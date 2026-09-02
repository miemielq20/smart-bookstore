// dto/create-permission.dto.ts
import { IsString, MinLength, IsOptional, IsNotEmpty, IsArray, IsNumber } from 'class-validator'

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty({ message: '名称不能为空' })
  name?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsArray()
  @IsNumber({}, { each: true })
  menuIds?: number[]
}
