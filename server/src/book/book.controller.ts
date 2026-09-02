import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { IsIn, IsInt } from 'class-validator'
import { BookService } from './book.service'
import { CreateBookDto } from './dto/create-book.dto'
import { BookQueryDto } from './dto/select-book.dto'
import { UpdateBookDto } from './dto/update-book.dto'

class UpdateBookStatusDto {
  @IsInt()
  @IsIn([0, 1])
  status!: number
}

@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Post()
  create(@Body() createBookDto: CreateBookDto) {
    return this.bookService.create(createBookDto)
  }

  @Get()
  getBooks(@Query() query: BookQueryDto) {
    return this.bookService.getBookList(query)
  }

  @Get('categories/all')
  getCategories() {
    return this.bookService.getCategories()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookService.findOne(id)
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateBookDto: UpdateBookDto) {
    return this.bookService.update(id, updateBookDto)
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBookStatusDto) {
    return this.bookService.updateStatus(id, dto.status)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bookService.remove(id)
  }
}
