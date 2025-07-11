// API服务配置
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// 创建axios实例
const api = axios.create({
  baseURL: 'https://api.ej.xingsora.cn', // 后端API基础URL
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'multipart/form-data'
  }
})

// 请求拦截器 - 添加认证令牌
api.interceptors.request.use(
  config => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers['Authorization'] = `Bearer ${authStore.token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  response => response,
  error => {
    const { response } = error
    if (response && response.status === 401) {
      // 未授权，清除令牌并重定向到登录页
      const authStore = useAuthStore()
      authStore.logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api