<template>
  <div class="container">
    <div v-if="questionList.length === 0" class="empty-state">
      <div class="emoji">🌸</div>
      <p>没有可练习的题目</p>
      <button class="btn btn-primary" style="margin-top:16px;" @click="$router.push('/')">返回首页</button>
    </div>

    <template v-else>
      <div class="quiz-header">
        <button class="btn btn-ghost btn-sm" @click="goBack">← 返回</button>
        <div class="quiz-progress">
          <div class="quiz-progress-bar" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="quiz-meta">
          <span>{{ currentIndex + 1 }} / {{ questionList.length }}</span>
        </div>
      </div>

      <!-- 顺序/单元模式：题号选择器 -->
      <div v-if="mode === 'sequential' || mode === 'unit'" class="picker-toggle">
        <button class="btn btn-secondary btn-sm" @click="showPicker = !showPicker">
          {{ showPicker ? '收起题号表' : '📋 选择题号 / 跳转' }}
        </button>
        <span class="picker-hint">绿=答对 红=答错 灰=未做</span>
      </div>
      <QuestionPicker v-if="(mode === 'sequential' || mode === 'unit') && showPicker"
        :questions="sequentialAll" @select="jumpToQuestion" />

      <!-- 随机模式：设置 -->
      <div v-if="mode === 'random'" class="random-settings">
        <label class="toggle-label">
          <input type="checkbox" v-model="fullyRandom" @change="saveRandomSetting" />
          <span>完全随机（默认优先抽取未做过的题）</span>
        </label>
        <button class="btn btn-ghost btn-sm" @click="reshuffleRandom">🔄 重新洗牌</button>
      </div>

      <!-- 答题区（带左右箭头） -->
      <div class="quiz-area">
        <!-- 左箭头 -->
        <button class="side-arrow side-arrow-left" :disabled="currentIndex === 0" @click="prevQuestion" title="上一题 (A)">
          <span class="arrow-icon">‹</span>
        </button>

        <Transition :name="slideDir" mode="out-in">
        <div class="card quiz-card" :key="currentIndex">
          <div class="quiz-meta" style="margin-bottom:12px;">
            <span class="qid-tag">No.{{ currentQuestion.id }}</span>
            <span v-if="mode === 'mock'" class="mock-tag">第{{ mockId }}回模拟</span>
            <span v-else-if="mode === 'unit'" class="mock-tag" style="background:#fef0e6;color:#c47a3a;">第{{ unitId }}单元</span>
            <span v-else class="mock-tag" style="background:#e8f4fd;color:#3a7ca5;">{{ modeLabel }}</span>
            <span v-if="currentQuestion.type" class="type-tag" :class="'type-' + currentQuestion.type">{{ currentQuestion.type }}</span>
            <span v-if="store.getAnswer(currentQuestion.id)" class="status-tag"
              :class="store.getAnswer(currentQuestion.id).correct ? 'status-correct' : 'status-wrong'">
              {{ store.getAnswer(currentQuestion.id).correct ? '已答对' : '曾答错' }}
            </span>
            <button class="fav-btn" :class="{ active: isFav }" @click="toggleFav">
              {{ isFav ? '❤️' : '🤍' }}
            </button>
          </div>

          <QuestionCard
            :question="currentQuestion"
            :selected="selected"
            :showResult="showResult"
            :flash="flash"
            @select="handleSelect" />

          <!-- 最后一题已答完时显示完成按钮 -->
          <div v-if="currentIndex >= questionList.length - 1 && showResult" class="finish-area">
            <button class="btn btn-primary" @click="finishQuiz">查看结果 →</button>
          </div>
        </div>
        </Transition>

        <!-- 右箭头 -->
        <button class="side-arrow side-arrow-right" :disabled="currentIndex >= questionList.length - 1" @click="nextQuestion" title="下一题 (D)">
          <span class="arrow-icon">›</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { questions } from '../data/questions'
import { useStore } from '../store/useStore'
import { useFurigana } from '../composables/useFurigana'
import QuestionCard from '../components/QuestionCard.vue'
import QuestionPicker from '../components/QuestionPicker.vue'

const route = useRoute()
const router = useRouter()
const store = useStore()
const furigana = useFurigana()

const mode = computed(() => route.params.mode)
const mockId = computed(() => Number(route.query.mock) || 0)
const unitId = computed(() => Number(route.query.unit) || 0)

const modeLabel = computed(() => {
  const map = { sequential: '顺序练习', random: '随机练习', unit: '单元练习', wrong: '错题重做', favorites: '收藏练习' }
  return map[mode.value] || '练习'
})

const questionList = ref([])
const currentIndex = ref(0)
const selected = ref(0)
const showResult = ref(false)
const flash = ref(false)
const sessionResults = ref([])
const showPicker = ref(false)
const fullyRandom = ref(false)
const slideDir = ref('slide-next')
let flashTimer = null
const shuffleCache = new Map()

function shuffleQuestion(q) {
  const indices = [0, 1, 2, 3]
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = indices[i]
    indices[i] = indices[j]
    indices[j] = tmp
  }
  return {
    ...q,
    options: indices.map(i => q.options[i]),
    answer: indices.indexOf(q.answer - 1) + 1,
    _optionOrder: indices,
  }
}

const sequentialAll = computed(() => {
  if (mode.value === 'unit') {
    return questions.filter(q => q.unit === unitId.value).sort((a, b) => a.id - b.id)
  }
  return questions.filter(q => !q.mock).sort((a, b) => a.id - b.id)
})

const currentQuestion = computed(() => {
  const q = questionList.value[currentIndex.value]
  if (!q) return {}
  if (!shuffleCache.has(q.id)) shuffleCache.set(q.id, shuffleQuestion(q))
  return shuffleCache.get(q.id)
})
const progressPercent = computed(() => Math.round((currentIndex.value + 1) / questionList.value.length * 100))
const isFav = computed(() => store.isFavorite(currentQuestion.value.id))

// 未提交时锁定振假名
watch(showResult, (val) => {
  furigana.setLocked(!val)
}, { immediate: true })

onUnmounted(() => {
  furigana.setLocked(false)
  if (flashTimer) clearTimeout(flashTimer)
  window.removeEventListener("keydown", handleKeydown)
})

const RANDOM_KEY = 'sakura_random_fully_random'
onMounted(() => {
  fullyRandom.value = localStorage.getItem(RANDOM_KEY) === '1'
  window.addEventListener('keydown', handleKeydown)
})
function saveRandomSetting() {
  localStorage.setItem(RANDOM_KEY, fullyRandom.value ? '1' : '0')
}

function handleKeydown(e) {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return
  if (e.key === 'l' || e.key === 'L') furigana.toggle()
  else if (e.key === 'a' || e.key === 'A') prevQuestion()
  else if (e.key === 'd' || e.key === 'D') nextQuestion()
  else if (['1','2','3','4'].includes(e.key)) {
    if (!showResult.value && !flash.value) handleSelect(Number(e.key))
  }
}

function buildList() {
  shuffleCache.clear()
  let list = []
  if (mode.value === 'sequential') {
    list = questions.filter(q => !q.mock).sort((a, b) => a.id - b.id)
    const start = Number(route.query.start)
    if (start) {
      const idx = list.findIndex(q => q.id >= start)
      if (idx > 0) list = list.slice(idx)
    }
  } else if (mode.value === 'random') {
    list = buildRandomList()
  } else if (mode.value === 'mock') {
    list = questions.filter(q => q.mock === mockId.value).sort((a, b) => a.id - b.id)
  } else if (mode.value === 'unit') {
    list = questions.filter(q => q.unit === unitId.value).sort((a, b) => a.id - b.id)
  } else if (mode.value === 'wrong') {
    list = questions.filter(q => store.state.wrong.includes(q.id))
  } else if (mode.value === 'favorites') {
    list = questions.filter(q => store.state.favorites.includes(q.id))
  }
  questionList.value = list
  currentIndex.value = 0
  if (mode.value === 'sequential' && !route.query.start) {
    const firstUnanswered = list.findIndex(q => !store.getAnswer(q.id))
    if (firstUnanswered > 0) currentIndex.value = firstUnanswered
  }
  resetState()
  sessionResults.value = []
}

function buildRandomList() {
  const all = questions.filter(q => !q.mock)
  if (fullyRandom.value) {
    return all.sort(() => Math.random() - 0.5)
  }
  const unseen = all.filter(q => !store.getAnswer(q.id))
  const seen = all.filter(q => store.getAnswer(q.id))
  unseen.sort(() => Math.random() - 0.5)
  seen.sort(() => Math.random() - 0.5)
  if (unseen.length >= all.length * 0.5) {
    return [...unseen, ...seen]
  }
  return [...unseen, ...seen].sort(() => Math.random() - 0.5)
}

function reshuffleRandom() {
  if (mode.value === 'random') {
    questionList.value = buildRandomList()
    currentIndex.value = 0
    resetState()
  }
}

function jumpToQuestion(id) {
  const idx = questionList.value.findIndex(q => q.id === id)
  if (idx >= 0) {
    currentIndex.value = idx
    resetState()
    showPicker.value = false
  }
}

onMounted(buildList)
watch(() => [mode.value, mockId.value, unitId.value], buildList)

// 点击选项即自动提交
function handleSelect(num) {
  if (showResult.value) return
  selected.value = num
  submitAnswer()
}

function submitAnswer() {
  if (!selected.value) return
  const correct = selected.value === currentQuestion.value.answer
  const origSelected = currentQuestion.value._optionOrder[selected.value - 1] + 1
  store.recordAnswer(currentQuestion.value.id, origSelected, correct)
  sessionResults.value.push({ qid: currentQuestion.value.id, selected: selected.value, correct })

  if (correct) {
    // 答对：flash显示1秒正确标记，然后自动下一题（不展开解析）
    flash.value = true
    flashTimer = setTimeout(() => {
      flash.value = false
      if (currentIndex.value < questionList.value.length - 1) {
        nextQuestion()
      } else {
        showResult.value = true
      }
    }, 1000)
  } else {
    // 答错：停留当前题，展开解析，自动开启振假名
    showResult.value = true
    furigana.setLocked(false)
    furigana.enable()
  }
}

function prevQuestion() {
  if (currentIndex.value > 0) {
    slideDir.value = 'slide-prev'
    currentIndex.value--
    resetState()
  }
}

function nextQuestion() {
  if (currentIndex.value < questionList.value.length - 1) {
    slideDir.value = 'slide-next'
    currentIndex.value++
    resetState()
  }
}

function resetState() {
  if (flashTimer) { clearTimeout(flashTimer); flashTimer = null }
  flash.value = false
  // 到新题时自动关闭振假名
  furigana.disable()
  const q = currentQuestion.value
  const prev = store.getAnswer(q.id)
  if (prev) {
    selected.value = q._optionOrder ? q._optionOrder.indexOf(prev.selected - 1) + 1 : prev.selected
    showResult.value = true
  } else {
    selected.value = 0
    showResult.value = false
  }
}

function toggleFav() {
  store.toggleFavorite(currentQuestion.value.id)
}

function finishQuiz() {
  if (mode.value === 'mock') {
    const correct = sessionResults.value.filter(r => r.correct).length
    store.saveMockResult(mockId.value, {
      correct,
      total: questionList.value.length,
      score: Math.round(correct / questionList.value.length * 100),
    })
  }
  router.push({ name: 'result', query: { from: mode.value, mock: mockId.value } })
}

function goBack() {
  router.push('/')
}
</script>

<style scoped>
.quiz-area {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}
/* 左右过页特效：下一题向右滑出/右侧滑入，上一题反向 */
.slide-next-enter-active, .slide-next-leave-active,
.slide-prev-enter-active, .slide-prev-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.slide-next-enter-from { transform: translateX(48px); opacity: 0; }
.slide-next-leave-to { transform: translateX(-48px); opacity: 0; }
.slide-prev-enter-from { transform: translateX(-48px); opacity: 0; }
.slide-prev-leave-to { transform: translateX(48px); opacity: 0; }
.quiz-card {
  flex: 1;
  min-width: 0;
}
.side-arrow {
  width: 44px;
  height: 80px;
  border-radius: 12px;
  background: #fff;
  border: 2px solid var(--sakura-100);
  color: var(--sakura-400);
  font-size: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.side-arrow:hover:not(:disabled) {
  background: var(--sakura-500);
  border-color: var(--sakura-500);
  color: #fff;
  transform: scale(1.05);
}
.side-arrow:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}
.arrow-icon {
  line-height: 1;
  font-weight: 700;
}
.finish-area {
  text-align: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--sakura-50);
}
.picker-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.picker-hint {
  font-size: 12px;
  color: var(--ink-light);
}
.random-settings {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 10px 16px;
  background: #fff;
  border-radius: var(--radius-sm);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ink);
  cursor: pointer;
}
.toggle-label input {
  width: 16px;
  height: 16px;
  accent-color: var(--sakura-500);
}
.status-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}
.status-correct {
  background: #e0f3ea;
  color: #3a8c63;
}
.status-wrong {
  background: #fde4e6;
  color: #c44a52;
}
.type-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}
.type-文字 {
  background: #e8f4fd;
  color: #3a7ca5;
}
.type-語彙 {
  background: #e6f5ec;
  color: #3a8c63;
}
.type-文法 {
  background: #f3e8fd;
  color: #7a5ca5;
}
@media (max-width: 640px) {
  .side-arrow {
    width: 36px;
    height: 60px;
    font-size: 22px;
  }
}
</style>
