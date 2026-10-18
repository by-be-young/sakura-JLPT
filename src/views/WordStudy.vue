<template>
  <div class="container words-page">
    <!-- 顶部导航 -->
    <header class="page-head">
      <div class="page-head-main">
        <button class="back-btn" @click="$router.push('/words')" title="返回背词" aria-label="返回背词">← 返回</button>
        <span class="icon-tile study-tile" aria-hidden="true">{{ phase === 'learn' ? '📖' : '✍️' }}</span>
        <div class="page-head-text">
          <h2 class="page-title">{{ phase === 'learn' ? '新学单词' : '学习测验' }}</h2>
          <p class="page-sub">
            {{ phase === 'learn' ? '点击卡片翻面 · Enter 翻面 · A / D 切换 · F 熟词 · N 笔记' : '选出正确答案，答对后会自动进入下一题' }}
          </p>
        </div>
      </div>
      <div class="page-actions">
        <span class="chip-pill accent">{{ levelName }}</span>
        <span v-if="phase === 'learn'" class="chip-pill">本组 {{ learnWords.length }} 词</span>
        <span v-else class="chip-pill">已答对 {{ quizCorrect }}</span>
      </div>
    </header>

    <!-- 学习阶段 -->
    <template v-if="phase === 'learn'">
      <section class="study-progress" aria-label="学习进度">
        <span class="pt-label">正在学习</span>
        <span class="pt-count">{{ learnIndex + 1 }}<i>/</i>{{ learnWords.length }}</span>
        <div class="progress-bar-wrap" role="progressbar" :aria-valuenow="learnIndex + 1" aria-valuemin="1" :aria-valuemax="learnWords.length">
          <div class="progress-bar-inner" :style="{ width: (learnIndex + 1) / learnWords.length * 100 + '%' }"></div>
        </div>
      </section>
      <div class="learn-card-area">
        <WordCard ref="wordCardRef" :key="learnWords[learnIndex].id" :word="learnWords[learnIndex]" />
        <div class="learn-note-btn">
          <button class="btn btn-ghost btn-sm" @click="openNote(learnWords[learnIndex])" title="添加笔记 (N)" aria-label="为当前单词添加笔记">📝 添加笔记</button>
          <button class="btn btn-ghost btn-sm" @click="markLearnFamiliar" title="标记为熟词，从本组移除 (F)" aria-label="把当前单词标记为熟词">⭐ 标记为熟词</button>
          <button class="btn btn-ghost btn-sm" @click="showList = true" title="查看本组单词" aria-label="查看本组单词列表">📋 查看本组单词</button>
        </div>
      </div>
      <div class="learn-actions">
        <button v-if="learnIndex > 0" class="btn btn-ghost" @click="learnIndex--" title="上一个 (A)" aria-label="上一个单词">← 上一个</button>
        <span class="learn-spacer"></span>
        <button class="btn btn-ghost" @click="skipToQuiz" title="跳过学习，直接测验 (S)" aria-label="跳过学习，直接测验">跳过学习，直接测验 →</button>
        <button class="btn btn-primary" @click="learnNext" :title="learnIndex < learnWords.length - 1 ? '下一个 (D)' : '完成学习'">
          {{ learnIndex < learnWords.length - 1 ? '下一个 → (D)' : '完成学习 ✓' }}
        </button>
      </div>
      <div v-if="learnIndex === learnWords.length - 1" class="learn-done empty-card">
        <div class="empty-emoji" aria-hidden="true">🎉</div>
        <div class="empty-title">本组学习完成！</div>
        <p class="empty-desc">可以开始测验，检验这一组的掌握情况。</p>
        <button class="btn btn-primary" @click="startLearnQuiz">开始本组测验</button>
      </div>
    </template>

    <!-- 本组单词列表 -->
    <div v-if="showList" v-reveal class="word-list-panel surface">
      <div class="surface-head">
        <h3 class="surface-title">📋 本组单词（{{ learnWords.length }}）</h3>
        <button class="btn btn-ghost btn-sm" @click="showList = false" title="关闭单词列表" aria-label="关闭本组单词列表">关闭</button>
      </div>
      <div class="word-list">
        <div class="list-item" v-for="(w, i) in learnWords" :key="w.id">
          <div class="list-item-head" @click="toggleExpand(i)" role="button" tabindex="0"
            :aria-expanded="expandedIndex === i"
            :aria-label="`${expandedIndex === i ? '收起' : '展开'} ${w.kanji || w.kana} 的详细信息`"
            @keydown.enter.prevent="toggleExpand(i)" @keydown.space.prevent="toggleExpand(i)">
            <span class="list-idx">{{ i + 1 }}</span>
            <span class="list-kanji">{{ w.kanji || w.kana }}</span>
            <span class="list-kana">{{ w.kana }}</span>
            <span class="list-mean">{{ w.meaning }}</span>
            <span class="list-toggle" aria-hidden="true">{{ expandedIndex === i ? '▲' : '▼' }}</span>
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
            <button class="btn btn-ghost btn-xs" @click="openNote(w)" :title="store.getNote(w.id) ? '编辑笔记 (N)' : '添加笔记 (N)'">
              📝 {{ store.getNote(w.id) ? '编辑笔记' : '添加笔记' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 测验阶段 -->
    <template v-if="phase === 'quiz'">
      <template v-if="!quizFinished">
        <div class="quiz-header-bar">
          <span class="chip-pill accent quiz-mode-tag">学习测验</span>
          <span class="quiz-counter">{{ quizIndex + 1 }}<i>/</i>{{ quizQuestions.length }}</span>
          <div class="progress-bar-wrap" role="progressbar" :aria-valuenow="quizIndex + 1" aria-valuemin="1" :aria-valuemax="quizQuestions.length">
            <div class="progress-bar-inner" :style="{ width: (quizIndex + 1) / quizQuestions.length * 100 + '%' }"></div>
          </div>
        </div>
        <div class="quiz-area">
          <!-- 左箭头（上一题） -->
          <button class="side-arrow side-arrow-left" :disabled="quizIndex === 0" @click="prevQuizQuestion" title="上一题 (A)" aria-label="上一题">
            <span class="arrow-icon" aria-hidden="true">‹</span>
          </button>

          <div class="quiz-card-wrap">
            <div class="quiz-familiar-row">
              <button class="btn-familiar" @click="markQuizFamiliar" title="标记为熟词，删除该词剩余题目 (F)" aria-label="把当前单词标记为熟词">⭐ 标记为熟词</button>
            </div>
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
          <button class="side-arrow side-arrow-right" :disabled="quizIndex >= quizQuestions.length - 1" @click="quizNext" title="下一题 (D)" aria-label="下一题">
            <span class="arrow-icon" aria-hidden="true">›</span>
          </button>
        </div>
      </template>

      <div v-else class="quiz-result empty-card">
        <div class="empty-emoji" aria-hidden="true">{{ quizRate >= 80 ? '🎉' : quizRate >= 60 ? '🌸' : '🌱' }}</div>
        <div class="result-title">{{ quizRate >= 80 ? '这一组掌握得不错！' : quizRate >= 60 ? '再巩固一下会更好' : '别急，多过几遍就熟了' }}</div>
        <div class="result-score">答对 {{ quizCorrect }} / {{ quizQuestions.length }}</div>
        <div class="result-rate">{{ quizRate }}<small>%</small></div>
        <div class="result-actions">
          <button class="btn btn-ghost" @click="$router.push('/words')">返回背词</button>
          <button v-if="quizQuestions.length" class="btn btn-primary" @click="retryQuiz">再来一轮</button>
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
import { wordsByLevel, pitchToCircle } from '../data/words'
import { useWordStore } from '../store/wordStore'
import { useLevel } from '../store/levelStore'
import { useDaily } from '../store/dailyStore'
import { useFurigana } from '../composables/useFurigana'
import { buildQuizRound, getNewWords, availableTypes } from '../composables/wordQuiz'
import WordCard from '../components/word/WordCard.vue'
import WordQuiz from '../components/word/WordQuiz.vue'
import WordNoteModal from '../components/word/WordNoteModal.vue'

const route = useRoute()
const router = useRouter()
const store = useWordStore()
const furigana = useFurigana()
const daily = useDaily()
const { level: globalLevel, APP_LEVELS } = useLevel()

// 有效等级：优先取全局同步等级（深链带 ?level= 时兼容旧入口）
const level = computed(() => {
  const q = route.query.level
  if (q && APP_LEVELS.some(l => l.id === q)) return q
  return globalLevel.value
})
const levelName = computed(() => (APP_LEVELS.find(l => l.id === level.value) || {}).name || level.value)
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
const wordCardRef = ref(null)

const editingWord = ref(null)
const lastCorrect = ref(false)
let autoTimer = null

const quizRate = computed(() => quizQuestions.value.length ? Math.min(100, Math.round(quizCorrect.value / quizQuestions.value.length * 100)) : 0)

// 初始化：随机抽取未学单词（排除熟词）
const learnedIds = computed(() => new Set(pool.value.filter(w => store.isLearned(w.id) || store.isFamiliar(w.id)).map(w => w.id)))
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
// 等级变化时重建（全局同步或深链切换）
watch(level, () => {
  learnIndex.value = 0
  quizIndex.value = 0
  quizFinished.value = false
  initLearn()
})

function learnNext() {
  store.markLearned(learnWords.value[learnIndex.value].id)
  daily.record('word')
  if (learnIndex.value < learnWords.value.length - 1) {
    learnIndex.value++
  }
}

function toggleExpand(i) {
  expandedIndex.value = expandedIndex.value === i ? -1 : i
}

// 学习阶段：标记当前词为熟词，从本组移除
function markLearnFamiliar() {
  const w = learnWords.value[learnIndex.value]
  if (!w) return
  store.markFamiliar(w.id)
  learnWords.value.splice(learnIndex.value, 1)
  if (learnWords.value.length === 0) {
    // 本组已全部标记为熟词，直接提示完成
    alert('本组单词已全部标记为熟词！')
    router.push('/words')
    return
  }
  if (learnIndex.value >= learnWords.value.length) {
    learnIndex.value = learnWords.value.length - 1
  }
  if (expandedIndex.value >= learnWords.value.length) expandedIndex.value = -1
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
  daily.record('word')
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

// 测验阶段：标记当前词为熟词，删除该词所有剩余题目
function markQuizFamiliar() {
  const q = quizQuestions.value[quizIndex.value]
  if (!q) return
  store.markFamiliar(q.wordId)
  clearTimeout(autoTimer)
  quizQuestions.value = quizQuestions.value.filter(x => x.wordId !== q.wordId)
  if (quizQuestions.value.length === 0) {
    quizFinished.value = true
    return
  }
  if (quizIndex.value >= quizQuestions.value.length) {
    quizIndex.value = quizQuestions.value.length - 1
  }
  resetQuizState()
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

// 快捷键：L 振假名、A/D 上一题/下一题、1-4 选选项、F 熟词、N 笔记；学习阶段 Enter/空格 翻面、S 跳过
function handleKeydown(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  if (quizFinished.value) return
  const k = e.key
  // 学习阶段
  if (phase.value === 'learn') {
    if (k === 'Enter' || k === ' ') {
      e.preventDefault()
      if (wordCardRef.value) wordCardRef.value.flip()
    } else if (k === 'a' || k === 'A' || k === 'ArrowLeft') {
      if (learnIndex.value > 0) learnIndex.value--
    } else if (k === 'd' || k === 'D' || k === 'ArrowRight') {
      learnNext()
    } else if (k === 'f' || k === 'F') {
      markLearnFamiliar()
    } else if (k === 'n' || k === 'N') {
      openNote(learnWords.value[learnIndex.value])
    } else if (k === 's' || k === 'S') {
      skipToQuiz()
    }
    return
  }
  // 测验阶段
  if (phase.value !== 'quiz') return
  if (k === 'l' || k === 'L') furigana.toggle()
  else if (k === 'a' || k === 'A' || k === 'ArrowLeft') prevQuizQuestion()
  else if (k === 'd' || k === 'D' || k === 'ArrowRight') quizNext()
  else if (k === 'f' || k === 'F') markQuizFamiliar()
  else if (k === 'n' || k === 'N') openQuizNote()
  else if (['1', '2', '3', '4'].includes(k)) {
    if (!quizAnswered.value && wordQuizRef.value) {
      wordQuizRef.value.selectByKey(Number(k))
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
.words-page { max-width: 960px; }

/* ---------- 页头 ---------- */
.page-head { align-items: center; }
.study-tile { background: var(--sakura-100); }
.back-btn { min-height: 40px; }

/* ---------- 进度条 ---------- */
.study-progress,
.quiz-header-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 11px 16px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  font-size: 12.5px;
  color: var(--text-light);
}
.pt-label { flex-shrink: 0; }
.pt-count,
.quiz-counter {
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 800;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}
.pt-count i,
.quiz-counter i {
  font-style: normal;
  margin: 0 2px;
  color: var(--text-faint);
  font-weight: 600;
}
.progress-bar-wrap {
  flex: 1;
  min-width: 56px;
  height: 7px;
  border-radius: var(--radius-pill);
  background: var(--sakura-100);
  overflow: hidden;
}
.progress-bar-inner {
  position: relative;
  height: 100%;
  border-radius: inherit;
  background: var(--grad-sakura);
  overflow: hidden;
  transition: width var(--dur-4) var(--ease-out-expo);
}
.progress-bar-inner::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent 30%, rgba(255, 255, 255, 0.55) 50%, transparent 70%);
  transform: translateX(-100%);
  animation: bar-shine 2.4s var(--ease-soft) infinite;
}
@keyframes bar-shine {
  0% { transform: translateX(-100%); }
  55%, 100% { transform: translateX(200%); }
}

/* ---------- 学习卡片区 ---------- */
.learn-card-area { margin-top: 4px; }
.learn-note-btn {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
}
.learn-note-btn .btn {
  min-height: 40px;
  padding: 7px 15px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  font-size: 12.5px;
  color: var(--text-light);
}
@media (hover: hover) and (pointer: fine) {
  .learn-note-btn .btn:hover {
    color: var(--sakura-600);
    border-color: var(--sakura-300);
    background: var(--sakura-50);
    transform: translateY(-1px);
  }
}
.learn-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  flex-wrap: wrap;
}
.learn-spacer { flex: 1; }
.learn-actions .btn {
  min-height: 44px;
  font-size: 14px;
}
.learn-actions .btn-ghost {
  border: 1px solid transparent;
}
@media (hover: hover) and (pointer: fine) {
  .learn-actions .btn-ghost:hover { border-color: var(--border); }
}

/* ---------- 统一结束态卡片 ---------- */
.empty-card {
  position: relative;
  overflow: hidden;
  padding: 28px 22px;
  text-align: center;
  background: var(--card-grad);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--card-float);
  animation: rise-in var(--dur-4) var(--ease-out-expo) both;
}
@keyframes rise-in {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}
.empty-emoji {
  font-size: 42px;
  line-height: 1;
  margin-bottom: 10px;
}
.empty-title {
  font-size: 17px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 6px;
}
.empty-desc {
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-light);
  max-width: 420px;
  margin: 0 auto 16px;
}
.learn-done { margin-top: 20px; }
.learn-done .btn-primary { min-height: 44px; }

/* ---------- 本组单词列表 ---------- */
.word-list-panel { margin-top: 18px; }
.word-list-panel .surface-head .btn { min-height: 40px; }
.word-list { display: flex; flex-direction: column; }
.list-item { border-top: 1px solid var(--line); }
.list-item:first-child { border-top: none; }
.list-item-head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 46px;
  padding: 9px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--dur-2);
}
@media (hover: hover) and (pointer: fine) {
  .list-item-head:hover { background: var(--sakura-50); }
}
.list-idx {
  flex-shrink: 0;
  width: 22px;
  padding: 2px 0;
  border-radius: 7px;
  background: var(--sakura-50);
  color: var(--text-faint);
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.list-kanji {
  flex-shrink: 0;
  font-size: 17px;
  font-weight: 800;
  color: var(--text);
}
.list-kana {
  flex-shrink: 0;
  max-width: 38%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12.5px;
  color: var(--sakura-700);
}
.list-mean {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12.5px;
  color: var(--text-light);
}
.list-toggle {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--text-faint);
}
.list-item-detail {
  margin: 2px 4px 10px;
  padding: 12px 14px;
  background: var(--sakura-50);
  border-radius: var(--radius-sm);
  animation: detail-in var(--dur-3) var(--ease-out-expo) both;
}
@keyframes detail-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: none; }
}
.detail-pitch {
  font-size: 13px;
  font-weight: 700;
  color: var(--sakura-700);
  margin-bottom: 6px;
}
.detail-pos {
  display: inline-block;
  margin-bottom: 8px;
  padding: 2px 9px;
  border-radius: var(--radius-pill);
  background: var(--card);
  color: var(--text-light);
  font-size: 11.5px;
}
.word-examples {
  text-align: left;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
}
.ex-item { margin-bottom: 8px; }
.ex-item:last-child { margin-bottom: 0; }
.ex-jp { font-size: 15px; line-height: 1.7; color: var(--text); }
.ex-zh { font-size: 12.5px; color: var(--text-light); margin-top: 2px; }
.detail-note {
  margin-top: 10px;
  padding: 9px 11px;
  border-left: 3px solid var(--sakura-300);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  background: var(--card);
  color: var(--text);
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
}
.list-item-detail .btn-xs {
  margin-top: 10px;
  min-height: 40px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--card);
}

/* ---------- 测验 ---------- */
.quiz-mode-tag { flex-shrink: 0; }
.quiz-area {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}
.quiz-card-wrap {
  flex: 1;
  min-width: 0;
  min-height: 300px;
}
.quiz-familiar-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}
.btn-familiar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 8px 14px;
  border-radius: var(--radius-pill);
  background: var(--amber-soft);
  border: 1px solid var(--border);
  color: var(--text);
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition:
    transform var(--dur-2) var(--ease-spring),
    border-color var(--dur-2),
    box-shadow var(--dur-2),
    color var(--dur-2);
}
@media (hover: hover) and (pointer: fine) {
  .btn-familiar:hover {
    transform: translateY(-1px);
    border-color: var(--amber);
    color: var(--sakura-700);
    box-shadow: 0 8px 18px -12px var(--amber);
  }
}
.btn-familiar:active { transform: scale(0.96); }
.side-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 44px;
  height: 88px;
  border-radius: var(--radius-lg);
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--sakura-500);
  font-size: 28px;
  cursor: pointer;
  font-family: inherit;
  box-shadow: var(--shadow-card);
  transition:
    transform var(--dur-2) var(--ease-spring),
    background var(--dur-2),
    border-color var(--dur-2),
    color var(--dur-2),
    box-shadow var(--dur-3);
}
@media (hover: hover) and (pointer: fine) {
  .side-arrow:hover:not(:disabled) {
    background: var(--grad-sakura);
    border-color: transparent;
    color: var(--card);
    transform: translateY(-1px) scale(1.03);
    box-shadow: var(--shadow-lg);
  }
}
.side-arrow:active:not(:disabled) { transform: scale(0.96); }
.side-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  box-shadow: none;
}
.arrow-icon {
  line-height: 1;
  font-weight: 700;
}
.quiz-nav {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
.quiz-nav .btn { min-height: 44px; }
.auto-next-hint {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  background: var(--green-soft);
  border-radius: var(--radius-pill);
  padding: 10px 18px;
}
.auto-next-hint::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--green);
  animation: hint-pulse 1s ease-in-out infinite;
}
@keyframes hint-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(0.8); }
}

/* ---------- 测验结果 ---------- */
.quiz-result { margin-top: 20px; }
.result-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 4px;
}
.result-score {
  font-size: 13px;
  color: var(--text-light);
}
.result-rate {
  font-size: clamp(46px, 12vw, 66px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.01em;
  background: var(--grad-sakura);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-variant-numeric: tabular-nums;
}
.result-rate small { font-size: 0.38em; margin-left: 2px; }
.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-top: 18px;
}
.result-actions .btn { min-height: 44px; }

/* ---------- 窄屏 ---------- */
@media (max-width: 560px) {
  .learn-spacer { display: none; }
  .learn-actions .btn-primary { flex: 1 1 100%; order: 1; }
  .learn-actions .btn-ghost { flex: 1 1 auto; order: 2; }
  .learn-note-btn .btn { flex: 1 1 auto; }
}
@media (max-width: 480px) {
  .study-progress,
  .quiz-header-bar { gap: 9px; padding: 10px 12px; }
  .pt-label { font-size: 11.5px; }
  .quiz-area { gap: 6px; }
  .side-arrow { width: 40px; height: 68px; font-size: 22px; }
  .word-list-panel { padding: 14px; }
  .list-kana { display: none; }
  .list-mean { font-size: 11.5px; }
  .quiz-card-wrap { min-height: 280px; }
}
</style>
