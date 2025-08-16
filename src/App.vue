<template>
  <v-app>
    <router-view />

    <v-overlay
      v-model="appStore.loading"
      class="align-center justify-center"
      persistent
      :scrim="scrimColor"
    >
    </v-overlay>

    <v-snackbar
      v-model="snackbar.show"
      :timeout="snackbar.timeout"
      :color="snackbar.color"
      location="top"
    >
      {{ snackbar.text }}
    </v-snackbar>
  </v-app>
</template>

<script lang="ts" setup>
import { useAppStore } from '@/stores/app'
import { useTheme } from 'vuetify'
import { computed, onMounted, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import * as dd from 'dingtalk-jsapi'

const appStore = useAppStore()
const authStore = useAuthStore()
const router = useRouter()
const theme = useTheme()

const scrimColor = computed(() => {
  return theme.global.current.value.dark
    ? 'rgba(255, 255, 255, 0.7)' // 深色模式用半透明白色
    : 'rgba(0, 0, 0, 0.7)'      // 亮色模式用半透明黑色
})

const snackbar = reactive({
  show: false,
  text: '',
  color: 'info',
  timeout: 3000,
})

function showSnackbar(text: string, color: string = 'info', timeout: number = 3000) {
  snackbar.text = text
  snackbar.color = color
  snackbar.timeout = timeout
  snackbar.show = true
}

async function handleDingTalkAutoLogin() {
  showSnackbar('检测到钉钉环境，正在尝试自动登录...', 'info', 5000)
  appStore.setLoading(true)

  try {
    const corpId = import.meta.env.VITE_DINGTALK_CORP_ID
    if (!corpId) {
      throw new Error('钉钉 CorpId 未配置 (VITE_DINGTALK_CORP_ID)。')
    }

    dd.ready(async () => {
      try {
        const result = await dd.runtime.permission.requestAuthCode({ corpId })
        await authStore.loginWithDingTalkCode(result.code)
        showSnackbar('登录成功，正在跳转...', 'success')
        const targetRoute = router.currentRoute.value.query.redirect || '/'
        router.push(targetRoute as string)
      } catch (err: any) {
        showSnackbar(`钉钉免密登录失败: ${err.message || '未知错误'}`, 'error', 5000)
      } finally {
        appStore.setLoading(false)
      }
    })

    dd.error((err: any) => {
      throw new Error(`钉钉 JSAPI 错误: ${JSON.stringify(err)}`)
    })

  } catch (err: any) {
    showSnackbar(err.message, 'error', 5000)
    appStore.setLoading(false)
  }
}

onMounted(() => {
  if (!authStore.isAuthenticated && /DingTalk/.test(navigator.userAgent)) {
    handleDingTalkAutoLogin()
  }
})
</script>
