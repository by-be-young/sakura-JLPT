<template>
  <div v-if="reading" class="container article-mode">
    <!-- 顶部：返回 + 标题（振假名由导航栏统一开关控制） -->
    <div class="rv-header">
      <button class="btn btn-ghost btn-sm" @click="$router.push('/reading')">← 读解列表</button>
      <h2 class="rv-title">読み物{{ reading.num }} · {{ reading.unitTitle }}</h2>
    </div>
    <div class="rv-sub">
      <span class="part-tag">{{ reading.part }}</span>
      <span class="unit-tag">Unit{{ reading.unit }}</span>
      <span class="progress-text">已完成 {{ answeredCount }}/{{ reading.questions.length }} 题</span>
    </div>

    <!-- 文章（内部滚动，单屏适配） -->
    <div ref="passageRef" class="passage-box" :class="{ 'has-overflow': articleOverflow }">
      <div class="passage-title">📖 文章</div>
      <div class="passage-content" v-html="articleHtml" @scroll="updateArticleOverflow"></div>
    </div>

    <!-- 答题卡 -->
    <div class="quiz-area">
      <button class="side-arrow" @click="go(-1)" :disabled="qi === 0" aria-label="上一题">‹</button>
      <div class="card quiz-card">
        <div class="quiz-meta">
          <span class="q-tag">第 {{ qi + 1 }} 题 / 共 {{ reading.questions.length }} 题</span>
          <span class="q-type">{{ current.options.length === 2 ? '判断' : '选择' }}</span>
          <span class="q-dots">
            <button v-for="(_, i) in reading.questions" :key="i" class="q-dot"
              :class="{ active: i === qi, answered: rec.answers[i] !== null }"
              @click="qi = i" :aria-label="'第' + (i + 1) + '题'">{{ i + 1 }}</button>
          </span>
        </div>
        <div class="question-sentence" v-html="stemHtml"></div>
        <div class="options-list">
          <div v-for="(opt, i) in current.options" :key="i" class="option-item" :class="optionClass(i)" @click="select(i)">
            <span class="option-num">{{ NUM[i] }}</span>
            <span class="option-text" v-html="optionHtml(i)"></span>
          </div>
        </div>
        <div v-if="answered" class="explanation-box">
          <div class="explanation-title">💡 解析</div>
          <div class="detail">{{ current.explanation || '本题暂无文字解析。' }}</div>
        </div>
      </div>
      <button class="side-arrow" @click="go(1)" :disabled="qi === reading.questions.length - 1" aria-label="下一题">›</button>
    </div>

    <!-- 译文与难句分析：特殊入口（答完全部题目后解锁） -->
    <div class="tr-area">
      <button class="btn tr-btn" :class="{ locked: !allAnswered }" :disabled="!allAnswered" @click="showTr = true">
        📖 全文翻译与难句分析
      </button>
      <div class="tr-hint" :class="{ ok: allAnswered }">
        {{ allAnswered ? '已解锁，点击查看' : '答完本篇文章全部 ' + reading.questions.length + ' 题后解锁' }}
      </div>
    </div>

    <!-- 全文翻译 / 难句分析弹窗 -->
    <div v-if="showTr" class="modal-mask" @click.self="showTr = false">
      <div class="modal-panel">
        <div class="modal-head">
          <h3>📖 全文翻译与难句分析</h3>
          <button class="btn btn-ghost btn-sm" @click="showTr = false">✕ 关闭</button>
        </div>
        <div class="modal-body">
          <div v-if="reading.translation" class="tr-section">
            <h4>全文翻译</h4>
            <p class="tr-text">{{ reading.translation }}</p>
          </div>
          <div v-if="reading.analysis && reading.analysis.length" class="tr-section">
            <h4>难句分析</h4>
            <div v-for="(a, i) in reading.analysis" :key="i" class="an-item">
              <p class="an-sentence" v-html="furigana.isEnabled ? (a.sentenceFurigana || a.sentence) : a.sentence"></p>
              <p class="an-note">→ {{ a.note }}</p>
            </div>
          </div>
          <p v-if="!reading.translation && (!reading.analysis || !reading.analysis.length)" class="tr-empty">本篇暂无全文翻译与难句分析内容。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { readingN2 } from '../data/reading-n2'
import { readingN1 } from '../data/reading-n1'
import { useFurigana } from '../composables/useFurigana'
import { useLevel } from '../store/levelStore'

const route = useRoute()
const router = useRouter()
const furigana = useFurigana()
const { level } = useLevel()

const readings = level.value === 'N1' ? readingN1 : readingN2
const id = Number(route.params.id)
const reading = readings.find(r => r.id === id)
if (!reading) router.replace('/reading')

const NUM = '①②③④⑤'

// 答题进度（localStorage 持久化）
const PROGRESS_KEY = 'sakura_reading_progress'
function loadRec() {
  try {
    const map = JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}
    return map[id] || null
  } catch { return null }
}
const rec = ref(loadRec() || { answers: reading.questions.map(() => null) })
watch(rec, (v) => {
  try {
    const map = JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}
    map[id] = v
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(map))
  } catch { /* ignore */ }
}, { deep: true })

const qi = ref(0)
const showTr = ref(false)
const current = computed(() => reading.questions[qi.value])
const answered = computed(() => rec.value.answers[qi.value] !== null)
const answeredCount = computed(() => rec.value.answers.filter(a => a !== null).length)
const allAnswered = computed(() => answeredCount.value === reading.questions.length)

function select(i) {
  if (answered.value) return
  rec.value.answers[qi.value] = i + 1
}
function go(d) {
  qi.value = Math.min(Math.max(qi.value + d, 0), reading.questions.length - 1)
}
function optionClass(i) {
  const sel = rec.value.answers[qi.value]
  if (sel === null) return ''
  if (i + 1 === current.value.answer) return 'correct'
  if (i + 1 === sel) return 'wrong'
  return ''
}

// 句号标记【n】→ 上标
function renderHtml(src) {
  return (src || '').replace(/【(\d+)】/g, '<sup class="s-no">$1</sup>')
}
const articleHtml = computed(() => renderHtml(furigana.isEnabled.value ? (reading.articleFurigana || reading.article) : reading.article))
const stemHtml = computed(() => renderHtml(furigana.isEnabled.value ? (current.value.stemFurigana || current.value.stem) : current.value.stem))
function optionHtml(i) {
  const q = current.value
  return furigana.isEnabled.value ? (q.optionFurigana[i] || q.options[i]) : q.options[i]
}

// 文章溢出渐隐
const passageRef = ref(null)
const articleOverflow = ref(false)
function updateArticleOverflow() {
  const el = passageRef.value && passageRef.value.querySelector('.passage-content')
  articleOverflow.value = !!(el && el.scrollHeight - el.scrollTop > el.clientHeight + 2)
}
watch(() => furigana.isEnabled.value, () => nextTick(updateArticleOverflow))
onMounted(() => {
  window.addEventListener('resize', updateArticleOverflow)
  nextTick(updateArticleOverflow)
})
onUnmounted(() => {
  window.removeEventListener('resize', updateArticleOverflow)
})
</script>

<style scoped>
.rv-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.rv-title {
  flex: 1;
  font-size: 17px;
  margin: 0;
  color: var(--sakura-600, #c2556f);
}
.rv-sub {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.part-tag, .unit-tag {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(255, 157, 189, 0.14);
  color: var(--sakura-600, #c2556f);
  font-weight: 600;
}
.unit-tag {
  background: rgba(124, 161, 255, 0.12);
  color: #5a7bd6;
}
.progress-text {
  font-size: 12.5px;
  color: var(--ink-2, #888);
}

/* 文章面板（单屏适配） */
.passage-box {
  position: relative;
  background: #fffdf9;
  border: 2px solid var(--sakura-100, #ffe3ec);
  border-radius: var(--radius, 16px);
  padding: 10px 16px 12px;
  margin-bottom: 10px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(233, 120, 150, 0.08);
}
.passage-title {
  font-weight: 700;
  color: var(--sakura-600, #c2556f);
  font-size: 13px;
  margin-bottom: 6px;
}
.passage-content {
  font-size: 15px;
  line-height: 1.85;
  color: var(--ink, #333);
  height: calc(100vh - 690px);
  height: calc(100dvh - 690px);
  min-height: 120px;
  max-height: 460px;
  overflow-y: auto;
  padding-right: 6px;
}
.passage-content :deep(.s-no) {
  font-size: 10px;
  color: var(--sakura-500, #ff7da0);
  font-weight: 700;
  margin-right: 1px;
}
.passage-box.has-overflow::after {
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

/* 答题卡（紧凑） */
.quiz-area {
  display: flex;
  align-items: center;
  gap: 8px;
}
.side-arrow {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid var(--sakura-200, #ffd0dd);
  background: #fff;
  color: var(--sakura-500, #ff7da0);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  transition: all .2s;
}
.side-arrow:hover:not(:disabled) {
  background: var(--sakura-100, #ffe9f0);
  border-color: var(--sakura-400, #ff9dbe);
}
.side-arrow:disabled {
  opacity: .3;
  cursor: not-allowed;
}
.quiz-card {
  flex: 1;
  padding: 14px 16px;
}
.quiz-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.q-tag {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--sakura-600, #c2556f);
}
.q-type {
  font-size: 11.5px;
  padding: 1px 8px;
  border-radius: 999px;
  background: rgba(255, 157, 189, 0.14);
  color: var(--sakura-600, #c2556f);
}
.q-dots {
  margin-left: auto;
  display: flex;
  gap: 5px;
}
.q-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid var(--sakura-200, #ffd0dd);
  background: #fff;
  color: var(--ink-2, #888);
  font-size: 11.5px;
  cursor: pointer;
  line-height: 1;
}
.q-dot.active {
  background: var(--sakura-500, #ff7da0);
  border-color: var(--sakura-500, #ff7da0);
  color: #fff;
  font-weight: 700;
}
.q-dot.answered:not(.active) {
  border-color: #7bc47f;
  color: #4a9a4f;
  background: #eef8ee;
}
.question-sentence {
  font-size: 16px;
  line-height: 1.7;
  padding: 10px 14px;
  margin-bottom: 10px;
  background: #fdf7fb;
  border-left: 4px solid var(--sakura-300, #ffb9cf);
  border-radius: 8px;
  color: var(--ink, #333);
}
.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.option-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 9px 14px;
  border: 2px solid var(--line, #eee);
  border-radius: 12px;
  cursor: pointer;
  transition: all .15s;
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--ink, #333);
}
.option-item:hover:not(.correct):not(.wrong) {
  border-color: var(--sakura-300, #ffb9cf);
  background: #fff8fb;
}
.option-num {
  flex-shrink: 0;
  font-weight: 700;
  color: var(--sakura-500, #ff7da0);
}
.option-item.correct {
  border-color: #7bc47f;
  background: #f0faf0;
}
.option-item.correct .option-num { color: #4a9a4f; }
.option-item.wrong {
  border-color: #ff8a8a;
  background: #fff3f3;
}
.option-item.wrong .option-num { color: #e05555; }
.explanation-box {
  margin-top: 10px;
  padding: 10px 14px;
  background: #fffbea;
  border-left: 4px solid #f5c76b;
  border-radius: 8px;
}
.explanation-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #c99a3a;
  margin-bottom: 4px;
}
.explanation-box .detail {
  font-size: 14px;
  line-height: 1.8;
  color: var(--ink, #333);
}

/* 译文与难句入口 */
.tr-area {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}
.tr-btn {
  background: linear-gradient(135deg, #ff9dbe, #ff7da0);
  color: #fff;
  border: none;
  font-weight: 700;
  padding: 9px 18px;
  border-radius: 999px;
  box-shadow: 0 3px 10px rgba(255, 125, 160, .3);
  transition: all .2s;
}
.tr-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 5px 14px rgba(255, 125, 160, .4);
}
.tr-btn.locked {
  background: #e8e3dd;
  color: #b0a9a0;
  box-shadow: none;
  cursor: not-allowed;
}
.tr-hint {
  font-size: 12px;
  color: var(--ink-2, #999);
}
.tr-hint.ok {
  color: #4a9a4f;
  font-weight: 600;
}

/* 弹窗 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}
.modal-panel {
  width: min(760px, 100%);
  max-height: 84vh;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, .22);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 2px solid var(--sakura-100, #ffe3ec);
}
.modal-head h3 {
  margin: 0;
  font-size: 16px;
  color: var(--sakura-600, #c2556f);
}
.modal-body {
  padding: 16px 20px 22px;
  overflow-y: auto;
}
.tr-section { margin-bottom: 18px; }
.tr-section h4 {
  margin: 0 0 8px;
  font-size: 14px;
  color: var(--sakura-600, #c2556f);
}
.tr-text {
  font-size: 14.5px;
  line-height: 2;
  color: var(--ink, #333);
  margin: 0;
}
.an-item {
  margin-bottom: 14px;
}
.tr-empty {
  font-size: 14px;
  color: var(--sakura-500, #b8898f);
  text-align: center;
  padding: 24px 0;
  margin: 0;
}
.an-sentence {
  font-size: 14.5px;
  line-height: 1.9;
  color: var(--ink, #333);
  margin: 0 0 4px;
  font-weight: 500;
}
.an-note {
  font-size: 13.5px;
  line-height: 1.9;
  color: #666;
  margin: 0;
}

@media (max-width: 640px) {
  .passage-content {
    font-size: 14px;
    height: calc(100vh - 660px);
    height: calc(100dvh - 660px);
    min-height: 90px;
  }
  .side-arrow {
    width: 34px;
    height: 44px;
  }
  .rv-title {
    font-size: 15px;
  }
  .q-dots { display: none; }
}
</style>
