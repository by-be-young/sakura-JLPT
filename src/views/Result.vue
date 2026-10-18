<template>
  <div class="container result-page">
    <!-- 成绩舞台：大号分数 + 正确率进度条 -->
    <section class="res-stage" v-reveal="'zoom'">
      <div class="res-halo" aria-hidden="true"></div>

      <div class="res-top">
        <span class="res-kicker">练习结果</span>
        <span class="res-mode">{{ modeLabel }}</span>
      </div>

      <div class="res-score">
        <span class="res-number">{{ scoreText }}</span>
        <span class="res-unit">分</span>
      </div>

      <p class="res-caption">共 {{ total }} 题 · 答对 {{ correct }} 题</p>

      <div class="res-meter" role="img" :aria-label="`正确率 ${accuracy}%`">
        <div class="res-meter-track">
          <div class="res-meter-fill" :style="{ width: accuracy + '%' }"></div>
          <span class="res-meter-mark mark-60" aria-hidden="true"></span>
          <span class="res-meter-mark mark-80" aria-hidden="true"></span>
        </div>
        <div class="res-meter-legend">
          <span>0</span>
          <span>60 及格</span>
          <span>100</span>
        </div>
      </div>

      <p class="res-encourage">{{ encouragement }}</p>
    </section>

    <!-- 三张统计卡 -->
    <section class="res-stats stagger" aria-label="答题统计">
      <div class="stat-card res-stat res-stat-ok">
        <span class="rs-icon mint" aria-hidden="true">✓</span>
        <div class="num">{{ correct }}</div>
        <div class="label">答对</div>
      </div>
      <div class="stat-card res-stat res-stat-no">
        <span class="rs-icon rose" aria-hidden="true">✕</span>
        <div class="num">{{ wrong }}</div>
        <div class="label">答错</div>
      </div>
      <div class="stat-card res-stat res-stat-rate">
        <span class="rs-icon iris" aria-hidden="true">%</span>
        <div class="num">{{ accuracy }}<small>%</small></div>
        <div class="label">正确率</div>
      </div>
    </section>

    <!-- 底部操作 -->
    <div class="sticky-actions res-actions">
      <button class="btn btn-primary" @click="retry">再练一次</button>
      <button v-if="wrong > 0" class="btn btn-secondary" @click="reviewWrong">复习错题</button>
      <button class="btn btn-ghost" @click="goBack">返回学习</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { levelQuestionsAll, levelMockQuestions } from '../data/questions'
import { useStore } from '../store/useStore'
import { useLevel } from '../store/levelStore'

const route = useRoute()
const router = useRouter()
const store = useStore()
const { level } = useLevel()

const fromMode = computed(() => route.query.from || '')
const mockId = computed(() => Number(route.query.mock) || 0)

const modeLabel = computed(() => {
  if (fromMode.value === 'mock') return `第${mockId.value}回模拟测试`
  const map = { sequential: '顺序练习', random: '随机练习', wrong: '错题重做', favorites: '收藏练习' }
  return map[fromMode.value] || '练习'
})

// 本次会话的题目范围（按当前级别）
const sessionQuestions = computed(() => {
  if (fromMode.value === 'mock') {
    return levelMockQuestions(level.value, mockId.value)
  }
  return levelQuestionsAll(level.value)
})

// 优先使用本次练习的真实 session 数据（Quiz 通过 query 传入），
// 否则退回按“当前级别已答题”统计 —— 旧逻辑会把整级题库都算进本页，出现“共 1000 题 / 答错 997”。
const queryTotal = Number(route.query.total)
const queryCorrect = Number(route.query.correct)
const hasSessionStats = Number.isFinite(queryTotal) && queryTotal > 0

const total = computed(() => (hasSessionStats ? queryTotal : sessionQuestions.value.length))
const correct = computed(() => {
  if (hasSessionStats) return Math.max(0, Math.min(queryTotal, Number.isFinite(queryCorrect) ? queryCorrect : 0))
  return sessionQuestions.value.filter(q => {
    const a = store.getAnswer(q.key)
    return a && a.correct
  }).length
})
const wrong = computed(() => total.value - correct.value)
const accuracy = computed(() => total.value ? Math.round(correct.value / total.value * 100) : 0)
const score = computed(() => accuracy.value)

// 分数直接展示 0–100（此前补零成 "00"/"05"，看起来像故障）
const scoreText = computed(() => String(score.value))

// 按正确率给中性鼓励语
const encouragement = computed(() => {
  if (!total.value) return '还没有可统计的题目，先开始一轮练习吧。'
  const a = accuracy.value
  if (a >= 90) return '完成度很高，保持现在的节奏。'
  if (a >= 75) return '大部分题目已经掌握，再看看错题会更稳。'
  if (a >= 60) return '基础已经打下，接下来重点巩固错题。'
  return '先从错题入手，一题一题补齐。'
})

function retry() {
  if (fromMode.value === 'mock') {
    router.push({ name: 'quiz', params: { mode: 'mock' }, query: { mock: mockId.value } })
  } else {
    router.push({ name: 'quiz', params: { mode: fromMode.value } })
  }
}

function reviewWrong() {
  router.push({ name: 'quiz', params: { mode: 'wrong' } })
}

function goBack() {
  if (fromMode.value === 'mock') {
    router.push({ path: '/learn', query: { mode: 'mock' } })
  } else {
    router.push({ path: '/learn', query: { mode: 'bank' } })
  }
}
</script>

<style scoped>
.result-page {
  max-width: 820px;
}

/* ---------- 成绩舞台 ---------- */
.res-stage {
  position: relative;
  overflow: hidden;
  padding: 26px 24px 28px;
  border-radius: var(--radius-xl);
  background: var(--card-grad);
  border: 1px solid var(--border);
  box-shadow: var(--card-float);
  text-align: center;
}
.res-halo {
  position: absolute;
  top: -170px;
  left: 50%;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  transform: translateX(-50%);
  background: radial-gradient(circle, var(--sakura-100), transparent 68%);
  opacity: 0.85;
  pointer-events: none;
}
[data-theme="dark"] .res-halo {
  background: radial-gradient(circle, var(--sakura-200), transparent 68%);
}
.res-top {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.res-kicker {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2.4px;
  color: var(--text-faint);
}
.res-mode {
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  background: var(--sakura-50);
  border: 1px solid var(--border);
  color: var(--sakura-600);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  max-width: 62%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.res-score {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 6px;
  margin: 16px 0 8px;
}
.res-number {
  font-size: clamp(76px, 19vw, 118px);
  font-weight: 800;
  line-height: 0.88;
  letter-spacing: -4px;
  font-variant-numeric: tabular-nums;
  background: var(--grad-sakura);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: score-in 780ms var(--ease-out-expo) both;
}
.res-unit {
  margin-top: 12px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-light);
}
@keyframes score-in {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.84);
    filter: blur(10px);
  }
  to {
    opacity: 1;
    transform: none;
    filter: blur(0);
  }
}

.res-caption {
  position: relative;
  font-size: 13px;
  color: var(--text-light);
}

/* 正确率进度条 */
.res-meter {
  position: relative;
  max-width: 420px;
  margin: 22px auto 0;
  text-align: left;
}
.res-meter-track {
  position: relative;
  height: 10px;
  border-radius: var(--radius-pill);
  background: var(--sakura-100);
  overflow: hidden;
}
.res-meter-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--grad-sakura);
  transform-origin: left center;
  animation: meter-grow 960ms 140ms var(--ease-out-expo) both;
}
@keyframes meter-grow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
.res-meter-mark {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--bg);
  opacity: 0.85;
}
.mark-60 { left: calc(60% - 1px); }
.mark-80 { left: calc(80% - 1px); }
.res-meter-legend {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 10.5px;
  color: var(--text-faint);
  letter-spacing: 0.2px;
}

.res-encourage {
  position: relative;
  display: inline-block;
  margin-top: 20px;
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  background: var(--sakura-50);
  border: 1px solid var(--border);
  color: var(--sakura-700);
  font-size: 13.5px;
  line-height: 1.6;
  max-width: 100%;
  animation: encourage-in 560ms 260ms var(--ease-out-expo) backwards;
}
@keyframes encourage-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}

/* ---------- 统计卡 ---------- */
.res-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 16px;
}
.res-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 16px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
.rs-icon {
  width: 30px;
  height: 30px;
  margin-bottom: 6px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  background: var(--sakura-50);
  color: var(--sakura-600);
}
.rs-icon.mint { background: var(--green-soft); color: var(--green); }
.rs-icon.rose { background: var(--red-soft); color: var(--red); }
.rs-icon.iris { background: var(--iris-soft); color: var(--iris); }
.res-stat .num {
  font-size: 30px;
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.6px;
  background: none;
  color: var(--text);
}
.res-stat .num small {
  margin-left: 1px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-light);
}
.res-stat-ok .num { color: var(--green); }
.res-stat-no .num { color: var(--red); }
.res-stat-rate .num { color: var(--iris); }
.res-stat .label {
  font-size: 11.5px;
  color: var(--text-light);
}

/* ---------- 底部操作 ---------- */
.res-actions {
  justify-content: center;
  gap: 12px;
  margin-top: 8px;
  padding-top: 18px;
}
.res-actions .btn {
  flex: 1 1 130px;
  max-width: 220px;
  min-height: 44px;
}

@media (max-width: 520px) {
  .res-stage { padding: 22px 16px 24px; }
  .res-score { margin-top: 12px; }
  .res-unit { margin-top: 10px; font-size: 17px; }
  .res-stats { gap: 8px; }
  .res-stat { padding: 14px 6px; }
  .res-stat .num { font-size: 26px; }
  .res-actions .btn { max-width: none; }
  .res-actions .btn-primary { flex-basis: 100%; }
}
/* 移动端为悬浮 Tab 栏让位 */
@media (max-width: 760px) {
  .res-actions {
    bottom: calc(78px + env(safe-area-inset-bottom));
    padding-bottom: calc(10px + env(safe-area-inset-bottom));
  }
}
</style>
