/**
 * main.ts
 *
 * Bootstraps Ant Design and other plugins then mounts the App
 */

// Plugins
import { registerPlugins } from '@/plugins';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';

import { provideFluentDesignSystem, fluentCard, fluentButton } from '@fluentui/web-components';
provideFluentDesignSystem().register(fluentCard(), fluentButton());

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

// Styles
import 'unfonts.css'

const app = createApp(App)

registerPlugins(app)

app.use(Antd).mount('#app')