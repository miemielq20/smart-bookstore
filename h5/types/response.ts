import type { BannerItem } from './banner'
import type { BookCategoryOption, BookItem } from './book'
import type { CategoryItem, CategoryOption } from './category'
import type { CartData } from './cart'
import type { CaptchaData, LoginData } from './auth'
import type { Order } from './order'
import type { Address } from './address'

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
export type CartResponse = ApiResponse<CartData>
export type LoginResponse = ApiResponse<LoginData>
export type CaptchaResponse = ApiResponse<CaptchaData>
export type OrderResponse = ApiResponse<Order>
export type OrderListResponse = ApiResponse<Order[]>
export type AddressResponse = ApiResponse<Address[]>
export interface FavoriteItem {
  id: number
  book: BookItem
}
export type FavoriteListResponse = ApiResponse<FavoriteItem[]>
export interface LoginUserProfile {
  id: number
  username: string
  nickname: string
  phone: string
  email: string
}
export type ProfileResponse = ApiResponse<LoginUserProfile>
