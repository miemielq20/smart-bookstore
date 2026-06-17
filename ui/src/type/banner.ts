// Banner 跳转类型，与后端 Prisma 枚举保持一致。
export type BannerLinkType = 'BOOK' | 'CATEGORY' | 'URL' | 'NONE'

// Banner 管理列表项和详情共用的模块类型。
export interface BannerItem {
  id: number
  title: string
  imageUrl: string
  linkUrl: string | null
  linkType: BannerLinkType
  targetId: number | null
  sort: number
  status: number
  createdBy: string | null
  createdAt: string
  updatedAt: string
}
