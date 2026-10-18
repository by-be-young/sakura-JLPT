<template>
  <div v-if="reading" class="container article-mode rv-page">
    <!-- 顶部粘性玻璃工具条 -->
    <header class="rv-topbar glass-bar" :class="{ 'is-stuck': scrolled }">
      <button class="back-btn rv-back" @click="$router.push('/reading')" title="返回读解列表" aria-label="返回读解列表">
        <span aria-hidden="true">←</span> 读解
      </button>
      <div class="rv-head">
        <h2 class="rv-title">読み物{{ reading.num }} · {{ reading.unitTitle }}</h2>
        <div class="rv-sub">
          <span class="part-tag">{{ reading.part }}</span>
          <span class="unit-tag">Unit{{ reading.unit }}</span>
          <span class="progress-text">已完成 {{ answeredCount }}/{{ reading.questions.length }} 题</span>
        </div>
      </div>
      <div class="rv-meter" aria-hidden="true">
        <span class="rv-meter-num">{{ answeredPercent }}<small>%</small></span>
        <span class="rv-meter-label">答题进度</span>
      </div>
      <div
        class="rv-progress"
        role="progressbar"
        :aria-valuenow="answeredPercent"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="'答题进度 ' + answeredPercent + '%'"
      >
        <span class="rv-progress-fill" :style="{ transform: 'scaleX(' + (answeredPercent / 100) + ')' }"></span>
      </div>
    </header>

    <div class="rv-layout">
      <!-- 文章（内部滚动，单屏适配） -->
      <section ref="passageRef" class="passage-box surface" :class="{ 'has-overflow': articleOverflow }" v-reveal>
        <div class="passage-head">
          <span class="icon-tile sm amber" aria-hidden="true">📖</span>
          <div class="passage-head-text">
            <div class="passage-title">文章</div>
            <div class="passage-hint">上下滑动阅读全文</div>
          </div>
          <span class="passage-count">{{ reading.questions.length }} 题</span>
        </div>
        <div class="passage-content reader-prose" v-html="articleHtml" @scroll="updateArticleOverflow"></div>
      </section>

      <!-- 答题卡 -->
      <section class="quiz-area">
        <button class="side-arrow" @click="go(-1)" :disabled="qi === 0" aria-label="上一题" title="上一题">‹</button>
        <div class="card quiz-card" v-reveal="{ delay: 80 }">
          <div class="quiz-meta">
            <span class="q-tag">第 {{ qi + 1 }} 题 / 共 {{ reading.questions.length }} 题</span>
            <span class="q-type">{{ current.options.length === 2 ? '判断' : '选择' }}</span>
            <span class="q-dots">
              <button v-for="(_, i) in reading.questions" :key="i" class="q-dot"
                :class="{ active: i === qi, answered: rec.answers[i] !== null }"
                @click="qi = i" :aria-label="'第' + (i + 1) + '题'" :aria-current="i === qi ? 'true' : undefined">{{ i + 1 }}</button>
            </span>
          </div>
          <div class="question-sentence" v-html="stemHtml"></div>
          <div class="options-list">
            <div
              v-for="(opt, i) in current.options"
              :key="i"
              class="option-item"
              :class="optionClass(i)"
              role="button"
              tabindex="0"
              :aria-disabled="answered ? 'true' : 'false'"
              @click="select(i)"
              @keydown.enter.prevent="select(i)"
              @keydown.space.prevent="select(i)"
            >
              <span class="option-num">{{ NUM[i] }}</span>
              <span class="option-text" v-html="optionHtml(i)"></span>
              <span v-if="answered && i + 1 === current.answer" class="option-mark" aria-hidden="true">✓</span>
              <span v-else-if="answered && i + 1 === rec.answers[qi]" class="option-mark wrong" aria-hidden="true">✕</span>
            </div>
          </div>
          <div v-if="answered" class="explanation-box" aria-live="polite">
            <div class="explanation-title"><span aria-hidden="true">💡</span> 解析</div>
            <div class="detail">{{ current.explanation || '本题暂无文字解析。' }}</div>
          </div>
        </div>
        <button class="side-arrow" @click="go(1)" :disabled="qi === reading.questions.length - 1" aria-label="下一题" title="下一题">›</button>
      </section>

      <!-- 译文与难句分析：特殊入口（答完全部题目后解锁） -->
      <div class="tr-area surface">
        <div class="tr-copy">
          <div class="tr-title">全文翻译与难句分析</div>
          <div class="tr-hint" :class="{ ok: allAnswered }">
            {{ allAnswered ? '已解锁，点击查看译文与逐句拆解' : '答完本篇文章全部 ' + reading.questions.length + ' 题后解锁' }}
          </div>
        </div>
        <button class="btn tr-btn" :class="{ locked: !allAnswered }" :disabled="!allAnswered" @click="showTr = true">
          <span aria-hidden="true">{{ allAnswered ? '📖' : '🔒' }}</span>
          {{ allAnswered ? '查看译文' : '答完解锁' }}
        </button>
      </div>
    </div>

    <!-- 底部答题操作条 -->
    <div class="sticky-actions rv-actions">
      <button class="btn btn-secondary rv-nav-btn" @click="go(-1)" :disabled="qi === 0" aria-label="上一题">← 上一题</button>
      <div class="rv-actions-mid">
        <span class="rv-actions-text">第 {{ qi + 1 }} / {{ reading.questions.length }} 题 · 已答 {{ answeredCount }} 题</span>
        <span class="rv-actions-rail" aria-hidden="true">
          <span class="rv-actions-fill" :style="{ transform: 'scaleX(' + (answeredPercent / 100) + ')' }"></span>
        </span>
      </div>
      <button class="btn btn-primary rv-nav-btn" @click="go(1)" :disabled="qi === reading.questions.length - 1" aria-label="下一题">下一题 →</button>
    </div>

    <!-- 全文翻译 / 难句分析弹窗 -->
    <div v-if="showTr" class="modal-mask" @click.self="showTr = false">
      <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="tr-modal-title">
        <div class="modal-head">
          <div class="modal-head-main">
            <span class="icon-tile sm iris" aria-hidden="true">📖</span>
            <div class="modal-head-text">
              <h3 id="tr-modal-title">全文翻译与难句分析</h3>
              <div class="modal-sub">読み物{{ reading.num }} · {{ reading.unitTitle }}</div>
            </div>
          </div>
          <button class="modal-close" @click="showTr = false" title="关闭" aria-label="关闭">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="reading.translation" class="tr-section">
            <h4>全文翻译</h4>
            <p class="tr-text">{{ reading.translation }}</p>
          </div>
          <div v-if="reading.analysis && reading.analysis.length" class="tr-section">
            <h4>难句分析</h4>
            <div v-for="(a, i) in reading.analysis" :key="i" class="an-item">
              <p class="an-sentence" v-html="furigana.isEnabled.value ? (a.sentenceFurigana || a.sentence) : a.sentence"></p>
              <p class="an-note"><span class="an-arrow" aria-hidden="true">→</span>{{ a.note }}</p>
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
const scrolled = ref(false)
const current = computed(() => reading.questions[qi.value])
const answered = computed(() => rec.value.answers[qi.value] !== null)
const answeredCount = computed(() => rec.value.answers.filter(a => a !== null).length)
const allAnswered = computed(() => answeredCount.value === reading.questions.length)
const answeredPercent = computed(() => {
  const total = reading.questions.length
  if (!total) return 0
  return Math.round((answeredCount.value / total) * 100)
})

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

// 句号标记【n】→ 上标，每段用<p>包裹（首行缩进）
function renderHtml(src) {
  const text = (src || '').replace(/【(\d+)】/g, '<sup class="s-no">$1</sup>')
  return text.split('\n').filter(p => p.trim()).map(p => `<p class="article-para">${p}</p>`).join('')
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
// 顶栏滚动阴影 + Esc 关闭译解弹窗
function onScroll() {
  scrolled.value = window.scrollY > 8
}
function onKeydown(e) {
  if (e.key === 'Escape' && showTr.value) showTr.value = false
}
watch(() => furigana.isEnabled.value, () => nextTick(updateArticleOverflow))
onMounted(() => {
  window.addEventListener('resize', updateArticleOverflow)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKeydown)
  onScroll()
  nextTick(updateArticleOverflow)
})
onUnmounted(() => {
  window.removeEventListener('resize', updateArticleOverflow)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
/* ===== 页面骨架 ===== */
.rv-page { max-width: 1000px; z-index: auto; }

/* ===== 顶部粘性玻璃工具条 ===== */
.rv-topbar {
  position: sticky;
  top: 62px;
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 12px 14px;
  flex-wrap: wrap;
  margin-bottom: 18px;
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--nav-bg);
  backdrop-filter: blur(20px) saturate(1.5);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  transition:
    box-shadow var(--dur-3) var(--ease-soft),
    border-color var(--dur-3) var(--ease-soft),
    background var(--dur-3) var(--ease-soft);
}
.rv-topbar.is-stuck {
  border-color: var(--border);
  box-shadow: 0 16px 34px -26px rgba(0, 0, 0, 0.5);
}
.rv-back { min-height: 40px; padding: 8px 13px; font-size: 13px; flex-shrink: 0; }
.rv-head { flex: 1 1 260px; min-width: 0; }
.rv-title {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  line-height: 1.35;
  letter-spacing: 0.2px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rv-sub { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
.part-tag,
.unit-tag {
  padding: 2px 10px;
  border-radius: var(--radius-pill);
  font-size: 11.5px;
  font-weight: 700;
  line-height: 1.6;
}
.part-tag { background: var(--sakura-100); color: var(--sakura-700); }
.unit-tag { background: var(--iris-soft); color: var(--iris); }
.progress-text { font-size: 12px; color: var(--text-light); }
.rv-meter {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 64px;
  padding: 3px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--sakura-50);
}
.rv-meter-num {
  font-size: 19px;
  font-weight: 800;
  line-height: 1.15;
  color: var(--sakura-600);
  font-variant-numeric: tabular-nums;
}
.rv-meter-num small { font-size: 11px; margin-left: 1px; }
.rv-meter-label { font-size: 10.5px; color: var(--text-light); }
.rv-progress {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: var(--line);
  overflow: hidden;
  pointer-events: none;
}
.rv-progress-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--grad-sakura);
  transform-origin: 0 50%;
  transition: transform var(--dur-4) var(--ease-out-expo);
}

/* ===== 阅读列 ===== */
.rv-layout {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 880px;
  margin: 0 auto;
}

/* ===== 文章面板（内部滚动，单屏适配） ===== */
.passage-box {
  position: relative;
  padding: 0;
  overflow: hidden;
  border-radius: var(--radius-lg);
}
.passage-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 16px;
  border-bottom: 1px solid var(--line);
  background: var(--card-hover);
}
.passage-head-text { flex: 1; min-width: 0; }
.passage-title { font-size: 14px; font-weight: 800; line-height: 1.35; color: var(--text); }
.passage-hint { margin-top: 2px; font-size: 11px; color: var(--text-faint); }
.passage-count {
  flex-shrink: 0;
  padding: 1px 9px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--sakura-50);
  color: var(--sakura-600);
  font-size: 11px;
  font-weight: 700;
}
.passage-content {
  height: 320px;
  height: clamp(220px, 36dvh, 420px);
  overflow-y: auto;
  padding: 16px 20px 28px;
  font-size: 16px;
  line-height: 2;
  color: var(--text);
}
.passage-content > * + * { margin-top: 0; }
.passage-content :deep(.article-para) { margin: 0 0 12px; text-indent: 2em; }
.passage-content :deep(.article-para:last-child) { margin-bottom: 0; }
.passage-content :deep(.s-no) {
  margin-right: 1px;
  color: var(--sakura-500);
  font-size: 10px;
  font-weight: 700;
}
.passage-box.has-overflow::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  height: 30px;
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  background: linear-gradient(to bottom, transparent, var(--card));
  pointer-events: none;
}

/* ===== 答题卡 ===== */
.quiz-area { display: flex; align-items: center; gap: 10px; }
.side-arrow {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--card);
  color: var(--sakura-600);
  font-size: 24px;
  line-height: 1;
  box-shadow: var(--shadow-card);
  transition:
    color var(--dur-2) var(--ease-soft),
    border-color var(--dur-2) var(--ease-soft),
    background var(--dur-2) var(--ease-soft),
    transform var(--dur-2) var(--ease-spring);
}
.side-arrow:hover:not(:disabled) {
  background: var(--sakura-50);
  border-color: var(--sakura-300);
  transform: translateX(-1px);
}
.side-arrow:active:not(:disabled) { transform: scale(0.92); }
.side-arrow:disabled { opacity: 0.32; cursor: not-allowed; }
.quiz-card { flex: 1; min-width: 0; padding: 18px 20px 20px; }
.quiz-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.q-tag { color: var(--sakura-600); font-size: 12.5px; font-weight: 800; }
.q-type {
  padding: 1px 8px;
  border-radius: var(--radius-pill);
  background: var(--sakura-100);
  color: var(--sakura-700);
  font-size: 11px;
  font-weight: 600;
}
.q-dots { margin-left: auto; display: flex; gap: 6px; flex-wrap: wrap; }
.q-dot {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--card);
  color: var(--text-light);
  font-size: 12px;
  font-family: inherit;
  transition:
    color var(--dur-2) var(--ease-soft),
    border-color var(--dur-2) var(--ease-soft),
    background var(--dur-2) var(--ease-soft),
    transform var(--dur-2) var(--ease-spring);
}
.q-dot:hover { border-color: var(--sakura-300); color: var(--sakura-600); }
.q-dot:active { transform: scale(0.9); }
.q-dot.active {
  border-color: transparent;
  background: var(--grad-sakura);
  color: rgba(255, 255, 255, 0.97);
  font-weight: 800;
  box-shadow: var(--shadow);
}
.q-dot.answered:not(.active) {
  border-color: var(--green);
  background: var(--green-soft);
  color: var(--green);
  font-weight: 700;
}
.question-sentence {
  margin-bottom: 14px;
  padding: 12px 16px;
  border-left: 3px solid var(--sakura-400);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  background: var(--sakura-50);
  color: var(--text);
  font-size: 16px;
  line-height: 1.95;
}
.question-sentence :deep(.article-para) { margin: 0; text-indent: 0; }
.options-list { display: flex; flex-direction: column; gap: 9px; }
.option-item {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--card);
  color: var(--text);
  font-size: 15px;
  line-height: 1.7;
  cursor: pointer;
  transition:
    transform var(--dur-2) var(--ease-spring),
    border-color var(--dur-2) var(--ease-soft),
    background var(--dur-2) var(--ease-soft),
    box-shadow var(--dur-2) var(--ease-soft);
}
@media (hover: hover) and (pointer: fine) {
  .option-item:hover:not(.correct):not(.wrong) {
    border-color: var(--sakura-300);
    background: var(--sakura-50);
    box-shadow: var(--shadow-card);
    transform: translateX(3px);
  }
}
.option-item:focus-visible { box-shadow: var(--focus-ring); }
.option-item[aria-disabled="true"] { cursor: default; }
.option-item[aria-disabled="true"]:not(.correct):not(.wrong):hover {
  transform: none;
  border-color: var(--border);
  background: var(--card);
  box-shadow: none;
}
.option-num {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--sakura-100);
  color: var(--sakura-700);
  font-size: 13px;
  font-weight: 800;
  transition: background var(--dur-2) var(--ease-soft), color var(--dur-2) var(--ease-soft);
}
.option-text { flex: 1; min-width: 0; }
.option-mark { flex-shrink: 0; align-self: center; color: var(--green); font-size: 16px; font-weight: 800; }
.option-mark.wrong { color: var(--red); }
.option-item.correct { border-color: var(--green); background: var(--green-soft); }
.option-item.correct .option-num { background: var(--green); color: rgba(255, 255, 255, 0.96); }
.option-item.wrong { border-color: var(--red); background: var(--red-soft); }
.option-item.wrong .option-num { background: var(--red); color: rgba(255, 255, 255, 0.96); }

.explanation-box {
  margin-top: 14px;
  padding: 12px 14px;
  border-left: 3px solid var(--amber);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  background: var(--amber-soft);
}
.explanation-title {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
  color: var(--amber);
  font-size: 12.5px;
  font-weight: 800;
}
.explanation-box .detail { color: var(--text); font-size: 14.5px; line-height: 2; white-space: pre-wrap; }

/* ===== 译文入口 ===== */
.tr-area {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding: 16px 18px;
}
.tr-copy { flex: 1 1 240px; min-width: 0; }
.tr-title { color: var(--text); font-size: 15px; font-weight: 800; }
.tr-hint { margin-top: 4px; color: var(--text-light); font-size: 12px; line-height: 1.6; }
.tr-hint.ok { color: var(--green); font-weight: 600; }
.tr-btn {
  flex-shrink: 0;
  min-height: 44px;
  padding: 0 20px;
  border-radius: var(--radius-pill);
  background: var(--grad-sakura);
  color: rgba(255, 255, 255, 0.97);
  font-size: 14px;
  font-weight: 700;
  box-shadow: var(--shadow);
}
.tr-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}
.tr-btn.locked {
  background: var(--card-hover);
  color: var(--text-faint);
  box-shadow: none;
  cursor: not-allowed;
  opacity: 1;
}

/* ===== 底部答题操作条 ===== */
.rv-actions { margin-top: 6px; padding-top: 10px; gap: 10px; }
.rv-nav-btn { min-height: 44px; padding: 0 18px; font-size: 13.5px; }
.rv-actions-mid {
  flex: 1;
  min-width: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}
.rv-actions-text { color: var(--text-light); font-size: 12px; font-variant-numeric: tabular-nums; }
.rv-actions-rail {
  display: block;
  width: 100%;
  max-width: 220px;
  height: 4px;
  border-radius: 2px;
  background: var(--sakura-100);
  overflow: hidden;
}
.rv-actions-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--grad-sakura);
  transform-origin: 0 50%;
  transition: transform var(--dur-4) var(--ease-out-expo);
}

/* ===== 译解弹窗 ===== */
.modal-panel {
  width: min(760px, 100%);
  max-height: 86vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  background: var(--card-grad);
  box-shadow: var(--shadow-lg);
  animation: modal-in var(--dur-4) var(--ease-spring);
}
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 0;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
}
.modal-head-main { display: flex; align-items: center; gap: 10px; min-width: 0; }
.modal-head-text { min-width: 0; }
.modal-head h3 { margin: 0; color: var(--text); font-size: 16.5px; font-weight: 800; }
.modal-sub { margin-top: 2px; color: var(--text-light); font-size: 11.5px; }
.modal-close {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--sakura-50);
  color: var(--text-light);
  font-size: 15px;
  transition:
    color var(--dur-2) var(--ease-soft),
    background var(--dur-2) var(--ease-soft),
    transform var(--dur-3) var(--ease-spring);
}
.modal-close:hover { color: var(--sakura-600); background: var(--sakura-100); transform: rotate(90deg); }
.modal-close:active { transform: scale(0.9); }
.modal-body { padding: 18px 20px calc(22px + env(safe-area-inset-bottom)); overflow-y: auto; }
.tr-section { margin-bottom: 20px; }
.tr-section h4 {
  display: flex;
  align-items: center;
  margin: 0 0 10px;
  color: var(--text);
  font-size: 15px;
  font-weight: 800;
}
.tr-section h4::before {
  content: '';
  width: 4px;
  height: 15px;
  margin-right: 8px;
  border-radius: 2px;
  background: var(--grad-sakura);
}
.tr-text { margin: 0; color: var(--text); font-size: 15px; line-height: 2; white-space: pre-wrap; }
.an-item {
  margin-bottom: 12px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--card-hover);
}
.an-sentence { margin: 0 0 6px; color: var(--text); font-size: 15px; font-weight: 500; line-height: 1.95; }
.an-note { display: flex; gap: 6px; margin: 0; color: var(--text-light); font-size: 13.5px; line-height: 1.9; }
.an-arrow { flex-shrink: 0; color: var(--sakura-400); }
.tr-empty { margin: 0; padding: 28px 0; color: var(--text-faint); font-size: 14px; text-align: center; }

/* 振假名注音 */
:deep(rt) { color: var(--sakura-500); font-size: 0.52em; font-weight: 500; line-height: 1; }
:deep(rp) { display: none; }

/* ===== 响应式 ===== */
@media (max-width: 820px) {
  .rv-layout { max-width: 100%; }
  .quiz-card { padding: 16px 16px 18px; }
  .rv-page { padding-bottom: 40px; }
}
@media (max-width: 640px) {
  .rv-topbar {
    gap: 8px;
    padding: 8px 10px;
    border-radius: var(--radius);
  }
  .rv-back { padding: 8px 10px; }
  .rv-head { flex-basis: calc(100% - 112px); }
  .rv-title { font-size: 15.5px; }
  .rv-sub { gap: 6px; }
  .rv-meter { display: none; }
  .passage-head { padding: 11px 14px; }
  .passage-hint { display: none; }
  .passage-content { height: 240px; height: clamp(180px, 32dvh, 340px); padding: 14px 16px 24px; }
  .side-arrow { display: none; }
  .quiz-card { padding: 14px 14px 16px; }
  .q-dots { display: none; }
  .quiz-meta { gap: 6px; }
  .option-item { padding: 11px 12px; font-size: 14.5px; }
  .tr-area { padding: 14px; }
  .tr-btn { width: 100%; justify-content: center; }
  .rv-nav-btn { flex: 1; padding: 0 10px; font-size: 12.5px; }
  .rv-actions-mid { flex-basis: 100%; order: -1; }
  .rv-actions-rail { max-width: 100%; }
  .modal-panel {
    width: 100%;
    max-height: 90vh;
    border-radius: 22px 22px 0 0;
    animation: sheet-in var(--dur-4) var(--ease-out-expo);
  }
  .modal-head { padding: 14px 16px; }
  .modal-body { padding: 16px 16px calc(20px + env(safe-area-inset-bottom)); }
}
@keyframes sheet-in {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: none; }
}
/* 手机底部 Tab 栏（Dock）：为底部操作条让位 */
@media (max-width: 760px) {
  .rv-page { padding-bottom: calc(200px + env(safe-area-inset-bottom)); }
  .rv-topbar { top: 58px; }
  .rv-actions { bottom: calc(78px + env(safe-area-inset-bottom)); }
}
</style>
