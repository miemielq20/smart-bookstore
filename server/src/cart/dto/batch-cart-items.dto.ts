import { Type } from 'class-transformer'
import { IsArray, IsInt, Min } from 'class-validator'

export class BatchCartItemsDto {
  // 将前端传入的商品 ID 统一转换为数字并进行基础校验。
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids!: number[]
}
