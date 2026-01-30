/**
 * 日期格式化工具
 * 
 * 这个文件提供了向后兼容的导出，实际实现位于 @/composables/useDateFormat
 * 
 * @deprecated 建议使用 @/composables/useDateFormat 中的函数
 */

export {
  useDateFormat,
  formatDateUTC8,
  formatShortDate,
  formatFullDate,
  formatRelativeTime,
  useReactiveDateFormat,
  type DateFormatOptions,
} from '@/composables/useDateFormat'