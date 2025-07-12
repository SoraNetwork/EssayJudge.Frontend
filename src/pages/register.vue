<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark>
            <v-toolbar-title>注册账号</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form @submit.prevent="register" ref="form">
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
                :rules="[v => !!v || '密码不能为空', v => v.length >= 6 || '密码至少6个字符']"
                required
              ></v-text-field>

              <v-text-field
                v-model="name"
                label="真实姓名"
                name="name"
                prepend-icon="mdi-account-badge"
                type="text"
                :rules="[v => !!v || '真实姓名不能为空']"
                required
              ></v-text-field>

              <v-text-field
                v-model="phoneNumber"
                label="手机号"
                name="phoneNumber"
                prepend-icon="mdi-phone"
                type="tel"
                :rules="[v => !v || /^1\d{10}$/.test(v) || '请输入有效的手机号']"
              ></v-text-field>
            </v-form>
            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              class="mt-4"
            >
              {{ error }}
            </v-alert>
            <v-alert
              v-if="success"
              type="success"
              variant="tonal"
              class="mt-4"
            >
              {{ success }}
            </v-alert>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn to="/login" variant="text">返回登录</v-btn>
            <v-btn color="primary" @click="register" :loading="loading">注册</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()

const username = ref('')
const password = ref('')
const name = ref('')
const phoneNumber = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')
const form = ref<any>(null)

async function register() {
  // 表单验证
  const { valid } = await form.value.validate()
  if (!valid) return

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
</script>