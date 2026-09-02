import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { PrismaService } from '../prisma/prisma.service';
import { BookQueryDto } from './dto/select-book.dto';
import { assertBookStatusTransition } from './book-status.machine';

@Injectable()
export class BookService {
  constructor(private readonly prisma: PrismaService) {}

  async getBookList(query: BookQueryDto) {
    const { keyword, category, status } = query;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const sort = query.sort ?? 'createdAt';
    const order = query.order ?? 'desc';

    const where: any = {
      deletedAt: null,
    };

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { author: { contains: keyword } },
        { isbn: { contains: keyword } },
      ];
    }

    if (category) {
      const categoryRecord = await this.prisma.categories.findFirst({
        where: { name: category },
        select: { id: true },
      });

      if (!categoryRecord) {
        return {
          list: [],
          total: 0,
          page,
          pageSize,
        };
      }

      const bookIds = await this.prisma.bookCategoryRelations.findMany({
        where: {
          categoryId: categoryRecord.id,
        },
        select: {
          bookId: true,
        },
      });
      const bookIdList = bookIds.map((item) => item.bookId);

      where.id = {
        in: bookIdList,
      };
    }

    if (status !== undefined) where.status = status;

    const [list, total] = await Promise.all([
      this.prisma.books.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.books.count({ where }),
    ]);

    return {
      list: list.map((book) => this.formatBook(book)),
      total,
      page,
      pageSize,
    };
  }

  async getCategories() {
    return this.prisma.categories.findMany({
      where: { status: 1 },
      select: {
        id: true,
        name: true,
      },
      orderBy: [
        { sort: 'asc' },
        { id: 'asc' },
      ],
    });
  }

  async create(createBookDto: CreateBookDto) {
    const { categories, tags } = createBookDto;

    if (createBookDto.isbn) {
      const existBook = await this.prisma.books.findFirst({
        where: { isbn: createBookDto.isbn, deletedAt: null },
        select: { id: true },
      });

      if (existBook) {
        throw new BadRequestException('该图书已存在');
      }
    }

    const book = await this.prisma.books.create({
      data: {
        title: createBookDto.title,
        author: createBookDto.author ?? '',
        isbn: createBookDto.isbn ?? null,
        coverUrl: createBookDto.coverUrl ?? null,
        price: createBookDto.price !== undefined ? Number(createBookDto.price) : 0,
        originalPrice:
          createBookDto.originalPrice !== undefined
            ? Number(createBookDto.originalPrice)
            : null,
        description: createBookDto.description ?? null,
        language: createBookDto.language ?? '中文',
        stock: createBookDto.stock !== undefined ? Number(createBookDto.stock) : 0,
        reading: createBookDto.reading ?? null,
        status: createBookDto.status !== undefined ? Number(createBookDto.status) : 1,
      },
    });

    if (categories !== undefined) {
      await this.replaceBookCategories(book.id, categories);
    }

    if (tags !== undefined) {
      await this.replaceBookTags(book.id, tags);
    }

    return this.findOne(Number(book.id));
  }

  async findOne(id: number) {
    const book = await this.prisma.books.findFirst({
      where: { id: BigInt(id), deletedAt: null },
    });

    if (!book) {
      throw new NotFoundException('图书不存在');
    }

    return this.formatBookDetail(book);
  }

  async update(id: number, updateBookDto: UpdateBookDto) {
    const bookId = BigInt(id);
    const exists = await this.prisma.books.findFirst({
      where: { id: bookId, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!exists) {
      throw new NotFoundException('图书不存在');
    }

    if (updateBookDto.isbn) {
      const existBook = await this.prisma.books.findFirst({
        where: {
          isbn: updateBookDto.isbn,
          deletedAt: null,
          NOT: { id: bookId },
        },
        select: { id: true },
      });

      if (existBook) {
        throw new BadRequestException('该 ISBN 已被其他图书使用');
      }
    }

    const { categories, tags, ...bookDto } = updateBookDto;
    const data: Record<string, any> = {};

    if (bookDto.title !== undefined) data.title = bookDto.title;
    if (bookDto.author !== undefined) data.author = bookDto.author;
    if (bookDto.isbn !== undefined) data.isbn = bookDto.isbn || null;
    if (bookDto.coverUrl !== undefined) data.coverUrl = bookDto.coverUrl || null;
    if (bookDto.price !== undefined) data.price = Number(bookDto.price);
    if (bookDto.originalPrice !== undefined) {
      data.originalPrice = Number(bookDto.originalPrice);
    }
    if (bookDto.description !== undefined) data.description = bookDto.description || null;
    if (bookDto.language !== undefined) data.language = bookDto.language || null;
    if (bookDto.stock !== undefined) data.stock = Number(bookDto.stock);
    if (bookDto.reading !== undefined) data.reading = bookDto.reading || null;
    if (bookDto.status !== undefined) {
      assertBookStatusTransition(exists.status, Number(bookDto.status));
      data.status = Number(bookDto.status);
    }

    await this.prisma.books.update({
      where: { id: bookId },
      data,
    });

    if (categories !== undefined) {
      await this.replaceBookCategories(bookId, categories);
    }

    if (tags !== undefined) {
      await this.replaceBookTags(bookId, tags);
    }

    return this.findOne(id);
  }

  async updateStatus(id: number, status: number) {
    const bookId = BigInt(id);
    const exists = await this.prisma.books.findFirst({
      where: { id: bookId, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!exists) {
      throw new NotFoundException('图书不存在');
    }

    assertBookStatusTransition(exists.status, status);

    const book = await this.prisma.books.update({
      where: { id: bookId },
      data: { status },
    });

    return this.formatBook(book);
  }

  async remove(id: number) {
    const bookId = BigInt(id);
    const exists = await this.prisma.books.findFirst({
      where: { id: bookId, deletedAt: null },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('图书不存在');
    }

    const book = await this.prisma.books.update({
      where: { id: bookId },
      data: { deletedAt: new Date() },
    });

    return this.formatBook(book);
  }

  private async replaceBookCategories(bookId: bigint, categories: string[]) {
    await this.prisma.bookCategoryRelations.deleteMany({ where: { bookId } });

    const names = this.normalizeNames(categories);
    if (names.length === 0) return;

    const categoryIds = await Promise.all(
      names.map(async (category) => {
        const categoryRecord = await this.prisma.categories.findFirst({
          where: { name: category },
          select: { id: true },
        });

        if (!categoryRecord) {
          const newCategory = await this.prisma.categories.create({
            data: { name: category },
          });
          return newCategory.id;
        }

        return categoryRecord.id;
      }),
    );

    await this.prisma.bookCategoryRelations.createMany({
      data: categoryIds.map((categoryId) => ({ bookId, categoryId })),
      skipDuplicates: true,
    });
  }

  private async replaceBookTags(bookId: bigint, tags: string[]) {
    await this.prisma.bookTagRelations.deleteMany({ where: { bookId } });

    const names = this.normalizeNames(tags);
    if (names.length === 0) return;

    const tagIds = await Promise.all(
      names.map(async (tag) => {
        const tagRecord = await this.prisma.tags.findFirst({
          where: { name: tag },
          select: { id: true },
        });

        if (!tagRecord) {
          const newTag = await this.prisma.tags.create({
            data: { name: tag },
          });
          return newTag.id;
        }

        return tagRecord.id;
      }),
    );

    await this.prisma.bookTagRelations.createMany({
      data: tagIds.map((tagId) => ({ bookId, tagId })),
      skipDuplicates: true,
    });
  }

  private normalizeNames(values: string[]) {
    return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  }

  private async getBookCategoryNames(bookId: bigint) {
    const relations = await this.prisma.bookCategoryRelations.findMany({
      where: { bookId },
      select: { categoryId: true },
    });

    const categoryIds = relations.map((item) => item.categoryId);
    if (categoryIds.length === 0) return [];

    const categories = await this.prisma.categories.findMany({
      where: { id: { in: categoryIds } },
      select: { name: true },
      orderBy: { id: 'asc' },
    });

    return categories.map((category) => category.name);
  }

  private async getBookTagNames(bookId: bigint) {
    const relations = await this.prisma.bookTagRelations.findMany({
      where: { bookId },
      select: { tagId: true },
    });

    const tagIds = relations.map((item) => item.tagId);
    if (tagIds.length === 0) return [];

    const tags = await this.prisma.tags.findMany({
      where: { id: { in: tagIds } },
      select: { name: true },
      orderBy: { id: 'asc' },
    });

    return tags.map((tag) => tag.name);
  }

  private async formatBookDetail(book: any) {
    const [categories, tags] = await Promise.all([
      this.getBookCategoryNames(book.id),
      this.getBookTagNames(book.id),
    ]);

    // 详情接口需要额外返回当前图书的分类和标签，用于编辑弹窗回显。
    return {
      ...this.formatBook(book),
      categories,
      tags,
    };
  }

  private formatBook(book: any) {
    return {
      ...book,
      id: Number(book.id),
      price: book.price === null ? null : Number(book.price),
      originalPrice: book.originalPrice === null ? null : Number(book.originalPrice),
      rating: book.rating === null ? null : Number(book.rating),
    };
  }
}
