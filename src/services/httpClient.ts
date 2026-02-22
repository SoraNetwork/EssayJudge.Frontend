import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { handleApiError } from '@/utils/errorHandler'

export const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const httpClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
})

httpClient.interceptors.request.use(
  config => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers['Authorization'] = `Bearer ${authStore.token}`
    }

    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data'
    }

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

httpClient.interceptors.response.use(
  response => response,
  error => {
    const { response } = error
    if (response && response.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
    }
    
    // 全局捕获错误并显示弹窗
    handleApiError(error)
    
    return Promise.reject(error)
  }
)

export default httpClient