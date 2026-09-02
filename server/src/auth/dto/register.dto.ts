import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: '账号不能为空' })
  @MinLength(2, { message: '账号长度不能少于2位' })
  @MaxLength(50)
  username!: string

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度不能少于6位' })
  @MaxLength(50)
  password!: string

  @IsString()
  @IsNotEmpty({ message: '确认密码不能为空' })
  @MinLength(6, { message: '确认密码长度不能少于6位' })
  @MaxLength(50)
  confirmPassword!: string

  @IsString()
  @IsNotEmpty({ message: '验证码不能为空' })
  captcha!: string

  @IsString()
  @IsNotEmpty({ message: '验证码ID不能为空' })
  captchaId!: string
}
