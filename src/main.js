import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/main.css'
import { initSupabase } from './composables/useAuth'

initSupabase()

createApp(App).use(router).mount('#app')
