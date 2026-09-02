import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class FavoriteService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: number) {
    const rows = await this.prisma.favorites.findMany({
      where: { userId: BigInt(userId) },
      orderBy: { createdAt: 'desc' },
    })
    const books = await this.prisma.books.findMany({ where: { id: { in: rows.map((row) => row.bookId) }, deletedAt: null } })
    const bookMap = new Map(books.map((book) => [book.id.toString(), book]))
    // 返回收藏记录和图书信息，收藏页可以直接展示真实封面与价格。
    return rows.flatMap((row) => {
      const book = bookMap.get(row.bookId.toString())
      if (!book) return []
      return [{ id: Number(row.id), book: { ...book, id: Number(book.id), price: Number(book.price), originalPrice: book.originalPrice === null ? null : Number(book.originalPrice) } }]
    })
  }

  async add(userId: number, bookId: number) {
    // 收藏前确认图书存在，避免生成无效收藏记录。
    const book = await this.prisma.books.findFirst({ where: { id: BigInt(bookId), deletedAt: null } })
    if (!book) throw new NotFoundException('图书不存在')
    return this.prisma.favorites.upsert({
      where: { userId_bookId: { userId: BigInt(userId), bookId: BigInt(bookId) } },
      create: { userId: BigInt(userId), bookId: BigInt(bookId) },
      update: {},
    })
  }

  async batchAdd(userId: number, bookIds: number[]) {
    const ids = [...new Set(bookIds.filter((id) => Number.isInteger(id) && id > 0))]
    if (!ids.length) return []
    // 使用逐条 upsert 兼容当前 Prisma 版本和收藏表的联合唯一索引。
    return this.prisma.$transaction(ids.map((bookId) => this.prisma.favorites.upsert({
      where: { userId_bookId: { userId: BigInt(userId), bookId: BigInt(bookId) } },
      create: { userId: BigInt(userId), bookId: BigInt(bookId) },
      update: {},
    })))
  }

  async remove(userId: number, bookId: number) {
    await this.prisma.favorites.deleteMany({ where: { userId: BigInt(userId), bookId: BigInt(bookId) } })
    return { success: true }
  }
}
