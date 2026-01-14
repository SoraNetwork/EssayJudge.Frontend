<template>
  <div class="register-container">
    <div class="register-card-wrapper">
      <a-card class="register-card" :bordered="false" style="box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <a-typography-title :level="2" class="register-title text-center">注册账号</a-typography-title>

        <a-form @submit.prevent="register" layout="vertical" ref="formRef">
          <a-form-item label="用户名" :colon="false" :rules="[{ required: true, message: '用户名不能为空' }]">
            <a-input
              v-model:value="username"
              size="large"
              placeholder="请输入用户名"
            >
              <template #prefix>
                <UserOutlined />
              </template>
            </a-input>
          </a-form-item>

          <a-form-item label="密码" :colon="false" :rules="[{ required: true, message: '密码不能为空' }, { min: 6, message: '密码至少6个字符' }]">
            <a-input-password
              v-model:value="password"
              size="large"
              placeholder="请输入密码"
            >
              <template #prefix>
                <LockOutlined />
              </template>
            </a-input-password>
          </a-form-item>

          <a-form-item label="真实姓名" :colon="false" :rules="[{ required: true, message: '真实姓名不能为空' }]">
            <a-input
              v-model:value="name"
              size="large"
              placeholder="请输入真实姓名"
            >
              <template #prefix>
                <UsergroupAddOutlined />
              </template>
            </a-input>
          </a-form-item>

          <a-form-item label="手机号" :colon="false">
            <a-input
              v-model:value="phoneNumber"
              size="large"
              placeholder="请输入手机号"
            >
              <template #prefix>
                <PhoneOutlined />
              </template>
            </a-input>
          </a-form-item>
        </a-form>

        <a-alert
          v-if="error"
          :message="error"
          type="error"
          show-icon
          class="mt-4"
        />

        <a-alert
          v-if="success"
          :message="success"
          type="success"
          show-icon
          class="mt-4"
        />

        <div class="register-actions mt-4 text-center">
          <a-button type="default" @click="goToLogin" class="mr-4">返回登录</a-button>
          <a-button type="primary" @click="register" :loading="loading" size="large">注册</a-button>
        </div>
      </a-card>
    </div>
    <BackToTop />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { message } from 'ant-design-vue';

// Ant Design 组件
import { UserOutlined, LockOutlined, UsergroupAddOutlined, PhoneOutlined } from '@ant-design/icons-vue';

const router = useRouter()

const username = ref('')
const password = ref('')
const name = ref('')
const phoneNumber = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')
const formRef = ref<any>(null)

async function register() {
  // 前端验证
  if (!username.value) {
    error.value = '用户名不能为空';
    return;
  }

  if (!password.value) {
    error.value = '密码不能为空';
    return;
  }

  if (password.value.length < 6) {
    error.value = '密码至少6个字符';
    return;
  }

  if (!name.value) {
    error.value = '真实姓名不能为空';
    return;
  }

  if (phoneNumber.value && !/^1\d{10}$/.test(phoneNumber.value)) {
    error.value = '请输入有效的手机号';
    return;
  }

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const formData = new FormData()
    formData.append('Username', username.value)
    formData.append('Password', password.value)
    
    if (name.value) {
      formData.append('Name', name.value)
    }
    
    if (phoneNumber.value) {
      formData.append('PhoneNumber', phoneNumber.value)
    }
    
    await api.post('/api/Auth/register', formData)

    // 注册成功
    success.value = '注册成功！即将跳转到登录页面...'
    
    // 3秒后跳转到登录页
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (err: any) {
    console.error('注册失败:', err)
    if (err.response) {
      error.value = err.response.data.message || '注册失败，请稍后重试'
    } else {
      error.value = '网络错误，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}

function goToLogin() {
  router.push('/login')
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
  padding: 16px;
}

.register-card-wrapper {
  width: 100%;
  max-width: 400px;
}

.register-card {
  padding: 24px;
  border-radius: 8px;
}

.register-title {
  margin-bottom: 24px !important;
  color: #303133;
}

.mt-4 {
  margin-top: 16px !important;
}

.mr-4 {
  margin-right: 16px !important;
}

.text-center {
  text-align: center;
}

.register-actions {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>