// dto/create-permission.dto.ts
import { IsString, IsArray, IsNumber, IsOptional } from 'class-validator'

export class UpdatePermissionDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  menuIds?: number[]
}