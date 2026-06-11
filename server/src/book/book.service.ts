import { Injectable } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { PrismaService } from "../prisma/prisma.service"


@Injectable()
export class BookService {
  constructor(private readonly prisma: PrismaService) { }
  create(createBookDto: CreateBookDto) {
    return 'This action adds a new book';
  }
  async findAll() {
  const list = await this.prisma.books.findMany(); 
 return list.map(book => ({
    ...book,
    id: Number(book.id), // ✅ BigInt → Number
  }))
}

  findOne(id: number) {
    return `This action returns a #${id} book`;
  }

  update(id: number, updateBookDto: UpdateBookDto) {
    return `This action updates a #${id} book`;
  }

  remove(id: number) {
    return `This action removes a #${id} book`;
  }
}
