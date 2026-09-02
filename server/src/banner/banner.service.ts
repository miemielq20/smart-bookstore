import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { BannersLinkType } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { BannerQueryDto } from './dto/banner-query.dto'
import { CreateBannerDto } from './dto/create-banner.dto'
import { UpdateBannerDto } from './dto/update-banner.dto'

@Injectable()
export class BannerService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: BannerQueryDto) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    const where: any = {}

    if (query.keyword) {
      where.title = { contains: query.keyword }
    }
    if (query.status !== undefined) {
      where.status = query.status
    }

    const [list, total] = await Promise.all([
      this.prisma.banners.findMany({
        where,
        orderBy: [{ sort: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.banners.count({ where }),
    ])

    return {
      list: list.map((item) => this.formatBanner(item)),
      total,
      page,
      pageSize,
    }
  }

  async findOne(id: number) {
    const banner = await this.prisma.banners.findUnique({ where: { id } })
    if (!banner) {
      throw new NotFoundException('Banner不存在')
    }

    return this.formatBanner(banner)
  }

  async create(dto: CreateBannerDto) {
    const linkData = this.buildLinkData(dto.linkType, dto.linkUrl, dto.targetId)

    const banner = await this.prisma.banners.create({
      data: {
        title: dto.title,
        imageUrl: dto.imageUrl,
        sort: dto.sort ?? 0,
        status: dto.status ?? 1,
        ...linkData,
      },
    })

    return this.formatBanner(banner)
  }

  async update(id: number, dto: UpdateBannerDto) {
    await this.assertExists(id)

    const data: Record<string, any> = {}
    if (dto.title !== undefined) data.title = dto.title
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl
    if (dto.sort !== undefined) data.sort = Number(dto.sort)
    if (dto.status !== undefined) data.status = Number(dto.status)

    if (dto.linkType !== undefined) {
      Object.assign(data, this.buildLinkData(dto.linkType, dto.linkUrl, dto.targetId))
    } else {
      if (dto.linkUrl !== undefined) data.linkUrl = dto.linkUrl || null
      if (dto.targetId !== undefined) data.targetId = BigInt(dto.targetId)
    }

    // Prisma 当前模型没有 @updatedAt，编辑时手动刷新更新时间。
    data.updatedAt = new Date()

    const banner = await this.prisma.banners.update({
      where: { id },
      data,
    })

    return this.formatBanner(banner)
  }

  async updateStatus(id: number, status: number) {
    await this.assertExists(id)

    const banner = await this.prisma.banners.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    })

    return this.formatBanner(banner)
  }

  async remove(id: number) {
    await this.assertExists(id)
    const banner = await this.prisma.banners.delete({ where: { id } })
    return this.formatBanner(banner)
  }

  private async assertExists(id: number) {
    const banner = await this.prisma.banners.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!banner) {
      throw new NotFoundException('Banner不存在')
    }
  }

  private buildLinkData(linkType: BannersLinkType, linkUrl?: string, targetId?: number) {
    const needTargetId = linkType === BannersLinkType.BOOK || linkType === BannersLinkType.CATEGORY

    if (linkType === BannersLinkType.URL && !linkUrl) {
      throw new BadRequestException('URL类型需要填写链接地址')
    }
    if (needTargetId && !targetId) {
      throw new BadRequestException('图书或分类类型需要填写目标ID')
    }

    // 根据链接类型清理无效字段，避免 URL 和目标 ID 混用。
    return {
      linkType,
      linkUrl: linkType === BannersLinkType.URL ? linkUrl : null,
      targetId: needTargetId ? BigInt(targetId as number) : null,
    }
  }

  private formatBanner(banner: any) {
    return {
      ...banner,
      targetId: banner.targetId === null ? null : Number(banner.targetId),
    }
  }
}
