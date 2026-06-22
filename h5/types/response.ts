import type { BannerItem } from './banner'
import type { BookCategoryOption, BookItem } from './book'
import type { CategoryItem, CategoryOption } from './category'

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export type BookListResult = PageResult<BookItem>
export type CategoryListResult = PageResult<CategoryItem>
export type BannerListResult = PageResult<BannerItem>

export type BookListResponse = ApiResponse<BookListResult>
export type BookDetailResponse = ApiResponse<BookItem>
export type BookCategoriesResponse = ApiResponse<BookCategoryOption[]>
export type CategoryListResponse = ApiResponse<CategoryListResult>
export type CategoryOptionsResponse = ApiResponse<CategoryOption[]>
export type BannerListResponse = ApiResponse<BannerListResult>
