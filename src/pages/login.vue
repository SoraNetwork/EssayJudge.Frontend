<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card variant="flat" class="pa-4 pa-sm-8" rounded="lg" style="border: 1px solid #e0e0e0;">
          <div class="text-center mb-6">
            <h1 class="text-h4 font-weight-bold text-grey-darken-3">{{ appTitle }}</h1>
          </div>

          <v-card-title class="text-h5 text-center font-weight-bold pa-0 mb-1">
            登录您的账户
          </v-card-title>

          <v-card-text class="pa-0">
            <v-form @submit.prevent="handlePasswordLogin" class="mt-6">
              <v-text-field
                v-model="username"
                label="账号"
                prepend-inner-icon="mdi-account-outline"
                variant="outlined"
                class="mb-4"
                :disabled="loading"
                density="comfortable"
              ></v-text-field>

              <v-text-field
                v-model="password"
                label="密码"
                prepend-inner-icon="mdi-lock-outline"
                type="password"
                variant="outlined"
                class="mb-4"
                :disabled="loading"
                density="comfortable"
              ></v-text-field>

              <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null" density="compact">
                {{ error }}
              </v-alert>

              <v-btn
                :loading="loading"
                type="submit"
                color="primary"
                block
                size="large"
                class="mb-4"
              >
                登录
              </v-btn>
            </v-form>

            <v-row align="center" class="my-2">
              <v-divider />
              <span class="px-4 text-caption text-grey">或</span>
              <v-divider />
            </v-row>

            <v-btn
              @click="redirectToDingTalkOAuth"
              variant="outlined"
              block
              size="large"
              :loading="loading"
              color="grey-darken-2"
            >
              <v-icon class="mr-2">mdi-dingtalk</v-icon>
              使用钉钉 Oauth 登录
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <!-- 添加全屏遮罩 -->
  <v-overlay :model-value="showDingTalkOverlay" class="align-center justify-center" persistent>
    <v-card class="pa-4 text-center" max-width="400">
      <v-card-title class="d-flex align-center justify-center">
        <v-icon color="primary" size="large" class="mr-2">mdi-dingtalk</v-icon>
        <span>钉钉登录中</span>
      </v-card-title>
      <v-card-text>
        <p class="mb-2">正在跳转到钉钉进行身份验证...</p>
        <v-progress-linear indeterminate color="primary" rounded></v-progress-linear>
      </v-card-text>
    </v-card>
  </v-overlay>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import * as dd from 'dingtalk-jsapi';

// --- App Title ---
const appTitle = import.meta.env.VITE_APP_TITLE || '作文评测系统';

// --- Reactive State ---
const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const isDingTalkEnv = ref(false);
// 添加遮罩状态
const showDingTalkOverlay = ref(false);

// --- Composables ---
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// --- Functions ---

/**
 * Handles standard username/password login.
 */
async function handlePasswordLogin() {
  if (!username.value || !password.value) {
    error.value = '请输入账号和密码。';
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    await authStore.login(username.value, password.value);
    router.push('/');
  } catch (err: any) {
    error.value = err.message || '登录失败，请检查您的凭据。';
  } finally {
    loading.value = false;
  }
}

/**
 * Redirects to the DingTalk OAuth2 authorization page.
 */
function redirectToDingTalkOAuth() {
  loading.value = true;
  error.value = null;

  const appKey = import.meta.env.VITE_DINGTALK_APP_KEY;

  if (!appKey) {
    error.value = '钉钉 AppKey 未配置，请检查 .env 文件中的 VITE_DINGTALK_APP_KEY 设置。';
    loading.value = false;
    return;
  }

  // 显示遮罩
  showDingTalkOverlay.value = true;
  
  // 延迟跳转，让用户看到提示
  setTimeout(() => {
    const redirectUri = encodeURIComponent(window.location.origin + '/login');
    const oauthUrl = `https://login.dingtalk.com/oauth2/auth?redirect_uri=${redirectUri}&response_type=code&client_id=${appKey}&scope=openid&prompt=consent`;
    window.location.href = oauthUrl;
  }, 1000);
}

/**
 * Handles the SSO callback from DingTalk OAuth.
 * @param {string} code - The authorization code from DingTalk.
 */
async function handleSsoCallback(code: string) {
  loading.value = true;
  error.value = null;
  try {
    await authStore.loginWithDingTalkSso(code);
    router.push('/');
  } catch (err: any) {
    error.value = err.message || '钉钉 SSO 登录失败。';
  } finally {
    loading.value = false;
    // 隐藏遮罩
    showDingTalkOverlay.value = false;
  }
}

/**
 * Attempts to automatically log in when inside the DingTalk client.
 */
async function handleDingTalkAutoLogin() {
  isDingTalkEnv.value = true;
  loading.value = true;
  error.value = null;
  
  // 显示遮罩
  showDingTalkOverlay.value = true;

  try {
    const corpId = import.meta.env.VITE_DINGTALK_CORP_ID;
    if (!corpId) {
      throw new Error('钉钉 CorpId 未配置。');
    }

    dd.ready(async () => {
      try {
        const result = await dd.runtime.permission.requestAuthCode({ corpId });
        await authStore.loginWithDingTalkCode(result.code);
        router.push('/');
      } catch (err: any) {
        error.value = `钉钉免密登录失败: ${err.message || '未知错误'}`;
        loading.value = false;
        // 隐藏遮罩
        showDingTalkOverlay.value = false;
      }
    });

    dd.error((err: any) => {
      throw new Error(`钉钉 JSAPI 错误: ${JSON.stringify(err)}`);
    });

  } catch (err: any) {
    error.value = err.message;
    loading.value = false;
    // 隐藏遮罩
    showDingTalkOverlay.value = false;
  }
}

// --- Lifecycle Hook ---
onMounted(() => {
  const { code } = route.query;
  if (typeof code === 'string' && code) {
    router.replace({ query: {} });
    handleSsoCallback(code);
    return;
  }

  if (/DingTalk/.test(navigator.userAgent)) {
    handleDingTalkAutoLogin();
  }
});
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>