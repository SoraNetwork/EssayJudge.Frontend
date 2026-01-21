<template>
  <div id="app">
    <a-spin :spinning="appStore.loading" :fullscreen="true" v-if="appStore.loading" />
    <router-view />
    <div>
      <component :is="contextHolder" />
    </div>
    <OrientationOverlay />
  </div>
</template>

<script lang="ts" setup>
import { useAppStore } from '@/stores/app'
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import * as dd from 'dingtalk-jsapi'
import { message } from 'ant-design-vue'
import OrientationOverlay from '@/components/OrientationOverlay.vue'

const appStore = useAppStore()
const authStore = useAuthStore()
const router = useRouter()

// 设置全局message实例
const [messageApi, contextHolder] = message.useMessage()

const showMessage = (text: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration: number = 3) => {
  switch (type) {
    case 'success': messageApi.success(text, duration); break;
    case 'error': messageApi.error(text, duration); break;
    case 'warning': messageApi.warning(text, duration); break;
    default: messageApi.info(text, duration); break;
  }
}

async function handleDingTalkAutoLogin() {
  showMessage('检测到钉钉环境，正在尝试自动登录...', 'info', 5)
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
        showMessage('登录成功，正在跳转...', 'success')
        const targetRoute = router.currentRoute.value.query.redirect || '/'
        router.push(targetRoute as string)
      } catch (err: any) {
        showMessage(`钉钉免密登录失败: ${err.message || '未知错误'}`, 'error', 5)
      } finally {
        appStore.setLoading(false)
      }
    })

    dd.error((err: any) => {
      throw new Error(`钉钉 JSAPI 错误: ${JSON.stringify(err)}`)
    })

  } catch (err: any) {
    showMessage(err.message, 'error', 5)
    appStore.setLoading(false)
  }
}

onMounted(() => {
  if (!authStore.isAuthenticated && /DingTalk/.test(navigator.userAgent)) {
    handleDingTalkAutoLogin()
  }
})
</script>