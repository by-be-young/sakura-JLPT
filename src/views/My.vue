<template>
  <div class="container">
    <div class="my-header">
      <div class="my-head-top">
        <h2>🌸 我的</h2>
      </div>

      <!-- 今日打卡条 -->
      <div class="streak-bar">
        <div class="streak-item">
          <span class="streak-emoji">🔥</span>
          <b>{{ daily.streak.value }}</b>
          <span>天连续</span>
        </div>
        <div class="streak-div"></div>
        <div class="streak-item">📝 今日 <b>{{ daily.todayQuiz.value }}</b>/{{ daily.state.settings.quizTarget }}</div>
        <div class="streak-item">🌸 今日 <b>{{ daily.todayWord.value }}</b>/{{ daily.state.settings.wordTarget }}</div>
        <button class="btn btn-ghost btn-xs" @click="$router.push('/settings')">⚙️ 设置</button>
      </div>

      <!-- 学习等级（唯一入口，全局同步） -->
      <LevelSelector show-hint class="level-card-wrap" />

      <!-- 账号栏：登录 / 云同步 -->
      <div class="account-bar">
        <template v-if="authState.user">
          <div class="account-info">
            <span class="account-avatar">👤</span>
            <span class="account-email">{{ authState.user.email || authState.user.username }}</span>
            <span v-if="syncState.message" class="account-sync">{{ syncState.message }}</span>
          </div>
          <button class="account-btn" @click="doLogout">退出登录</button>
        </template>
        <template v-else>
          <div class="account-info account-guest">
            <span class="account-avatar">🌱</span>
            <span class="account-hint">登录后可跨设备同步学习数据</span>
          </div>
          <button class="account-btn primary" @click="authModalVisible = true">
            {{ authState.configured ? '登录 / 注册' : '登录（未配置云端）' }}
          </button>
        </template>
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
      <div v-if="!hasQuiz" class="card placeholder-card">
        <div class="empty-inline">
          <div class="emoji">📚</div>
          <p>{{ currentTitle }}题库待补充，暂无刷题数据。</p>
        </div>
      </div>

      <template v-else>
        <!-- 数据总览 -->
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
            <div class="num good">{{ correctCount }}</div>
            <div class="label">答对题数</div>
          </div>
          <div class="stat-card">
            <div class="num bad">{{ wrongCountTotal }}</div>
            <div class="label">错题数</div>
          </div>
        </div>

        <!-- 正确率 -->
        <div class="card accuracy-card">
          <div class="card-head">
            <h3 class="card-title">🎯 {{ level }} 总正确率</h3>
            <span class="accuracy-pct">{{ accuracy }}<small>%</small></span>
          </div>
          <div class="accuracy-bar">
            <div class="accuracy-fill" :style="{ width: accuracy + '%' }"></div>
          </div>
          <div class="accuracy-sub">
            <span v-if="answeredCount">答对 {{ correctCount }} 题 · 已答 {{ answeredCount }} 题</span>
            <span v-else>暂无答题数据，去刷题吧</span>
          </div>
        </div>

        <!-- 模拟测试成绩 -->
        <h3 class="section-title">{{ level }} · 模拟测试成绩</h3>
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
              <button class="btn btn-primary btn-sm" @click="startMock(m.id)">开始测试</button>
            </div>
            <div v-else class="mock-empty">
              <span>待补充</span>
              <div class="coming-hint">即将上线</div>
            </div>
          </div>
        </div>

        <!-- 快捷操作 -->
        <div class="card quick-card">
          <h3 class="card-title">⚡ 快捷操作</h3>
          <div class="quick-actions">
            <button class="btn btn-secondary" @click="$router.push('/quiz/sequential')">{{ level }} 顺序练习</button>
            <button class="btn btn-secondary" @click="$router.push('/quiz/random')">{{ level }} 随机练习</button>
            <button class="btn btn-secondary" @click="switchTab('wrong')">查看错题</button>
            <button class="btn btn-secondary" @click="feedbackVisible = true">📮 问题反馈</button>
            <button v-if="authState.isAdmin" class="btn btn-secondary" @click="$router.push('/admin/feedback')">📋 反馈管理</button>
            <button class="btn btn-secondary" @click="$router.push('/settings')">⚙️ 设置</button>
          </div>
        </div>

      </template>

      <!-- 文法学习进度（当前等级） -->
      <div class="card grammar-card">
        <h3 class="card-title">📘 文法学习 · {{ level }}</h3>
        <div v-if="grammarCard" class="grammar-body">
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
            <button class="btn btn-ghost btn-xs" @click="$router.push('/study')">去学习 →</button>
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
        <button class="btn btn-ghost btn-sm" @click="clearWrongLevel">🗑 清空错题本</button>
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
            <span class="wrong-time" v-if="store.getAnswer(q.key)?.time">最近答错 <b>{{ formatDate(store.getAnswer(q.key).time) }}</b></span>
          </div>
        </div>
      </div>
    </template>

    <!-- ============ 收藏 ============ -->
    <template v-else>
      <div v-if="favQuestions.length" class="wrong-toolbar">
        <button class="btn btn-primary btn-sm" @click="practiceAllFav">全部练习（{{ favQuestions.length }}）</button>
        <button class="btn btn-ghost btn-sm" @click="clearFavLevel">🗑 清空收藏</button>
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

    <!-- 登录/注册弹窗 -->
    <AuthModal v-model:visible="authModalVisible" @authed="authModalVisible = false" />
    <!-- 问题反馈弹窗 -->
    <FeedbackModal v-model:visible="feedbackVisible" type="general" />
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
import { useDaily } from '../store/dailyStore'
import { useFurigana } from '../composables/useFurigana'
import { useAuth } from '../composables/useAuth'
import { useSync } from '../composables/useSync'
import LevelSelector from '../components/LevelSelector.vue'
import AuthModal from '../components/AuthModal.vue'
import FeedbackModal from '../components/FeedbackModal.vue'

const router = useRouter()
const route = useRoute()
const store = useStore()
const { level } = useLevel()
const grammarStore = useGrammarStore()
const furigana = useFurigana()
const daily = useDaily()
const { state: authState, logout } = useAuth()
const { syncState, stopSync } = useSync()
const authModalVisible = ref(false)
const feedbackVisible = ref(false)

function doLogout() {
  logout()
  stopSync()
}

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
    title: lv.name.replace('（整理版）', '').trim(),
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

function clearWrongLevel() {
  if (confirm(`确定清空 ${level.value} 的全部错题吗？`)) {
    store.clearWrong(level.value)
  }
}

function clearFavLevel() {
  if (confirm(`确定清空 ${level.value} 的全部收藏吗？`)) {
    store.clearFavorites(level.value)
  }
}

// ===== 错题本（按最近答错时间倒序，像成熟学习 App） =====
function displaySentence(q) {
  if (furigana.isEnabled.value && q.sentenceFurigana) return q.sentenceFurigana
  return q.sentence
}

const wrongQuestions = computed(() => {
  return levelQuestionsAll(level.value)
    .filter(q => store.state.wrong.includes(q.key))
    .sort((a, b) => {
      const ta = store.state.answered[a.key]?.time || 0
      const tb = store.state.answered[b.key]?.time || 0
      return tb - ta
    })
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
.my-header { margin-bottom: 18px; }
.my-head-top { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.my-header h2 { margin: 0; font-size: 22px; color: var(--text); }

/* 今日打卡条 */
.streak-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding: 10px 14px;
  background: var(--card-grad);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  font-size: 13px;
  color: var(--text-light);
}
.streak-item { display: flex; align-items: center; gap: 5px; }
.streak-item b { color: var(--sakura-600); font-size: 15px; }
.streak-emoji { font-size: 16px; }
.streak-div { width: 1px; height: 16px; background: var(--border-strong); }

/* 账号栏 */
.account-bar {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  margin-top: 12px; padding: 10px 14px;
  background: var(--sakura-50);
  border: 1px solid var(--border); border-radius: 12px;
}
.account-info { display: flex; align-items: center; gap: 8px; min-width: 0; }
.account-avatar { font-size: 18px; }
.account-email { font-size: 14px; font-weight: 600; color: var(--sakura-600); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.account-hint { font-size: 13px; color: var(--text-light); }
.account-sync { font-size: 12px; color: var(--green); background: var(--green-soft); padding: 2px 8px; border-radius: 10px; }
.account-btn {
  border: 1px solid var(--border-strong); background: var(--card-grad); color: var(--sakura-600);
  padding: 6px 16px; border-radius: 16px; font-size: 13px; cursor: pointer; transition: all 0.18s;
}
.account-btn:hover { background: var(--sakura-100); }
.account-btn.primary {
  background: linear-gradient(90deg, var(--sakura-400), var(--sakura-600)); border: none; color: #fff; font-weight: 600;
}
.account-btn.primary:hover { filter: brightness(1.05); }

.tabs { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
.tab {
  border: 1px solid var(--border-strong);
  background: var(--card-grad);
  color: var(--text-light);
  padding: 7px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.18s;
  position: relative;
}
.tab.active {
  background: linear-gradient(145deg, var(--sakura-400), var(--sakura-600));
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
  background: var(--red);
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
  color: var(--text-light);
  font-size: 13px;
  line-height: 1.7;
}
.empty-inline .emoji { font-size: 34px; margin-bottom: 8px; }
.btn-xs { font-size: 12px; padding: 3px 10px; }

/* ===== 卡片通用标题 ===== */
.card-title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}
.card-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 15px;
  margin-right: 8px;
  vertical-align: -1px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--sakura-400), var(--sakura-600));
}

/* ===== 数据总览 ===== */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}
.stat-card {
  background: var(--card-grad);
  border-radius: var(--radius);
  padding: 20px 12px;
  text-align: center;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border);
}
.stat-card .num { font-size: 30px; font-weight: 700; color: var(--sakura-600); line-height: 1.1; }
.stat-card .num.good { color: var(--green); }
.stat-card .num.bad { color: var(--red); }
.stat-card .label { font-size: 13px; color: var(--text-light); margin-top: 6px; }

/* ===== 正确率 ===== */
.accuracy-card { margin-bottom: 20px; }
.accuracy-card .card-head { display: flex; align-items: baseline; justify-content: space-between; }
.accuracy-card .card-title { margin-bottom: 14px; }
.accuracy-pct { font-size: 26px; font-weight: 800; color: var(--sakura-600); line-height: 1; }
.accuracy-pct small { font-size: 15px; color: var(--text-light); margin-left: 2px; }
.accuracy-bar {
  height: 18px;
  background: var(--sakura-100);
  border-radius: 9px;
  overflow: hidden;
}
.accuracy-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--sakura-400), var(--sakura-600));
  border-radius: 9px;
  transition: width 0.5s;
}
.accuracy-sub { margin-top: 10px; font-size: 13px; color: var(--text-light); }

/* ===== 模拟测试成绩 ===== */
.mock-results {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.mock-result-card {
  background: var(--card-grad);
  border-radius: var(--radius-sm);
  padding: 16px 12px;
  text-align: center;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border);
}
.mock-result-card.mock-coming { opacity: 0.6; }
.mock-round { font-size: 15px; font-weight: 700; color: var(--sakura-600); margin-bottom: 10px; }
.score-num { font-size: 32px; font-weight: 800; color: var(--sakura-600); line-height: 1; }
.score-num .unit { font-size: 14px; color: var(--text-light); }
.score-detail { font-size: 12px; color: var(--text-light); margin-top: 6px; }
.score-date { font-size: 11px; color: var(--text-faint); margin-top: 4px; }
.mock-empty { color: var(--text-light); font-size: 13px; padding: 12px 0; }
.coming-hint { font-size: 11px; color: var(--sakura-600); margin-top: 4px; font-weight: 600; }

/* ===== 快捷操作 ===== */
.quick-card { margin-bottom: 20px; }
.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.quick-actions .btn { width: 100%; }

/* ===== 数据管理（已移至设置中心） ===== */
.level-card-wrap { margin-top: 12px; }

/* ===== 文法进度 ===== */
.grammar-body { margin-bottom: 4px; }
.grammar-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.grammar-badge {
  background: linear-gradient(145deg, var(--sakura-400), var(--sakura-600));
  color: #fff;
  font-weight: 800;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
}
.grammar-name { font-size: 14px; font-weight: 600; color: var(--text); flex: 1; }
.grammar-progress-text { font-size: 12px; color: var(--sakura-600); font-weight: 700; min-width: 40px; text-align: right; }
.grammar-track {
  height: 10px;
  background: var(--sakura-100);
  border-radius: 5px;
  overflow: hidden;
}
.grammar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--sakura-400), var(--sakura-600));
  border-radius: 5px;
  transition: width 0.4s;
}
.grammar-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-light);
}
.grammar-meta .gm-marked { color: #e08a00; }
.grammar-meta .btn { margin-left: auto; }

.wrong-toolbar { margin-bottom: 14px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.sentence :deep(u) {
  text-decoration: none;
  border-bottom: 2px solid var(--sakura-400);
  padding-bottom: 1px;
  color: var(--sakura-600);
  font-weight: 600;
}
.del-btn {
  margin-left: auto;
  width: 24px;
  height: 24px;
  border: none;
  background: var(--red-soft);
  color: var(--red);
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
  .quick-actions { grid-template-columns: 1fr; }
}
</style>
