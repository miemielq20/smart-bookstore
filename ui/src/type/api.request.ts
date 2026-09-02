export interface LoginParams {
  username: string
  password: string
  captcha: string
  captchaId: string
}

export interface addGroupParams {
  name: string
  description: string
  menuIds: number[]
}

export interface UpdateGroupParams {
  name: string
  description: string
}

export interface UpdateGroupMenuParams {
  description?: string
  name?: string
  menuIds?: number[]
}

export interface BookQueryParams {
  page?: number
  pageSize?: number
  keyword?: string
  category?: string
  status?: number
}

export interface BookFormParams {
  title: string
  author?: string
  isbn?: string
  coverUrl?: string
  price?: number
  originalPrice?: number
  description?: string
  language?: string
  stock?: number
  reading?: string
  status?: number
  categories?: string[]
  tags?: string[]
}

export type UpdateBookParams = Partial<BookFormParams>

export interface CategoryQueryParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: number
}

export interface CategoryFormParams {
  name: string
  sort?: number
  icon?: string
  status?: number
}

export type UpdateCategoryParams = Partial<CategoryFormParams>

// Banner 列表查询参数。
export interface BannerQueryParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: number
}

// Banner 新增和编辑表单参数。
export interface BannerFormParams {
  title: string
  imageUrl: string
  linkUrl?: string
  linkType: 'BOOK' | 'CATEGORY' | 'URL' | 'NONE'
  targetId?: number
  sort?: number
  status?: number
}

// 编辑 Banner 时允许只传变化字段。
export type UpdateBannerParams = Partial<BannerFormParams>

// 后台订单列表筛选条件。
export interface AdminOrderQueryParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  sortOrder?: 'asc' | 'desc'
}

// 后台退款列表筛选条件。
export interface AdminRefundQueryParams {
  page?: number
  pageSize?: number
  status?: string
}
