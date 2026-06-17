import type { GroupRow, MenuItem } from '../type/menu'
import type { BannerItem } from './banner'
import type { BookCategoryOption, BookDetail, BookItem } from './book'
import type { CategoryItem, CategoryOption } from './category'

//统一接口响应格式
export interface ApiResponse<T= any> {
  code: number
  message: string
  data: T
}

//登录
export interface LoginResult {
  accessToken: string
  user: {
    id: number
    username: string
    groupId: number | null
  }
}

//获取验证码
export interface GetCodeResult {
  img: string,
  uuid: string
}

//侧边栏菜单
export interface MenuMeta {
  title: string
  icon?: string
  permission?: string
}

//侧边栏菜单树
export interface MenuNode {
  id: number
  parentId: number
  name: string
  path: string
  icon: string | null
  component?: string | null
  permissionCode: string
  sort: number
  visible: number
  meta: MenuMeta     
  collapsed ?: boolean
  buttons: { name: string; permissionCode: string }[]
  children: MenuNode[]
}


export interface BookListResult {
  list: BookItem[]
  total: number
  page: number
  pageSize: number
}

export interface CategoryListResult {
  list: CategoryItem[]
  total: number
  page: number
  pageSize: number
}

// Banner 分页列表响应数据。
export interface BannerListResult {
  list: BannerItem[]
  total: number
  page: number
  pageSize: number
}

export type LoginApiResponse = ApiResponse<LoginResult>
export type GetCodeApiResponse = ApiResponse<GetCodeResult>
export type MenusApiResponse = ApiResponse<MenuNode[]>
export type getGroupsApiResponse  = ApiResponse<GroupRow[]>
export type getMenuTreeApiResponse = ApiResponse<MenuNode[]>
export type getGroupsMenuApiResponse = ApiResponse<Number[]>
export type BookListApiResponse = ApiResponse<BookListResult>
export type BookDetailApiResponse = ApiResponse<BookDetail>
export type BookCategoriesApiResponse = ApiResponse<BookCategoryOption[]>
export type CategoryListApiResponse = ApiResponse<CategoryListResult>
export type CategoryDetailApiResponse = ApiResponse<CategoryItem>
export type CategoryOptionsApiResponse = ApiResponse<CategoryOption[]>
export type BannerListApiResponse = ApiResponse<BannerListResult>
export type BannerDetailApiResponse = ApiResponse<BannerItem>
