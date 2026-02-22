// Utilities
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const loading = ref(false)
  const errorVisible = ref(false)
  const errorCode = ref<number | null>(null)
  const errorMessage = ref('')
  const errorFull = ref('')

  function setLoading(isLoading: boolean) {
    loading.value = isLoading
  }

  function showError(params: { code?: number | null; message?: string; full?: string }) {
    errorCode.value = params.code ?? null
    errorMessage.value = params.message || ''
    errorFull.value = params.full || ''
    errorVisible.value = true
  }

  function hideError() {
    errorVisible.value = false
  }

  return {
    loading,
    setLoading,
    errorVisible,
    errorCode,
    errorMessage,
    errorFull,
    showError,
    hideError,
  }
})
