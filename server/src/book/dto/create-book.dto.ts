import { Type, Transform } from 'class-transformer'
import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
  MaxLength,
  IsUrl,
  IsArray,
  IsIn,
} from 'class-validator'

export class CreateBookDto {
  @IsString()
  @MaxLength(200)
  title!: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  author?: string

  @IsOptional()
  @IsString()
  @MaxLength(20)
  isbn?: string

  @IsOptional()
  @IsUrl()
  coverUrl?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  originalPrice?: number

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  language?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number

  @IsOptional()
  @IsString()
  reading?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  status?: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}
