<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      app
    >
      <v-list-item
        prepend-avatar="https://randomuser.me/api/portraits/men/78.jpg"
        :title="authStore.realName || '未登录'"
        :subtitle="authStore.userName || '请先登录'"
      ></v-list-item>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item v-for="item in menuItems" :key="item.title" :to="item.to" :prepend-icon="item.icon" :title="item.title" rounded="xl"></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar
      app
      color="primary"
    >
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>作文评测系统</v-toolbar-title>
      <v-spacer></v-spacer>
      
      <template v-if="authStore.isAuthenticated">
        <v-btn icon @click="logout">
          <v-icon>mdi-logout</v-icon>
        </v-btn>
      </template>
      <template v-else>
        <v-btn to="/login" variant="text">登录</v-btn>
        <v-btn to="/register" variant="text">注册</v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>

    <v-footer app>
      <span>&copy; {{ new Date().getFullYear() }} - 作文评测系统</span>
    </v-footer>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const drawer = ref(false)

// 菜单项配置
const menuItems = computed(() => {
  const items = [
    { title: '首页', icon: 'mdi-view-dashboard', to: '/' },
  ]

  if (authStore.isAuthenticated) {
    items.push(
      { title: '作文管理', icon: 'mdi-book-open-page-variant', to: '/essays' },
      { title: '测验管理', icon: 'mdi-clipboard-text', to: '/assignments' },
      { title: '学生管理', icon: 'mdi-account-group', to: '/students' },
      { title: '班级管理', icon: 'mdi-google-classroom', to: '/classes' }
    )
  }

  return items
})

// 登出方法
function logout() {
  authStore.logout()
  router.push('/login')
}
</script>
