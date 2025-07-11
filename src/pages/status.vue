<!-- filepath: f:\ProgramDev\soraessayjudge.frontend\src\pages\status.vue -->
<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <h1 class="text-h4">服务器状态</h1>
          <v-spacer></v-spacer>
          <v-btn :loading="loading" icon="mdi-refresh" variant="text" @click="fetchStatus"></v-btn>
        </div>
      </v-col>
    </v-row>

    <div v-if="loading && !status" class="text-center">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <div v-if="error" class="text-center">
      <v-alert type="error" prominent border="start">
        {{ error }}
      </v-alert>
    </div>

    <v-row v-if="status">
      <!-- 概览 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>概览</v-card-title>
          <v-list lines="one">
            <v-list-item title="服务器状态">
              <template v-slot:prepend><v-icon icon="mdi-server-network"></v-icon></template>
              <template v-slot:append>
                <v-chip :color="status.serverStatus === 'Running' ? 'green' : 'red'" text-color="white" small>
                  {{ status.serverStatus }}
                </v-chip>
              </template>
            </v-list-item>
            <v-list-item title="数据库状态">
              <template v-slot:prepend><v-icon icon="mdi-database"></v-icon></template>
              <template v-slot:append>
                <v-chip :color="status.databaseStatus === 'Connected' ? 'green' : 'red'" text-color="white" small>
                  {{ status.databaseStatus }}
                </v-chip>
              </template>
            </v-list-item>
            <v-list-item title="持续运行时间" :subtitle="status.uptime">
              <template v-slot:prepend><v-icon icon="mdi-timer-sand"></v-icon></template>
            </v-list-item>
            <v-list-item title="服务器时间 (UTC)" :subtitle="new Date(status.serverTimeUtc).toLocaleString()">
              <template v-slot:prepend><v-icon icon="mdi-clock-outline"></v-icon></template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- 构建信息 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>构建信息</v-card-title>
          <v-list lines="one">
            <v-list-item title="版本" :subtitle="status.build.version">
              <template v-slot:prepend><v-icon icon="mdi-tag-outline"></v-icon></template>
            </v-list-item>
            <v-list-item title="Git Commit">
              <template v-slot:prepend><v-icon icon="mdi-source-commit"></v-icon></template>
              <template v-slot:subtitle>
                <a
                  v-if="status.build.gitCommit && status.build.gitCommit !== 'N/A'"
                  :href="`https://github.com/SoraNetwork/EssayJudge.Backend/commit/${status.build.gitCommit}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-decoration-none"
                >
                  {{ status.build.gitCommit }}
                  <v-icon size="x-small" class="ml-1">mdi-open-in-new</v-icon>
                </a>
                <span v-else>{{ status.build.gitCommit }}</span>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- 应用详情 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>应用详情</v-card-title>
          <v-list lines="one">
            <v-list-item title="环境" :subtitle="status.application.environment">
              <template v-slot:prepend><v-icon icon="mdi-laptop"></v-icon></template>
            </v-list-item>
            <v-list-item title="框架" :subtitle="status.application.framework">
              <template v-slot:prepend><v-icon icon="mdi-dot-net"></v-icon></template>
            </v-list-item>
            <v-list-item title="内存占用">
              <template v-slot:prepend><v-icon icon="mdi-memory"></v-icon></template>
              <template v-slot:append>
                <div class="d-flex flex-column text-right" style="width: 120px;">
                  <span>{{ status.application.memoryUsage }}</span>
                  <v-progress-linear :model-value="parseMemory(status.application.memoryUsage)" color="primary" height="6" rounded class="mt-1"></v-progress-linear>
                </div>
              </template>
            </v-list-item>
            <v-list-item title="已分配内存">
              <template v-slot:prepend><v-icon icon="mdi-chip"></v-icon></template>
              <template v-slot:append>
                <div class="d-flex flex-column text-right" style="width: 120px;">
                  <span>{{ status.application.totalAllocatedMemory }}</span>
                  <v-progress-linear :model-value="parseMemory(status.application.totalAllocatedMemory)" color="secondary" height="6" rounded class="mt-1"></v-progress-linear>
                </div>
              </template>
            </v-list-item>
            <v-list-item title="线程数" :subtitle="status.application.threadCount">
              <template v-slot:prepend><v-icon icon="mdi-thread"></v-icon></template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- 系统信息 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>系统信息</v-card-title>
          <v-list lines="one">
            <v-list-item title="主机名" :subtitle="status.system.hostName">
              <template v-slot:prepend><v-icon icon="mdi-desktop-classic"></v-icon></template>
            </v-list-item>
            <v-list-item title="服务器 IP" :subtitle="status.system.serverIpAddresses">
              <template v-slot:prepend><v-icon icon="mdi-ip-network-outline"></v-icon></template>
            </v-list-item>
            <v-list-item title="操作系统" :subtitle="status.system.os">
              <template v-slot:prepend><v-icon icon="mdi-microsoft-windows"></v-icon></template>
            </v-list-item>
            <v-list-item title="处理器核心数" :subtitle="status.system.processorCount">
              <template v-slot:prepend><v-icon icon="mdi-cpu-64-bit"></v-icon></template>
            </v-list-item>
            <v-list-item title="你的 IP" :subtitle="status.request.clientIp">
              <template v-slot:prepend><v-icon icon="mdi-account-box-outline"></v-icon></template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { getServerStatus, type ServerStatus } from '@/services/apiService';

const status = ref<ServerStatus | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
let intervalId: number | null = null;

const parseMemory = (memString: string): number => {
  if (!memString) return 0;
  const value = parseFloat(memString);
  // 为可视化设置一个基准最大值 (例如 2GB)。
  // 这只是为了在进度条上显示一个相对值。
  const maxMemory = 2048; // in MB
  return (value / maxMemory) * 100;
};

const fetchStatus = async () => {
  try {
    loading.value = true;
    status.value = await getServerStatus();
    error.value = null;
  } catch (err) {
    error.value = '获取服务器状态失败，请稍后重试。';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStatus();
  intervalId = window.setInterval(fetchStatus, 5000); // 每 5 秒刷新一次状态
});

onUnmounted(() => {
  if (intervalId) {
    window.clearInterval(intervalId);
  }
});
</script>

<style scoped>
/* 这里可以添加页面特有的样式 */
</style>