/**
 * main.ts
 *
 * Bootstraps Ant Design and other plugins then mounts the App
 */

// Plugins
import { registerPlugins } from '@/plugins';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import { ConfigProvider } from 'ant-design-vue';

import { provideFluentDesignSystem, fluentCard, fluentButton } from '@fluentui/web-components';
provideFluentDesignSystem().register(fluentCard(), fluentButton());

// Components
import App from './App.vue'

// Composables
import { createApp, h } from 'vue'

// Styles
import 'unfonts.css'

const app = createApp({
  setup() {
    return () => h(ConfigProvider, { locale: zhCN }, () => h(App));
  }
})

registerPlugins(app)

app.use(Antd).mount('#app')