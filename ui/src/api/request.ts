import axios from 'axios'
import { ElMessage } from 'element-plus'

/* Axios 实例 — 自动附加 token 和统一错误处理 */
const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

/* 请求拦截器：附加 JWT */
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/* 响应拦截器：统一错误处理 */
request.interceptors.response.use(
  (res) => res.data,
  (error) => {
    const msg = error.response?.data?.message ?? '请求失败'
    const status = error.response?.status

    if (status === 401) {
      localStorage.removeItem('token')
      //window.location.href = '/login'
    }

    ElMessage.error(msg)
    return Promise.reject(error)
  },
)

export default request
