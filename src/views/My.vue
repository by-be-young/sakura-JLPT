<template>
  <div class="container">
    <div class="my-header">
      <h2>🌸 我的</h2>
      <div class="tabs">
        <button class="tab" :class="{ active: tab === 'stats' }" @click="switchTab('stats')">📊 统计</button>
        <button class="tab" :class="{ active: tab === 'wrong' }" @click="switchTab('wrong')">
          📝 错题本<span v-if="store.state.wrong.length" class="tab-badge">{{ store.state.wrong.length }}</span>
        </button>
      </div>
    </div>

    <!-- ============ 统计 ============ -->
    <template v-if="tab === 'stats'">
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

      <!-- 正确率 -->
      <div class="card" style="margin-bottom:20px;">
        <div class="section-title" style="margin-top:0;">总正确率</div>
        <div class="accuracy-bar">
          <div class="accuracy-fill" :style="{ width: accuracy + '%' }"></div>
        </div>
        <div class="accuracy-text">{{ accuracy }}%（{{ correctCount }}/{{ store.state.totalAnswered }}）</div>
      </div>

      <!-- 文法学习进度 -->
      <div class="card" style="margin-bottom:20px;">
        <div class="section-title" style="margin-top:0;">文法学习</div>
        <div v-for="lv in grammarCards" :key="lv.id" class="grammar-row">
          <div class="grammar-head">
            <span class="grammar-badge">{{ lv.id }}</span>
            <span class="grammar-name">{{ lv.title }}</span>
            <span class="grammar-progress-text">{{ lv.learnedPercent }}%</span>
          </div>
          <div class="grammar-track">
            <div class="grammar-fill" :style="{ width: lv.learnedPercent + '%' }"></div>
          </div>
          <div class="grammar-meta">
            <span>已学 {{ lv.learnedCount }}/{{ lv.pointCount }} 点</span>
            <span v-if="lv.markedCount" class="gm-marked">★ 标记 {{ lv.markedCount }}</span>
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
        <button class="btn btn-secondary" @click="switchTab('wrong')">查看错题</button>
        <button class="btn btn-ghost btn-sm" @click="confirmReset">重置全部记录</button>
      </div>
    </template>

    <!-- ============ 错题本 ============ -->
    <template v-else>
      <div v-if="wrongQuestions.length" class="wrong-toolbar">
        <button class="btn btn-primary btn-sm" @click="practiceAll">全部重练</button>
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
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { questions, mockInfo } from '../data/questions'
import { grammarLevels } from '../data/grammar'
import { useStore } from '../store/useStore'
import { useGrammarStore } from '../store/grammarStore'
import { useFurigana } from '../composables/useFurigana'

const router = useRouter()
const route = useRoute()
const store = useStore()
const grammarStore = useGrammarStore()
const furigana = useFurigana()

const tab = ref(route.query.tab === 'wrong' ? 'wrong' : 'stats')

watch(() => route.query.tab, (v) => {
  tab.value = v === 'wrong' ? 'wrong' : 'stats'
})

function switchTab(t) {
  tab.value = t
  router.replace({ query: { tab: t === 'wrong' ? 'wrong' : undefined } })
}

// ===== 统计 =====
const totalQuestions = computed(() => questions.length)
const correctCount = computed(() => store.state.totalCorrect)
const accuracy = computed(() => {
  if (store.state.totalAnswered === 0) return 0
  return Math.round(correctCount.value / store.state.totalAnswered * 100)
})

const grammarCards = computed(() => {
  return grammarLevels.map(lv => {
    const points = lv.units.flatMap(u => u.points)
    const learnedCount = grammarStore.learnedCountOf(points)
    const markedCount = grammarStore.markedCountOf(points)
    return {
      id: lv.id,
      title: lv.name.replace(' 文法详解（整理版）', '').replace('文法详解（整理版）', ''),
      pointCount: points.length,
      learnedCount,
      markedCount,
      learnedPercent: points.length ? Math.round(learnedCount / points.length * 100) : 0,
    }
  })
})

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
  if (confirm('确定要清空所有学习记录（答题记录、错题、收藏、文法标记与进度）吗？')) {
    store.resetAll()
    grammarStore.resetAll()
  }
}

// ===== 错题本 =====
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
.my-header {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.my-header h2 { margin: 0; font-size: 22px; }
.tabs { display: flex; gap: 10px; margin-left: auto; }
.tab {
  border: 1px solid var(--sakura-100, #ffd3e0);
  background: #fff;
  color: var(--ink-light);
  padding: 7px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.18s;
  position: relative;
}
.tab.active {
  background: linear-gradient(145deg, #ff9dbd, #ff7da0);
  border-color: transparent;
  color: #fff;
  font-weight: 700;
}
.tab-badge {
  display: inline-block;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--red, #e5484d);
  color: #fff;
  font-size: 11px;
  text-align: center;
  margin-left: 4px;
  vertical-align: 1px;
}

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
.stat-card .num { font-size: 30px; font-weight: 700; color: var(--sakura-600); }
.stat-card .label { font-size: 13px; color: var(--ink-light); margin-top: 6px; }

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
.accuracy-text { font-size: 14px; color: var(--ink); font-weight: 600; }

/* 文法进度 */
.grammar-row { margin-bottom: 16px; }
.grammar-row:last-child { margin-bottom: 0; }
.grammar-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.grammar-badge {
  background: linear-gradient(145deg, #ff9dbd, #ff7da0);
  color: #fff;
  font-weight: 800;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
}
.grammar-name { font-size: 14px; font-weight: 600; color: #7a4b55; flex: 1; }
.grammar-progress-text { font-size: 12px; color: #c2556f; font-weight: 700; min-width: 40px; text-align: right; }
.grammar-track {
  height: 10px;
  background: #ffe3ec;
  border-radius: 5px;
  overflow: hidden;
}
.grammar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff9dbd, #ff7da0);
  border-radius: 5px;
  transition: width 0.4s;
}
.grammar-meta { display: flex; gap: 12px; margin-top: 4px; font-size: 12px; color: #b98a94; }
.grammar-meta .gm-marked { color: #e08a00; }

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
.mock-round { font-size: 15px; font-weight: 700; color: var(--sakura-700); margin-bottom: 10px; }
.score-num { font-size: 32px; font-weight: 800; color: var(--sakura-600); line-height: 1; }
.score-num .unit { font-size: 14px; color: var(--ink-light); }
.score-detail { font-size: 12px; color: var(--ink-light); margin-top: 6px; }
.score-date { font-size: 11px; color: #bbb; margin-top: 4px; }
.mock-empty { color: var(--ink-light); font-size: 13px; padding: 12px 0; }

.wrong-toolbar { margin-bottom: 14px; }
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
.del-btn:hover { background: var(--red); color: #fff; transform: scale(1.1); }

@media (max-width: 640px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .mock-results { grid-template-columns: repeat(3, 1fr); }
  .tabs { margin-left: 0; }
}
</style>
