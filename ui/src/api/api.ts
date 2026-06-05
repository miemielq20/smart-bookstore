import request from './request'

import type{ LoginParams } from '../type/api.request'
import type{ LoginResult,getCodeResult } from '../type/api.response'

//登录
export function loginApi(data: LoginParams): Promise<LoginResult> {
  return request.post('/auth/login', data)
}

//获取验证码
export function getCodeApi(): Promise<getCodeResult> {
  return request.get('/getCode')
}