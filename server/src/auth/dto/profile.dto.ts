import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator'

// 个人资料允许修改的字段，用户名和密码不在本接口范围内。
export class ProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  @MaxLength(100)
  email?: string
}
