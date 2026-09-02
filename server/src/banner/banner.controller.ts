import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { IsIn, IsInt } from 'class-validator'
import { BannerService } from './banner.service'
import { BannerQueryDto } from './dto/banner-query.dto'
import { CreateBannerDto } from './dto/create-banner.dto'
import { UpdateBannerDto } from './dto/update-banner.dto'

class UpdateBannerStatusDto {
  // 状态切换只允许启用或禁用。
  @IsInt()
  @IsIn([0, 1])
  status!: number
}

@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  // 分页获取 Banner 列表。
  @Get()
  findAll(@Query() query: BannerQueryDto) {
    return this.bannerService.findAll(query)
  }

  // 根据 ID 获取单个 Banner 详情。
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bannerService.findOne(id)
  }

  // 新增 Banner。
  @Post()
  create(@Body() dto: CreateBannerDto) {
    return this.bannerService.create(dto)
  }

  // 编辑 Banner 基础信息和跳转配置。
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBannerDto) {
    return this.bannerService.update(id, dto)
  }

  // 单独切换 Banner 启禁用状态。
  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBannerStatusDto) {
    return this.bannerService.updateStatus(id, dto.status)
  }

  // 删除 Banner 记录。
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bannerService.remove(id)
  }
}
