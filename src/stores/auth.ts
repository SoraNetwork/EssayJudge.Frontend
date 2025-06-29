// 用户认证相关的存储
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref(localStorage.getItem('token') || '')
  const userName = ref(localStorage.getItem('userName') || '')
  const realName = ref(localStorage.getItem('realName') || '')
  const phoneNumber = ref(localStorage.getItem('phoneNumber') || '')

  // 计算属性
  const isAuthenticated = computed(() => !!token.value)

  // 方法
  function setUserInfo(userInfo: { token: string, name: string, phoneNumber: string }) {
    token.value = userInfo.token
    realName.value = userInfo.name
    phoneNumber.value = userInfo.phoneNumber

    // 保存到本地存储
    localStorage.setItem('token', userInfo.token)
    localStorage.setItem('realName', userInfo.name)
    localStorage.setItem('phoneNumber', userInfo.phoneNumber)
  }

  function setUserName(name: string) {
    userName.value = name
    localStorage.setItem('userName', name)
  }

  function logout() {
    token.value = ''
    userName.value = ''
    realName.value = ''
    phoneNumber.value = ''

    // 清除本地存储
    localStorage.removeItem('token')
    localStorage.removeItem('userName')
    localStorage.removeItem('realName')
    localStorage.removeItem('phoneNumber')
  }

  return {
    token,
    userName,
    realName,
    phoneNumber,
    isAuthenticated,
    setUserInfo,
    setUserName,
    logout
  }
})