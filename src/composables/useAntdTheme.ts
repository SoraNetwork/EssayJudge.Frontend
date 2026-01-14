/**
 * composables/useAntdTheme.ts
 *
 * Ant Design Vue 主题切换 composable
 */

import { ref, computed, watch } from 'vue'
import { usePreferredDark } from '@vueuse/core'

const isDark = ref(false)
const preferredDark = usePreferredDark()

// 从 localStorage 读取主题设置
const savedTheme = localStorage.getItem('theme')
if (savedTheme) {
  isDark.value = savedTheme === 'dark'
} else {
  isDark.value = preferredDark.value
}

// 监听系统主题变化
watch(preferredDark, (newVal) => {
  if (!localStorage.getItem('theme')) {
    isDark.value = newVal
  }
})

// 监听主题变化并保存到 localStorage
watch(isDark, (newVal) => {
  localStorage.setItem('theme', newVal ? 'dark' : 'light')
})

// 切换主题
export function useAntdTheme() {
  const toggleTheme = () => {
    isDark.value = !isDark.value
  }

  const setTheme = (dark: boolean) => {
    isDark.value = dark
  }

  return {
    isDark: computed(() => isDark.value),
    toggleTheme,
    setTheme,
  }
}

// 导出当前主题状态供全局使用
export { isDark }