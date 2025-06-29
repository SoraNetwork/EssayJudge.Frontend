import { reactive } from 'vue'

interface SnackbarState {
  show: boolean
  text: string
  color: string
  timeout: number
}

const snackbarState = reactive<SnackbarState>({
  show: false,
  text: '',
  color: 'success',
  timeout: 3000,
})

export function useSnackbar() {
  const showSnackbar = (text: string, color: string = 'success', timeout: number = 3000) => {
    snackbarState.text = text
    snackbarState.color = color
    snackbarState.timeout = timeout
    snackbarState.show = true
  }

  return {
    snackbarState,
    showSnackbar,
  }
}
