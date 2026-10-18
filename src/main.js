import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/main.css'
import { initSupabase } from './composables/useAuth'
import { vReveal } from './composables/useMotion'

initSupabase()

const app = createApp(App)
app.directive('reveal', vReveal)
app.use(router).mount('#app')
