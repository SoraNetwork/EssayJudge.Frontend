<template>
  <div class="not-found-container">
    <a-row justify="center" align="middle" class="not-found-row">
      <a-col :xs="24" :sm="20" :md="16" :lg="12">
        <a-card class="not-found-card">
          <div class="not-found-content">
            <ExclamationCircleOutlined class="error-icon" />
            <h1 class="error-code">404</h1>
            <h2 class="error-title">有这个页面吗？</h2>
            <p class="error-description">
              抱歉，您正在寻找的页面不存在或已被移动，请检查统一资源定位器输入是否正确。
            </p>
            <a-button type="primary" size="large" @click="$router.push('/')">
              <template #icon>
                <HomeOutlined />
              </template>
              返回首页
            </a-button>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
  <BackToTop />
</template>

<script setup lang="ts">
import { ExclamationCircleOutlined, HomeOutlined } from '@ant-design/icons-vue'
import BackToTop from '@/components/BackToTop.vue'
</script>

<style scoped>
.not-found-container {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.not-found-row {
  width: 100%;
}

.not-found-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.not-found-content {
  text-align: center;
  padding: 40px 20px;
}

.error-icon {
  font-size: 100px;
  color: var(--ant-color-error);
  margin-bottom: 24px;
  display: block;
}

.error-code {
  font-size: 72px;
  font-weight: bold;
  color: var(--ant-color-primary);
  margin: 0 0 16px 0;
}

.error-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--ant-color-text-base);
}

.error-description {
  font-size: 16px;
  color: var(--ant-color-text-secondary);
  margin: 0 0 32px 0;
  line-height: 1.6;
}
</style>