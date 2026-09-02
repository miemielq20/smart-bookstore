import type { RequestMethod } from '../types/request'
import type { ApiResponse } from '../types/response'

const BASE_URL = (() => {
  // #ifdef H5
  return '/api'
  // #endif

  // #ifdef MP-WEIXIN
  return 'http://localhost:3000/api'
  // #endif

  return 'http://localhost:3000/api'
})()

interface RequestOptions<TData> {
  url: string
  method?: RequestMethod
  data?: TData
}

export function request<TResponse, TData = Record<string, unknown>>(
  options: RequestOptions<TData>,
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')

    // 将 PATCH 方法转换为 POST，并添加 _method 标识
    let method = options.method ?? 'GET'
    let requestData = options.data

    // uni-app H5 对 GET 请求的 data 对象兼容性不一致，可能会把对象序列化成 [object Object]。
    // 统一将 GET 参数拼接到查询字符串，避免首页、分类和订单等列表接口收到非法参数。
    let requestUrl = `${BASE_URL}${options.url}`
    if (method === 'GET' && options.data && typeof options.data === 'object') {
      const query = Object.entries(options.data as Record<string, unknown>)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&')
      if (query) requestUrl += `${requestUrl.includes('?') ? '&' : '?'}${query}`
      requestData = undefined
    }
    
    if (method === 'PATCH') {
      method = 'POST'
      requestData = { ...options.data, _method: 'PATCH' } as any
    }

    uni.request({
      url: requestUrl,
      method: method as UniApp.RequestOptions['method'],
      data: requestData as UniApp.RequestOptions['data'],
      timeout: 15000,
      header: {
        'content-type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (res) => {
        const statusCode = res.statusCode
        const body = res.data as ApiResponse<TResponse> | TResponse

        if (statusCode >= 200 && statusCode < 300) {
          resolve(body as TResponse)
          return
        }

        if (statusCode === 401) {
          uni.removeStorageSync('token')
        }

        const message =
          typeof body === 'object' && body && 'message' in body
            ? String((body as ApiResponse).message)
            : '请求失败'

        uni.showToast({ title: message, icon: 'none' })
        reject(new Error(message))
      },
      fail: (error) => {
        uni.showToast({ title: '网络连接失败', icon: 'none' })
        reject(error)
      },
    })
  })
}
