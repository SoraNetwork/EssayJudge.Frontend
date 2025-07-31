// Utilities
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const loading = ref(false)

  function setLoading(isLoading: boolean) {
    loading.value = isLoading
  }

  return {
    loading,
    setLoading,
  }
})
