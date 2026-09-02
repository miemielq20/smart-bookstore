import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { isBookPurchasable } from '../book/book-status.machine'
import { AddCartItemDto } from './dto/add-cart-item.dto'

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  // 查询购物车商品并拼接最新图书信息。
  // 查询购物车商品并拼接最新图书信息。
  async getCart(userId: number) {
    const items = await this.prisma.cartItems.findMany({
      where: { userId: BigInt(userId) },
      orderBy: { createdAt: 'desc' },
    })
    const books = await this.prisma.books.findMany({
      where: { id: { in: items.map((item) => item.bookId) } },
    })
    const bookMap = new Map(books.map((book) => [book.id.toString(), book]))
    return this.formatCart(items, bookMap)
  }

  // 添加图书到购物车，并校验图书状态和库存。
  // 添加图书到购物车，并校验图书状态和库存。
  async addItem(userId: number, dto: AddCartItemDto) {
    const user = BigInt(userId)
    const book = await this.prisma.books.findFirst({
      where: { id: BigInt(dto.bookId), deletedAt: null },
    })
    if (!book) throw new NotFoundException('图书不存在')
    this.assertPurchasable(book.status, book.stock)

    const item = await this.prisma.cartItems.findUnique({
      where: { userId_bookId: { userId: user, bookId: book.id } },
    })
    const quantity = (item?.quantity ?? 0) + dto.quantity
    this.assertStock(quantity, book.stock)

    await this.prisma.cartItems.upsert({
      where: { userId_bookId: { userId: user, bookId: book.id } },
      create: { userId: user, bookId: book.id, quantity: dto.quantity, selected: 1 },
      update: { quantity, selected: 1 },
    })
    return this.getCart(userId)
  }

  // 修改购物车商品数量，确保数量不超过当前库存。
  // 修改购物车商品数量，确保数量不超过当前库存。
  async updateQuantity(userId: number, itemId: number, quantity: number) {
    const item = await this.findItem(userId, itemId)
    const book = await this.getPurchasableBook(item.bookId)
    this.assertStock(quantity, book.stock)
    await this.prisma.cartItems.update({ where: { id: item.id }, data: { quantity } })
    return this.getCart(userId)
  }

  // 更新单个购物车商品的结算选中状态。
  // 更新单个购物车商品的结算选中状态。
  async updateSelected(userId: number, itemId: number, selected: number) {
    await this.findItem(userId, itemId)
    await this.prisma.cartItems.update({ where: { id: BigInt(itemId) }, data: { selected } })
    return this.getCart(userId)
  }

  // 批量更新当前用户购物车商品的选中状态。
  // 批量更新当前用户购物车商品的选中状态。
  async updateAllSelected(userId: number, selected: number) {
    await this.prisma.cartItems.updateMany({
      where: { userId: BigInt(userId) },
      data: { selected },
    })
    return this.getCart(userId)
  }

  // 删除当前用户购物车中的指定商品。
  // 删除当前用户购物车中的指定商品。
  async removeItem(userId: number, itemId: number) {
    await this.findItem(userId, itemId)
    await this.prisma.cartItems.delete({ where: { id: BigInt(itemId) } })
    return this.getCart(userId)
  }

  // 清理当前用户购物车中已选中的商品。
  // 清理当前用户购物车中已选中的商品。
  async clearSelected(userId: number) {
    await this.prisma.cartItems.deleteMany({ where: { userId: BigInt(userId), selected: 1 } })
    return this.getCart(userId)
  }

  async batchDelete(userId: number, itemIds: number[]) {
    // 按用户和商品 ID 双重限制删除范围，避免越权删除其他用户的购物车商品。
    await this.prisma.cartItems.deleteMany({
      where: { userId: BigInt(userId), id: { in: itemIds.map((id) => BigInt(id)) } },
    })
    return this.getCart(userId)
  }

  private async findItem(userId: number, itemId: number) {
    const item = await this.prisma.cartItems.findFirst({
      where: { id: BigInt(itemId), userId: BigInt(userId) },
    })
    if (!item) throw new NotFoundException('购物车商品不存在')
    return item
  }

  private async getPurchasableBook(bookId: bigint) {
    const book = await this.prisma.books.findFirst({ where: { id: bookId, deletedAt: null } })
    if (!book) throw new NotFoundException('图书不存在')
    this.assertPurchasable(book.status, book.stock)
    return book
  }

  private assertPurchasable(status: number, stock: number) {
    if (!isBookPurchasable(status, stock)) {
      throw new BadRequestException(stock > 0 ? '图书已下架，暂不可购买' : '图书库存不足')
    }
  }

  private assertStock(quantity: number, stock: number) {
    if (quantity > stock) throw new BadRequestException(`库存不足，当前库存为 ${stock}`)
  }

  private formatCart(items: any[], bookMap: Map<string, any>) {
    const formattedItems = items.flatMap((item) => {
      const book = bookMap.get(item.bookId.toString())
      if (!book) return []
      const price = Number(book?.price ?? 0)
      return [
        {
          id: Number(item.id),
          quantity: item.quantity,
          selected: item.selected === 1,
          subtotal: Number((price * item.quantity).toFixed(2)),
          book: {
            ...book,
            id: Number(book.id),
            price,
            originalPrice:
              book?.originalPrice === null || book?.originalPrice === undefined
                ? null
                : Number(book.originalPrice),
            rating:
              book?.rating === null || book?.rating === undefined ? null : Number(book.rating),
          },
        },
      ]
    })
    const selectedItems = formattedItems.filter((item) => item.selected)
    return {
      items: formattedItems,
      totalCount: formattedItems.reduce((sum, item) => sum + item.quantity, 0),
      selectedCount: selectedItems.reduce((sum, item) => sum + item.quantity, 0),
      selectedAmount: Number(
        selectedItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2),
      ),
    }
  }
}
