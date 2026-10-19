<template>
  <div class="container home">
    <!-- ==================== 今日 ==================== -->
    <section class="today-hero" v-reveal="'zoom'">
      <div class="today-head">
        <div class="greet">{{ greet() }}</div>
        <div class="streak" v-if="daily.streak.value > 0">
          <span class="streak-flame">🔥</span>
          <span>连续 {{ daily.streak.value }} 天</span>
        </div>
        <div class="streak first" v-else>
          <span class="streak-flame">🌱</span>
          <span>今天开始第一个学习日</span>
        </div>
      </div>

      <div class="today-main">
        <!-- 环形进度 -->
        <div class="ring-wrap">
          <div class="ring-halo" aria-hidden="true"></div>
          <svg width="140" height="140" viewBox="0 0 124 124">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ff9ec3" />
                <stop offset="55%" stop-color="#ff7aa2" />
                <stop offset="100%" stop-color="#e03e74" />
              </linearGradient>
              <linearGradient id="ringTrack" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="var(--sakura-100)" />
                <stop offset="100%" stop-color="var(--sakura-50)" />
              </linearGradient>
            </defs>
            <circle class="ring-bg" cx="62" cy="62" r="50" fill="none" stroke="url(#ringTrack)" stroke-width="11" />
            <circle class="ring-fg" cx="62" cy="62" r="50" fill="none" stroke="url(#ringGrad)" stroke-width="11"
              :stroke-dasharray="C" :stroke-dashoffset="ringOffset" />
          </svg>
          <div class="ring-center">
            <span class="ring-num">{{ displayPercent }}<small>%</small></span>
            <span class="ring-label">今日目标</span>
          </div>
        </div>

        <div class="today-side">
          <div class="today-chips">
            <span class="chip chip-quiz">
              <span class="chip-icon">📝</span>
              <span class="chip-text">答题 <b>{{ daily.todayQuiz.value }}</b>/{{ daily.state.settings.quizTarget }}</span>
            </span>
            <span class="chip chip-word">
              <span class="chip-icon">🌸</span>
              <span class="chip-text">背词 <b>{{ daily.todayWord.value }}</b>/{{ daily.state.settings.wordTarget }}</span>
            </span>
          </div>

          <div class="today-bars">
            <div class="bar-row">
              <span class="bar-tag">答题</span>
              <div class="bar-track"><div class="bar-fill" :style="{ width: quizPercent + '%' }"></div></div>
              <span class="bar-pct">{{ quizPercent }}%</span>
            </div>
            <div class="bar-row">
              <span class="bar-tag">背词</span>
              <div class="bar-track"><div class="bar-fill word" :style="{ width: wordPercent + '%' }"></div></div>
              <span class="bar-pct">{{ wordPercent }}%</span>
            </div>
          </div>

          <div class="week">
            <span class="week-title">近 7 天</span>
            <div class="week-bars">
              <span v-for="(d, i) in daily.weekActive.value" :key="d.date"
                class="week-bar" :class="{ on: d.active, today: i === 6 }"
                :style="{ height: weekHeight(d) + 'px' }"
                :title="d.date + (d.active ? ` · 答题 ${d.quiz} / 背词 ${d.word}` : ' · 未学习')"></span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 学习 ==================== -->
    <div class="section-title" v-reveal>学习</div>
    <div class="study-grid">
      <router-link to="/words" class="study-card sc-words" v-reveal="{ delay: 40 }">
        <div class="sc-body">
          <div class="sc-head">
            <span class="sc-icon">🌸</span>
            <div>
              <div class="sc-title">背词</div>
              <div class="sc-sub">红宝书 · 文字词汇</div>
            </div>
          </div>
          <div class="sc-tags">
            <span class="sc-tag">共 <b>{{ wordStats.total }}</b> 词</span>
            <span class="sc-tag hot" v-if="wordStats.due">待复习 <b>{{ wordStats.due }}</b></span>
            <span class="sc-tag" v-if="wordStats.notes">笔记 <b>{{ wordStats.notes }}</b></span>
          </div>
          <div class="sc-bar"><div class="sc-fill" :style="{ width: wordStats.pct + '%' }"></div></div>
          <div class="sc-foot">已学 {{ wordStats.learned }}/{{ wordStats.total }} · {{ wordStats.pct }}%</div>
        </div>
        <div class="sc-cover">
          <img src="./covers/vocabulary-red.svg" alt="红宝书 · 文字词汇" loading="lazy" />
        </div>
      </router-link>

      <router-link to="/study" class="study-card sc-grammar" v-reveal="{ delay: 110 }">
        <div class="sc-body">
          <div class="sc-head">
            <span class="sc-icon">📘</span>
            <div>
              <div class="sc-title">文法</div>
              <div class="sc-sub">蓝宝书 · 文法详解</div>
            </div>
          </div>
          <div class="sc-tags">
            <span class="sc-tag">{{ grammarStats.units }} 单元</span>
            <span class="sc-tag">共 {{ grammarStats.points }} 点</span>
            <span class="sc-tag hot" v-if="grammarStats.learned">已学 <b>{{ grammarStats.learned }}</b></span>
          </div>
          <div class="sc-bar iris"><div class="sc-fill" :style="{ width: grammarStats.pct + '%' }"></div></div>
          <div class="sc-foot">进度 {{ grammarStats.pct }}%</div>
        </div>
        <div class="sc-cover">
          <img src="./covers/grammar-blue.svg" alt="蓝宝书 · 文法详解" loading="lazy" />
        </div>
      </router-link>
    </div>

    <!-- ==================== 练习 ==================== -->
    <div class="section-title" v-reveal>练习</div>
    <div class="practice-grid">
      <router-link to="/learn?mode=bank" class="prac-card pc-quiz" v-reveal="{ delay: 40 }">
        <div class="pc-head">
          <span class="pc-icon">📝</span>
          <span class="pc-name">题库练习</span>
          <span class="pc-go">›</span>
        </div>
        <div class="pc-num">{{ quizStats.total || '—' }}<small>题</small></div>
        <div class="pc-foot" v-if="quizStats.total">
          <span v-if="quizStats.answered">已答 <b>{{ quizStats.answered }}</b> · 正确率 {{ quizStats.correctRate }}%</span>
          <span v-else>单元 / 顺序 / 随机</span>
        </div>
        <div class="pc-foot muted" v-else>题库补充中</div>
        <div class="pc-glow" aria-hidden="true"></div>
      </router-link>

      <router-link to="/learn?mode=mock" class="prac-card pc-mock" v-reveal="{ delay: 110 }">
        <div class="pc-head">
          <span class="pc-icon">🧪</span>
          <span class="pc-name">模拟测试</span>
          <span class="pc-go">›</span>
        </div>
        <div class="pc-num">{{ mockStats.count || '—' }}<small>套卷</small></div>
        <div class="pc-foot" v-if="mockStats.count && mockStats.done">已完成 <b>{{ mockStats.done }}</b> · 均分 {{ mockStats.avg }}</div>
        <div class="pc-foot" v-else-if="mockStats.count">全真模拟 · 成绩记录</div>
        <div class="pc-foot muted" v-else>即将上线</div>
        <div class="pc-glow" aria-hidden="true"></div>
      </router-link>
    </div>

    <div class="mini-grid">
      <router-link to="/reading" class="mini-card mc-reading" v-reveal="{ delay: 40 }">
        <img class="mini-cover" src="./covers/reading-orange.svg" alt="橙宝书 · 读解" loading="lazy" />
        <div class="mini-body">
          <b>读解</b>
          <span>橙宝书 · 阅读文章 + 解析</span>
        </div>
        <div class="mini-num">{{ readingCount }}<small>篇</small></div>
        <span class="mini-go">›</span>
      </router-link>

      <router-link to="/listening" class="mini-card mc-listening" v-reveal="{ delay: 110 }">
        <img class="mini-cover" src="./covers/listening-green.svg" alt="绿宝书 · 听解" loading="lazy" />
        <div class="mini-body">
          <b>听解</b>
          <span>绿宝书 · 单元练习 + 音频</span>
        </div>
        <div class="mini-num">{{ listeningCount }}<small>单元</small></div>
        <span class="mini-go">›</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDaily } from '../store/dailyStore'
import { useStore } from '../store/useStore'
import { useWordStore } from '../store/wordStore'
import { useGrammarStore } from '../store/grammarStore'
import { useLevel } from '../store/levelStore'
import { wordsByLevel } from '../data/words'
import { grammarLevels } from '../data/grammar'
import { levelQuestionsAll, hasQuizData, levelConfig, mockInfo } from '../data/questions'
import { readingN1 } from '../data/reading-n1'
import { readingN2 } from '../data/reading-n2'
import { listeningUnits as n2Listening } from '../data/listening'
import { listeningUnits as n1Listening } from '../data/listening-n1'
import { listeningUnits as n5Listening } from '../data/listening-n5'
import { listeningUnits as n4Listening } from '../data/listening-n4'
import { availableTypes } from '../composables/wordQuiz'
import { useCountUp } from '../composables/useMotion'

const daily = useDaily()
const store = useStore()
const wordStore = useWordStore()
const grammar = useGrammarStore()
const { level } = useLevel()

// ===== 背词卡 =====
const wordStats = computed(() => {
  const pool = wordsByLevel(level.value)
  const learned = pool.filter(w => wordStore.isLearned(w.id)).length
  // 与「背词」页同一套判定：待复习 = 已学 && 未背完(所有可用题型都做过) && 非熟词
  // 注意 isMastered 的第二个参数必须是「可用题型数组」（availableTypes 的返回值），
  // 早期这里误传了 doneTypes() 返回的 Set，会导致 Set.every 报错并让首页白屏。
  const due = pool.filter(w => wordStore.isLearned(w.id) && !wordStore.isMastered(w.id, availableTypes(w)) && !wordStore.isFamiliar(w.id)).length
  const notes = pool.filter(w => wordStore.hasNote(w.id)).length
  return {
    total: pool.length,
    learned,
    unseen: pool.length - learned,
    due,
    notes,
    pct: pool.length ? Math.round(learned / pool.length * 100) : 0,
  }
})

// ===== 文法卡 =====
const grammarStats = computed(() => {
  const g = grammarLevels.find(x => x.id === level.value)
  if (!g) return { units: 0, points: 0, learned: 0, pct: 0 }
  const points = g.units.flatMap(u => u.points || [])
  const learned = grammar.learnedCountOf(points)
  return {
    units: g.units?.length || 0,
    points: points.length,
    learned,
    pct: points.length ? Math.round(learned / points.length * 100) : 0,
  }
})

// ===== 题库卡 =====
const quizStats = computed(() => {
  const all = levelQuestionsAll(level.value)
  const total = all.length
  const answered = store.state.counts?.[level.value]?.answered || 0
  const correct = store.state.counts?.[level.value]?.correct || 0
  return {
    total: hasQuizData(level.value) ? total : 0,
    answered,
    correctRate: answered ? Math.round(correct / answered * 100) : null,
    pct: total ? Math.round(answered / total * 100) : 0,
  }
})

// ===== 模拟测试卡 =====
const mockStats = computed(() => {
  const count = levelConfig[level.value]?.mockCount || 0
  let done = 0, sum = 0
  for (const [k, v] of Object.entries(store.state.mockResults || {})) {
    if (k.startsWith(level.value + ':') && v) { done++; sum += (v.score || 0) }
  }
  return {
    count,
    done,
    avg: done ? Math.round(sum / done) : null,
    pct: count ? Math.round(done / count * 100) : 0,
  }
})

// ===== 读解 / 听解 =====
const readingCount = computed(() => (level.value === 'N1' ? readingN1 : readingN2).length)
const listeningCount = computed(() => ({
  N1: n1Listening,
  N2: n2Listening,
  N5: n5Listening,
  N4: n4Listening,
}[level.value] || n2Listening).length)

// 环周长：2 * π * 50
const C = 2 * Math.PI * 50

const totalPercent = computed(() => {
  const q = Math.min(1, daily.todayQuiz.value / (daily.state.settings.quizTarget || 1))
  const w = Math.min(1, daily.todayWord.value / (daily.state.settings.wordTarget || 1))
  return Math.round(((q + w) / 2) * 100)
})

// 首帧从 0 画到目标值（CSS transition 负责补间）
const ringDrawn = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { ringDrawn.value = true })
})
const ringOffset = computed(() => C - (C * (ringDrawn.value ? totalPercent.value : 0)) / 100)

// 数字滚动
const { display: displayPercent } = useCountUp(totalPercent, { duration: 1100, delay: 240 })

const quizPercent = computed(() => Math.min(100, Math.round(daily.todayQuiz.value / (daily.state.settings.quizTarget || 1) * 100)))
const wordPercent = computed(() => Math.min(100, Math.round(daily.todayWord.value / (daily.state.settings.wordTarget || 1) * 100)))

// 近 7 天柱高：按当天活动量归一化
function weekHeight(d) {
  const items = daily.weekActive.value || []
  const max = Math.max(1, ...items.map(x => (x.quiz || 0) + (x.word || 0)))
  const v = (d.quiz || 0) + (d.word || 0)
  return Math.round(6 + (v / max) * 30)
}

function greet() {
  const h = new Date().getHours()
  if (h < 5) return '夜深了，注意休息 🌙'
  if (h < 11) return '早上好，开启今日学习 ☀️'
  if (h < 14) return '中午好，休息一下再学吧 🍵'
  if (h < 18) return '下午好，继续加油 💪'
  return '晚上好，学完今天的内容吧 🌸'
}
</script>

<style scoped>
.home { max-width: 960px; }

/* ==================== 今日 ==================== */
.today-hero {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-xl);
  padding: 22px 26px 24px;
  margin-bottom: 8px;
  background:
    radial-gradient(120% 120% at 12% 0%, rgba(255, 255, 255, 0.68), transparent 58%),
    linear-gradient(135deg, rgba(255, 205, 224, 0.42), rgba(255, 240, 246, 0.14) 55%, rgba(214, 205, 255, 0.2));
  border: 1px solid var(--border);
  box-shadow: var(--card-float);
}
[data-theme="dark"] .today-hero {
  background:
    radial-gradient(120% 120% at 12% 0%, rgba(255, 255, 255, 0.06), transparent 58%),
    linear-gradient(135deg, rgba(224, 94, 142, 0.2), rgba(42, 26, 34, 0.1) 55%, rgba(124, 108, 240, 0.14));
}
.today-hero::after {
  content: '';
  position: absolute;
  right: -80px;
  top: -120px;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 122, 162, 0.28), transparent 68%);
  pointer-events: none;
}
.today-head {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.greet { font-size: 21px; font-weight: 800; color: var(--text); letter-spacing: 0.3px; text-align: center; }
.streak {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: var(--radius-pill);
  background: rgba(232, 184, 109, 0.2);
  color: #c8860f;
  font-size: 13px;
  font-weight: 700;
}
[data-theme="dark"] .streak { color: #e8b86d; }
.streak-flame { animation: flame 2.4s ease-in-out infinite; display: inline-block; }
@keyframes flame {
  0%, 100% { transform: scale(1) rotate(-3deg); }
  50% { transform: scale(1.14) rotate(4deg); }
}

.today-main {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 28px;
}

/* 环形进度 */
.ring-wrap {
  position: relative;
  width: 140px;
  height: 140px;
  flex-shrink: 0;
}
.ring-wrap svg { transform: rotate(-90deg); display: block; }
/* 轨道在粉色底上要能被看见：用半透明白而不是浅粉 */
.ring-bg { stroke: rgba(255, 255, 255, 0.72); }
[data-theme="dark"] .ring-bg { stroke: rgba(255, 255, 255, 0.14); }
.ring-fg {
  stroke-linecap: round;
  transition: stroke-dashoffset 1.15s var(--ease-out-expo);
  filter: drop-shadow(0 4px 10px rgba(224, 62, 116, 0.35));
}
.ring-halo {
  position: absolute;
  inset: 12px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 122, 162, 0.22), transparent 70%);
  animation: halo-pulse 3.6s var(--ease-soft) infinite;
}
@keyframes halo-pulse {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.06); }
}
.ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.ring-num {
  font-size: 34px;
  font-weight: 800;
  line-height: 1;
  color: var(--sakura-600);
  font-variant-numeric: tabular-nums;
  letter-spacing: -1px;
}
.ring-num small { font-size: 16px; margin-left: 1px; }
.ring-label { font-size: 11.5px; color: var(--text-light); margin-top: 4px; letter-spacing: 1px; }

.today-side { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 14px; }
.today-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--radius-pill);
  font-size: 12.5px;
  color: var(--text-light);
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.75);
  transition: transform var(--dur-2) var(--ease-spring);
}
[data-theme="dark"] .chip { background: rgba(255, 255, 255, 0.07); border-color: rgba(255, 255, 255, 0.08); }
.chip:hover { transform: translateY(-1px); }
.chip b { color: var(--sakura-600); font-size: 15px; font-variant-numeric: tabular-nums; }
.chip-icon { font-size: 14px; }

.today-bars { display: flex; flex-direction: column; gap: 8px; }
.bar-row { display: flex; align-items: center; gap: 10px; }
.bar-tag { font-size: 11.5px; color: var(--text-faint); width: 30px; flex-shrink: 0; }
.bar-track {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.6);
  overflow: hidden;
}
[data-theme="dark"] .bar-track { background: rgba(255, 255, 255, 0.09); }
.bar-fill {
  height: 100%;
  border-radius: 4px;
  background: var(--grad-sakura);
  transition: width var(--dur-4) var(--ease-out-expo);
}
.bar-fill.word { background: var(--grad-amber); }
.bar-pct { font-size: 11px; color: var(--text-faint); width: 32px; text-align: right; font-variant-numeric: tabular-nums; }

.week { display: flex; align-items: center; gap: 10px; }
.week-title { font-size: 11px; color: var(--text-faint); letter-spacing: 0.5px; flex-shrink: 0; }
.week-bars { display: flex; align-items: flex-end; gap: 6px; height: 38px; }
.week-bar {
  width: 14px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.55);
  transition: background var(--dur-3), transform var(--dur-3) var(--ease-spring);
  animation: week-in 700ms var(--ease-out-expo) backwards;
}
[data-theme="dark"] .week-bar { background: rgba(255, 255, 255, 0.1); }
.week-bar:nth-child(2) { animation-delay: 40ms; }
.week-bar:nth-child(3) { animation-delay: 80ms; }
.week-bar:nth-child(4) { animation-delay: 120ms; }
.week-bar:nth-child(5) { animation-delay: 160ms; }
.week-bar:nth-child(6) { animation-delay: 200ms; }
.week-bar:nth-child(7) { animation-delay: 240ms; }
@keyframes week-in { from { transform: scaleY(0.2); opacity: 0; } to { transform: scaleY(1); opacity: 1; } }
.week-bar.on { background: var(--grad-sakura); box-shadow: 0 3px 8px -2px rgba(224, 62, 116, 0.5); }
.week-bar.today { box-shadow: 0 0 0 2.5px var(--sakura-300); }

/* ==================== 学习 ==================== */
.study-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 6px;
}
.study-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 18px 16px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border);
  overflow: hidden;
  transition: transform var(--dur-3) var(--ease-out-expo), box-shadow var(--dur-3) var(--ease-out-expo), border-color var(--dur-3);
}
.sc-words {
  background: linear-gradient(135deg, rgba(255, 205, 224, 0.5), rgba(255, 240, 246, 0.22));
}
.sc-grammar {
  background: linear-gradient(135deg, rgba(199, 214, 255, 0.5), rgba(238, 243, 255, 0.22));
}
[data-theme="dark"] .sc-words { background: linear-gradient(135deg, rgba(224, 94, 142, 0.22), rgba(42, 26, 34, 0.12)); }
[data-theme="dark"] .sc-grammar { background: linear-gradient(135deg, rgba(106, 128, 221, 0.2), rgba(42, 29, 56, 0.12)); }
@media (hover: hover) and (pointer: fine) {
  .study-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--sakura-200); }
  .study-card:hover .sc-cover img { transform: rotateY(0deg) rotateX(0deg) translateY(-4px) scale(1.04); }
}
.study-card:active { transform: scale(0.99); }
.sc-body { flex: 1; min-width: 0; position: relative; z-index: 1; }
.sc-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.sc-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 4px 12px rgba(244, 92, 142, 0.16);
  flex-shrink: 0;
}
[data-theme="dark"] .sc-icon { background: rgba(255, 255, 255, 0.08); box-shadow: none; }
.sc-title { font-size: 18px; font-weight: 800; color: var(--text); letter-spacing: 0.5px; }
.sc-sub { font-size: 11.5px; color: var(--text-light); margin-top: 2px; }
.sc-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.sc-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.62);
  color: var(--text-light);
}
[data-theme="dark"] .sc-tag { background: rgba(255, 255, 255, 0.07); }
.sc-tag b { color: var(--sakura-600); }
.sc-tag.hot { background: #fff; color: var(--sakura-600); }
[data-theme="dark"] .sc-tag.hot { background: rgba(255, 255, 255, 0.12); color: var(--sakura-500); }
.sc-bar { height: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.55); overflow: hidden; }
[data-theme="dark"] .sc-bar { background: rgba(255, 255, 255, 0.09); }
.sc-fill {
  height: 100%;
  border-radius: 3px;
  background: var(--grad-sakura);
  transition: width var(--dur-5) var(--ease-out-expo);
}
.sc-bar.iris .sc-fill { background: var(--grad-iris); }
.sc-foot { font-size: 11px; color: var(--text-faint); margin-top: 7px; font-variant-numeric: tabular-nums; }

.sc-cover { flex-shrink: 0; width: 74px; perspective: 500px; }
.sc-cover img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 8px;
  transform: rotateY(-16deg) rotateX(4deg);
  transform-origin: left center;
  transition: transform var(--dur-4) var(--ease-out-expo);
  box-shadow: 0 10px 24px -8px rgba(60, 20, 40, 0.5);
}

/* ==================== 练习 ==================== */
.practice-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.prac-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-xl);
  padding: 18px 20px 16px;
  border: 1px solid var(--border);
  transition: transform var(--dur-3) var(--ease-out-expo), box-shadow var(--dur-3) var(--ease-out-expo);
}
.pc-quiz { background: linear-gradient(135deg, rgba(255, 216, 170, 0.52), rgba(255, 247, 230, 0.2)); }
.pc-mock { background: linear-gradient(135deg, rgba(172, 230, 200, 0.52), rgba(234, 250, 240, 0.2)); }
[data-theme="dark"] .pc-quiz { background: linear-gradient(135deg, rgba(217, 152, 61, 0.22), rgba(42, 34, 26, 0.1)); }
[data-theme="dark"] .pc-mock { background: linear-gradient(135deg, rgba(79, 187, 135, 0.22), rgba(29, 42, 36, 0.1)); }
@media (hover: hover) and (pointer: fine) {
  .prac-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
  .prac-card:hover .pc-go { transform: translateX(4px); }
  .prac-card:hover .pc-glow { opacity: 1; transform: scale(1.1); }
}
.prac-card:active { transform: scale(0.99); }
.pc-head { display: flex; align-items: center; gap: 8px; }
.pc-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.72);
}
[data-theme="dark"] .pc-icon { background: rgba(255, 255, 255, 0.1); }
.pc-name { font-size: 14.5px; font-weight: 800; color: var(--text); flex: 1; }
.pc-go { font-size: 18px; color: var(--text-faint); transition: transform var(--dur-2) var(--ease-out-expo); }
.pc-num {
  font-size: 42px;
  font-weight: 800;
  line-height: 1.1;
  margin-top: 8px;
  letter-spacing: -1px;
  background: linear-gradient(120deg, #ff9db8, #e03e74);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-variant-numeric: tabular-nums;
}
.pc-mock .pc-num {
  background: linear-gradient(120deg, #6fd3a0, #2ba66e);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
[data-theme="dark"] .pc-num { background: linear-gradient(120deg, #ff87ae, #e05e8e); -webkit-background-clip: text; background-clip: text; color: transparent; }
[data-theme="dark"] .pc-mock .pc-num { background: linear-gradient(120deg, #7fe0b0, #4cbf8c); -webkit-background-clip: text; background-clip: text; color: transparent; }
.pc-num small { font-size: 12px; font-weight: 600; margin-left: 4px; color: var(--text-light); -webkit-text-fill-color: var(--text-light); }
.pc-foot { font-size: 11.5px; color: var(--text-light); margin-top: 6px; }
.pc-foot b { color: var(--sakura-600); }
.pc-mock .pc-foot b { color: var(--green); }
.pc-foot.muted { color: var(--text-faint); }
.pc-glow {
  position: absolute;
  right: -40px;
  bottom: -50px;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.7), transparent 70%);
  opacity: 0.45;
  transition: opacity var(--dur-3), transform var(--dur-4) var(--ease-out-expo);
  pointer-events: none;
}
[data-theme="dark"] .pc-glow { background: radial-gradient(circle, rgba(255, 255, 255, 0.14), transparent 70%); }

/* ==================== 读解 / 听解 ==================== */
.mini-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.mini-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  overflow: hidden;
  transition: transform var(--dur-3) var(--ease-out-expo), box-shadow var(--dur-3) var(--ease-out-expo);
}
.mc-reading { background: linear-gradient(135deg, rgba(199, 221, 255, 0.46), rgba(238, 245, 255, 0.2)); }
.mc-listening { background: linear-gradient(135deg, rgba(222, 202, 255, 0.46), rgba(246, 239, 255, 0.2)); }
[data-theme="dark"] .mc-reading { background: linear-gradient(135deg, rgba(106, 128, 221, 0.2), rgba(29, 36, 52, 0.1)); }
[data-theme="dark"] .mc-listening { background: linear-gradient(135deg, rgba(150, 108, 220, 0.2), rgba(40, 30, 52, 0.1)); }
@media (hover: hover) and (pointer: fine) {
  .mini-card:hover { transform: translateY(-3px); box-shadow: var(--shadow); }
  .mini-card:hover .mini-go { transform: translateX(4px); }
}
.mini-card:active { transform: scale(0.99); }
.mini-cover {
  width: 38px;
  height: auto;
  border-radius: 5px;
  flex-shrink: 0;
  transform: rotate(-4deg);
  box-shadow: 0 6px 14px -6px rgba(60, 20, 40, 0.55);
  transition: transform var(--dur-4) var(--ease-spring);
}
@media (hover: hover) and (pointer: fine) {
  .mini-card:hover .mini-cover { transform: rotate(0deg) scale(1.06); }
}
.mini-body { flex: 1; min-width: 0; }
.mini-body b { display: block; font-size: 14.5px; font-weight: 800; color: var(--text); }
.mini-body span { display: block; font-size: 11px; color: var(--text-light); margin-top: 2px; }
.mini-num { font-size: 20px; font-weight: 800; color: var(--sakura-600); flex-shrink: 0; font-variant-numeric: tabular-nums; }
.mini-num small { font-size: 11px; color: var(--text-light); margin-left: 2px; }
.mini-go { font-size: 16px; color: var(--text-faint); flex-shrink: 0; transition: transform var(--dur-2) var(--ease-out-expo); }

/* ==================== 响应式 ==================== */
@media (max-width: 860px) {
  .study-grid, .practice-grid, .mini-grid { gap: 12px; }
  .today-main { gap: 18px; }
  .ring-wrap { width: 124px; height: 124px; }
  .ring-wrap svg { width: 124px; height: 124px; }
  .ring-num { font-size: 30px; }
}
@media (max-width: 760px) {
  .today-hero { padding: 18px 18px 20px; }
  .today-main { flex-direction: column; align-items: stretch; gap: 16px; }
  .ring-wrap { align-self: center; }
  .today-side { gap: 12px; }
  .study-grid, .practice-grid, .mini-grid { grid-template-columns: 1fr; }
  .greet { font-size: 19px; }
  .sc-cover { width: 62px; }
  .pc-num { font-size: 36px; }
}
@media (max-width: 420px) {
  .sc-cover { width: 54px; }
  .week-bar { width: 12px; }
}
@media (max-width: 340px) {
  .sc-cover { display: none; }
}
</style>
