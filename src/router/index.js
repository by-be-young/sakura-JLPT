import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Quiz from '../views/Quiz.vue'
import WrongBook from '../views/WrongBook.vue'
import Favorites from '../views/Favorites.vue'
import Result from '../views/Result.vue'
import Stats from '../views/Stats.vue'
import UnitSelect from '../views/UnitSelect.vue'

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/quiz/:mode', name: 'quiz', component: Quiz, props: true },
  { path: '/units', name: 'units', component: UnitSelect },
  { path: '/wrong', name: 'wrong', component: WrongBook },
  { path: '/favorites', name: 'favorites', component: Favorites },
  { path: '/result', name: 'result', component: Result },
  { path: '/stats', name: 'stats', component: Stats },
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
