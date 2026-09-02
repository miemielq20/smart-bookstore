import { request } from './request'
import type { AddCartItemParams, BannerQueryParams, BookQueryParams, CategoryQueryParams } from '../types/request'
import type {
  BannerListResponse,
  BookCategoriesResponse,
  BookDetailResponse,
  BookListResponse,
  CategoryListResponse,
  CategoryOptionsResponse,
  CartResponse,
} from '../types/response'
import type { OrderStatus } from '../types/order'
import type { Address } from '../types/address'
import type { AddressResponse } from '../types/response'
import type { FavoriteListResponse } from '../types/response'

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

export const getCartApi = () =>
  request<CartResponse>({ url: '/cart' })

export const addCartItemApi = (params: AddCartItemParams) =>
  request<CartResponse, AddCartItemParams>({ url: '/cart/items', method: 'POST', data: params })

export const updateCartQuantityApi = (id: number, quantity: number) =>
  request<CartResponse>({ url: `/cart/items/${id}/quantity`, method: 'POST', data: { quantity } })

export const updateCartSelectedApi = (id: number, selected: boolean) =>
  request<CartResponse>({ url: `/cart/items/${id}/selected`, method: 'POST', data: { selected: selected ? 1 : 0 } })

export const updateAllCartSelectedApi = (selected: boolean) =>
  request<CartResponse>({ url: '/cart/items/selected-all', method: 'POST', data: { selected: selected ? 1 : 0 } })

export const removeCartItemApi = (id: number) =>
  request<CartResponse>({ url: `/cart/items/${id}`, method: 'DELETE' })
export const batchDeleteCartItemsApi = (ids: number[]) =>
  request<CartResponse>({ url: '/cart/items/batch-delete', method: 'POST', data: { ids } })
export const addFavoritesApi = (bookIds: number[]) =>
  request<unknown>({ url: '/favorites/batch', method: 'POST', data: { bookIds } })
export const addFavoriteApi = (bookId: number) =>
  request<unknown>({ url: `/favorites/${bookId}`, method: 'POST' })
export const removeFavoriteApi = (bookId: number) =>
  request<unknown>({ url: `/favorites/${bookId}`, method: 'DELETE' })
export const getFavoritesApi = () =>
  request<FavoriteListResponse>({ url: '/favorites' })

export const createOrderApi = (data: { address: Record<string, string>; remark?: string }) => request<OrderResponse>({ url: '/orders', method: 'POST', data })
export const getOrdersApi = (status?: OrderStatus) => request<OrderListResponse>({
  // uni-app H5 对 GET 的 data 对象会错误序列化为 [object Object]，这里显式拼接状态参数。
  url: status ? `/orders?status=${encodeURIComponent(status)}` : '/orders',
})
export const getOrderApi = (id: number) => request<OrderResponse>({ url: `/orders/${id}` })
export const payOrderApi = (id: number) => request<OrderResponse>({ url: `/orders/${id}/pay`, method: 'POST' })
export const completeOrderApi = (id: number) => request<OrderResponse>({ url: `/orders/${id}/complete`, method: 'POST' })
export const cancelOrderApi = (id: number) => request<OrderResponse>({ url: `/orders/${id}/cancel`, method: 'POST' })
// 删除待付款或待发货订单，并由后端事务清理订单关联数据。
export const deleteOrderApi = (id: number) => request<{ id: number; deleted: boolean }>({ url: `/orders/${id}`, method: 'DELETE' })
export const refundOrderApi = (id: number, reason: string) => request<OrderResponse>({ url: `/orders/${id}/refund`, method: 'POST', data: { reason } })
// 售后申请单独调用接口，避免与退款审核订单混用同一状态。
export const afterSaleOrderApi = (id: number, reason: string) => request<OrderResponse>({ url: `/orders/${id}/after-sale`, method: 'POST', data: { reason } })
export const getAddressesApi = () => request<AddressResponse>({ url: '/addresses' })
export const createAddressApi = (data: Omit<Address, 'id' | 'isDefault'> & { isDefault?: number }) => request<AddressResponse>({ url: '/addresses', method: 'POST', data })
export const updateAddressApi = (id: number, data: Omit<Address, 'id' | 'isDefault'> & { isDefault?: number }) => request<AddressResponse>({ url: `/addresses/${id}`, method: 'PUT', data })
export const setDefaultAddressApi = (id: number) => request<AddressResponse>({ url: `/addresses/${id}/default`, method: 'POST' })
export const removeAddressApi = (id: number) => request<AddressResponse>({ url: `/addresses/${id}`, method: 'DELETE' })
