import { Transform } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class CategoryQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10

  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  status?: number
}
