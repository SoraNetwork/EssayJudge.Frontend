<template>
  <v-app>
    <!-- 路由变化时显示遮罩 -->
    <div v-if="showMobileOverlay" class="mobile-overlay">
      <div class="overlay-content">
        <v-card :width="mdAndUp ? 400 : '90%'" class="pa-4 position-relative">
          <v-card-title class="text-h6">
            <span>提示</span>
          </v-card-title>
          <v-card-text>
            使用V3享受更好的体验！
          </v-card-text>
          <v-card-actions class="flex-column">
            <v-btn
              href="https://v3.ej.xingsora.cn"
              elevation="12"
              :size="mdAndUp ? 'x-large' : 'large'"
              :width="mdAndUp ? '50%' : '100%'"
              class="cool-btn mb-2"
              aria-label="前往 V3"
            >
              <span class="btn-content">
                <v-icon left>mdi-rocket-launch</v-icon>
                前往V3
              </span>
            </v-btn>
          </v-card-actions>
          <v-btn 
            @click="closeOverlay" 
            variant="text" 
            size="x-small" 
            class="close-btn text-caption"
          >
            我知道了
          </v-btn>
        </v-card>
      </div>
    </div>

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

// 添加移动设备检测相关变量
const showMobileOverlay = ref(false);

// 移动设备检测函数
function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // 检查各种移动设备的关键字
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

// 关闭遮罩的方法
function closeOverlay() {
  showMobileOverlay.value = false;
}

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
  
  // 检查是否为移动设备，如果不是，则显示遮罩（每次都显示）
  if (!isMobileDevice()) {
    showMobileOverlay.value = true;
  }
  
  // 监听路由变化，每次路由变化时都显示遮罩
  watch(() => router.currentRoute.value, () => {
    if (!isMobileDevice()) {
      showMobileOverlay.value = true;
    }
  });
});

// 监听系统主题变化，并同步更新应用主题
watch(preferredDark, (newVal) => {
  theme.global.name.value = newVal ? 'dark' : 'light';
});
</script>

<style scoped>
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 16px;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.overlay-content {
  width: 100%;
  max-width: 400px;
}

/* 新增：酷炫按钮样式 */
.cool-btn {
  /* 覆盖 Vuetify 颜色，使用动态渐变背景 */
  background-image: linear-gradient(90deg, #6a11cb 0%, #2575fc 50%, #00c6ff 100%) !important;
  background-size: 200% 100%;
  color: #fff !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 20px rgba(37, 117, 252, 0.18), 0 0 30px rgba(106, 17, 203, 0.08);
  overflow: hidden;
  transition: transform 220ms cubic-bezier(.2,.9,.2,1), box-shadow 220ms;
  position: relative;
  text-transform: none !important;
}

/* 内部文本布局 */
.cool-btn .btn-content {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* 渐变移动效果 */
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.cool-btn {
  animation: gradientShift 6s ease infinite;
}

/* 光泽滑过的伪元素 */
.cool-btn::after {
  content: "";
  position: absolute;
  top: -120%;
  left: -30%;
  width: 60%;
  height: 260%;
  background: rgba(255,255,255,0.12);
  transform: rotate(25deg);
  transition: all 550ms cubic-bezier(.2,.9,.2,1);
  opacity: 0;
}
.cool-btn:hover::after,
.cool-btn:focus-visible::after {
  left: 120%;
  opacity: 1;
}

/* 悬停与按下的视觉反馈 */
.cool-btn:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 14px 30px rgba(37,117,252,0.22), 0 0 40px rgba(106,17,203,0.12);
}
.cool-btn:active {
  transform: translateY(-1px) scale(0.995);
  box-shadow: 0 8px 18px rgba(37,117,252,0.16);
}

/* 焦点可见性，便于键盘导航 */
.cool-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px rgba(37,117,252,0.12), 0 12px 26px rgba(37,117,252,0.18);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .mobile-overlay {
    padding: 12px;
  }
  
  .overlay-content {
    max-width: 100%;
  }
  
  .cool-btn {
    transform: none;
    box-shadow: 0 6px 14px rgba(37,117,252,0.12);
  }
  
  .cool-btn::after {
    display: none;
  }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
  .mobile-overlay {
    padding: 8px;
  }
  
  .cool-btn {
    font-size: 14px;
  }
}

/* 右下角关闭按钮样式 */
.close-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-size: 10px !important;
  min-width: auto !important;
  height: auto !important;
  padding: 2px 6px !important;
  opacity: 0.7 !important;
  color: rgba(0, 0, 0, 0.4) !important;
  transition: opacity 0.2s ease;
}

.close-btn:hover {
  opacity: 0.6 !important;
}

/* 深色主题下的关闭按钮颜色 */
.v-theme--dark .close-btn {
  color: rgba(255, 255, 255, 0.3) !important;
}

.v-theme--dark .close-btn:hover {
  color: rgba(255, 255, 255, 0.5) !important;
}
</style>