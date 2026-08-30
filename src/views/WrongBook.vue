<template>
  <div class="container">
    <div class="list-header">
      <h2>📝 错题本</h2>
      <button v-if="wrongQuestions.length" class="btn btn-primary btn-sm" @click="practiceAll">全部重练</button>
    </div>

    <div v-if="wrongQuestions.length === 0" class="empty-state">
      <div class="emoji">🎉</div>
      <p>还没有错题，继续保持！</p>
      <button class="btn btn-primary" style="margin-top:16px;" @click="$router.push('/')">去做题</button>
    </div>

    <div v-else class="question-list">
      <div v-for="q in wrongQuestions" :key="q.id" class="question-list-item" @click="practiceOne(q.id)">
        <div class="top">
          <span class="qid-tag">No.{{ q.id }}</span>
          <span v-if="q.mock" class="mock-tag">第{{ q.mock }}回</span>
          <span v-else-if="q.unit" class="mock-tag" style="background:#fef0e6;color:#c47a3a;">第{{ q.unit }}单元</span>
          <span v-if="store.getAnswer(q.id)" :style="{ color: store.getAnswer(q.id).correct ? 'var(--green)' : 'var(--red)' }">
            {{ store.getAnswer(q.id).correct ? '已答对' : '仍答错' }}
          </span>
          <button class="del-btn" @click.stop="removeOne(q.id)" title="从错题本移除">✕</button>
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

const wrongQuestions = computed(() => {
  return questions.filter(q => store.state.wrong.includes(q.id)).sort((a, b) => a.id - b.id)
})

function practiceOne(id) {
  router.push({ name: 'quiz', params: { mode: 'wrong' }, query: { start: id } })
}

function practiceAll() {
  router.push({ name: 'quiz', params: { mode: 'wrong' } })
}

function removeOne(id) {
  store.removeWrong(id)
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
.del-btn {
  margin-left: auto;
  width: 24px;
  height: 24px;
  border: none;
  background: #fde4e6;
  color: #c44a52;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}
.del-btn:hover {
  background: var(--red);
  color: #fff;
  transform: scale(1.1);
}
</style>
