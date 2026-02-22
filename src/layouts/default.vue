<template>
  <a-config-provider :theme="{ algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm }">
    <a-layout class="layout">
    <!-- 全局加载指示器 -->
    <div v-if="appStore.loading" class="global-loading">
      <a-spin size="large" />
    </div>

    <a-layout-header class="header" v-if="authStore.isAuthenticated" style="background: #1890ff; padding: 0 20px;">
      <div class="logo" @click="$router.push('/')" style="cursor: pointer; color: white; font-size: 18px; font-weight: bold; float: left; height: 64px; line-height: 64px;">
        {{ appTitle }}
      </div>
      <a-menu
        class="main-menu"
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="horizontal"
        :style="{ lineHeight: '64px', float: 'left', minWidth: 0, flex: 1, background: '#1890ff' }"
        @click="handleMenuClick"
      >
        <a-menu-item key="/">
          <HomeOutlined />
          首页
        </a-menu-item>
        <a-sub-menu key="essays-menu" v-if="authStore.isAuthenticated">
          <template #title>
            <FileTextOutlined />
            <span>作文管理</span>
          </template>
          <a-menu-item key="/essays">作文列表</a-menu-item>
          <a-menu-item key="/essay/export">导出报告</a-menu-item>
        </a-sub-menu>
        <a-menu-item key="/assignments" v-if="authStore.isAuthenticated">
          <BookOutlined />
          测验管理
        </a-menu-item>
        <a-menu-item key="/students" v-if="authStore.isAuthenticated">
          <TeamOutlined />
          学生管理
        </a-menu-item>
        <a-menu-item key="/classes" v-if="authStore.isAuthenticated">
          <ApartmentOutlined />
          班级管理
        </a-menu-item>
        <a-menu-item key="/apikey" v-if="authStore.isAuthenticated">
          <KeyOutlined />
          API密钥管理
        </a-menu-item>
      </a-menu>
      <div class="header-actions" style="float: right;">
        <!-- Status Info Button -->
        <a-tooltip title="服务器状态" v-if="authStore.isAuthenticated">
          <a-button type="text" @click="$router.push('/status')" style="color: white;">
            <InfoCircleOutlined />
          </a-button>
        </a-tooltip>
        <!-- 主题切换按钮 -->
        <a-button type="text" @click="toggleTheme" style="color: white; margin: 0 12px;">
          {{ isDark ? '☀️' : '🌙' }}
        </a-button>
        <a-dropdown>
          <template #overlay>
            <a-menu @click="handleUserMenuClick">
               <a-menu-item v-if="authStore.isAuthenticated">
                  用户： {{ authStore.realName || authStore.user }}
                </a-menu-item>
                <a-menu-item key="logout" v-if="authStore.isAuthenticated">
                <LogoutOutlined />
                退出登录
              </a-menu-item>
            </a-menu>
          </template>
          <a-avatar :size="32" class="user-avatar" style="cursor: pointer; background-color: #177ddc; vertical-align: middle; margin-left: 16px;">
            <template #icon>
              <UserOutlined />
            </template>
            {{ userInitial }}
          </a-avatar>
        </a-dropdown>
      </div>
    </a-layout-header>
    <a-layout-header class="header" v-else style="background: #1890ff; padding: 0 20px; display: flex; align-items: center; justify-content: space-between;">
      <div class="logo" style="color: white; font-size: 18px; font-weight: bold;">
        {{ appTitle }}
      </div>
      <div class="header-actions" style="display: flex; align-items: center;">
        <!-- 主题切换按钮 -->
        <a-button type="text" @click="toggleTheme" style="color: white; margin-right: 16px;">
          {{ isDark ? '☀️' : '🌙' }}
        </a-button>
        <a-button type="text" @click="$router.push('/login')" style="color: white;">登录</a-button>
        <a-button type="text" @click="$router.push('/register')" style="color: white; margin-left: 8px;">注册</a-button>
      </div>
    </a-layout-header>

    <a-layout>
      <!-- 侧边栏仅在移动端显示 -->
      <a-drawer
        v-if="authStore.isAuthenticated"
        v-model:open="mobileMenuOpen"
        placement="left"
        :closable="false"
        width="256"
      >
        <a-menu
          class="main-menu-mobile"
          mode="inline"
          :selected-keys="selectedKeys"
          @click="handleMenuClick"
        >
          <a-menu-item key="/">
            <HomeOutlined />
            首页
          </a-menu-item>
          <a-sub-menu key="essays-mobile-menu">
            <template #title>
              <FileTextOutlined />
              <span>作文管理</span>
            </template>
            <a-menu-item key="/essays">作文列表</a-menu-item>
            <a-menu-item key="/essay/export">导出报告</a-menu-item>
          </a-sub-menu>
          <a-menu-item key="/assignments">
            <BookOutlined />
            测验管理
          </a-menu-item>
          <a-menu-item key="/students">
            <TeamOutlined />
            学生管理
          </a-menu-item>
          <a-menu-item key="/classes">
            <ApartmentOutlined />
            班级管理
          </a-menu-item>
          <a-menu-item key="/apikey">
            <KeyOutlined />
            API密钥管理
          </a-menu-item>
        </a-menu>
      </a-drawer>

      <a-layout-content class="content" style="margin: 24px 16px; overflow: initial;">
        <!-- 桌面端：使用 content-wrapper 包装 -->
        <div v-if="!isMobile" class="content-wrapper" :style="{ padding: '24px', background: 'var(--ant-color-bg-container)', borderRadius: '8px' }">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <KeepAlive>
                <component :is="Component" />
              </KeepAlive>
            </transition>
          </router-view>
        </div>
        <!-- 移动端：直接显示在底部，不使用 content-wrapper -->
        <router-view v-else v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <KeepAlive>
              <component :is="Component" />
            </KeepAlive>
          </transition>
        </router-view>
    </a-layout-content>
    </a-layout>

    <a-layout-footer class="footer" style="text-align: center; padding: 16px 50px;">
      <div class="footer-content">
        <span>Copyright &copy; {{ new Date().getFullYear() }} - SoraEssayJudge &nbsp;&nbsp; <a class="text-md select-none font-semibold text-neutral-500 dark:text-neutral-400" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">浙ICP备2024113182号-1</a></span>
      </div>
    </a-layout-footer>
    <GlobalErrorModal />
  </a-layout>
  </a-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useAntdTheme } from '@/composables/useAntdTheme'
import { getServerStatus, type ServerStatus } from '@/services/apiService'
import { theme } from 'ant-design-vue'
import GlobalErrorModal from '@/components/GlobalErrorModal.vue'

// Ant Design 组件
import {
  HomeOutlined,
  FileTextOutlined,
  BookOutlined,
  TeamOutlined,
  ApartmentOutlined,
  KeyOutlined,
  InfoCircleOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons-vue';

// 使用 Ant Design 主题
const { isDark, toggleTheme } = useAntdTheme()

// 定义菜单项类型
interface MenuItem {
  title: string;
  icon: string;
  to: string;
  subItems?: MenuItem[];
  active?: boolean;
}

const appTitle = import.meta.env.VITE_APP_TITLE || '作文评测系统';
const footerText = import.meta.env.VITE_FOOTER_TEXT || appTitle;
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()
const serverStatus = ref<ServerStatus | null>(null);
const selectedKeys = ref<string[]>([route.path]);
const mobileMenuOpen = ref(false);

// 检测是否为移动设备
const isMobile = computed(() => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
});

// 监听路由变化更新选中的菜单项
watch(
  () => route.path,
  (newPath) => {
    selectedKeys.value = [newPath];
  },
  { immediate: true }
);

const userInitial = computed(() => (authStore.realName ? authStore.realName.charAt(0).toUpperCase() : ''));

const versionTooltip = computed(() => {
  if (serverStatus.value?.build) {
    return `${serverStatus.value.build.version}@${serverStatus.value.build.gitCommit}`;
  }
  return '加载中...';
});

// 菜单点击事件
function handleMenuClick({ key }: { key: string }) {
  router.push(key);
  mobileMenuOpen.value = false; // 关闭移动端菜单
}

// 用户菜单点击事件
function handleUserMenuClick({ key }: { key: string }) {
  if (key === 'logout') {
    logout();
  }
}

// 登出方法
function logout() {
  authStore.logout()
  router.push('/login')
}

// 页面挂载时，获取服务器状态
onMounted(async () => {
  if (authStore.isAuthenticated) {
    try {
      serverStatus.value = await getServerStatus();
    } catch (error) {
      console.error("获取服务器状态失败:", error);
    }
  }
});
</script>

<style scoped>
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.layout {
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.header-actions {
  display: flex;
  align-items: center;
}

.content {
  padding: 24px;
  background-color: var(--ant-color-bg-layout);
  min-height: calc(100vh - 128px);
}

.content-wrapper {
  min-height: calc(100vh - 160px);
  background-color: var(--ant-color-bg-container);
  padding: 24px;
  border-radius: var(--ant-border-radius);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.footer {
  text-align: center;
  padding: 16px;
  background-color: var(--ant-color-bg-layout);
  border-top: 1px solid var(--ant-color-border);
}

.footer-content {
  width: 100%;
}

.user-avatar {
  background-color: #1890ff;
  color: white;
  margin-left: 16px;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* 调整菜单项间距并垂直居中 */
:deep(.main-menu .ant-menu-item) {
  margin: 0 20px;
  padding: 0 8px;
  height: 64px;
  display: flex;
  align-items: center;
}

/* 让菜单与右侧操作区保持一定间距 */
:deep(.main-menu) {
  margin-right: 20px;
}

/* 移动端抽屉内菜单样式 */
:deep(.main-menu-mobile .ant-menu-item) {
  padding: 12px 20px;
  margin: 0;
  height: auto;
  display: flex;
  align-items: center;
}

/* 确保抽屉体内的菜单有合适的内边距 */
:deep(.ant-drawer-body .main-menu-mobile) {
  padding-top: 8px;
  padding-bottom: 8px;
}

@media (max-width: 768px) {
  .content-wrapper {
    margin: 0 8px;
  }
}

/* 移动端内容样式 */
.content:has(> .router-view-wrapper) {
  margin: 0;
  padding: 0;
  background-color: transparent;
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>