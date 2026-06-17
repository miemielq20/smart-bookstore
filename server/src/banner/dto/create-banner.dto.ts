import { BannersLinkType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBannerDto {
  // Banner 标题，用于后台列表识别。
  @IsString()
  @MaxLength(100)
  title!: string;

  // 首页轮播展示图片地址。
  @IsUrl()
  @MaxLength(500)
  imageUrl!: string;

  // URL 类型 Banner 的外链地址。
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  linkUrl?: string;

  // 跳转类型：图书、分类、URL 或无跳转。
  @IsEnum(BannersLinkType)
  linkType!: BannersLinkType;

  // 图书或分类跳转时对应的业务 ID。
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  targetId?: number;

  // 排序值越小越靠前。
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort?: number;

  // 展示状态：1 启用，0 禁用。
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  status?: number;
}
