//统一接口响应格式
export interface ApiResponse<T> {
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

export interface MenuMeta {
  title: string
  icon?: string
  permission?: string
}

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


export type LoginApiResponse = ApiResponse<LoginResult>
export type GetCodeApiResponse = ApiResponse<GetCodeResult>
export type MenusApiResponse = ApiResponse<MenuNode[]>