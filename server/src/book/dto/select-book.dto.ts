
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class BookQueryDto {

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1;


  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  status?: number;

  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'salesCount', 'price', 'rating'])
  sort?: 'createdAt' | 'salesCount' | 'price' | 'rating';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}
