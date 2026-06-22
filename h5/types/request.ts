export interface PageQueryParams {
  page?: number
  pageSize?: number
}

export interface BookQueryParams extends PageQueryParams {
  keyword?: string
  category?: string
  status?: number
  sort?: 'createdAt' | 'salesCount' | 'price' | 'rating'
  order?: 'asc' | 'desc'
}

export interface CategoryQueryParams extends PageQueryParams {
  keyword?: string
  status?: number
}

export interface BannerQueryParams extends PageQueryParams {
  keyword?: string
  status?: number
}

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
