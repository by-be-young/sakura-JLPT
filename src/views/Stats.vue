<template>
  <div class="container">
    <div class="list-header">
      <h2>📊 学习统计</h2>
      <button class="btn btn-ghost btn-sm" @click="$router.push('/')">← 返回首页</button>
    </div>

    <!-- 总览 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="num">{{ totalQuestions }}</div>
        <div class="label">题库总数</div>
      </div>
      <div class="stat-card">
        <div class="num">{{ store.state.totalAnswered }}</div>
        <div class="label">已答题数</div>
      </div>
      <div class="stat-card">
        <div class="num" style="color:var(--green);">{{ correctCount }}</div>
        <div class="label">答对题数</div>
      </div>
      <div class="stat-card">
        <div class="num" style="color:var(--red);">{{ store.state.wrong.length }}</div>
        <div class="label">错题数</div>
      </div>
    </div>

    <!-- 正确率进度 -->
    <div class="card" style="margin-bottom:20px;">
      <div class="section-title" style="margin-top:0;">总正确率</div>
      <div class="accuracy-bar">
        <div class="accuracy-fill" :style="{ width: accuracy + '%' }"></div>
      </div>
      <div class="accuracy-text">{{ accuracy }}%（{{ correctCount }}/{{ store.state.totalAnswered }}）</div>

      <div class="breakdown">
        <div class="breakdown-item">
          <span class="dot" style="background:#f0ecee;"></span>
          <span>未做：{{ unseenCount }} 题</span>
        </div>
        <div class="breakdown-item">
          <span class="dot" style="background:var(--green);"></span>
          <span>答对：{{ correctCount }} 题</span>
        </div>
        <div class="breakdown-item">
          <span class="dot" style="background:var(--red);"></span>
          <span>答错：{{ store.state.wrong.length }} 题</span>
        </div>
      </div>
    </div>

    <!-- 模拟测试成绩 -->
    <div class="section-title">模拟测试成绩</div>
    <div class="mock-results">
      <div v-for="m in mockList" :key="m.id" class="mock-result-card">
        <div class="mock-round">第{{ m.id }}回</div>
        <div v-if="store.state.mockResults[m.id]" class="mock-score">
          <div class="score-num">{{ store.state.mockResults[m.id].score }}<span class="unit">分</span></div>
          <div class="score-detail">{{ store.state.mockResults[m.id].correct }}/{{ store.state.mockResults[m.id].total }} 题</div>
          <div class="score-date">{{ formatDate(store.state.mockResults[m.id].date) }}</div>
        </div>
        <div v-else class="mock-empty">
          <span>未测试</span>
          <button class="btn btn-primary btn-sm" style="margin-top:8px;" @click="startMock(m.id)">开始测试</button>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div style="text-align:center; margin-top:28px; display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
      <button class="btn btn-secondary" @click="$router.push('/quiz/sequential')">顺序练习</button>
      <button class="btn btn-secondary" @click="$router.push('/quiz/random')">随机练习</button>
      <button class="btn btn-secondary" @click="$router.push('/wrong')">复习错题</button>
      <button class="btn btn-ghost btn-sm" @click="confirmReset">重置全部记录</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { questions, mockInfo } from '../data/questions'
import { useStore } from '../store/useStore'

const router = useRouter()
const store = useStore()

const totalQuestions = computed(() => questions.length)
const correctCount = computed(() => store.state.totalCorrect)
const accuracy = computed(() => {
  if (store.state.totalAnswered === 0) return 0
  return Math.round(correctCount.value / store.state.totalAnswered * 100)
})
const unseenCount = computed(() => totalQuestions.value - store.state.totalAnswered)

const mockList = computed(() => {
  return Object.entries(mockInfo).map(([id, info]) => ({ id: Number(id), ...info }))
})

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function startMock(id) {
  router.push({ name: 'quiz', params: { mode: 'mock' }, query: { mock: id } })
}

function confirmReset() {
  if (confirm('确定要清空所有学习记录吗？')) {
    store.resetAll()
  }
}
</script>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}
.stat-card {
  background: #fff;
  border-radius: var(--radius);
  padding: 20px 12px;
  text-align: center;
  box-shadow: var(--shadow);
  border: 1px solid var(--sakura-50);
}
.stat-card .num {
  font-size: 30px;
  font-weight: 700;
  color: var(--sakura-600);
}
.stat-card .label {
  font-size: 13px;
  color: var(--ink-light);
  margin-top: 6px;
}
.accuracy-bar {
  height: 24px;
  background: #f0ecee;
  border-radius: 12px;
  overflow: hidden;
  margin: 12px 0 8px;
}
.accuracy-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--sakura-400), var(--sakura-600));
  border-radius: 12px;
  transition: width 0.5s;
}
.accuracy-text {
  font-size: 14px;
  color: var(--ink);
  font-weight: 600;
  margin-bottom: 16px;
}
.breakdown {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.breakdown-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ink-light);
}
.breakdown-item .dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}
.mock-results {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}
.mock-result-card {
  background: #fff;
  border-radius: var(--radius-sm);
  padding: 16px 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border: 1px solid var(--sakura-50);
}
.mock-round {
  font-size: 15px;
  font-weight: 700;
  color: var(--sakura-700);
  margin-bottom: 10px;
}
.score-num {
  font-size: 32px;
  font-weight: 800;
  color: var(--sakura-600);
  line-height: 1;
}
.score-num .unit {
  font-size: 14px;
  color: var(--ink-light);
}
.score-detail {
  font-size: 12px;
  color: var(--ink-light);
  margin-top: 6px;
}
.score-date {
  font-size: 11px;
  color: #bbb;
  margin-top: 4px;
}
.mock-empty {
  color: var(--ink-light);
  font-size: 13px;
  padding: 12px 0;
}
@media (max-width: 640px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .mock-results { grid-template-columns: repeat(3, 1fr); }
}
</style>
