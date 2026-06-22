export type BannerLinkType = 'BOOK' | 'CATEGORY' | 'URL' | 'NONE'

export interface BannerItem {
  id: number
  title: string
  imageUrl: string
  linkUrl: string | null
  linkType: BannerLinkType
  targetId: number | null
  sort: number
  status: number
  createdAt: string
  updatedAt: string
}
