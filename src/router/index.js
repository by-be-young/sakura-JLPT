import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Quiz from '../views/Quiz.vue'
import Favorites from '../views/Favorites.vue'
import Result from '../views/Result.vue'
import My from '../views/My.vue'
import UnitSelect from '../views/UnitSelect.vue'
import WordLearn from '../views/WordLearn.vue'
import WordStudy from '../views/WordStudy.vue'
import WordReview from '../views/WordReview.vue'
import Study from '../views/Study.vue'
import GrammarReader from '../views/GrammarReader.vue'

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/quiz/:mode', name: 'quiz', component: Quiz, props: true },
  { path: '/units', name: 'units', component: UnitSelect },
  { path: '/words', name: 'words', component: WordLearn },
  { path: '/words/learn', name: 'words-learn', component: WordStudy },
  { path: '/words/review', name: 'words-review', component: WordReview },
  { path: '/study', name: 'study', component: Study },
  { path: '/study/:level', name: 'study-reader', component: GrammarReader },
  { path: '/my', name: 'my', component: My },
  { path: '/stats', redirect: '/my' },
  { path: '/wrong', redirect: { name: 'my', query: { tab: 'wrong' } } },
  { path: '/favorites', name: 'favorites', component: Favorites },
  { path: '/result', name: 'result', component: Result },
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
