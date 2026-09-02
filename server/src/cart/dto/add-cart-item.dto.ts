import { Type } from 'class-transformer'
import { IsInt, IsPositive, Max } from 'class-validator'

export class AddCartItemDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  bookId!: number

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(99)
  quantity = 1
}
