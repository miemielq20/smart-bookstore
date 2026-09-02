import { request } from './request'
import type { LoginParams, RegisterParams } from '../types/auth'
import type { CaptchaResponse, LoginResponse, ProfileResponse } from '../types/response'

export const getCaptchaApi = () =>
  request<CaptchaResponse>({ url: '/getCode' })

export const loginApi = (params: LoginParams) =>
  request<LoginResponse, LoginParams>({ url: '/auth/login', method: 'POST', data: params })

export const registerApi = (params: RegisterParams) =>
  request<LoginResponse, RegisterParams>({ url: '/auth/register', method: 'POST', data: params })

// 资料页统一通过接口读取和保存，保证页面展示与数据库保持一致。
export const getProfileApi = () => request<ProfileResponse>({ url: '/auth/profile' })
export const updateProfileApi = (data: { nickname: string; phone: string; email: string }) =>
  request<ProfileResponse>({ url: '/auth/profile', method: 'PUT', data })

export function hasLoginToken() {
  return Boolean(uni.getStorageSync('token'))
}

export function clearLoginToken() {
  uni.removeStorageSync('token')
  uni.removeStorageSync('user')
}
