<template>
  <div class="status-container" style="padding: 24px;">
    <div class="header-section mb-4" style="display: flex; align-items: center; justify-content: space-between;">
      <a-typography-title :level="2" style="margin-bottom: 0;">服务器状态</a-typography-title>
      <a-button :loading="loading" type="default" @click="fetchStatus" size="large">
        <template #icon>
          <ReloadOutlined />
        </template>
        刷新
      </a-button>
    </div>

    <div v-if="loading && !status" class="text-center" style="text-align: center; padding: 40px 0;">
      <a-spin size="large" />
    </div>

    <div v-if="error" class="text-center" style="text-align: center; padding: 20px 0;">
      <a-alert message="获取服务器状态失败" :description="error" type="error" show-icon />
    </div>

    <a-row :gutter="[24, 24]" v-if="status">
      <!-- 概览 -->
      <a-col :span="24" :md="12">
        <a-card title="概览" :hoverable="true">
          <a-list :data-source="overviewItems" :split="false" item-layout="horizontal">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta :description="item.description">
                  <template #title>
                    <span>{{ item.title }}</span>
                  </template>
                  <template #avatar>
                    <component :is="item.icon" style="font-size: 18px;" :style="{ color: item.color }" />
                  </template>
                </a-list-item-meta>
                <template v-if="item.chip">
                  <a-tag :color="item.chip.color">{{ item.chip.text }}</a-tag>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>

      <!-- 构建信息 -->
      <a-col :span="24" :md="12">
        <a-card title="构建信息" :hoverable="true">
          <a-list :data-source="buildItems" :split="false" item-layout="horizontal">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta :description="item.description">
                  <template #title>
                    <span>{{ item.title }}</span>
                  </template>
                  <template #avatar>
                    <component :is="item.icon" style="font-size: 18px;" :style="{ color: item.color }" />
                  </template>
                </a-list-item-meta>
                <template v-if="item.link && item.description && item.description !== 'N/A'">
                  <a :href="item.link" target="_blank" rel="noopener noreferrer">{{ item.description }} <ExportOutlined style="font-size: 12px;" /></a>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>

      <!-- 应用详情 -->
      <a-col :span="24" :md="12">
        <a-card title="应用详情" :hoverable="true">
          <a-list :data-source="applicationItems" :split="false" item-layout="horizontal">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta :description="item.description">
                  <template #title>
                    <span>{{ item.title }}</span>
                  </template>
                  <template #avatar>
                    <component :is="item.icon" style="font-size: 18px;" :style="{ color: item.color }" />
                  </template>
                </a-list-item-meta>
                <template v-if="item.progress">
                  <div style="width: 120px; text-align: right;">
                    <div>{{ item.description }}</div>
                    <a-progress :percent="item.progress.percent" :stroke-color="item.progress.color" size="small" :show-info="false" class="mt-1" />
                  </div>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>

      <!-- 系统信息 -->
      <a-col :span="24" :md="12">
        <a-card title="系统信息" :hoverable="true">
          <a-list :data-source="systemItems" :split="false" item-layout="horizontal">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta :description="item.description">
                  <template #title>
                    <span>{{ item.title }}</span>
                  </template>
                  <template #avatar>
                    <component :is="item.icon" style="font-size: 18px;" :style="{ color: item.color }" />
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { getServerStatus, type ServerStatus } from '@/services/apiService';

// Ant Design 组件
import { ReloadOutlined, ExportOutlined, CloudServerOutlined, DatabaseOutlined, ClockCircleOutlined, TagOutlined, ApiOutlined, DesktopOutlined, TeamOutlined, SettingOutlined, AppstoreOutlined, UserOutlined, CodeOutlined, HddOutlined } from '@ant-design/icons-vue';

const frontendVersion = import.meta.env.VITE_APP_VERSION || 'N/A';
const frontendGitCommit = import.meta.env.VITE_GIT_COMMIT || 'N/A';

const status = ref<ServerStatus | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
let intervalId: number | null = null;

const parseMemory = (memString: string): number => {
  if (!memString) return 0;
  // 提取数字部分并转换为数字
  const numValue = parseFloat(memString.replace(/[^\d.]/g, ''));
  // 为可视化设置一个基准最大值 (例如 2GB)。
  // 这只是为了在进度条上显示一个相对值。
  const maxMemory = 2048; // in MB
  return Math.min(100, (numValue / maxMemory) * 100); // 限制在100%以内
};

const fetchStatus = async () => {
  try {
    loading.value = true;
    status.value = await getServerStatus();
    error.value = null;
  } catch (err: any) {
    error.value = err.message || '获取服务器状态失败，请稍后重试。';
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

// 概览数据
const overviewItems = computed(() => {
  if (!status.value) return [];
  return [
    {
      title: '服务器状态',
      description: status.value.serverStatus,
      icon: 'CloudServerOutlined',
      color: status.value.serverStatus === 'Running' ? '#52c41a' : '#ff4d4f',
      chip: {
        text: status.value.serverStatus,
        color: status.value.serverStatus === 'Running' ? 'success' : 'error'
      }
    },
    {
      title: '数据库状态',
      description: status.value.databaseStatus,
      icon: 'DatabaseOutlined',
      color: status.value.databaseStatus === 'Connected' ? '#52c41a' : '#ff4d4f',
      chip: {
        text: status.value.databaseStatus,
        color: status.value.databaseStatus === 'Connected' ? 'success' : 'error'
      }
    },
    {
      title: '持续运行时间',
      description: status.value.uptime,
      icon: 'ClockCircleOutlined',
      color: '#1890ff'
    },
    {
      title: '服务器时间 (UTC)',
      description: new Date(status.value.serverTimeUtc).toLocaleString(),
      icon: 'ClockCircleOutlined',
      color: '#1890ff'
    }
  ];
});

// 构建信息数据
const buildItems = computed(() => {
  if (!status.value) return [];
  return [
    {
      title: '后端版本',
      description: status.value.build.version,
      icon: 'TagOutlined',
      color: '#722ed1'
    },
    {
      title: '后端 Git Commit',
      description: status.value.build.gitCommit,
      icon: 'TagOutlined',
      color: '#722ed1',
      link: status.value.build.gitCommit && status.value.build.gitCommit !== 'N/A' ?
        `https://github.com/SoraNetwork/EssayJudge.Backend/commit/${status.value.build.gitCommit}` : undefined
    },
    {
      title: '前端版本',
      description: frontendVersion,
      icon: 'TagOutlined',
      color: '#722ed1'
    },
    {
      title: '前端 Git Commit',
      description: frontendGitCommit,
      icon: 'TagOutlined',
      color: '#722ed1',
      link: frontendGitCommit && frontendGitCommit !== 'N/A' ?
        `https://github.com/SoraNetwork/essayjudge.frontend/commit/${frontendGitCommit}` : undefined
    }
  ];
});

// 应用详情数据
const applicationItems = computed(() => {
  if (!status.value) return [];
  return [
    {
      title: '环境',
      description: status.value.application.environment,
      icon: 'AppstoreOutlined',
      color: '#1890ff'
    },
    {
      title: '框架',
      description: status.value.application.framework,
      icon: 'CodeOutlined',
      color: '#1890ff'
    },
    {
      title: '内存占用',
      description: status.value.application.memoryUsage,
      icon: 'HddOutlined',
      color: '#faad14',
      progress: {
        percent: parseMemory(status.value.application.memoryUsage),
        color: '#faad14'
      }
    },
    {
      title: '已分配内存',
      description: status.value.application.totalAllocatedMemory,
      icon: 'ApiOutlined',
      color: '#faad14',
      progress: {
        percent: parseMemory(status.value.application.totalAllocatedMemory),
        color: '#faad14'
      }
    },
    {
      title: '线程数',
      description: status.value.application.threadCount.toString(),
      icon: 'TeamOutlined',
      color: '#1890ff'
    }
  ];
});

// 系统信息数据
const systemItems = computed(() => {
  if (!status.value) return [];
  return [
    {
      title: '主机名',
      description: status.value.system.hostName,
      icon: 'DesktopOutlined',
      color: '#52c41a'
    },
    {
      title: '服务器 IP',
      description: status.value.system.serverIpAddresses,
      icon: 'SettingOutlined',
      color: '#52c41a'
    },
    {
      title: '操作系统',
      description: status.value.system.os,
      icon: 'DesktopOutlined',
      color: '#52c41a'
    },
    {
      title: '处理器核心数',
      description: status.value.system.processorCount.toString(),
      icon: 'SettingOutlined',
      color: '#52c41a'
    },
    {
      title: '你的 IP',
      description: status.value.request.clientIp,
      icon: 'UserOutlined',
      color: '#52c41a'
    }
  ];
});
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px !important;
}

.mt-1 {
  margin-top: 4px !important;
}

.text-center {
  text-align: center;
}
</style>