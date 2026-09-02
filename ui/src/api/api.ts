import request from './request'

import type {
  LoginParams,
  addGroupParams,
  UpdateGroupMenuParams,
  BookQueryParams,
  BookFormParams,
  UpdateBookParams,
  CategoryQueryParams,
  CategoryFormParams,
  UpdateCategoryParams,
  BannerQueryParams,
  BannerFormParams,
  UpdateBannerParams,
} from '@/type/api.request'
import type {LoginApiResponse,GetCodeApiResponse, MenusApiResponse,getMenuTreeApiResponse,
  getGroupsApiResponse,getGroupsMenuApiResponse, ApiResponse, BookListApiResponse,
  BookDetailApiResponse, BookCategoriesApiResponse, CategoryListApiResponse,
  CategoryDetailApiResponse, CategoryOptionsApiResponse, BannerListApiResponse,
  BannerDetailApiResponse} from '@/type/api.response'
import type { AdminOrderDetailApiResponse, AdminOrderListApiResponse, AdminOrderStatsApiResponse, AdminRefundListApiResponse } from '@/type/api.response'
import type { AdminOrderQueryParams, AdminRefundQueryParams } from '@/type/api.request'

// 登录
export const loginApi = (data: LoginParams): Promise<LoginApiResponse> =>
  request.post('/auth/login', data)

// 获取验证码
export const getCodeApi = (): Promise<GetCodeApiResponse> =>
  request.get('/getCode')

/* GET /api/auth/menus */
export const getMenusApi = (): Promise<MenusApiResponse> =>
  request.get('/auth/menus')

// 加载权限组信息
export const getGroupsApi = (): Promise<getGroupsApiResponse>=>
  request.get('/permission-groups')

// 添加权限组
export const addGroupsApi = (data:addGroupParams): Promise<ApiResponse>=>
  request.post('/permission-groups',data)


//加载权限组菜单结构
export const getMenuTreeApi=(): Promise<getMenuTreeApiResponse> =>
  request.get("/permission-groups/menu-tree")


//更新权限
export const updateGroupsApi = (id: number, data:UpdateGroupMenuParams) =>
  request.put(`/permission-groups/${id}`, data)

export const getGroupsMenuApi = (id: number): Promise<getGroupsMenuApiResponse> =>
  request.get(`/permission-groups/${id}/menus`)

export const getBooksApi = (params: BookQueryParams): Promise<BookListApiResponse> =>
  request.get('/books', { params })

export const getBookCategoriesApi = (): Promise<BookCategoriesApiResponse> =>
  request.get('/books/categories/all')

export const getBookDetailApi = (id: number): Promise<BookDetailApiResponse> =>
  request.get(`/books/${id}`)

export const addBookApi = (data: BookFormParams): Promise<BookDetailApiResponse> =>
  request.post('/books', data)

export const updateBookApi = (id: number, data: UpdateBookParams): Promise<BookDetailApiResponse> =>
  request.patch(`/books/${id}`, data)

export const updateBookStatusApi = (id: number, status: number): Promise<BookDetailApiResponse> =>
  request.patch(`/books/${id}/status`, { status })

export const deleteBookApi = (id: number): Promise<BookDetailApiResponse> =>
  request.delete(`/books/${id}`)

export const getCategoriesApi = (params: CategoryQueryParams): Promise<CategoryListApiResponse> =>
  request.get('/categories', { params })

export const getCategoryOptionsApi = (): Promise<CategoryOptionsApiResponse> =>
  request.get('/categories/options')

export const addCategoryApi = (data: CategoryFormParams): Promise<CategoryDetailApiResponse> =>
  request.post('/categories', data)

export const updateCategoryApi = (id: number, data: UpdateCategoryParams): Promise<CategoryDetailApiResponse> =>
  request.patch(`/categories/${id}`, data)

export const updateCategoryStatusApi = (id: number, status: number): Promise<CategoryDetailApiResponse> =>
  request.patch(`/categories/${id}/status`, { status })

export const deleteCategoryApi = (id: number): Promise<CategoryDetailApiResponse> =>
  request.delete(`/categories/${id}`)

// 获取 Banner 分页列表
export const getBannersApi = (params: BannerQueryParams): Promise<BannerListApiResponse> =>
  request.get('/banners', { params })

// 获取 Banner 详情
export const getBannerDetailApi = (id: number): Promise<BannerDetailApiResponse> =>
  request.get(`/banners/${id}`)

// 新增 Banner
export const addBannerApi = (data: BannerFormParams): Promise<BannerDetailApiResponse> =>
  request.post('/banners', data)

// 编辑 Banner
export const updateBannerApi = (id: number, data: UpdateBannerParams): Promise<BannerDetailApiResponse> =>
  request.patch(`/banners/${id}`, data)

// 切换 Banner 启禁用状态
export const updateBannerStatusApi = (id: number, status: number): Promise<BannerDetailApiResponse> =>
  request.patch(`/banners/${id}/status`, { status })

// 删除 Banner
export const deleteBannerApi = (id: number): Promise<BannerDetailApiResponse> =>
  request.delete(`/banners/${id}`)

// 后台订单与退款管理接口。
export const getAdminOrdersApi = (params: AdminOrderQueryParams): Promise<AdminOrderListApiResponse> => request.get('/admin/orders', { params })
export const getAdminOrderApi = (id: number): Promise<AdminOrderDetailApiResponse> => request.get(`/admin/orders/${id}`)
export const getAdminOrderStatsApi = (): Promise<AdminOrderStatsApiResponse> => request.get('/admin/orders/stats')
export const shipAdminOrderApi = (id: number, trackingNo: string): Promise<AdminOrderDetailApiResponse> => request.put(`/admin/orders/${id}/ship`, { trackingNo })
export const updateAdminOrderRemarkApi = (id: number, remark: string): Promise<AdminOrderDetailApiResponse> => request.put(`/admin/orders/${id}/remark`, { remark })
export const cancelAdminOrderApi = (id: number): Promise<AdminOrderDetailApiResponse> => request.put(`/admin/orders/${id}/cancel`)
// 管理员确认售后后，将订单转入退款审核状态。
export const approveAdminAfterSaleApi = (id: number): Promise<AdminOrderDetailApiResponse> => request.put(`/admin/orders/${id}/after-sale/approve`)
// 售后拒绝和重新发货接口。
export const rejectAdminAfterSaleApi = (id: number): Promise<AdminOrderDetailApiResponse> => request.put(`/admin/orders/${id}/after-sale/reject`)
export const reshipAdminAfterSaleApi = (id: number, trackingNo: string): Promise<AdminOrderDetailApiResponse> => request.put(`/admin/orders/${id}/after-sale/reship`, { trackingNo })
export const getAdminRefundsApi = (params: AdminRefundQueryParams): Promise<AdminRefundListApiResponse> => request.get('/admin/refunds', { params })
export const approveAdminRefundApi = (id: number, handlerNote = ''): Promise<AdminOrderDetailApiResponse> => request.put(`/admin/refunds/${id}/approve`, { handlerNote })
export const rejectAdminRefundApi = (id: number, handlerNote: string): Promise<AdminOrderDetailApiResponse> => request.put(`/admin/refunds/${id}/reject`, { handlerNote })
