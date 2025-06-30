<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark>
            <v-toolbar-title>登录</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form @keyup.enter="login" ref="form">
              <v-text-field
                v-model="username"
                label="用户名"
                name="username"
                prepend-icon="mdi-account"
                type="text"
                :rules="[v => !!v || '用户名不能为空']"
                required
              ></v-text-field>

              <v-text-field
                v-model="password"
                label="密码"
                name="password"
                prepend-icon="mdi-lock"
                type="password"
                :rules="[v => !!v || '密码不能为空']"
                required
              ></v-text-field>
            </v-form>
            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              class="mt-4"
            >
              <div v-if="typeof error === 'string'">{{ error }}</div>
              <ul v-else>
                <li v-for="(messages, field) in error" :key="field">
                  {{ messages.join(', ') }}
                </li>
              </ul>
            </v-alert>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn to="/register" variant="text">注册账号</v-btn>
            <v-btn color="primary" @click="login" :loading="loading">登录</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | Record<string, string[]>>('')
const form = ref<any>(null)

async function login() {
  // 表单验证
  const { valid } = await form.value.validate()
  if (!valid) return

  loading.value = true
  error.value = ''

  try {
    // 使用FormData格式发送请求
    const formData = new FormData()
    formData.append('Username', username.value)
    formData.append('Password', password.value)

    const response = await api.post('/api/Auth/login', formData)

    // 保存用户信息和令牌
    authStore.setUserInfo({
      token: response.data.token,
      name: response.data.user.name,
      phoneNumber: response.data.user.phoneNumber || ''
    })
    authStore.setUserName(response.data.user.username)
    
    // 登录成功，跳转到首页
    router.push('/')
  } catch (err: any) {
    console.error('登录失败:', err)
    if (err.response) {
      if (err.response.data.errors) {
        // 处理验证错误
        error.value = err.response.data.errors
      } else {
        error.value = err.response.data.message || '登录失败，请检查用户名和密码'
      }
    } else {
      error.value = '网络错误，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}
</script>