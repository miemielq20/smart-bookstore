import { Type } from 'class-transformer'
import { IsIn, IsInt } from 'class-validator'

export class UpdateCartSelectedDto {
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  selected!: number
}
