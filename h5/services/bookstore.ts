import { request } from './request'
import type { BannerQueryParams, BookQueryParams, CategoryQueryParams } from '../types/request'
import type {
  BannerListResponse,
  BookCategoriesResponse,
  BookDetailResponse,
  BookListResponse,
  CategoryListResponse,
  CategoryOptionsResponse,
} from '../types/response'

export const getBannersApi = (params: BannerQueryParams = {}) =>
  request<BannerListResponse, BannerQueryParams>({
    url: '/banners',
    data: params,
  })

export const getBooksApi = (params: BookQueryParams = {}) =>
  request<BookListResponse, BookQueryParams>({
    url: '/books',
    data: params,
  })

export const getBookCategoriesApi = () =>
  request<BookCategoriesResponse>({
    url: '/books/categories/all',
  })

export const getBookDetailApi = (id: number) =>
  request<BookDetailResponse>({
    url: `/books/${id}`,
  })

export const getCategoriesApi = (params: CategoryQueryParams = {}) =>
  request<CategoryListResponse, CategoryQueryParams>({
    url: '/categories',
    data: params,
  })

export const getCategoryOptionsApi = () =>
  request<CategoryOptionsResponse>({
    url: '/categories/options',
  })
