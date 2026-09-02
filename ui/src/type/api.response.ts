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

export interface AdminOrderItem {
  id: number
  orderNo: string
  userNickname: string
  userPhone: string
  receiverName: string
  receiverPhone: string
  totalAmount: number
  status: string
  trackingNo?: string | null
  itemCount: number
  remark?: string | null
  paidAt?: string | null
  shippedAt?: string | null
  completedAt?: string | null
  cancelledAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminOrderDetail extends AdminOrderItem {
  address: Record<string, string>
  items: Array<{ id: number; bookId: number; book: { title?: string; author?: string; coverUrl?: string | null }; price: number; quantity: number }>
  payments: Array<{ paymentNo: string; amount: number; method: string; status: string; paidAt?: string | null }>
  refunds: Array<{ id: number; refundNo: string; amount: number; reason: string; status: string; handlerNote?: string | null; handledAt?: string | null }>
}

export interface AdminOrderListResult { list: AdminOrderItem[]; total: number; page: number; pageSize: number }
export interface AdminRefundItem { id: number; refundNo: string; orderId: number; orderNo: string; userNickname: string; amount: number; reason: string; status: string; handlerNote?: string | null; handledAt?: string | null; createdAt: string }
export interface AdminRefundListResult { list: AdminRefundItem[]; total: number; page: number; pageSize: number }
export interface AdminOrderStats { totalCount: number; pendingCount: number; paidCount: number; shippedCount: number; completedCount: number; cancelledCount: number; afterSaleCount: number; refundingCount: number; todayCount: number; todayAmount: number }
export type AdminOrderListApiResponse = ApiResponse<AdminOrderListResult>
export type AdminOrderDetailApiResponse = ApiResponse<AdminOrderDetail>
export type AdminRefundListApiResponse = ApiResponse<AdminRefundListResult>
export type AdminOrderStatsApiResponse = ApiResponse<AdminOrderStats>
