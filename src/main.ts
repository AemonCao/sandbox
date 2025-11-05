import { createHead } from '@unhead/vue/client'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { router } from '~/router/index'
import App from './App.vue'

import './styles/main.css'
// import 'normalize.css'
import 'uno.css'

const app = createApp(App)
const head = createHead()
const pinia = createPinia()

app.use(router)
app.use(pinia)
app.use(head)
app.mount('#app')
