<template>
  <div class="hello-container">
    <div class="logo-section">
      <img src="@/assets/logo.svg" alt="Logo" class="logo" />
    </div>

    <div class="welcome-section">
      <div class="subtitle">Welcome to</div>
      <h1 class="title">SoraEssayJudge</h1>
    </div>

    <a-row :gutter="[16, 16]">
      <a-col :span="24">
        <a-card class="feature-card">
          <template #title>
            <h2 class="card-title">Get started</h2>
          </template>
          <p class="card-subtitle">
            Change this page by updating <code>&lt;HelloWorld /&gt;</code> in <code>components/HelloWorld.vue</code>.
          </p>
        </a-card>
      </a-col>

      <a-col v-for="link in links" :key="link.href" :xs="12" :sm="12" :md="6">
        <a-card class="link-card" hoverable>
          <template #title>
            <div class="link-title">
              <component :is="link.icon" class="link-icon" />
              {{ link.title }}
            </div>
          </template>
          <p class="link-subtitle">{{ link.subtitle }}</p>
          <template #actions>
            <a :href="link.href" target="_blank" rel="noopener noreferrer">
              <ExportOutlined />
            </a>
          </template>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import {
  FileTextOutlined,
  StarOutlined,
  AppstoreOutlined,
  TeamOutlined,
  ExportOutlined
} from '@ant-design/icons-vue'

const links = [
  {
    href: 'https://ant.design/',
    icon: FileTextOutlined,
    subtitle: 'Learn about all things Ant Design in our documentation.',
    title: 'Documentation',
  },
  {
    href: 'https://ant.design/components/overview/',
    icon: StarOutlined,
    subtitle: 'Explore available framework Features.',
    title: 'Features',
  },
  {
    href: 'https://ant.design/components/',
    icon: AppstoreOutlined,
    subtitle: 'Discover components in the Component library.',
    title: 'Components',
  },
  {
    href: 'https://github.com/vuejs/core',
    icon: TeamOutlined,
    subtitle: 'Connect with Vue developers.',
    title: 'Community',
  },
]
</script>

<style scoped>
.hello-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.logo-section {
  text-align: center;
  margin-bottom: 20px;
}

.logo {
  height: 150px;
  width: auto;
}

.welcome-section {
  text-align: center;
  margin-bottom: 32px;
}

.subtitle {
  font-size: 14px;
  color: var(--ant-color-text-secondary);
  margin-bottom: 8px;
}

.title {
  font-size: 40px;
  font-weight: bold;
  margin: 0;
  color: var(--ant-color-text-base);
}

.feature-card {
  border-radius: 12px;
}

.card-title {
  font-size: 20px;
  font-weight: bold;
  margin: 0;
}

.card-subtitle {
  margin: 8px 0 0 0;
  color: var(--ant-color-text-secondary);
}

.link-card {
  border-radius: 12px;
  height: 100%;
}

.link-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.link-icon {
  font-size: 20px;
  color: var(--ant-color-primary);
}

.link-subtitle {
  margin: 8px 0 0 0;
  color: var(--ant-color-text-secondary);
  font-size: 14px;
}
</style>