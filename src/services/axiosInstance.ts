// API服务配置
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:5000', // 后端API基础URL
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json' // 默认使用 JSON
  }
})

// 请求拦截器 - 添加认证令牌
api.interceptors.request.use(
  config => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers['Authorization'] = `Bearer ${authStore.token}`
    }
    // 如果是文件上传，需要设置 Content-Type 为 multipart/form-data
    if (config.data instanceof FormData) {
        config.headers['Content-Type'] = 'multipart/form-data';
    } else {
        // 否则确保是 application/json
        config.headers['Content-Type'] = 'application/json';
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
      // 使用 router 进行跳转，避免硬编码 window.location
      // 需要在拦截器外部获取 router 实例，或者在需要时动态获取
      // 简单起见，这里仍然使用 window.location，但更好的方式是使用 router
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api