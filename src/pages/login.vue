<template>
  <div class="login-container">
    <div class="login-card-wrapper">
      <a-card class="login-card" :bordered="false" style="box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #e0e0e0;">
        <div class="login-header mb-6 text-center">
          <h1 class="login-title">{{ appTitle }}</h1>
        </div>

        <a-typography-title :level="3" class="login-subtitle text-center">
          登录您的账户
        </a-typography-title>

        <a-form @submit.prevent="handlePasswordLogin" class="mt-6" layout="vertical">
          <a-form-item label="账号" :colon="false">
            <a-input
              v-model:value="username"
              size="large"
              placeholder="请输入账号"
              :disabled="loading"
            >
              <template #prefix>
                <UserOutlined />
              </template>
            </a-input>
          </a-form-item>

          <a-form-item label="密码" :colon="false">
            <a-input-password
              v-model:value="password"
              size="large"
              placeholder="请输入密码"
              :disabled="loading"
            >
              <template #prefix>
                <LockOutlined />
              </template>
            </a-input-password>
          </a-form-item>

          <a-alert
            v-if="error"
            :message="error"
            type="error"
            show-icon
            closable
            @close="error = null"
            class="mb-4"
          />

          <a-button
            :loading="loading"
            type="primary"
            size="large"
            block
            html-type="submit"
            class="mb-4"
          >
            登录
          </a-button>
        </a-form>

        <div class="divider-wrapper my-4 text-center">
          <a-divider class="divider" orientation="center" dashed>或</a-divider>
        </div>

        <a-button
          @click="redirectToDingTalkOAuth"
          size="large"
          block
          :loading="loading"
          class="dingtalk-btn"
        >
          <DingtalkOutlined class="mr-2" />
          使用钉钉 Oauth 登录
        </a-button>
      </a-card>
    </div>

    <!-- 全屏遮罩 -->
    <a-modal
      v-model:open="showDingTalkOverlay"
      :footer="null"
      :closable="false"
      :maskClosable="false"
      centered
    >
      <div class="modal-content text-center">
        <DingtalkOutlined class="modal-icon" :style="{ fontSize: '24px', color: '#1890ff' }" />
        <a-typography-title :level="5" class="mt-2">钉钉登录中</a-typography-title>
        <p class="mt-2">正在跳转到钉钉进行身份验证...</p>
        <a-spin />
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import * as dd from 'dingtalk-jsapi';

// Ant Design 组件
import { UserOutlined, LockOutlined, DingtalkOutlined } from '@ant-design/icons-vue';

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
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
  padding: 16px;
}

.login-card-wrapper {
  width: 100%;
  max-width: 400px;
}

.login-card {
  padding: 24px;
  border-radius: 8px;
}

.login-header {
  margin-bottom: 24px;
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2d3d;
}

.login-subtitle {
  margin-bottom: 24px !important;
  color: #303133;
}

.mt-6 {
  margin-top: 24px;
}

.mb-4 {
  margin-bottom: 16px !important;
}

.my-4 {
  margin: 16px 0 !important;
}

.mt-2 {
  margin-top: 8px !important;
}

.divider-wrapper .divider {
  margin: 16px 0;
}

.dingtalk-btn {
  border-color: #1890ff;
  color: #1890ff;
}

.modal-content {
  text-align: center;
}

.modal-icon {
  margin-right: 8px;
}

.text-center {
  text-align: center;
}

.mr-2 {
  margin-right: 8px;
}
</style>