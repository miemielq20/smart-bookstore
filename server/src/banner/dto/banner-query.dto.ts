import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator'

export class BannerQueryDto {
  // 当前页码，默认由服务层兜底为第 1 页。
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  // 每页数量，默认由服务层兜底为 10 条。
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number

  // 按 Banner 标题模糊搜索。
  @IsOptional()
  @IsString()
  keyword?: string

  // Banner 展示状态：1 启用，0 禁用。
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  status?: number
}
