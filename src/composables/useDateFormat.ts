import { computed } from 'vue'

/**
 * 日期格式化选项类型
 */
export type DateFormatOptions = Intl.DateTimeFormatOptions & {
  locale?: string
  timezoneOffset?: number // 时区偏移（小时），例如 UTC+8 为 8
}

/**
 * 默认日期格式化选项
 */
const DEFAULT_OPTIONS: DateFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  locale: 'zh-CN',
}

/**
 * 短日期格式化选项
 */
const SHORT_DATE_OPTIONS: DateFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  locale: 'zh-CN',
}

/**
 * 完整日期时间格式化选项
 */
const FULL_DATE_OPTIONS: DateFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  locale: 'zh-CN',
}

/**
 * 日期格式化 composable
 * @param dateString 日期字符串或 Date 对象
 * @param options 格式化选项
 * @returns 格式化后的日期字符串
 */
export function useDateFormat(
  dateString: string | Date | null | undefined,
  options: DateFormatOptions = {}
): string {
  if (!dateString) return ''

  const {
    locale = DEFAULT_OPTIONS.locale,
    timezoneOffset = 8, // 默认 UTC+8
    ...dateOptions
  } = options

  const date = typeof dateString === 'string' ? new Date(dateString) : dateString

  if (isNaN(date.getTime())) return ''

  // 应用时区偏移
  if (timezoneOffset !== 0) {
    date.setHours(date.getHours() + timezoneOffset)
  }

  const formatOptions: Intl.DateTimeFormatOptions = {
    ...dateOptions,
  }

  return date.toLocaleString(locale, formatOptions)
}

/**
 * 格式化为 UTC+8 时间
 * @param dateString 日期字符串或 Date 对象
 * @returns 格式化后的日期字符串
 */
export function formatDateUTC8(
  dateString: string | Date | null | undefined
): string {
  return useDateFormat(dateString, {
    ...DEFAULT_OPTIONS,
    timezoneOffset: 8,
  })
}

/**
 * 格式化为短日期（年-月-日）
 * @param dateString 日期字符串或 Date 对象
 * @returns 格式化后的日期字符串
 */
export function formatShortDate(
  dateString: string | Date | null | undefined
): string {
  return useDateFormat(dateString, SHORT_DATE_OPTIONS)
}

/**
 * 格式化为完整日期时间（包含秒）
 * @param dateString 日期字符串或 Date 对象
 * @returns 格式化后的日期字符串
 */
export function formatFullDate(
  dateString: string | Date | null | undefined
): string {
  return useDateFormat(dateString, FULL_DATE_OPTIONS)
}

/**
 * 格式化为相对时间（例如："3分钟前"）
 * @param dateString 日期字符串或 Date 对象
 * @returns 相对时间字符串
 */
export function formatRelativeTime(
  dateString: string | Date | null | undefined
): string {
  if (!dateString) return ''

  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return '刚刚'
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return formatDateUTC8(dateString)
  }
}

/**
 * 创建响应式的日期格式化
 * @param dateString 响应式日期字符串
 * @param options 格式化选项
 * @returns 计算属性，返回格式化后的日期字符串
 */
export function useReactiveDateFormat(
  dateString: () => string | Date | null | undefined,
  options: DateFormatOptions = {}
) {
  return computed(() => useDateFormat(dateString(), options))
}