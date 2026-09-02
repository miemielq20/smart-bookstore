import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CategoryQueryDto } from './dto/category-query.dto'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CategoryQueryDto) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    const where: any = {}

    if (query.keyword) {
      where.name = { contains: query.keyword }
    }
    if (query.status !== undefined) {
      where.status = query.status
    }

    const [list, total] = await Promise.all([
      this.prisma.categories.findMany({
        where,
        orderBy: [{ sort: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.categories.count({ where }),
    ])

    const bookCounts = await this.getBookCountMap(list.map((item) => item.id))

    return {
      list: list.map((item) => ({
        ...item,
        bookCount: bookCounts.get(item.id) ?? 0,
      })),
      total,
      page,
      pageSize,
    }
  }

  async findOptions() {
    return this.prisma.categories.findMany({
      where: { status: 1 },
      select: { id: true, name: true },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    })
  }

  async create(dto: CreateCategoryDto) {
    await this.assertNameAvailable(dto.name)

    // 分类模块不维护子分类，只保存当前分类本身的信息。
    return this.prisma.categories.create({
      data: {
        name: dto.name,
        sort: dto.sort ?? 0,
        icon: dto.icon || null,
        status: dto.status ?? 1,
      },
    })
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.assertExists(id)
    if (dto.name !== undefined) {
      await this.assertNameAvailable(dto.name, id)
    }

    return this.prisma.categories.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.sort !== undefined && { sort: dto.sort }),
        ...(dto.icon !== undefined && { icon: dto.icon || null }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    })
  }

  async updateStatus(id: number, status: number) {
    await this.assertExists(id)
    return this.prisma.categories.update({
      where: { id },
      data: { status },
    })
  }

  async remove(id: number) {
    await this.assertExists(id)

    // 已关联图书的分类不允许删除，避免图书筛选数据断裂。
    const usedCount = await this.prisma.bookCategoryRelations.count({
      where: { categoryId: id },
    })
    if (usedCount > 0) {
      throw new BadRequestException('该分类已关联图书，不能删除')
    }

    return this.prisma.categories.delete({ where: { id } })
  }

  private async assertExists(id: number) {
    const category = await this.prisma.categories.findFirst({
      where: { id },
      select: { id: true },
    })
    if (!category) {
      throw new NotFoundException('分类不存在')
    }
  }

  private async assertNameAvailable(name: string, currentId?: number) {
    const category = await this.prisma.categories.findFirst({
      where: {
        name,
        ...(currentId !== undefined && { NOT: { id: currentId } }),
      },
      select: { id: true },
    })
    if (category) {
      throw new BadRequestException('分类名称已存在')
    }
  }

  private async getBookCountMap(categoryIds: number[]) {
    if (categoryIds.length === 0) return new Map<number, number>()

    const rows = await this.prisma.bookCategoryRelations.groupBy({
      by: ['categoryId'],
      where: { categoryId: { in: categoryIds } },
      _count: { bookId: true },
    })

    return new Map(rows.map((row) => [row.categoryId, row._count.bookId]))
  }
}
