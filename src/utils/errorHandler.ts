import { message } from 'ant-design-vue'
import type { AxiosError } from 'axios'

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleApiError(error: unknown): void {
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 401:
        message.error('未授权，请重新登录')
        break
      case 403:
        message.error('没有权限访问此资源')
        break
      case 404:
        message.error('请求的资源不存在')
        break
      case 500:
        message.error('服务器错误，请稍后重试')
        break
      default:
        message.error(error.message || '操作失败')
    }
  } else if (isAxiosError(error)) {
    const status = error.response?.status
    const errorMessage = (error.response?.data as any)?.message || error.message || '请求失败'

    switch (status) {
      case 401:
        message.error('未授权，请重新登录')
        break
      case 403:
        message.error('没有权限访问此资源')
        break
      case 404:
        message.error('请求的资源不存在')
        break
      case 500:
        message.error('服务器错误，请稍后重试')
        break
      default:
        message.error(errorMessage)
    }
  } else if (error instanceof Error) {
    message.error(error.message || '操作失败')
  } else {
    message.error('发生未知错误')
  }
}

export function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  )
}

export function createErrorHandler(context: string) {
  return (error: unknown) => {
    console.error(`[${context}] Error:`, error)
    handleApiError(error)
  }
}