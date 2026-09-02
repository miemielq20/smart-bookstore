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
import { CategoryService } from './category.service'
import { CategoryQueryDto } from './dto/category-query.dto'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'

class UpdateCategoryStatusDto {
  @IsInt()
  @IsIn([0, 1])
  status!: number
}

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  findAll(@Query() query: CategoryQueryDto) {
    return this.categoryService.findAll(query)
  }

  @Get('options')
  findOptions() {
    return this.categoryService.findOptions()
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto)
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(id, dto)
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryStatusDto) {
    return this.categoryService.updateStatus(id, dto.status)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.remove(id)
  }
}
