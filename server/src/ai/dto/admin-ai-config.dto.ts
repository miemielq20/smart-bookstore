import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** 后台 AI 配置表单。API Key 为空时保留数据库中的现有值。 */
export class AdminAiConfigDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ai_model?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ai_api_key?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ai_api_base_url?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  ai_temperature?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(32768)
  ai_max_tokens?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  ai_prompt_template?: string;
}
