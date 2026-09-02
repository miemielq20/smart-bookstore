export interface LoginParams {
  username: string
  password: string
  captcha: string
  captchaId: string
}

export interface RegisterParams {
  username: string
  password: string
  confirmPassword: string
  captcha: string
  captchaId: string
}

export interface LoginUser {
  id: number
  username: string
  groupId: number | null
  accountType?: 'admin' | 'user'
}

export interface LoginData {
  accessToken: string
  user: LoginUser
}

export interface CaptchaData {
  uuid: string
  img: string
}
