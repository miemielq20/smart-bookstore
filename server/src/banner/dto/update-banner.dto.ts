import { PartialType } from '@nestjs/mapped-types'
import { CreateBannerDto } from './create-banner.dto'

// 编辑 Banner 时允许只提交发生变化的字段。
export class UpdateBannerDto extends PartialType(CreateBannerDto) {}
