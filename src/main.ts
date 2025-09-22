/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins';
import { Image } from 'ant-design-vue';

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

app.use(Image).mount('#app')
