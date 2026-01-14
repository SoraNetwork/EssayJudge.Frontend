<template>
  <a-layout-footer class="footer">
    <div class="footer-content">
      <a-space>
        <a
          v-for="item in items"
          :key="item.title"
          class="social-link"
          :href="item.href"
          rel="noopener noreferrer"
          target="_blank"
          :title="item.title"
        >
          <component :is="item.icon" />
        </a>
      </a-space>

      <div class="copyright">
        &copy; {{ (new Date()).getFullYear() }} <span class="d-none d-sm-inline-block">SoraEssayJudge</span>
        —
        <a
          class="license-link"
          href="https://github.com/SoraNetwork/EssayJudge.Frontend"
          rel="noopener noreferrer"
          target="_blank"
        >
          MIT License
        </a>
      </div>
    </div>
  </a-layout-footer>
</template>

<script setup lang="ts">
import {
  GithubOutlined,
  TwitterOutlined,
  WechatOutlined,
  MailOutlined
} from '@ant-design/icons-vue'

const items = [
  {
    title: 'GitHub',
    icon: GithubOutlined,
    href: 'https://github.com/SoraNetwork/EssayJudge.Frontend',
  },
  {
    title: 'Twitter',
    icon: TwitterOutlined,
    href: 'https://twitter.com',
  },
  {
    title: 'WeChat',
    icon: WechatOutlined,
    href: '#',
  },
  {
    title: 'Email',
    icon: MailOutlined,
    href: 'mailto:support@example.com',
  },
]
</script>

<style scoped>
.footer {
  text-align: center;
  padding: 16px 50px;
  background-color: var(--ant-color-bg-layout);
  border-top: 1px solid var(--ant-color-border);
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
}

.social-link {
  color: var(--ant-color-text-tertiary);
  text-decoration: none;
  transition: color 0.2s ease-in-out;
  font-size: 18px;
  display: inline-flex;
  align-items: center;
}

.social-link:hover {
  color: var(--ant-color-primary);
}

.copyright {
  color: var(--ant-color-text-tertiary);
  font-size: 12px;
}

.license-link {
  color: var(--ant-color-text-tertiary);
  text-decoration: none;
}

.license-link:hover {
  color: var(--ant-color-primary);
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    gap: 12px;
  }
}
</style>