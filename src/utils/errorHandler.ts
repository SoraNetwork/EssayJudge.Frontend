import { message } from 'ant-design-vue'
import type { AxiosError } from 'axios'
import { useAppStore } from '@/stores/app'

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleApiError(error: unknown): void {
  const appStore = useAppStore()
  
  // 避免重复显示同一个错误
  if (appStore.errorVisible) return

  if (error instanceof ApiError) {
    appStore.showError({
      code: error.statusCode,
      message: error.message
    })
  } else if (isAxiosError(error)) {
    const status = error.response?.status
    const responseData = error.response?.data as any
    const errorMessage = responseData?.message || error.message || '请求失败'
    
    // 如果是 500 错误，尽量获取完整的错误堆栈或 JSON
    let fullError = ''
    if (status === 500) {
      fullError = typeof responseData === 'string' 
        ? responseData 
        : JSON.stringify(responseData || error.message, null, 2)
    }

    appStore.showError({
      code: status || null,
      message: errorMessage,
      full: fullError
    })
  } else if (error instanceof Error) {
    appStore.showError({
      message: error.message || '操作失败'
    })
  } else {
    appStore.showError({
      message: '发生未知错误'
    })
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