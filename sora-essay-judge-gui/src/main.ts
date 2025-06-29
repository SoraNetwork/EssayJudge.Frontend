/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'
import router from './router'
import vuetify from './plugins/vuetify'

// Styles
import './styles/main.css'

const app = createApp(App)

registerPlugins(app)

app.use(router)
app.use(vuetify)

app.mount('#app')
