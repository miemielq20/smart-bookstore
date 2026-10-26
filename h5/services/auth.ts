import { request } from './request'
import type { LoginParams, RegisterParams } from '../types/auth'
import type { CaptchaResponse, LoginResponse, ProfileResponse } from '../types/response'

export const getCaptchaApi = () => request<CaptchaResponse>({ url: '/getCode' })

export const loginApi = (params: LoginParams) =>
  request<LoginResponse, LoginParams>({ url: '/auth/login', method: 'POST', data: params })

export const registerApi = (params: RegisterParams) =>
  request<LoginResponse, RegisterParams>({ url: '/auth/register', method: 'POST', data: params })

// 资料页统一通过接口读取和保存，保证页面展示与数据库保持一致。
export const getProfileApi = () => request<ProfileResponse>({ url: '/auth/profile' })
export const updateProfileApi = (data: {
  nickname: string
  phone: string
  email: string
  avatar?: string
  backgroundImage?: string
}) =>
  request<ProfileResponse>({ url: '/auth/profile', method: 'PUT', data })

const PROFILE_IMAGE_UPLOAD_URL = (() => {
  const configuredOrigin = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_ORIGIN?.replace(/\/$/, '')
  // #ifdef H5
  return configuredOrigin ? `${configuredOrigin}/api/auth/profile/image` : '/api/auth/profile/image'
  // #endif

  return `${configuredOrigin || 'http://192.168.1.100:3001'}/api/auth/profile/image`
})()

// 上传图片后返回服务器静态地址，资料表只保存该地址而非设备临时文件路径。
export function uploadProfileImageApi(filePath: string) {
  return new Promise<{ data: { url: string } }>((resolve, reject) => {
    uni.uploadFile({
      url: PROFILE_IMAGE_UPLOAD_URL,
      filePath,
      name: 'file',
      header: { Authorization: `Bearer ${uni.getStorageSync('token')}` },
      success: (response) => {
        try {
          const body = JSON.parse(response.data) as {
            data?: { url?: string }
            message?: string
          }
          if (response.statusCode >= 200 && response.statusCode < 300 && body.data?.url) {
            resolve({ data: { url: body.data.url } })
            return
          }
          reject(new Error(body.message || '图片上传失败'))
        } catch {
          reject(new Error('图片上传失败'))
        }
      },
      fail: reject,
    })
  })
}

export function hasLoginToken() {
  return Boolean(uni.getStorageSync('token'))
}

export function clearLoginToken() {
  uni.removeStorageSync('token')
  uni.removeStorageSync('user')
}
