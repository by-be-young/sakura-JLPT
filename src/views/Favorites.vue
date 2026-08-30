<template>
  <div class="container">
    <div class="list-header">
      <h2>⭐ 我的收藏</h2>
      <button v-if="favQuestions.length" class="btn btn-primary btn-sm" @click="practiceAll">全部练习</button>
    </div>

    <div v-if="favQuestions.length === 0" class="empty-state">
      <div class="emoji">🌟</div>
      <p>还没有收藏题目，做题时点击❤️收藏吧</p>
      <button class="btn btn-primary" style="margin-top:16px;" @click="$router.push('/')">去做题</button>
    </div>

    <div v-else class="question-list">
      <div v-for="q in favQuestions" :key="q.id" class="question-list-item" @click="practiceOne(q.id)">
        <div class="top">
          <span class="qid-tag">No.{{ q.id }}</span>
          <span v-if="q.mock" class="mock-tag">第{{ q.mock }}回</span>
          <span v-else-if="q.unit" class="mock-tag" style="background:#fef0e6;color:#c47a3a;">第{{ q.unit }}单元</span>
          <button class="fav-btn active" @click.stop="removeFav(q.id)">❤️</button>
        </div>
        <div class="sentence" v-html="displaySentence(q)"></div>
        <div class="meta">
          <span>正确答案：{{ q.answer }}. {{ q.options[q.answer - 1] }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { questions } from '../data/questions'
import { useStore } from '../store/useStore'
import { useFurigana } from '../composables/useFurigana'

const router = useRouter()
const store = useStore()
const furigana = useFurigana()

function displaySentence(q) {
  if (furigana.isEnabled.value && q.sentenceFurigana) return q.sentenceFurigana
  return q.sentence
}

const favQuestions = computed(() => {
  return questions.filter(q => store.state.favorites.includes(q.id)).sort((a, b) => a.id - b.id)
})

function practiceOne(id) {
  router.push({ name: 'quiz', params: { mode: 'favorites' }, query: { start: id } })
}

function practiceAll() {
  router.push({ name: 'quiz', params: { mode: 'favorites' } })
}

function removeFav(id) {
  store.toggleFavorite(id)
}
</script>

<style scoped>
.sentence :deep(u) {
  text-decoration: none;
  border-bottom: 2px solid var(--sakura-400);
  padding-bottom: 1px;
  color: var(--sakura-700);
  font-weight: 600;
}
</style>
