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
export interface getCodeResult {
  img: string
}