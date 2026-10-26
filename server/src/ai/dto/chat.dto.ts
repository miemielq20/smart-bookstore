import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class ChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  message!: string

  @IsOptional()
  @IsInt({ each: true })
  excludeIds?: number[]

  @IsOptional()
  @IsString()
  sessionId?: string
}
