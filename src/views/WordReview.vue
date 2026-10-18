<template>
  <div class="container words-page">
    <!-- 顶部导航 -->
    <header class="page-head">
      <div class="page-head-main">
        <button class="back-btn" @click="$router.push('/words')" title="返回背词" aria-label="返回背词">← 返回</button>
        <span class="icon-tile review-tile" aria-hidden="true">🔁</span>
        <div class="page-head-text">
          <h2 class="page-title">复习</h2>
          <p class="page-sub">三档自评 · 记得 / 模糊 / 不记得 · 快捷键 1 / 2 / 3</p>
        </div>
      </div>
      <div class="page-actions">
        <span class="chip-pill accent">{{ levelName }}</span>
        <span v-if="queue.length" class="chip-pill">剩余 {{ queue.length }} 词</span>
      </div>
    </header>

    <!-- 复习进度 -->
    <section class="review-progress-row" v-if="queue.length" aria-label="复习进度">
      <span class="rp-label">复习进度</span>
      <span class="rp-count">{{ doneCount }}<i>/</i>{{ totalCount }}</span>
      <div class="progress-bar-wrap" role="progressbar" :aria-valuenow="doneCount" aria-valuemin="0" :aria-valuemax="totalCount">
        <div class="progress-bar-inner" :style="{ width: doneCount / totalCount * 100 + '%' }"></div>
      </div>
      <span class="rp-pct">{{ totalCount ? Math.round(doneCount / totalCount * 100) : 0 }}%</span>
    </section>

    <!-- 无待复习词 -->
    <div v-if="!queue.length && !reviewFinished" class="empty-card status-card">
      <div class="empty-emoji" aria-hidden="true">🌸</div>
      <div class="empty-title">暂无需要复习的单词</div>
      <p class="empty-desc">先学几个新词，或明天再来巩固记忆。</p>
      <button class="btn btn-primary" @click="$router.push('/words')">返回背词</button>
    </div>

    <!-- 复习卡片流程（完成态也要保留容器，才能显示“复习完成”） -->
    <div v-if="queue.length || reviewFinished" class="review-section">
      <!-- 阶段1：自评 -->
      <div v-if="reviewStage === 'eval'" v-reveal class="review-card">
        <div class="eval-eyebrow"><span class="eval-dot" aria-hidden="true"></span>回忆一下这个单词</div>
        <div class="word-main center">
          <span class="word-kanji" v-html="kanjiHtml"></span>
          <span v-if="currentWord.pitch && currentWord.pitch.length" class="pitch-tag">
            <span class="pitch-label">音调</span>{{ pitchStr }}
          </span>
        </div>
        <div class="eval-hint">你想起来了吗？先在心中回想释义，再选择熟悉程度。</div>
        <div class="eval-actions">
          <button class="eval-btn btn-remember" title="记得 (1)" aria-label="记得，快捷键 1" @click="selfEval('remember')">
            <span class="eval-emoji" aria-hidden="true">😄</span>
            <span class="eval-label">记得</span>
            <span class="eval-key" aria-hidden="true">按 1</span>
          </button>
          <button class="eval-btn btn-blur" title="模糊 (2)" aria-label="模糊，快捷键 2" @click="selfEval('blur')">
            <span class="eval-emoji" aria-hidden="true">🤔</span>
            <span class="eval-label">模糊</span>
            <span class="eval-key" aria-hidden="true">按 2</span>
          </button>
          <button class="eval-btn btn-forget" title="不记得 (3)" aria-label="不记得，快捷键 3" @click="selfEval('forget')">
            <span class="eval-emoji" aria-hidden="true">😵</span>
            <span class="eval-label">不记得</span>
            <span class="eval-key" aria-hidden="true">按 3</span>
          </button>
        </div>
        <div class="familiar-row">
          <button class="btn-familiar" title="标记为熟词，不再进入学习与复习 (F)" aria-label="把当前单词标记为熟词" @click="markFamiliar">⭐ 标记为熟词</button>
        </div>
      </div>

      <!-- 阶段2：翻开详情 -->
      <div v-else-if="reviewStage === 'reveal'" v-reveal class="review-reveal">
        <div class="reveal-tag">释义与例句</div>
        <div class="reveal-word">
          <span class="word-kanji" v-html="kanjiHtml"></span>
          <span v-if="currentWord.pitch && currentWord.pitch.length" class="pitch-tag">
            <span class="pitch-label">音调</span>{{ pitchStr }}
          </span>
          <div class="reveal-kana">
            {{ currentWord.kana }}
            <span v-if="currentWord.pitch && currentWord.pitch.length" class="pitch-tag pitch-tag-sm">{{ pitchStr }}</span>
          </div>
        </div>
        <div v-if="currentWord.pos" class="word-pos">{{ currentWord.pos }}</div>
        <div class="word-meaning">{{ currentWord.meaning }}</div>
        <div v-if="currentWord.examples && currentWord.examples.length" class="word-examples">
          <div class="ex-head">例句</div>
          <div v-for="(ex, i) in currentWord.examples" :key="i" class="ex-item">
            <div class="ex-jp" v-html="exJpHtml(ex)"></div>
            <div class="ex-zh">{{ ex.zh }}</div>
          </div>
        </div>
        <div v-if="relations.syn.length || relations.ant.length" class="word-relations">
          <div v-if="relations.syn.length" class="rel-group">
            <span class="rel-label">近义词</span>
            <span class="rel-items">
              <span v-for="(s, i) in relations.syn" :key="i" class="rel-item">{{ s.t }}<span v-if="s.y" class="rel-kana">{{ s.y }}</span></span>
            </span>
          </div>
          <div v-if="relations.ant.length" class="rel-group">
            <span class="rel-label">反义词</span>
            <span class="rel-items">
              <span v-for="(a, i) in relations.ant" :key="i" class="rel-item">{{ a.t }}<span v-if="a.y" class="rel-kana">{{ a.y }}</span></span>
            </span>
          </div>
        </div>
        <div class="reveal-notes">
          <div v-if="noteText" class="reveal-note-text">{{ noteText }}</div>
          <button class="btn btn-ghost btn-sm" :title="noteText ? '编辑笔记 (N)' : '添加笔记 (N)'"
            :aria-label="noteText ? '编辑当前单词笔记' : '为当前单词添加笔记'" @click="openNote">
            📝 {{ noteText ? '编辑笔记' : '添加笔记' }}
          </button>
        </div>
        <div class="reveal-actions">
          <button class="eval-btn btn-correct" title="没问题 (1)" aria-label="没问题，快捷键 1" @click="confirmEval(true)">
            <span class="eval-emoji" aria-hidden="true">😄</span>
            <span class="eval-label">没问题</span>
            <span class="eval-key" aria-hidden="true">按 1</span>
          </button>
          <button class="eval-btn btn-wrong" title="记错了 (2)" aria-label="记错了，快捷键 2" @click="confirmEval(false)">
            <span class="eval-emoji" aria-hidden="true">😵</span>
            <span class="eval-label">记错了</span>
            <span class="eval-key" aria-hidden="true">按 2</span>
          </button>
        </div>
        <div class="familiar-row">
          <button class="btn-familiar" title="标记为熟词，不再进入学习与复习 (F)" aria-label="把当前单词标记为熟词" @click="markFamiliar">⭐ 标记为熟词</button>
        </div>
      </div>

      <!-- 阶段3：完成提示 -->
      <div v-else class="review-finished empty-card">
        <div class="empty-emoji" aria-hidden="true">🌸</div>
        <div class="result-score">复习完成！</div>
        <div class="result-rate">本批共 {{ totalCount }} 个</div>
        <p class="empty-desc">这一批单词已经过了一遍，记得常回来复习。</p>
        <div class="result-actions">
          <button class="btn btn-ghost" @click="$router.push('/words')">返回背词</button>
          <button class="btn btn-primary" @click="restartReview">再来一轮</button>
        </div>
      </div>
    </div>

    <!-- 笔记弹窗 -->
    <WordNoteModal v-if="editingWord" :word="editingWord" @close="editingWord = null" @saved="onNoteSaved" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { wordsByLevel, pitchToCircle, wordRelationsOf } from '../data/words'
import { useWordStore } from '../store/wordStore'
import { useLevel } from '../store/levelStore'
import { useDaily } from '../store/dailyStore'
import { availableTypes } from '../composables/wordQuiz'
import { useFurigana } from '../composables/useFurigana'
import WordNoteModal from '../components/word/WordNoteModal.vue'

const route = useRoute()
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

const queue = ref([])        // 待复习队列（词对象）
const totalCount = ref(0)
const doneCount = ref(0)
const reviewStage = ref('eval') // 'eval' | 'reveal' | 'done'
const editingWord = ref(null)
// 本批复习是否已走完（模板里的 .review-finished 与空状态都依赖它；
// 之前模板引用了未定义的 reviewFinished，导致"复习完成"页永远不出现）
const reviewFinished = computed(() => reviewStage.value === 'done')

const currentWord = computed(() => queue.value[0] || null)
const pitchStr = computed(() => (currentWord.value && currentWord.value.pitch) ? currentWord.value.pitch.map(pitchToCircle).join('') : '')
const noteText = computed(() => currentWord.value ? store.getNote(currentWord.value.id) : '')
const relations = computed(() => currentWord.value ? wordRelationsOf(currentWord.value.id) : { syn: [], ant: [] })

// 振假名：开启时渲染汉字头顶假名（ruby）
const kanjiHtml = computed(() => {
  const w = currentWord.value
  if (!w) return ''
  if (furigana.isEnabled.value && w.kanjiFurigana) return w.kanjiFurigana
  return w.kanji || w.kana
})
function exJpHtml(ex) {
  if (furigana.isEnabled.value && ex.jpFurigana) return ex.jpFurigana
  return ex.jp
}

onMounted(() => {
  buildQueue()
  window.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// 快捷键：1 记得/没问题、2 模糊/记错了、3 不记得、F 熟词、N 笔记
function handleKeydown(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  if (reviewStage.value === 'done' || !queue.value.length) return
  const k = e.key
  if (reviewStage.value === 'eval') {
    if (k === '1') selfEval('remember')
    else if (k === '2') selfEval('blur')
    else if (k === '3') selfEval('forget')
    else if (k === 'f' || k === 'F') markFamiliar()
    else if (k === 'n' || k === 'N') openNote()
  } else if (reviewStage.value === 'reveal') {
    if (k === '1') confirmEval(true)
    else if (k === '2') confirmEval(false)
    else if (k === 'f' || k === 'F') markFamiliar()
    else if (k === 'n' || k === 'N') openNote()
  }
}

function buildQueue() {
  // 已学但未背完 或 生疏需要复习（排除熟词）
  const due = pool.value.filter(w => store.isLearned(w.id) && !store.isMastered(w.id, availableTypes(w)) && !store.isFamiliar(w.id))
  if (!due.length) {
    // 生疏兜底
    queue.value = []
    reviewStage.value = 'done'
  } else {
    // 生疏优先：错误次数多的排前面，其次按最近复习时间（越久越优先）
    const arr = [...due].sort((a, b) => {
      const wa = store.wrongCount(a.id)
      const wb = store.wrongCount(b.id)
      if (wb !== wa) return wb - wa
      const ta = store.state.learned[a.id]?.lastReviewAt || 0
      const tb = store.state.learned[b.id]?.lastReviewAt || 0
      return ta - tb
    })
    queue.value = arr
    totalCount.value = arr.length
    doneCount.value = 0
    reviewStage.value = 'eval'
  }
}

function selfEval(level) {
  reviewStage.value = 'reveal'
}

function confirmEval(ok) {
  daily.record('word')
  const w = currentWord.value
  if (ok) {
    // 没问题：视为掌握，清除错误计数
    store.clearWrong(w.id)
    queue.value.shift()
    doneCount.value++
  } else {
    // 记错了：记录错误，放回队列末尾，稍后再复习（不增加完成数）
    store.recordAnswer(w.id, false)
    queue.value.push(queue.value.shift())
  }
  if (queue.value.length === 0) {
    reviewStage.value = 'done'
  } else {
    reviewStage.value = 'eval'
  }
}

// 标记为熟词：从复习队列移除，不再进入学习与复习
function markFamiliar() {
  daily.record('word')
  const w = currentWord.value
  if (!w) return
  store.markFamiliar(w.id)
  queue.value.shift()
  doneCount.value++
  if (queue.value.length === 0) {
    reviewStage.value = 'done'
  } else {
    reviewStage.value = 'eval'
  }
}

function openNote() {
  editingWord.value = currentWord.value
}

function onNoteSaved() {
  // 笔记保存后，刷新展示
}

function restartReview() {
  buildQueue()
}
</script>

<style scoped>
.words-page { max-width: 960px; }

/* ---------- 页头 ---------- */
.page-head { align-items: center; }
.review-tile { background: var(--iris-soft); }
.back-btn { min-height: 40px; }

/* ---------- 进度条 ---------- */
.review-progress-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  padding: 11px 16px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  font-size: 12.5px;
  color: var(--text-light);
}
.rp-label { flex-shrink: 0; }
.rp-count {
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 800;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}
.rp-count i {
  font-style: normal;
  margin: 0 2px;
  color: var(--text-faint);
  font-weight: 600;
}
.rp-pct {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 800;
  color: var(--sakura-700);
  font-variant-numeric: tabular-nums;
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

/* ---------- 统一空态 / 结束态卡片 ---------- */
.empty-card {
  position: relative;
  overflow: hidden;
  padding: 32px 22px;
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
  font-size: 44px;
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
  margin: 10px auto 18px;
}
.status-card { max-width: 560px; margin: 22px auto; }
.status-card .btn { min-height: 44px; }

/* ---------- 阶段1：自评 ---------- */
.review-section { min-height: 260px; }
.review-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 34px 26px 26px;
  text-align: center;
  background: radial-gradient(120% 100% at 50% 0%, var(--sakura-50) 0%, var(--card) 66%);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--card-float);
}
.review-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 64px;
  height: 3px;
  transform: translateX(-50%);
  border-radius: 0 0 3px 3px;
  background: var(--grad-sakura);
  opacity: 0.85;
}
.eval-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 18px;
  padding: 5px 13px;
  border-radius: var(--radius-pill);
  background: var(--sakura-100);
  color: var(--sakura-700);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
}
.eval-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--sakura-500);
}
.word-main {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px 14px;
  max-width: 100%;
}
.center { justify-content: center; }
.word-kanji {
  max-width: 100%;
  font-size: clamp(42px, 11vw, 72px);
  font-weight: 800;
  line-height: 1.16;
  letter-spacing: 0.04em;
  color: var(--sakura-600);
  text-align: center;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.word-kanji :deep(ruby), .ex-jp :deep(ruby) {
  ruby-position: over;
}
.word-kanji :deep(rt), .ex-jp :deep(rt) {
  font-size: 0.5em;
  color: var(--sakura-600);
  font-weight: 600;
}
.word-kanji :deep(rp), .ex-jp :deep(rp) {
  display: none;
}
.pitch-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  border-radius: var(--radius-pill);
  background: var(--sakura-100);
  color: var(--sakura-700);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.06em;
  white-space: nowrap;
}
.pitch-tag-sm { font-size: 13px; padding: 2px 9px; }
.pitch-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--sakura-600);
  opacity: 0.85;
}
.eval-hint {
  max-width: 400px;
  margin: 18px auto 24px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-light);
}

/* 三档自评 / 判定按钮 */
.eval-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
  max-width: 540px;
}
.eval-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 112px;
  padding: 14px 8px;
  border-radius: var(--radius-lg);
  border: 1px solid;
  background: var(--card);
  font-family: inherit;
  cursor: pointer;
  transition:
    transform var(--dur-2) var(--ease-spring),
    box-shadow var(--dur-3) var(--ease-out-expo),
    background var(--dur-2) var(--ease-soft),
    border-color var(--dur-2);
}
.eval-btn:active { transform: scale(0.955); }
.eval-emoji {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--card);
  box-shadow: var(--shadow-card);
  font-size: 21px;
  line-height: 1;
}
.eval-label {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: var(--text);
}
.eval-key {
  padding: 1px 7px;
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-light);
}
.btn-remember {
  background: var(--green-soft);
  border-color: var(--green);
  color: var(--green);
}
.btn-blur {
  background: var(--amber-soft);
  border-color: var(--amber);
  color: var(--amber);
}
.btn-forget {
  background: var(--red-soft);
  border-color: var(--red);
  color: var(--red);
}
.btn-correct {
  background: var(--green-soft);
  border-color: var(--green);
  color: var(--green);
}
.btn-wrong {
  background: var(--red-soft);
  border-color: var(--red);
  color: var(--red);
}
@media (hover: hover) and (pointer: fine) {
  .btn-remember:hover,
  .btn-correct:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 0 4px var(--green-soft), 0 16px 30px -20px var(--green);
  }
  .btn-blur:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 0 4px var(--amber-soft), 0 16px 30px -20px var(--amber);
  }
  .btn-forget:hover,
  .btn-wrong:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 0 4px var(--red-soft), 0 16px 30px -20px var(--red);
  }
}
.familiar-row {
  margin-top: 20px;
  text-align: center;
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

/* ---------- 阶段2：翻开详情 ---------- */
.review-reveal {
  padding: 28px 26px;
  background: var(--card-grad);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--card-float);
  animation: rise-in var(--dur-4) var(--ease-out-expo) both;
}
.reveal-tag {
  display: block;
  width: fit-content;
  margin: 0 auto 14px;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  background: var(--sakura-50);
  border: 1px solid var(--border);
  color: var(--text-light);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.reveal-word { text-align: center; }
.reveal-kana {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  font-size: clamp(24px, 6.5vw, 36px);
  font-weight: 800;
  color: var(--sakura-600);
  overflow-wrap: anywhere;
}
.word-pos {
  display: block;
  width: fit-content;
  margin: 12px auto 0;
  padding: 2px 11px;
  border-radius: var(--radius-pill);
  background: var(--sakura-50);
  border: 1px solid var(--border);
  color: var(--text-light);
  font-size: 12px;
  font-weight: 700;
}
.word-meaning {
  margin: 14px auto 18px;
  max-width: 620px;
  text-align: center;
  font-size: clamp(20px, 5vw, 25px);
  font-weight: 700;
  line-height: 1.55;
  color: var(--text);
}
.word-examples {
  width: 100%;
  text-align: left;
  background: var(--sakura-50);
  border: 1px solid var(--border);
  border-left: 3px solid var(--sakura-300);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
}
.ex-head {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: var(--text-light);
  margin-bottom: 8px;
}
.ex-item { margin-bottom: 10px; }
.ex-item:last-child { margin-bottom: 0; }
.ex-jp { font-size: 16px; line-height: 1.8; color: var(--text); }
.ex-zh { font-size: 12.5px; line-height: 1.6; color: var(--text-light); margin-top: 2px; }
.word-relations {
  width: 100%;
  margin-top: 10px;
  background: var(--iris-soft);
  border-radius: var(--radius-sm);
  padding: 10px 13px;
  box-sizing: border-box;
  text-align: left;
}
.rel-group {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.rel-group:last-child { margin-bottom: 0; }
.rel-label {
  font-size: 11px;
  color: var(--iris);
  background: var(--card);
  padding: 2px 9px;
  border-radius: var(--radius-pill);
  white-space: nowrap;
  font-weight: 700;
}
.rel-items {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.rel-item {
  font-size: 15px;
  color: var(--text);
  font-weight: 600;
}
.rel-kana {
  font-size: 12px;
  color: var(--text-light);
  margin-left: 4px;
  font-weight: 400;
}
.reveal-notes {
  margin-top: 14px;
  text-align: center;
}
.reveal-note-text {
  margin-bottom: 10px;
  padding: 10px 14px;
  text-align: left;
  background: var(--sakura-50);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 13.5px;
  line-height: 1.75;
  color: var(--text);
  white-space: pre-wrap;
}
.reveal-notes .btn {
  min-height: 40px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--card);
}
.reveal-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
  max-width: 460px;
  margin: 22px auto 0;
}
.reveal-actions .eval-btn { min-height: 96px; }

/* ---------- 阶段3：完成 ---------- */
.review-finished { max-width: 620px; margin: 0 auto; }
.result-score {
  font-size: 20px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 6px;
}
.result-rate {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-light);
}
.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}
.result-actions .btn { min-height: 44px; }

/* ---------- 窄屏 ---------- */
@media (max-width: 480px) {
  .review-progress-row { gap: 9px; padding: 10px 12px; }
  .rp-label { font-size: 11.5px; }
  .review-card { padding: 28px 16px 22px; min-height: 280px; }
  .review-reveal { padding: 22px 16px; }
  .eval-btn { min-height: 102px; padding: 12px 6px; }
  .eval-emoji { width: 36px; height: 36px; font-size: 19px; }
  .eval-label { font-size: 14px; }
  .eval-actions { gap: 8px; }
  .reveal-actions .eval-btn { min-height: 88px; }
}
</style>
