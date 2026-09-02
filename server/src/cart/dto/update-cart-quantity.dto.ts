import { Type } from 'class-transformer'
import { IsInt, IsPositive, Max } from 'class-validator'

export class UpdateCartQuantityDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(99)
  quantity!: number
}
