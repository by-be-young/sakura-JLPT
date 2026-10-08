<template>
  <div class="container my-page">
    <!-- ===== 个人资料 ===== -->
    <section class="profile-card">
      <div class="profile-main">
        <div class="profile-avatar" :class="{ guest: !authState.user }">
          {{ authState.user ? '👤' : '🌱' }}
        </div>
        <div class="profile-text">
          <div class="profile-name" :title="profileName">{{ profileName }}</div>
          <div class="profile-meta">
            <span class="meta-chip streak">🔥 连续 {{ daily.streak.value }} 天</span>
            <span v-if="authState.user && syncState.message" class="meta-chip sync">☁️ {{ syncState.message }}</span>
          </div>
        </div>
        <button class="profile-action" :class="{ 'is-primary': !authState.user }" @click="onAccountClick">
          {{ authState.user ? '退出登录' : '登录 / 注册' }}
        </button>
      </div>
      <p class="profile-tip" v-if="!authState.user">
        {{ authState.configured ? '登录后可跨设备同步学习数据' : '本地学习 · 数据保存在本设备' }}
      </p>
    </section>

    <!-- ===== 学习等级（全局唯一入口） ===== -->
    <LevelSelector show-hint class="level-card-wrap" />

    <!-- ===== 内容切换 ===== -->
    <div class="seg-tabs">
      <button
        v-for="t in tabs"
        :key="t.id"
        class="seg-tab"
        :class="{ active: tab === t.id }"
        @click="switchTab(t.id)"
      >
        <span>{{ t.label }}</span>
        <span v-if="t.badge" class="seg-badge" :class="t.badgeClass">{{ t.badge }}</span>
      </button>
    </div>

    <!-- ============ 学习数据 ============ -->
    <template v-if="tab === 'stats'">
      <div v-if="hasQuiz" class="panel-card">
        <div class="panel-head">
          <h3 class="panel-title">学习数据</h3>
          <span class="panel-tag">{{ level }}</span>
        </div>

        <div class="data-body">
          <div class="acc-ring">
            <svg width="104" height="104" viewBox="0 0 104 104">
              <defs>
                <linearGradient id="myAccGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#ff7aa2" />
                  <stop offset="100%" stop-color="#e03e74" />
                </linearGradient>
              </defs>
              <circle class="acc-bg" cx="52" cy="52" r="44" fill="none" stroke-width="10" />
              <circle
                class="acc-fg" cx="52" cy="52" r="44" fill="none" stroke-width="10"
                :stroke-dasharray="RING_C" :stroke-dashoffset="ringOffset"
              />
            </svg>
            <div class="acc-center">
              <span class="acc-num">{{ accuracy }}<small>%</small></span>
              <span class="acc-label">正确率</span>
            </div>
          </div>

          <div class="data-list">
            <div class="data-row">
              <span class="dr-label">题库总数</span>
              <span class="dr-value">{{ totalQuestions }}</span>
            </div>
            <div class="data-row">
              <span class="dr-label">已答题数</span>
              <span class="dr-value">{{ answeredCount }}</span>
            </div>
            <div class="data-row">
              <span class="dr-label">答对</span>
              <span class="dr-value good">{{ correctCount }}</span>
            </div>
            <div class="data-row">
              <span class="dr-label">错题</span>
              <span class="dr-value bad">{{ wrongCountTotal }}</span>
            </div>
          </div>
        </div>

        <div class="data-progress">
          <div class="dp-head">
            <span>{{ currentTitle }}刷题进度</span>
            <b>{{ answeredPercent }}%</b>
          </div>
          <div class="dp-track"><div class="dp-fill" :style="{ width: answeredPercent + '%' }"></div></div>
        </div>

        <button class="data-link" @click="goMock">
          <span class="dl-icon">🧪</span>
          <span class="dl-text">
            <b>模拟测试</b>
            <small>{{ mockSummary }}</small>
          </span>
          <span class="dl-arrow">›</span>
        </button>
      </div>

      <!-- 无题库等级 -->
      <div v-else class="panel-card empty-card">
        <div class="empty-emoji">📚</div>
        <p class="empty-title">{{ currentTitle }}题库待补充</p>
        <p class="empty-desc">当前等级暂无刷题数据，可以先通过「背词」「文法」学习该等级内容。</p>
      </div>

      <!-- 文法进度 -->
      <div class="panel-card">
        <div class="panel-head">
          <h3 class="panel-title">📘 文法学习</h3>
        </div>
        <template v-if="grammarCard">
          <div class="g-head">
            <span class="g-badge">{{ grammarCard.id }}</span>
            <span class="g-name">{{ grammarCard.title }}</span>
            <span class="g-pct">{{ grammarCard.learnedPercent }}%</span>
          </div>
          <div class="g-track"><div class="g-fill" :style="{ width: grammarCard.learnedPercent + '%' }"></div></div>
          <div class="g-meta">
            <span>已学 {{ grammarCard.learnedCount }}/{{ grammarCard.pointCount }} 点</span>
            <span v-if="grammarCard.markedCount" class="g-marked">★ 标记 {{ grammarCard.markedCount }}</span>
            <button class="btn btn-ghost btn-xs g-go" @click="$router.push('/study')">去学习 →</button>
          </div>
        </template>
        <div v-else class="empty-inline">
          <div class="empty-emoji">📘</div>
          <p>当前等级暂无文法内容</p>
        </div>
      </div>
    </template>

    <!-- ============ 错题本 ============ -->
    <template v-else-if="tab === 'wrong'">
      <template v-if="wrongQuestions.length">
        <div class="tool-bar">
          <button class="btn btn-primary btn-sm" @click="practiceAll">全部重练 · {{ wrongQuestions.length }}</button>
          <button class="btn btn-ghost btn-sm" @click="clearWrongLevel">清空错题本</button>
        </div>
        <div class="q-list">
          <article v-for="q in wrongQuestions" :key="q.key" class="q-item" @click="practiceOne(q.id)">
            <div class="q-top">
              <span class="qid-tag">{{ level }} No.{{ q.id }}</span>
              <span v-if="q.mock" class="mock-tag">第{{ q.mock }}回</span>
              <span v-else-if="q.unit" class="mock-tag unit-tag">第{{ q.unit }}单元</span>
              <span v-if="answerState(q.key)" class="q-state" :class="answerState(q.key)">
                {{ answerState(q.key) === 'correct' ? '已答对' : '仍答错' }}
              </span>
              <button class="q-del" @click.stop="removeOne(q.key)" title="从错题本移除">✕</button>
            </div>
            <div class="q-sentence" v-html="displaySentence(q)"></div>
            <div class="q-foot">
              <span class="q-answer">正确答案 {{ q.answer }}. {{ q.options[q.answer - 1] }}</span>
              <span class="q-time" v-if="store.getAnswer(q.key)?.time">最近答错 {{ formatDate(store.getAnswer(q.key).time) }}</span>
            </div>
          </article>
        </div>
      </template>
      <div v-else class="panel-card empty-card">
        <div class="empty-emoji">🎉</div>
        <p class="empty-title">{{ level }} 还没有错题</p>
        <p class="empty-desc">继续保持！做错的题会自动进入这里，方便集中重练。</p>
        <button class="btn btn-primary btn-sm" @click="$router.push('/learn')">去练习</button>
      </div>
    </template>

    <!-- ============ 收藏 ============ -->
    <template v-else>
      <template v-if="favQuestions.length">
        <div class="tool-bar">
          <button class="btn btn-primary btn-sm" @click="practiceAllFav">全部练习 · {{ favQuestions.length }}</button>
          <button class="btn btn-ghost btn-sm" @click="clearFavLevel">清空收藏</button>
        </div>
        <div class="q-list">
          <article v-for="q in favQuestions" :key="q.key" class="q-item" @click="practiceOneFav(q.id)">
            <div class="q-top">
              <span class="qid-tag">{{ level }} No.{{ q.id }}</span>
              <span v-if="q.mock" class="mock-tag">第{{ q.mock }}回</span>
              <span v-else-if="q.unit" class="mock-tag unit-tag">第{{ q.unit }}单元</span>
              <button class="q-del fav" @click.stop="removeFav(q.key)" title="取消收藏">❤️</button>
            </div>
            <div class="q-sentence" v-html="displaySentence(q)"></div>
            <div class="q-foot">
              <span class="q-answer">正确答案 {{ q.answer }}. {{ q.options[q.answer - 1] }}</span>
            </div>
          </article>
        </div>
      </template>
      <div v-else class="panel-card empty-card">
        <div class="empty-emoji">🌟</div>
        <p class="empty-title">{{ level }} 还没有收藏题目</p>
        <p class="empty-desc">做题时点击 ❤️ 收藏，重要题目会集中在这里。</p>
        <button class="btn btn-primary btn-sm" @click="$router.push('/learn')">去练习</button>
      </div>
    </template>

    <!-- 管理员入口（仅管理员可见） -->
    <button v-if="authState.isAdmin" class="admin-row" @click="$router.push('/admin/feedback')">
      <span class="admin-icon">📋</span>
      <span class="admin-text">反馈管理</span>
      <span class="admin-arrow">›</span>
    </button>

    <!-- 登录/注册弹窗 -->
    <AuthModal v-model:visible="authModalVisible" @authed="authModalVisible = false" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { levelQuestionsAll, levelTitle, hasQuizData, mockInfo } from '../data/questions'
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

// ===== 账号 =====
const profileName = computed(() => {
  const u = authState.user
  if (!u) return '未登录'
  return u.email || u.username || '已登录'
})

function onAccountClick() {
  if (authState.user) {
    logout()
    stopSync()
  } else {
    authModalVisible.value = true
  }
}

// ===== 等级 / 题库 =====
const currentTitle = computed(() => levelTitle(level.value))
const hasQuiz = computed(() => hasQuizData(level.value))

// ===== 分页（支持 ?tab= 深链） =====
const tab = ref(route.query.tab === 'wrong' || route.query.tab === 'favorites' ? route.query.tab : 'stats')

watch(() => route.query.tab, (v) => {
  tab.value = v === 'wrong' || v === 'favorites' ? v : 'stats'
})

function switchTab(t) {
  tab.value = t
  router.replace({ query: { tab: t === 'stats' ? undefined : t } })
}

// ===== 学习数据 =====
const totalQuestions = computed(() => levelQuestionsAll(level.value).length)
const answeredCount = computed(() => store.state.counts[level.value]?.answered || 0)
const correctCount = computed(() => store.state.counts[level.value]?.correct || 0)
const wrongCountTotal = computed(() => store.wrongCountOf(level.value))
const accuracy = computed(() => {
  if (answeredCount.value === 0) return 0
  return Math.round(correctCount.value / answeredCount.value * 100)
})
const answeredPercent = computed(() => {
  if (!totalQuestions.value) return 0
  return Math.round(answeredCount.value / totalQuestions.value * 100)
})

// 正确率进度环（r = 44）
const RING_C = 2 * Math.PI * 44
const ringOffset = computed(() => RING_C * (1 - accuracy.value / 100))

// 模拟测试：成绩明细在「练习 · 模拟测试」，这里只做概览入口
const mockSummary = computed(() => {
  const prefix = level.value + ':'
  const total = Object.keys(mockInfo).filter(k => k.startsWith(prefix)).length
  if (!total) return '当前等级暂无模拟卷'
  let done = 0, sum = 0
  for (const [k, v] of Object.entries(store.state.mockResults || {})) {
    if (k.startsWith(prefix) && v) { done++; sum += (v.score || 0) }
  }
  if (!done) return `共 ${total} 套 · 尚未测试`
  return `已完成 ${done}/${total} 套 · 平均 ${Math.round(sum / done)} 分`
})

function goMock() {
  router.push({ path: '/learn', query: { mode: 'mock' } })
}

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

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ===== 错题本 =====
function displaySentence(q) {
  if (furigana.isEnabled.value && q.sentenceFurigana) return q.sentenceFurigana
  return q.sentence
}

function answerState(key) {
  const a = store.getAnswer(key)
  if (!a) return ''
  return a.correct ? 'correct' : 'wrong'
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

function clearWrongLevel() {
  if (confirm(`确定清空 ${level.value} 的全部错题吗？`)) {
    store.clearWrong(level.value)
  }
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

function clearFavLevel() {
  if (confirm(`确定清空 ${level.value} 的全部收藏吗？`)) {
    store.clearFavorites(level.value)
  }
}

// ===== 分页配置 =====
const tabs = computed(() => [
  { id: 'stats', label: '学习数据', badge: 0 },
  { id: 'wrong', label: '错题本', badge: wrongCountTotal.value, badgeClass: '' },
  { id: 'favorites', label: '收藏', badge: favCount.value, badgeClass: 'fav' },
])
</script>

<style scoped>
.my-page { max-width: 860px; }

/* ===== 个人资料卡 ===== */
.profile-card {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  padding: 20px 22px;
  margin-bottom: 14px;
  background: linear-gradient(135deg, rgba(255, 205, 224, 0.5), rgba(255, 240, 246, 0.18));
  box-shadow: var(--card-float);
}
[data-theme="dark"] .profile-card {
  background: linear-gradient(135deg, rgba(224, 94, 142, 0.2), rgba(42, 26, 34, 0.12));
}
.profile-card::after {
  content: '';
  position: absolute;
  right: -70px;
  top: -90px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 122, 162, 0.3), rgba(255, 122, 162, 0) 70%);
  pointer-events: none;
}
[data-theme="dark"] .profile-card::after {
  background: radial-gradient(circle, rgba(224, 94, 142, 0.24), rgba(224, 94, 142, 0) 70%);
}
.profile-main {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 14px;
}
.profile-avatar {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  background: linear-gradient(145deg, var(--sakura-400), var(--sakura-600));
  box-shadow: 0 6px 18px rgba(244, 92, 142, 0.34);
}
.profile-avatar.guest {
  background: linear-gradient(145deg, #cdeadd, #98d3ba);
  box-shadow: 0 6px 18px rgba(76, 191, 140, 0.24);
}
[data-theme="dark"] .profile-avatar.guest {
  background: linear-gradient(145deg, #2f5c4a, #1f3d33);
  box-shadow: none;
}
.profile-text { flex: 1; min-width: 0; }
.profile-name {
  font-size: 17px;
  font-weight: 800;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.profile-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.meta-chip {
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.62);
  color: var(--text-light);
}
[data-theme="dark"] .meta-chip { background: rgba(255, 255, 255, 0.08); }
.meta-chip.streak { background: rgba(232, 184, 109, 0.22); color: #c8860f; }
[data-theme="dark"] .meta-chip.streak { color: #e8b86d; }
.meta-chip.sync { background: var(--green-soft); color: var(--green); }
.profile-action {
  flex-shrink: 0;
  border-radius: 20px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 700;
  color: var(--sakura-600);
  background: var(--card);
  border: 1.5px solid var(--border-strong);
  transition: all 0.2s;
}
.profile-action:hover { border-color: var(--sakura-400); transform: translateY(-1px); }
.profile-action.is-primary {
  color: #fff;
  border-color: transparent;
  background: linear-gradient(135deg, var(--sakura-400), var(--sakura-600));
  box-shadow: 0 4px 14px rgba(244, 92, 142, 0.35);
}
.profile-action.is-primary:hover { filter: brightness(1.05); }
.profile-tip {
  position: relative;
  z-index: 1;
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-light);
}
.level-card-wrap { margin-bottom: 16px; }

/* ===== 内容切换（分段控件） ===== */
.seg-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 5px;
  border-radius: 18px;
  background: var(--sakura-100);
  margin-bottom: 18px;
}
.seg-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 11px 8px;
  border-radius: 14px;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-light);
  transition: all 0.2s;
}
.seg-tab:hover:not(.active) { color: var(--sakura-600); }
.seg-tab.active {
  background: var(--card);
  color: var(--sakura-600);
  box-shadow: 0 2px 10px rgba(60, 30, 45, 0.1);
}
[data-theme="dark"] .seg-tab.active { box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3); }
.seg-badge {
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
}
.seg-badge.fav { background: #e08a00; }

/* ===== 通用面板卡 ===== */
.panel-card {
  background: var(--card-grad);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-card);
  margin-bottom: 16px;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.panel-title {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: var(--text);
  display: flex;
  align-items: center;
}
.panel-title::before {
  content: '';
  width: 4px;
  height: 15px;
  margin-right: 8px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--sakura-400), var(--sakura-600));
}
.panel-tag {
  font-size: 12px;
  font-weight: 800;
  color: var(--sakura-600);
  background: var(--sakura-100);
  border-radius: 10px;
  padding: 3px 12px;
}

/* ===== 学习数据 ===== */
.data-body {
  display: flex;
  align-items: center;
  gap: 22px;
}
.acc-ring { position: relative; width: 104px; height: 104px; flex-shrink: 0; }
.acc-ring svg { transform: rotate(-90deg); }
.acc-bg { stroke: var(--sakura-100); }
.acc-fg { stroke: url(#myAccGrad); stroke-linecap: round; transition: stroke-dashoffset 0.6s ease; }
.acc-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.acc-num { font-size: 25px; font-weight: 800; color: var(--sakura-600); line-height: 1; }
.acc-num small { font-size: 13px; }
.acc-label { font-size: 11px; color: var(--text-light); margin-top: 3px; }

.data-list { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.data-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 0;
}
.data-row + .data-row { border-top: 1px solid var(--line); }
.dr-label { font-size: 13px; color: var(--text-light); }
.dr-value { font-size: 19px; font-weight: 800; color: var(--sakura-600); }
.dr-value.good { color: var(--green); }
.dr-value.bad { color: var(--red); }

.data-progress { margin-top: 16px; }
.dp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-light);
  margin-bottom: 7px;
}
.dp-head b { color: var(--sakura-600); font-size: 13px; }
.dp-track { height: 8px; border-radius: 4px; background: var(--sakura-100); overflow: hidden; }
.dp-fill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--sakura-400), var(--sakura-600));
  transition: width 0.5s;
}

.data-link {
  width: 100%;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  transition: opacity 0.18s;
}
.data-link:hover { opacity: 0.78; }
.dl-icon {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: var(--green-soft);
}
.dl-text { flex: 1; min-width: 0; }
.dl-text b { display: block; font-size: 14px; font-weight: 700; color: var(--text); }
.dl-text small { display: block; font-size: 12px; color: var(--text-light); margin-top: 2px; }
.dl-arrow { font-size: 18px; color: var(--text-faint); }

/* ===== 文法进度 ===== */
.g-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.g-badge {
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  padding: 3px 10px;
  border-radius: 10px;
  background: linear-gradient(145deg, var(--sakura-400), var(--sakura-600));
}
.g-name { flex: 1; min-width: 0; font-size: 14px; font-weight: 700; color: var(--text); }
.g-pct { font-size: 13px; font-weight: 800; color: var(--sakura-600); }
.g-track { height: 10px; border-radius: 5px; background: var(--sakura-100); overflow: hidden; }
.g-fill {
  height: 100%;
  border-radius: 5px;
  background: linear-gradient(90deg, var(--sakura-400), var(--sakura-600));
  transition: width 0.4s;
}
.g-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-light);
}
.g-meta .g-marked { color: #e08a00; }
.g-meta .g-go { margin-left: auto; }

/* ===== 空态 ===== */
.empty-card { text-align: center; padding: 40px 20px; }
.empty-emoji { font-size: 40px; margin-bottom: 10px; }
.empty-title { font-size: 15px; font-weight: 700; color: var(--text); }
.empty-desc { font-size: 13px; color: var(--text-light); line-height: 1.7; margin: 8px auto 16px; max-width: 340px; }
.empty-inline { text-align: center; padding: 24px 16px; color: var(--text-light); font-size: 13px; line-height: 1.7; }
.empty-inline .empty-emoji { font-size: 32px; margin-bottom: 6px; }

/* ===== 错题 / 收藏 列表 ===== */
.tool-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.q-list { display: flex; flex-direction: column; gap: 12px; }
.q-item {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px 18px;
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: all 0.2s;
}
.q-item:hover {
  border-color: var(--sakura-300);
  transform: translateY(-2px);
  box-shadow: var(--card-float);
}
.q-top { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.q-state {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 12px;
}
.q-state.correct { color: var(--green); background: var(--green-soft); }
.q-state.wrong { color: var(--red); background: var(--red-soft); }
.q-del {
  margin-left: auto;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--red);
  background: var(--red-soft);
  transition: all 0.15s;
}
.q-del:hover { color: #fff; background: var(--red); transform: scale(1.08); }
.q-del.fav { font-size: 14px; background: transparent; }
.q-del.fav:hover { background: var(--sakura-100); transform: scale(1.12); }
.unit-tag { background: #fef0e6; color: #c47a3a; }
[data-theme="dark"] .unit-tag { background: #3a2c18; color: #e8b86d; }
.q-sentence { font-size: 15px; line-height: 1.7; color: var(--text); margin-bottom: 10px; }
.q-sentence :deep(u) {
  text-decoration: none;
  border-bottom: 2px solid var(--sakura-400);
  padding-bottom: 1px;
  color: var(--sakura-600);
  font-weight: 600;
}
.q-foot {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--text-light);
}
.q-time { margin-left: auto; color: var(--text-faint); }

/* ===== 管理员入口 ===== */
.admin-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  margin-top: 4px;
  border-radius: var(--radius);
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--text-light);
  font-size: 13px;
  transition: all 0.18s;
}
.admin-row:hover { border-color: var(--sakura-300); color: var(--sakura-600); }
.admin-icon { font-size: 16px; }
.admin-text { flex: 1; text-align: left; font-weight: 600; }
.admin-arrow { color: var(--text-faint); font-size: 16px; }

@media (max-width: 640px) {
  .profile-card { padding: 18px; }
  .profile-main { flex-wrap: wrap; }
  .profile-action { width: 100%; }
  .data-body { flex-direction: column; gap: 16px; }
  .data-list { width: 100%; }
  .q-time { margin-left: 0; }
}
</style>
