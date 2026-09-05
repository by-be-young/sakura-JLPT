<template>
  <div class="container" :class="{ 'article-mode': !!currentArticle }">
    <div v-if="questionList.length === 0" class="empty-state">
      <div class="emoji">🌸</div>
      <p>没有可练习的题目</p>
      <button class="btn btn-primary" style="margin-top:16px;" @click="goBack">返回学习</button>
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

      <!-- 答题卡 / 题号表（顺序/单元/模拟 模式可用，默认收起） -->
      <div v-if="mode === 'sequential' || mode === 'unit' || mode === 'mock'" class="picker-toggle">
        <button class="btn btn-secondary btn-sm" @click="showPicker = !showPicker">
          {{ showPicker ? '收起' : (mode === 'mock' ? '📋 答题卡' : '📋 选择题号 / 跳转') }}
        </button>
        <span class="picker-hint">绿=答对 红=答错 灰=未做</span>
      </div>
      <QuestionPicker v-if="showPicker && (mode === 'sequential' || mode === 'unit' || mode === 'mock')"
        :questions="pickerQuestions" :title="pickerTitle" :current-id="currentQuestion.id"
        @select="jumpToQuestion" />

      <!-- 随机模式：设置 -->
      <div v-if="mode === 'random'" class="random-settings">
        <label class="toggle-label">
          <input type="checkbox" v-model="fullyRandom" @change="saveRandomSetting" />
          <span>完全随机（默认优先抽取未做过的题）</span>
        </label>
        <button class="btn btn-ghost btn-sm" @click="reshuffleRandom">🔄 重新洗牌</button>
      </div>

      <!-- 完形填空/读解：整篇文章展示（同组题切换时文章保持） -->
      <div v-if="currentArticle" ref="passageRef" class="passage-box" :class="{ 'has-overflow': articleOverflow }">
        <div class="passage-title">📖 文章</div>
        <div class="passage-content" v-html="displayArticle" @scroll="updateArticleOverflow"></div>
      </div>

      <!-- 答题区（带左右箭头） -->
      <div class="quiz-area">
        <!-- 左箭头 -->
        <button class="side-arrow side-arrow-left" :disabled="currentIndex === 0" @click="prevQuestion" title="上一题 (A)">
          <span class="arrow-icon">‹</span>
        </button>

        <Transition :name="slideDir" mode="out-in">
        <div class="card quiz-card" :key="currentQuestion.key">
          <div class="quiz-meta" style="margin-bottom:12px;">
            <span class="qid-tag">{{ level }} No.{{ currentQuestion.id }}</span>
            <span v-if="mode === 'mock'" class="mock-tag">第{{ mockId }}回模拟</span>
            <span v-else-if="mode === 'unit'" class="mock-tag" style="background:#fef0e6;color:#c47a3a;">第{{ unitId }}单元</span>
            <span v-else class="mock-tag" style="background:#e8f4fd;color:#3a7ca5;">{{ modeLabel }}</span>
            <span v-if="currentQuestion.type" class="type-tag" :class="'type-' + currentQuestion.type">{{ currentQuestion.type }}</span>
            <span v-if="store.getAnswer(currentQuestion.key)" class="status-tag"
              :class="store.getAnswer(currentQuestion.key).correct ? 'status-correct' : 'status-wrong'">
              {{ store.getAnswer(currentQuestion.key).correct ? '已答对' : '曾答错' }}
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
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { levelQuestions, levelMockQuestions } from '../data/questions'
import { useStore } from '../store/useStore'
import { useLevel } from '../store/levelStore'
import { useFurigana } from '../composables/useFurigana'
import QuestionCard from '../components/QuestionCard.vue'
import QuestionPicker from '../components/QuestionPicker.vue'

const route = useRoute()
const router = useRouter()
const store = useStore()
const { level } = useLevel()
const furigana = useFurigana()

// 文章面板：判断内容是否需要内部滚动（底部还有未读内容时显示渐隐提示）
const passageRef = ref(null)
const articleOverflow = ref(false)
function updateArticleOverflow() {
  const el = passageRef.value && passageRef.value.querySelector('.passage-content')
  articleOverflow.value = !!(el && el.scrollHeight - el.scrollTop > el.clientHeight + 2)
}

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

// 当前级别下、按模式过滤的题（用于题号表 / 列表构建）
const allLevelQuestions = computed(() => levelQuestions(level.value))

const sequentialAll = computed(() => {
  if (mode.value === 'unit') {
    return allLevelQuestions.value.filter(q => q.unit === unitId.value).sort((a, b) => a.id - b.id)
  }
  return allLevelQuestions.value.slice().sort((a, b) => a.id - b.id)
})

const currentQuestion = computed(() => {
  const q = questionList.value[currentIndex.value]
  if (!q) return {}
  if (!shuffleCache.has(q.key)) shuffleCache.set(q.key, shuffleQuestion(q))
  return shuffleCache.get(q.key)
})

// 答题卡数据源：模拟模式用当前回题目，顺序/单元用全量
const pickerQuestions = computed(() => {
  if (mode.value === 'mock') return questionList.value
  return sequentialAll.value
})
const pickerTitle = computed(() =>
  mode.value === 'mock' ? `第${mockId.value}回模拟 · 答题卡` : '选择起始题号')

// 完形填空/读解：整篇文章（同组题共享 article，切题时文章不切换）
const currentArticle = computed(() => currentQuestion.value.article || '')
const displayArticle = computed(() => {
  const a = currentArticle.value
  if (!a) return ''
  // 转义 HTML 避免注入；\n 换行；挖空处用〔题号〕标记，渲染为填空位并高亮当前题
  const escaped = a.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escaped.replace(/\n/g, '<br>').replace(/〔(\d+)〕/g, (m, id) => {
    const active = Number(id) === currentQuestion.value.id
    return `<span class="passage-gap${active ? ' active' : ''}" data-q="${id}">（　　）</span>`
  })
})
const progressPercent = computed(() => Math.round((currentIndex.value + 1) / questionList.value.length * 100))
const isFav = computed(() => store.isFavorite(currentQuestion.value.key))

// 未提交时锁定振假名
watch(showResult, (val) => {
  furigana.setLocked(!val)
}, { immediate: true })

// 切题后重算文章溢出状态
watch(() => currentQuestion.value.key, () => {
  nextTick(updateArticleOverflow)
})

onUnmounted(() => {
  furigana.setLocked(false)
  if (flashTimer) clearTimeout(flashTimer)
  window.removeEventListener("keydown", handleKeydown)
})

const RANDOM_KEY = 'sakura_random_fully_random'
onMounted(() => {
  fullyRandom.value = localStorage.getItem(RANDOM_KEY) === '1'
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', updateArticleOverflow)
  nextTick(updateArticleOverflow)
})
onUnmounted(() => {
  window.removeEventListener('resize', updateArticleOverflow)
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
    list = allLevelQuestions.value.slice().sort((a, b) => a.id - b.id)
    const start = Number(route.query.start)
    if (start) {
      const idx = list.findIndex(q => q.id >= start)
      if (idx > 0) list = list.slice(idx)
    }
  } else if (mode.value === 'random') {
    list = buildRandomList()
  } else if (mode.value === 'mock') {
    list = levelMockQuestions(level.value, mockId.value).sort((a, b) => a.id - b.id)
  } else if (mode.value === 'unit') {
    list = allLevelQuestions.value.filter(q => q.unit === unitId.value).sort((a, b) => a.id - b.id)
  } else if (mode.value === 'wrong') {
    list = allLevelQuestions.value.filter(q => store.state.wrong.includes(q.key))
  } else if (mode.value === 'favorites') {
    list = allLevelQuestions.value.filter(q => store.state.favorites.includes(q.key))
  }
  questionList.value = list
  currentIndex.value = 0
  if (mode.value === 'sequential' && !route.query.start) {
    const firstUnanswered = list.findIndex(q => !store.getAnswer(q.key))
    if (firstUnanswered > 0) currentIndex.value = firstUnanswered
  }
  resetState()
  sessionResults.value = []
}

function buildRandomList() {
  const all = allLevelQuestions.value
  if (fullyRandom.value) {
    return all.slice().sort(() => Math.random() - 0.5)
  }
  const unseen = all.filter(q => !store.getAnswer(q.key))
  const seen = all.filter(q => store.getAnswer(q.key))
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
watch(() => [mode.value, mockId.value, unitId.value, level.value], buildList)

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
  store.recordAnswer(currentQuestion.value.key, origSelected, correct)
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
  const prev = store.getAnswer(q.key)
  if (prev) {
    selected.value = q._optionOrder ? q._optionOrder.indexOf(prev.selected - 1) + 1 : prev.selected
    showResult.value = true
  } else {
    selected.value = 0
    showResult.value = false
  }
}

function toggleFav() {
  store.toggleFavorite(currentQuestion.value.key)
}

function finishQuiz() {
  if (mode.value === 'mock') {
    const correct = sessionResults.value.filter(r => r.correct).length
    store.saveMockResult(level.value + ':' + mockId.value, {
      correct,
      total: questionList.value.length,
      score: Math.round(correct / questionList.value.length * 100),
    })
  }
  router.push({ name: 'result', query: { from: mode.value, mock: mockId.value } })
}

function goBack() {
  if (mode.value === 'mock') {
    router.push({ path: '/learn', query: { mode: 'mock' } })
  } else {
    router.push({ path: '/learn', query: { mode: 'bank' } })
  }
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
/* 完形填空/读解文章面板 */
.passage-box {
  background: #fffdf9;
  border: 2px solid var(--sakura-100, #ffe3ec);
  border-radius: var(--radius, 16px);
  padding: 16px 20px;
  margin-bottom: 14px;
  box-shadow: 0 2px 10px rgba(233, 120, 150, 0.08);
}
.passage-title {
  font-weight: 700;
  color: var(--sakura-600, #c2556f);
  font-size: 14px;
  margin-bottom: 10px;
}
.passage-content {
  font-size: 15px;
  line-height: 1.9;
  color: var(--ink, #333);
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;
}
.passage-content :deep(ruby) { ruby-position: over; }
.passage-content :deep(rt) {
  font-size: 0.55em;
  color: var(--sakura-500);
  font-weight: 500;
}
.passage-content :deep(rp) { display: none; }
.passage-gap {
  display: inline-block;
  min-width: 2.6em;
  border-bottom: 2px dashed var(--sakura-300, #f7b7c9);
  text-align: center;
  margin: 0 2px;
  color: transparent;
}
.passage-gap.active {
  border-bottom: 2.5px solid var(--sakura-500, #ff7da0);
  background: rgba(255, 157, 189, 0.12);
  border-radius: 4px;
}

/* ===== 文章题（读解/完形填空）单屏适配：压缩间距 + 文章区自适应剩余高度，避免整页滚动 ===== */
.article-mode .passage-box {
  position: relative;
  padding: 10px 16px 12px;
  margin-bottom: 10px;
  overflow: hidden;
}
.article-mode .passage-title {
  font-size: 13px;
  margin-bottom: 6px;
}
.article-mode .passage-content {
  font-size: 15px;
  line-height: 1.8;
  height: calc(100vh - 660px);
  height: calc(100dvh - 660px);
  min-height: 130px;
  max-height: 460px;
  overflow-y: auto;
  padding-right: 6px;
}
/* 文章底部渐隐提示：内容溢出可滚动时显示 */
.article-mode .passage-box.has-overflow::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 26px;
  background: linear-gradient(to bottom, rgba(255, 253, 249, 0), #fffdf9);
  pointer-events: none;
  border-radius: 0 0 var(--radius, 16px) var(--radius, 16px);
}
/* 文章题答题卡紧凑化，保证选项区完整可见 */
.article-mode .quiz-card {
  padding: 16px 18px;
}
.article-mode .quiz-meta {
  margin-bottom: 8px;
}
.article-mode :deep(.question-sentence) {
  font-size: 16px;
  padding: 12px 14px;
  margin-bottom: 12px;
  line-height: 1.7;
}
.article-mode :deep(.options-list) {
  gap: 8px;
}
.article-mode :deep(.option-item) {
  padding: 10px 14px;
  font-size: 14.5px;
}
.article-mode :deep(.explanation-box) {
  margin-top: 12px;
  padding: 12px 14px;
}
.article-mode :deep(.explanation-box .translation) {
  font-size: 14px;
  margin-bottom: 8px;
}
.article-mode :deep(.explanation-box .detail) {
  font-size: 15px;
  line-height: 1.9;
}
.article-mode .picker-toggle {
  margin-bottom: 8px;
}
@media (max-width: 640px) {
  .article-mode .passage-content {
    font-size: 14px;
    height: calc(100vh - 640px);
    height: calc(100dvh - 640px);
    min-height: 100px;
  }
  .article-mode .quiz-card {
    padding: 12px 14px;
  }
  .article-mode :deep(.question-sentence) {
    font-size: 15px;
    padding: 10px 12px;
  }
  .article-mode :deep(.option-item) {
    padding: 9px 12px;
    font-size: 14px;
  }
}
@media (max-width: 640px) {
  .side-arrow {
    width: 36px;
    height: 60px;
    font-size: 22px;
  }
  .passage-content {
    font-size: 14px;
    max-height: 240px;
  }
}
</style>
