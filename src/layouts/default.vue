<template>
  <v-app>
    <v-progress-linear
      v-if="appStore.loading"
      indeterminate
      color="primary"
      style="position: fixed; top: 0; z-index: 9999;"
    ></v-progress-linear>

    <v-navigation-drawer
      v-model="drawer"
      :temporary="!mdAndUp"
    >
      <v-list-item
        :title="authStore.realName || '未登录'"
        :subtitle="authStore.userName || '请先登录'"
      >
        <template v-slot:prepend>
          <v-avatar color="primary">
            <span v-if="authStore.isAuthenticated">{{ userInitial }}</span>
            <v-icon v-else>mdi-account</v-icon>
          </v-avatar>
        </template>
      </v-list-item>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <template v-for="item in menuItems" :key="item.title">
          <v-list-group v-if="item.subItems" v-model="item.active">
            <template v-slot:activator="{ props }">
              <v-list-item v-bind="props" :prepend-icon="item.icon" :title="item.title" rounded="xl"></v-list-item>
            </template>
            <v-list-item v-for="subItem in item.subItems" :key="subItem.title" :to="subItem.to" :prepend-icon="subItem.icon" :title="subItem.title" rounded="xl" density="compact"></v-list-item>
          </v-list-group>
          <v-list-item v-else :to="item.to" :prepend-icon="item.icon" :title="item.title" rounded="xl"></v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar
      app
      color="primary"
    >
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title @click="$router.push('/')" style="cursor: pointer;">{{ appTitle }}</v-toolbar-title>
      <v-spacer></v-spacer>

      <!-- Status Info Button -->
      <v-tooltip location="bottom" v-if="authStore.isAuthenticated">
        <template v-slot:activator="{ props }">
          <v-btn icon to="/status" v-bind="props">
            <v-icon>mdi-information-outline</v-icon>
          </v-btn>
        </template>
        <span>{{ versionTooltip }}</span>
      </v-tooltip>

      <!-- 主题切换按钮 -->
      <v-btn icon @click="toggleTheme">
        <v-icon>{{ isDark ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
      </v-btn>
      
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
        <!-- Wrap router-view with KeepAlive -->
        <KeepAlive>
          <router-view />
        </KeepAlive>
      </v-container>
    </v-main>

    <v-footer app>
      <span>Copyright &copy; {{ new Date().getFullYear() }} - SoraEssayJudge &nbsp;&nbsp; <a class="text-md select-none font-semibold text-neutral-500 dark:text-neutral-400" href="https://beian.miit.gov.cn/">浙ICP备2024113182号-1</a></span>
    </v-footer>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue' // 导入 watch
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useTheme, useDisplay } from 'vuetify'
import { usePreferredDark } from '@vueuse/core' // 导入 usePreferredDark
import { getServerStatus, type ServerStatus } from '@/services/apiService';

// 定义菜单项类型
interface MenuItem {
  title: string;
  icon: string;
  to: string;
  subItems?: MenuItem[];
  active?: boolean;
}

const { mdAndUp } = useDisplay()
const appTitle = import.meta.env.VITE_APP_TITLE || '作文评测系统';
const footerText = import.meta.env.VITE_FOOTER_TEXT || appTitle;
const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const drawer = ref(mdAndUp.value)
const theme = useTheme()
const preferredDark = usePreferredDark() // 获取系统主题偏好
const serverStatus = ref<ServerStatus | null>(null);

watch(mdAndUp, (newVal) => {
  drawer.value = newVal
})

const userInitial = computed(() => (authStore.realName ? authStore.realName.charAt(0).toUpperCase() : ''));

// 计算属性：判断当前是否为深色主题
const isDark = computed(() => theme.global.name.value === 'dark')

const versionTooltip = computed(() => {
  if (serverStatus.value?.build) {
    return `${serverStatus.value.build.version}@${serverStatus.value.build.gitCommit}`;
  }
  return '加载中...';
});

// 切换主题函数
function toggleTheme() {
  theme.global.name.value = isDark.value ? 'light' : 'dark'
}

// 菜单项配置
const menuItems = computed<MenuItem[]>(() => {
  const items: MenuItem[] = [
    { title: '首页', icon: 'mdi-view-dashboard', to: '/' },
  ]

  if (authStore.isAuthenticated) {
    items.push(
      { 
        title: '作文管理', 
        icon: 'mdi-book-open-page-variant', 
        to: '/essays',
        subItems: [
          { title: '作文列表', to: '/essays', icon: 'mdi-format-list-bulleted' },
          { title: '导出报告', to: '/essay/export', icon: 'mdi-download' }
        ],
        active: false
      },
      { title: '测验管理', icon: 'mdi-clipboard-text', to: '/assignments' },
      { title: '学生管理', icon: 'mdi-account-group', to: '/students' },
      { title: '班级管理', icon: 'mdi-google-classroom', to: '/classes' },
      { title: 'API密钥管理', icon: 'mdi-key-variant', to: '/apikey' }
    )
  }

  return items
})

// 登出方法
function logout() {
  authStore.logout()
  router.push('/login')
}

// 页面挂载时，根据系统主题设置初始主题
onMounted(async () => {
  theme.global.name.value = preferredDark.value ? 'dark' : 'light';
  if (authStore.isAuthenticated) {
    try {
      serverStatus.value = await getServerStatus();
    } catch (error) {
      console.error("获取服务器状态失败:", error);
    }
  }
});

// 监听系统主题变化，并同步更新应用主题
watch(preferredDark, (newVal) => {
  theme.global.name.value = newVal ? 'dark' : 'light';
});

</script>
