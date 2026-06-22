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
    
    if (method === 'PATCH') {
      method = 'POST'
      requestData = { ...options.data, _method: 'PATCH' } as any
    }

    uni.request({
      url: `${BASE_URL}${options.url}`,
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
