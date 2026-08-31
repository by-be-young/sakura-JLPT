<template>
  <div class="container words-page">
    <!-- 顶部导航 -->
    <div class="words-header">
      <button class="btn btn-ghost btn-sm" @click="$router.push('/words')">← 返回</button>
      <h2 class="page-title">🌸 新学单词</h2>
      <div class="header-spacer"></div>
      <span class="level-tag">{{ levelName }}</span>
    </div>

    <!-- 学习阶段 -->
    <template v-if="phase === 'learn'">
      <div class="learn-progress">
        <span>正在学习 {{ learnIndex + 1 }} / {{ learnWords.length }}</span>
        <div class="progress-bar-wrap"><div class="progress-bar-inner" :style="{ width: (learnIndex + 1) / learnWords.length * 100 + '%' }"></div></div>
      </div>
      <div class="learn-card-area">
        <WordCard :word="learnWords[learnIndex]" />
        <div class="learn-note-btn">
          <button class="btn btn-ghost btn-sm" @click="openNote(learnWords[learnIndex])">📝 添加笔记</button>
          <button class="btn btn-ghost btn-sm" @click="showList = true">📋 查看本组单词</button>
        </div>
      </div>
      <div class="learn-actions">
        <button v-if="learnIndex > 0" class="btn btn-ghost" @click="learnIndex--">← 上一个</button>
        <span class="learn-spacer"></span>
        <button class="btn btn-ghost" @click="skipToQuiz">跳过学习，直接测验 →</button>
        <button class="btn btn-primary" @click="learnNext">
          {{ learnIndex < learnWords.length - 1 ? '下一个 →' : '完成学习 ✓' }}
        </button>
      </div>
      <div v-if="learnIndex === learnWords.length - 1" class="learn-done">
        <p>本组学习完成！可以开始测验了。</p>
        <button class="btn btn-primary" @click="startLearnQuiz">开始本组测验</button>
      </div>
    </template>

    <!-- 本组单词列表 -->
    <div v-if="showList" class="word-list-panel">
      <div class="notes-header">
        <h3>📋 本组单词（{{ learnWords.length }}）</h3>
        <button class="btn btn-ghost btn-sm" @click="showList = false">关闭</button>
      </div>
      <div class="list-item" v-for="(w, i) in learnWords" :key="w.id">
        <div class="list-item-head" @click="toggleExpand(i)">
          <span class="list-idx">{{ i + 1 }}</span>
          <span class="list-kanji">{{ w.kanji || w.kana }}</span>
          <span class="list-kana">{{ w.kana }}</span>
          <span class="list-mean">{{ w.meaning }}</span>
          <span class="list-toggle">{{ expandedIndex === i ? '▲' : '▼' }}</span>
        </div>
        <div v-if="expandedIndex === i" class="list-item-detail">
          <div v-if="w.pitch && w.pitch.length" class="detail-pitch">音调：{{ w.pitch.map(pitchToCircle).join(' ') }}</div>
          <div v-if="w.pos" class="detail-pos">{{ w.pos }}</div>
          <div v-if="w.examples && w.examples.length" class="word-examples">
            <div v-for="(ex, j) in w.examples" :key="j" class="ex-item">
              <div class="ex-jp">{{ ex.jp }}</div>
              <div class="ex-zh">{{ ex.zh }}</div>
            </div>
          </div>
          <div v-if="store.getNote(w.id)" class="detail-note">📝 {{ store.getNote(w.id) }}</div>
          <button class="btn btn-ghost btn-xs" @click="openNote(w)">📝 {{ store.getNote(w.id) ? '编辑笔记' : '添加笔记' }}</button>
        </div>
      </div>
    </div>

    <!-- 测验阶段 -->
    <template v-if="phase === 'quiz'">
      <div class="quiz-header-bar">
        <span class="quiz-mode-tag">学习测验</span>
        <span>{{ quizIndex + 1 }} / {{ quizQuestions.length }}</span>
        <div class="progress-bar-wrap"><div class="progress-bar-inner" :style="{ width: (quizIndex + 1) / quizQuestions.length * 100 + '%' }"></div></div>
      </div>
      <div class="quiz-area">
        <!-- 左箭头（上一题） -->
        <button class="side-arrow side-arrow-left" :disabled="quizIndex === 0" @click="prevQuizQuestion" title="上一题 (A)">
          <span class="arrow-icon">‹</span>
        </button>

        <div class="quiz-card-wrap">
          <WordQuiz :key="quizIndex" ref="wordQuizRef" :type="quizQuestions[quizIndex].type" :question="quizQuestions[quizIndex]"
            @answer="handleQuizAnswer" @note="openQuizNote" />
          <div v-if="quizAnswered" class="quiz-nav">
            <button v-if="!lastCorrect" class="btn btn-primary" @click="quizNext">
              {{ quizIndex < quizQuestions.length - 1 ? '下一题 →' : '查看结果' }}
            </button>
            <span v-else class="auto-next-hint">回答正确，即将自动跳转…</span>
          </div>
        </div>

        <!-- 右箭头（下一题） -->
        <button class="side-arrow side-arrow-right" :disabled="quizIndex >= quizQuestions.length - 1" @click="quizNext" title="下一题 (D)">
          <span class="arrow-icon">›</span>
        </button>
      </div>
      <div v-if="quizFinished" class="quiz-result">
        <div class="result-score">答对 {{ quizCorrect }} / {{ quizQuestions.length }}</div>
        <div class="result-rate">{{ Math.round(quizCorrect / quizQuestions.length * 100) }}%</div>
        <div class="result-actions">
          <button class="btn btn-ghost" @click="$router.push('/words')">返回背词</button>
          <button class="btn btn-primary" @click="retryQuiz">再来一轮</button>
        </div>
      </div>
    </template>

    <!-- 笔记弹窗 -->
    <WordNoteModal v-if="editingWord" :word="editingWord" @close="editingWord = null" @saved="editingWord = null" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { wordsByLevel, levels, pitchToCircle } from '../data/words'
import { useWordStore } from '../store/wordStore'
import { useFurigana } from '../composables/useFurigana'
import { buildQuizRound, getNewWords, availableTypes } from '../composables/wordQuiz'
import WordCard from '../components/word/WordCard.vue'
import WordQuiz from '../components/word/WordQuiz.vue'
import WordNoteModal from '../components/word/WordNoteModal.vue'

const route = useRoute()
const router = useRouter()
const store = useWordStore()
const furigana = useFurigana()

const level = ref(route.query.level || localStorage.getItem('sakura_word_level') || 'N5')
if (level.value === 'N4N5') level.value = 'N5' // 兼容旧存值
const levelName = computed(() => (levels.find(l => l.id === level.value) || {}).name || level.value)
const pool = computed(() => wordsByLevel(level.value))

const phase = ref('learn') // 'learn' | 'quiz'
const learnWords = ref([])
const learnIndex = ref(0)
const showList = ref(false)
const expandedIndex = ref(-1)

// 测验
const quizQuestions = ref([])
const quizIndex = ref(0)
const quizAnswered = ref(false)
const quizCorrect = ref(0)
const quizFinished = ref(false)
const wordQuizRef = ref(null)

const editingWord = ref(null)
const lastCorrect = ref(false)
let autoTimer = null

// 初始化：随机抽取未学单词
const learnedIds = computed(() => new Set(pool.value.filter(w => store.isLearned(w.id)).map(w => w.id)))
function initLearn() {
  const unseen = getNewWords(pool.value, learnedIds.value, 10)
  if (unseen.length === 0) {
    alert('本等级单词已全部学完！')
    router.push('/words')
    return
  }
  learnWords.value = unseen
  learnIndex.value = 0
  phase.value = 'learn'
  showList.value = false
  expandedIndex.value = -1
}
initLearn()
// 等级变化时重建（组件复用场景）
watch(() => route.query.level, () => {
  if (route.query.level) level.value = route.query.level
  if (level.value === 'N4N5') level.value = 'N5'
  learnIndex.value = 0
  quizIndex.value = 0
  quizFinished.value = false
  initLearn()
})

function learnNext() {
  store.markLearned(learnWords.value[learnIndex.value].id)
  if (learnIndex.value < learnWords.value.length - 1) {
    learnIndex.value++
  }
}

function toggleExpand(i) {
  expandedIndex.value = expandedIndex.value === i ? -1 : i
}

function startLearnQuiz() {
  quizQuestions.value = buildQuizRound(learnWords.value, pool.value, (id) => store.doneTypes(id))
  quizIndex.value = 0
  quizCorrect.value = 0
  quizFinished.value = false
  resetQuizState()
  phase.value = 'quiz'
  showList.value = false
}

// 跳过学习：本组所有词标记为已学，直接进入测验
function skipToQuiz() {
  for (const w of learnWords.value) {
    store.markLearned(w.id)
  }
  startLearnQuiz()
}

function handleQuizAnswer(correct) {
  quizAnswered.value = true
  lastCorrect.value = correct
  if (correct) quizCorrect.value++
  const q = quizQuestions.value[quizIndex.value]
  if (q) {
    store.recordAnswer(q.wordId, correct)
    if (correct) store.markTypeDone(q.wordId, q.type)
  }
  if (correct) {
    // 答对：解锁振假名（可手动开），1秒后自动跳转下一题
    furigana.setLocked(false)
    clearTimeout(autoTimer)
    autoTimer = setTimeout(() => {
      if (quizAnswered.value && !quizFinished.value) {
        quizNext()
      }
    }, 1000)
  } else {
    // 答错：自动开启振假名，锁定（已提交可看）
    furigana.setLocked(false)
    furigana.enable()
  }
}

function quizNext() {
  clearTimeout(autoTimer)
  if (quizIndex.value < quizQuestions.value.length - 1) {
    quizIndex.value++
    resetQuizState()
  } else {
    quizFinished.value = true
  }
}

function prevQuizQuestion() {
  if (quizIndex.value > 0) {
    quizIndex.value--
    resetQuizState()
  }
}

function resetQuizState() {
  quizAnswered.value = false
  lastCorrect.value = false
  // 到新题时自动关闭振假名（未提交时锁定）
  furigana.disable()
  furigana.setLocked(true)
}

function retryQuiz() {
  clearTimeout(autoTimer)
  const wordIds = [...new Set(quizQuestions.value.map(q => q.wordId))]
  const words2 = wordIds.map(id => pool.value.find(w => w.id === id)).filter(Boolean)
  quizQuestions.value = buildQuizRound(words2, pool.value, (id) => store.doneTypes(id))
  quizIndex.value = 0
  quizCorrect.value = 0
  quizFinished.value = false
  resetQuizState()
}

function openNote(w) {
  editingWord.value = w
}

function openQuizNote() {
  const q = quizQuestions.value[quizIndex.value]
  if (!q) return
  const w = pool.value.find(x => x.id === q.wordId)
  if (w) editingWord.value = w
}

// 快捷键：L 振假名、A 上一题、D 下一题、1-4 选选项
function handleKeydown(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  if (phase.value !== 'quiz' || quizFinished.value) return
  if (e.key === 'l' || e.key === 'L') furigana.toggle()
  else if (e.key === 'a' || e.key === 'A') prevQuizQuestion()
  else if (e.key === 'd' || e.key === 'D') quizNext()
  else if (['1', '2', '3', '4'].includes(e.key)) {
    if (!quizAnswered.value && wordQuizRef.value) {
      wordQuizRef.value.selectByKey(Number(e.key))
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  clearTimeout(autoTimer)
  window.removeEventListener('keydown', handleKeydown)
  furigana.setLocked(false)
})
</script>

<style scoped>
.words-page { max-width: 720px; }
.words-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}
.page-title { margin: 0; font-size: 22px; color: #c2556f; }
.header-spacer { flex: 1; }
.level-tag {
  background: #ffe9f0;
  color: #c2556f;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}
.learn-progress, .quiz-header-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #7a4b55;
  margin-bottom: 14px;
}
.progress-bar-wrap {
  flex: 1;
  height: 8px;
  background: #ffe3ec;
  border-radius: 8px;
  overflow: hidden;
}
.progress-bar-inner {
  height: 100%;
  background: linear-gradient(90deg, #ff9dbd, #ff7da0);
  border-radius: 8px;
  transition: width 0.3s;
}
.learn-card-area { position: relative; }
.learn-note-btn {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 14px;
}
.learn-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
}
.learn-spacer { flex: 1; }
.learn-done {
  text-align: center;
  margin-top: 18px;
  padding: 20px;
  background: #fff5f8;
  border-radius: 16px;
}
.learn-done p { margin: 0 0 12px; color: #7a4b55; }
.word-list-panel {
  margin-top: 16px;
  background: #fffafc;
  border: 2px solid #ffd3e0;
  border-radius: 16px;
  padding: 16px;
}
.notes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.notes-header h3 { margin: 0; color: #c2556f; font-size: 16px; }
.list-item {
  border-bottom: 1px dashed #ffe3ec;
  padding: 6px 0;
}
.list-item:last-child { border-bottom: none; }
.list-item-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 6px 4px;
  cursor: pointer;
  border-radius: 8px;
}
.list-item-head:hover { background: #fff5f8; }
.list-idx { font-size: 12px; color: #b98a94; width: 20px; }
.list-kanji { font-size: 20px; font-weight: 700; color: #c2556f; }
.list-kana { font-size: 14px; color: #d9773e; }
.list-mean { flex: 1; font-size: 13px; color: #7a4b55; }
.list-toggle { color: #e884a0; font-size: 12px; }
.list-item-detail {
  background: #fff5f8;
  border-radius: 10px;
  padding: 12px 14px;
  margin: 4px 4px 8px;
}
.detail-pitch { font-size: 14px; color: #e884a0; margin-bottom: 6px; }
.detail-pos { font-size: 13px; color: #b98a94; margin-bottom: 6px; }
.word-examples {
  text-align: left;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  padding: 10px 12px;
}
.ex-item { margin-bottom: 6px; }
.ex-item:last-child { margin-bottom: 0; }
.ex-jp { font-size: 15px; color: #8a5a45; }
.ex-zh { font-size: 13px; color: #b8a091; margin-top: 2px; }
.detail-note {
  margin-top: 8px;
  font-size: 14px;
  color: #6b4a52;
  background: #ffeef3;
  border-radius: 8px;
  padding: 8px 10px;
  white-space: pre-wrap;
}
.quiz-card-wrap { min-height: 300px; }
.quiz-area {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}
.quiz-card-wrap {
  flex: 1;
  min-width: 0;
}
.side-arrow {
  width: 44px;
  height: 80px;
  border-radius: 12px;
  background: #fff;
  border: 2px solid #ffd3e0;
  color: #e884a0;
  font-size: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  font-family: inherit;
}
.side-arrow:hover:not(:disabled) {
  background: linear-gradient(145deg, #ff9dbd, #ff7da0);
  border-color: #ff7da0;
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
.quiz-mode-tag {
  background: #ffe9f0;
  color: #c2556f;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}
.quiz-nav { margin-top: 16px; text-align: center; }
.auto-next-hint {
  display: inline-block;
  font-size: 14px;
  color: #2d8a3e;
  background: #eefbf0;
  border-radius: 20px;
  padding: 8px 20px;
  animation: pulseHint 1s ease-in-out infinite;
}
@keyframes pulseHint {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
.quiz-result {
  text-align: center;
  margin-top: 20px;
  padding: 28px;
  background: #fff5f8;
  border-radius: 20px;
}
.result-score { font-size: 18px; color: #7a4b55; margin-bottom: 6px; }
.result-rate { font-size: 44px; font-weight: 700; color: #c2556f; margin-bottom: 16px; }
.result-actions { display: flex; gap: 12px; justify-content: center; }
@media (max-width: 640px) {
  .side-arrow {
    width: 36px;
    height: 60px;
    font-size: 22px;
  }
}
</style>

