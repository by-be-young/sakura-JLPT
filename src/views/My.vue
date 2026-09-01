<template>
  <div class="container">
    <div class="my-header">
      <h2>🌸 我的</h2>
      <!-- 难度切换（全局同步） -->
      <div class="level-mini-switch">
        <button v-for="lv in APP_LEVELS" :key="lv.id" class="level-mini-btn"
          :class="{ active: level === lv.id }" @click="setLevel(lv.id)">{{ lv.name }}</button>
      </div>
      <div class="tabs">
        <button class="tab" :class="{ active: tab === 'stats' }" @click="switchTab('stats')">📊 统计</button>
        <button class="tab" :class="{ active: tab === 'wrong' }" @click="switchTab('wrong')">
          📝 错题本<span v-if="wrongCountTotal" class="tab-badge">{{ wrongCountTotal }}</span>
        </button>
        <button class="tab" :class="{ active: tab === 'favorites' }" @click="switchTab('favorites')">
          ⭐ 收藏<span v-if="favCount" class="tab-badge fav-badge">{{ favCount }}</span>
        </button>
      </div>
    </div>

    <!-- ============ 统计 ============ -->
    <template v-if="tab === 'stats'">
      <!-- 无题库等级：占位 -->
      <div v-if="!hasQuiz" class="card" style="margin-bottom:20px;">
        <div class="empty-inline">
          <div class="emoji">📚</div>
          <p>{{ currentTitle }}题库待补充，暂无可统计的刷题数据。可以先通过「背词」「文法」学习该等级内容。</p>
        </div>
      </div>

      <template v-else>
        <!-- 总览 -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="num">{{ totalQuestions }}</div>
            <div class="label">{{ level }} 题库总数</div>
          </div>
          <div class="stat-card">
            <div class="num">{{ answeredCount }}</div>
            <div class="label">已答题数</div>
          </div>
          <div class="stat-card">
            <div class="num" style="color:var(--green);">{{ correctCount }}</div>
            <div class="label">答对题数</div>
          </div>
          <div class="stat-card">
            <div class="num" style="color:var(--red);">{{ wrongCountTotal }}</div>
            <div class="label">错题数</div>
          </div>
        </div>

        <!-- 正确率 -->
        <div class="card" style="margin-bottom:20px;">
          <div class="section-title" style="margin-top:0;">{{ level }} 总正确率</div>
          <div class="accuracy-bar">
            <div class="accuracy-fill" :style="{ width: accuracy + '%' }"></div>
          </div>
          <div class="accuracy-text">{{ accuracy }}%（{{ correctCount }}/{{ answeredCount }}）</div>
        </div>

        <!-- 模拟测试成绩 -->
        <div class="section-title">{{ level }} · 模拟测试成绩</div>
        <div class="mock-results">
          <div v-for="m in mockList" :key="m.id" class="mock-result-card" :class="{ 'mock-coming': !m.available }">
            <div class="mock-round">第{{ m.id }}回</div>
            <div v-if="m.available && store.state.mockResults[m.mockKey]" class="mock-score">
              <div class="score-num">{{ store.state.mockResults[m.mockKey].score }}<span class="unit">分</span></div>
              <div class="score-detail">{{ store.state.mockResults[m.mockKey].correct }}/{{ store.state.mockResults[m.mockKey].total }} 题</div>
              <div class="score-date">{{ formatDate(store.state.mockResults[m.mockKey].date) }}</div>
            </div>
            <div v-else-if="m.available" class="mock-empty">
              <span>未测试</span>
              <button class="btn btn-primary btn-sm" style="margin-top:8px;" @click="startMock(m.id)">开始测试</button>
            </div>
            <div v-else class="mock-empty">
              <span>待补充</span>
              <div class="coming-hint">即将上线</div>
            </div>
          </div>
        </div>

        <!-- 快捷操作 -->
        <div style="text-align:center; margin-top:28px; display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
          <button class="btn btn-secondary" @click="$router.push('/quiz/sequential')">{{ level }} 顺序练习</button>
          <button class="btn btn-secondary" @click="$router.push('/quiz/random')">{{ level }} 随机练习</button>
          <button class="btn btn-secondary" @click="switchTab('wrong')">查看错题</button>
          <button class="btn btn-ghost btn-sm" @click="confirmReset">重置全部记录</button>
        </div>
      </template>

      <!-- 文法学习进度（当前等级） -->
      <div class="card" style="margin-bottom:20px;">
        <div class="section-title" style="margin-top:0;">文法学习 · {{ level }}</div>
        <div v-if="grammarCard" class="grammar-row">
          <div class="grammar-head">
            <span class="grammar-badge">{{ grammarCard.id }}</span>
            <span class="grammar-name">{{ grammarCard.title }}</span>
            <span class="grammar-progress-text">{{ grammarCard.learnedPercent }}%</span>
          </div>
          <div class="grammar-track">
            <div class="grammar-fill" :style="{ width: grammarCard.learnedPercent + '%' }"></div>
          </div>
          <div class="grammar-meta">
            <span>已学 {{ grammarCard.learnedCount }}/{{ grammarCard.pointCount }} 点</span>
            <span v-if="grammarCard.markedCount" class="gm-marked">★ 标记 {{ grammarCard.markedCount }}</span>
            <button class="btn btn-ghost btn-xs" style="margin-left:auto;" @click="$router.push('/study')">去学习 →</button>
          </div>
        </div>
        <div v-else class="empty-inline">
          <div class="emoji">📘</div>
          <p>当前等级暂无文法内容</p>
        </div>
      </div>
    </template>

    <!-- ============ 错题本 ============ -->
    <template v-else-if="tab === 'wrong'">
      <div v-if="wrongQuestions.length" class="wrong-toolbar">
        <button class="btn btn-primary btn-sm" @click="practiceAll">全部重练（{{ wrongQuestions.length }}）</button>
      </div>
      <div v-if="wrongQuestions.length === 0" class="empty-state">
        <div class="emoji">🎉</div>
        <p>{{ level }} 还没有错题，继续保持！</p>
        <button class="btn btn-primary" style="margin-top:16px;" @click="$router.push('/')">去做题</button>
      </div>
      <div v-else class="question-list">
        <div v-for="q in wrongQuestions" :key="q.key" class="question-list-item" @click="practiceOne(q.id)">
          <div class="top">
            <span class="qid-tag">{{ level }} No.{{ q.id }}</span>
            <span v-if="q.mock" class="mock-tag">第{{ q.mock }}回</span>
            <span v-else-if="q.unit" class="mock-tag" style="background:#fef0e6;color:#c47a3a;">第{{ q.unit }}单元</span>
            <span v-if="store.getAnswer(q.key)" :style="{ color: store.getAnswer(q.key).correct ? 'var(--green)' : 'var(--red)' }">
              {{ store.getAnswer(q.key).correct ? '已答对' : '仍答错' }}
            </span>
            <button class="del-btn" @click.stop="removeOne(q.key)" title="从错题本移除">✕</button>
          </div>
          <div class="sentence" v-html="displaySentence(q)"></div>
          <div class="meta">
            <span>正确答案：{{ q.answer }}. {{ q.options[q.answer - 1] }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- ============ 收藏 ============ -->
    <template v-else>
      <div v-if="favQuestions.length" class="wrong-toolbar">
        <button class="btn btn-primary btn-sm" @click="practiceAllFav">全部练习（{{ favQuestions.length }}）</button>
      </div>
      <div v-if="favQuestions.length === 0" class="empty-state">
        <div class="emoji">🌟</div>
        <p>{{ level }} 还没有收藏题目，做题时点击❤️收藏吧</p>
        <button class="btn btn-primary" style="margin-top:16px;" @click="$router.push('/')">去做题</button>
      </div>
      <div v-else class="question-list">
        <div v-for="q in favQuestions" :key="q.key" class="question-list-item" @click="practiceOneFav(q.id)">
          <div class="top">
            <span class="qid-tag">{{ level }} No.{{ q.id }}</span>
            <span v-if="q.mock" class="mock-tag">第{{ q.mock }}回</span>
            <span v-else-if="q.unit" class="mock-tag" style="background:#fef0e6;color:#c47a3a;">第{{ q.unit }}单元</span>
            <button class="fav-btn active" @click.stop="removeFav(q.key)">❤️</button>
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
import { levelConfig, levelQuestionsAll, levelTitle, hasQuizData, mockInfo } from '../data/questions'
import { grammarLevels } from '../data/grammar'
import { useStore } from '../store/useStore'
import { useLevel } from '../store/levelStore'
import { useGrammarStore } from '../store/grammarStore'
import { useFurigana } from '../composables/useFurigana'

const router = useRouter()
const route = useRoute()
const store = useStore()
const { level, setLevel, APP_LEVELS } = useLevel()
const grammarStore = useGrammarStore()
const furigana = useFurigana()

const currentTitle = computed(() => levelTitle(level.value))
const hasQuiz = computed(() => hasQuizData(level.value))

const tab = ref(route.query.tab === 'wrong' || route.query.tab === 'favorites' ? route.query.tab : 'stats')

watch(() => route.query.tab, (v) => {
  tab.value = v === 'wrong' || v === 'favorites' ? v : 'stats'
})

function switchTab(t) {
  tab.value = t
  router.replace({ query: { tab: t === 'stats' ? undefined : t } })
}

// ===== 统计 =====
const totalQuestions = computed(() => levelQuestionsAll(level.value).length)
const answeredCount = computed(() => store.state.counts[level.value]?.answered || 0)
const correctCount = computed(() => store.state.counts[level.value]?.correct || 0)
const wrongCountTotal = computed(() => store.wrongCountOf(level.value))
const accuracy = computed(() => {
  if (answeredCount.value === 0) return 0
  return Math.round(correctCount.value / answeredCount.value * 100)
})

// 文法进度：只显示当前等级
const grammarCard = computed(() => {
  const lv = grammarLevels.find(l => l.id === level.value)
  if (!lv) return null
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

const mockList = computed(() => {
  const cfg = levelConfig[level.value]
  const count = cfg?.mockCount || 0
  const arr = []
  for (let id = 1; id <= count; id++) {
    const mockKey = level.value + ':' + id
    const info = mockInfo[mockKey]
    arr.push(info
      ? { id, mockKey, available: true, count: info.count }
      : { id, mockKey, available: false, count: 0 })
  }
  return arr
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
  return levelQuestionsAll(level.value)
    .filter(q => store.state.wrong.includes(q.key))
    .sort((a, b) => a.id - b.id)
})

function practiceOne(id) {
  router.push({ name: 'quiz', params: { mode: 'wrong' }, query: { start: id } })
}

function practiceAll() {
  router.push({ name: 'quiz', params: { mode: 'wrong' } })
}

function removeOne(key) {
  store.removeWrong(key)
}

// ===== 收藏 =====
const favCount = computed(() => levelQuestionsAll(level.value).filter(q => store.state.favorites.includes(q.key)).length)
const favQuestions = computed(() => {
  return levelQuestionsAll(level.value)
    .filter(q => store.state.favorites.includes(q.key))
    .sort((a, b) => a.id - b.id)
})

function practiceOneFav(id) {
  router.push({ name: 'quiz', params: { mode: 'favorites' }, query: { start: id } })
}

function practiceAllFav() {
  router.push({ name: 'quiz', params: { mode: 'favorites' } })
}

function removeFav(key) {
  store.toggleFavorite(key)
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
.level-mini-switch {
  display: flex;
  gap: 6px;
  background: #fff;
  border: 2px solid var(--sakura-50);
  border-radius: 18px;
  padding: 3px;
}
.level-mini-btn {
  border: none;
  background: transparent;
  color: var(--ink-light);
  font-size: 13px;
  font-weight: 700;
  padding: 5px 14px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.18s;
}
.level-mini-btn.active {
  background: linear-gradient(145deg, #ff9dbd, #ff7da0);
  color: #fff;
}
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
.tab-badge.fav-badge { background: #e08a00; }

.empty-inline {
  text-align: center;
  padding: 24px 16px;
  color: var(--ink-light);
  font-size: 13px;
  line-height: 1.7;
}
.empty-inline .emoji { font-size: 34px; margin-bottom: 8px; }
.btn-xs { font-size: 12px; padding: 3px 10px; }

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
.mock-result-card.mock-coming {
  opacity: 0.6;
}
.mock-round { font-size: 15px; font-weight: 700; color: var(--sakura-700); margin-bottom: 10px; }
.score-num { font-size: 32px; font-weight: 800; color: var(--sakura-600); line-height: 1; }
.score-num .unit { font-size: 14px; color: var(--ink-light); }
.score-detail { font-size: 12px; color: var(--ink-light); margin-top: 6px; }
.score-date { font-size: 11px; color: #bbb; margin-top: 4px; }
.mock-empty { color: var(--ink-light); font-size: 13px; padding: 12px 0; }
.coming-hint { font-size: 11px; color: var(--sakura-600); margin-top: 4px; font-weight: 600; }

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
