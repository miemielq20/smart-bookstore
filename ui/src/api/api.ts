import request from './request'

import type{ LoginParams } from '../type/api.request'
import type{ LoginApiResponse,GetCodeApiResponse,MenusApiResponse } from '../type/api.response'

//登录
export function loginApi(data: LoginParams): Promise<LoginApiResponse> {
  return request.post('/auth/login', data)
}

//获取验证码
export function getCodeApi(): Promise<GetCodeApiResponse> {
  return request.get('/getCode')
}
/* 菜单节点类型 */


/* GET /api/auth/menus */
export function getMenusApi(): Promise<MenusApiResponse> {
  return request.get('/auth/menus')
}