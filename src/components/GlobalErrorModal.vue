<template>
  <div v-if="appStore.errorVisible" class="error-overlay">
    <a-card class="error-card" :title="`错误信息 (${appStore.errorCode || '未知'})`" :bordered="false">
      <template #extra>
        <a-button type="text" @click="appStore.hideError">
          <CloseOutlined />
        </a-button>
      </template>

      <div class="error-content">
        <div class="error-description">
          <span class="error-status-text">{{ errorStatusText }}</span>
          <p v-if="appStore.errorMessage && appStore.errorCode !== 500" class="error-msg-detail">{{ appStore.errorMessage }}</p>
        </div>

        <!-- 500 错误特殊处理：显示详细信息并支持折叠 -->
        <div v-if="appStore.errorCode === 500" class="error-500-details">
          <div class="short-message">
            {{ shortErrorFull }}
          </div>
          <a-collapse v-if="appStore.errorFull" ghost>
            <a-collapse-panel key="1" header="显示完整错误详情">
              <pre class="full-error-pre">{{ appStore.errorFull }}</pre>
            </a-collapse-panel>
          </a-collapse>
        </div>

        <div class="error-footer">
          <a-button type="primary" @click="appStore.hideError">确定</a-button>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { CloseOutlined } from '@ant-design/icons-vue'

const appStore = useAppStore()

const errorStatusText = computed(() => {
  switch (appStore.errorCode) {
    case 400: return '请求参数错误'
    case 401: return '未授权，JWT 令牌无效或已过期'
    case 403: return '禁止访问，权限不足'
    case 404: return '资源未找到'
    case 500: return '服务器内部错误'
    default: return '未知错误'
  }
})

const shortErrorFull = computed(() => {
  if (!appStore.errorFull) return ''
  const firstLine = appStore.errorFull.split('')[0]
  return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine
})
</script>

<style scoped>
.error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(2px);
}

.error-card {
  width: 90%;
  max-width: 500px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.error-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-status-text {
  font-size: 18px;
  font-weight: 600;
  color: #ff4d4f;
  display: block;
  margin-bottom: 8px;
}

.error-msg-detail {
  color: #666;
}

.error-500-details {
  background: #fff1f0;
  border: 1px solid #ffa39e;
  padding: 12px;
  border-radius: 4px;
}

.short-message {
  font-family: monospace;
  font-size: 13px;
  color: #cf1322;
  margin-bottom: 8px;
  word-break: break-all;
}

.full-error-pre {
  margin-top: 8px;
  padding: 8px;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.error-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

:deep(.ant-collapse-header) {
  padding: 4px 0 !important;
  font-size: 12px;
  color: #1890ff !important;
}

:deep(.ant-collapse-content-box) {
  padding: 0 !important;
}
</style>
