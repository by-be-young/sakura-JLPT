<template>
  <div class="container">
    <!-- 今日学习卡片（居中布局） -->
    <div class="today-card">
      <div class="today-head">
        <div class="today-greet">{{ greet() }}</div>
        <div class="today-streak" v-if="daily.streak.value > 0">
          <span>🔥</span><span>连续学习 {{ daily.streak.value }} 天</span>
        </div>
        <div v-else class="today-streak today-first">
          <span>🌱</span><span>今天开始第一个学习日</span>
        </div>
      </div>

      <div class="ring-wrap">
        <svg width="124" height="124" viewBox="0 0 124 124">
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ff7aa2" />
              <stop offset="100%" stop-color="#e03e74" />
            </linearGradient>
          </defs>
          <circle class="ring-bg" cx="62" cy="62" r="50" fill="none" stroke-width="11" />
          <circle class="ring-fg" cx="62" cy="62" r="50" fill="none" stroke-width="11"
            :stroke-dasharray="C" :stroke-dashoffset="ringOffset" />
        </svg>
        <div class="ring-center">
          <span class="ring-num">{{ totalPercent }}<small>%</small></span>
          <span class="ring-label">今日目标</span>
        </div>
      </div>

      <div class="today-chips">
        <span class="today-label">📝 答题 <b>{{ daily.todayQuiz.value }}</b>/{{ daily.state.settings.quizTarget }}</span>
        <span class="today-label">🌸 背词 <b>{{ daily.todayWord.value }}</b>/{{ daily.state.settings.wordTarget }}</span>
      </div>

      <div class="today-bars">
        <div class="today-bar-item">
          <div class="bar-track"><div class="bar-fill" :style="{ width: quizPercent + '%' }"></div></div>
        </div>
        <div class="today-bar-item">
          <div class="bar-track"><div class="bar-fill word" :style="{ width: wordPercent + '%' }"></div></div>
        </div>
      </div>

      <div class="today-week">
        <span class="week-title">近 7 天</span>
        <span class="week-dots">
          <span v-for="(d, i) in daily.weekActive.value" :key="d.date" class="week-dot"
            :class="{ on: d.active, today: i === 6 }" :title="d.date + (d.active ? ' · 已学习' : '')"></span>
        </span>
      </div>
    </div>

    <!-- 学习板块 -->
    <div class="section-title">学习</div>
    <div class="primary-card words-card" @click="$router.push('/words')">
      <div class="pc-left">
        <span class="pc-icon">🌸</span>
        <div class="pc-text">
          <div class="pc-title">背词</div>
          <div class="pc-sub">词汇卡片 · 复习 · 笔记</div>
          <div class="pc-tags">
            <span class="pc-tag" v-if="wordStats.total">共 <b>{{ wordStats.total }}</b> 词</span>
            <span class="pc-tag hot" v-if="wordStats.due">复习 <b>{{ wordStats.due }}</b></span>
            <span class="pc-tag" v-if="wordStats.notes">笔记 <b>{{ wordStats.notes }}</b></span>
          </div>
        </div>
      </div>
      <div class="pc-right">
        <div class="pc-ring">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="7" />
            <circle cx="36" cy="36" r="30" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"
              :stroke-dasharray="wordRingC" :stroke-dashoffset="wordRingOffset" transform="rotate(-90 36 36)" />
          </svg>
          <div class="pc-ring-num">{{ wordStats.pct }}%</div>
        </div>
        <div class="pc-ring-label">已学 {{ wordStats.learned }}/{{ wordStats.total }}</div>
      </div>
    </div>

    <div class="primary-card grammar-card" @click="$router.push('/study')">
      <div class="pc-left">
        <span class="pc-icon">📘</span>
        <div class="pc-text">
          <div class="pc-title">文法</div>
          <div class="pc-sub">文法详解 · 例句学习</div>
          <div class="pc-tags">
            <span class="pc-tag">{{ grammarStats.units }} 单元</span>
            <span class="pc-tag" v-if="grammarStats.learned">已学 <b>{{ grammarStats.learned }}</b></span>
          </div>
        </div>
      </div>
      <div class="pc-right">
        <div class="pc-big-num">{{ grammarStats.points }}</div>
        <div class="pc-big-label">语法点</div>
        <div class="pc-mini-bar"><div class="pc-mini-fill" :style="{ width: grammarStats.pct + '%' }"></div></div>
      </div>
    </div>

    <!-- 练习板块 -->
    <div class="section-title">练习</div>
    <div class="practice-zone">
      <div class="num-card quiz-card" @click="$router.push({ path: '/learn', query: { mode: 'bank' } })">
        <div class="nc-head">
          <span class="nc-icon">📝</span>
          <span class="nc-name">题库练习</span>
          <span class="nc-go">›</span>
        </div>
        <div class="nc-body">
          <div class="nc-num">{{ quizStats.total || '—' }}</div>
          <div class="nc-unit">道题</div>
          <div class="nc-foot" v-if="quizStats.total">
            <span v-if="quizStats.answered">已答 <b>{{ quizStats.answered }}</b> · 正确率 {{ quizStats.correctRate }}%</span>
            <span v-else>单元 / 顺序 / 随机</span>
          </div>
          <div class="nc-foot" v-else>题库补充中</div>
        </div>
      </div>

      <div class="num-card mock-card" @click="$router.push({ path: '/learn', query: { mode: 'mock' } })">
        <div class="nc-head">
          <span class="nc-icon">🧪</span>
          <span class="nc-name">模拟测试</span>
          <span class="nc-go">›</span>
        </div>
        <div class="nc-body">
          <div class="nc-num">{{ mockStats.count || '—' }}</div>
          <div class="nc-unit">套模拟卷</div>
          <div class="nc-foot">
            <span v-if="mockStats.count && mockStats.done">已完成 <b>{{ mockStats.done }}</b> · 均分 {{ mockStats.avg }}</span>
            <span v-else-if="mockStats.count">全真模拟 · 成绩记录</span>
            <span v-else>即将上线</span>
          </div>
        </div>
      </div>

      <div class="split-row">
        <div class="split-item reading-split" @click="$router.push('/reading')">
          <span class="si-icon">📖</span>
          <div class="si-text">
            <b>读解</b>
            <span>阅读文章 · 答题解析</span>
          </div>
          <div class="si-num">{{ readingCount }}<small>篇</small></div>
          <span class="si-go">›</span>
        </div>
        <div class="split-item listening-split" @click="$router.push('/listening')">
          <span class="si-icon">🎧</span>
          <div class="si-text">
            <b>听解</b>
            <span>听力练习 · 音频播放</span>
          </div>
          <div class="si-num">{{ listeningCount }}<small>单元</small></div>
          <span class="si-go">›</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
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

const daily = useDaily()
const store = useStore()
const wordStore = useWordStore()
const grammar = useGrammarStore()
const { level } = useLevel()

// ===== 背词卡 =====
const wordStats = computed(() => {
  const pool = wordsByLevel(level.value)
  const learned = pool.filter(w => wordStore.isLearned(w.id)).length
  const due = pool.filter(w => wordStore.isLearned(w.id) && !wordStore.isMastered(w.id, wordStore.doneTypes(w.id)) && !wordStore.isFamiliar(w.id)).length
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
const listeningCount = computed(() => (level.value === 'N1' ? n1Listening : n2Listening).length)

// 环周长：2 * π * 46
const C = 2 * Math.PI * 46

// 背词主卡迷你进度环
const wordRingC = 2 * Math.PI * 30

const wordRingOffset = computed(() => wordRingC - (wordRingC * wordStats.value.pct) / 100)

const totalPercent = computed(() => {
  const q = Math.min(1, daily.todayQuiz.value / (daily.state.settings.quizTarget || 1))
  const w = Math.min(1, daily.todayWord.value / (daily.state.settings.wordTarget || 1))
  return Math.round(((q + w) / 2) * 100)
})

const ringOffset = computed(() => C - (C * totalPercent.value) / 100)

const quizPercent = computed(() => Math.min(100, Math.round(daily.todayQuiz.value / (daily.state.settings.quizTarget || 1) * 100)))
const wordPercent = computed(() => Math.min(100, Math.round(daily.todayWord.value / (daily.state.settings.wordTarget || 1) * 100)))

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
.level-sel { margin-bottom: 18px; }

/* 今日卡片：居中信息层级 */
.today-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 6px 2px 16px;
  margin-bottom: 16px;
}
.today-head { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.today-week { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-top: 4px; }
.week-title { font-size: 11px; color: var(--text-faint); letter-spacing: 1px; }
.week-dots { display: flex; gap: 6px; }
.week-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--sakura-100);
  transition: all 0.2s;
}
.week-dot.on { background: linear-gradient(145deg, var(--sakura-400), var(--sakura-600)); }
.week-dot.today { box-shadow: 0 0 0 3.5px var(--sakura-300); }
.today-chips { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
.today-bars { display: flex; flex-direction: column; gap: 8px; width: min(420px, 88%); }
.today-bar-item .bar-head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-light);
  margin-bottom: 4px;
}
.today-bar-item .bar-head b { color: var(--sakura-600); }
.bar-track { height: 6px; background: var(--sakura-100); border-radius: 3px; overflow: hidden; }
.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--sakura-400), var(--sakura-600));
  border-radius: 3px;
  transition: width 0.5s;
}
.bar-fill.word { background: linear-gradient(90deg, #e8b86d, #d99a3d); }
.today-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 2px; }

/* ===== 学习区：全宽主卡（排版差异化） ===== */
.primary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-radius: 22px;
  padding: 20px 22px;
  margin-bottom: 14px;
  cursor: pointer;
  transition: all 0.25s;
  position: relative;
  overflow: hidden;
}
.primary-card:hover { transform: translateY(-2px); }
.words-card {
  background: linear-gradient(135deg, rgba(255, 205, 224, 0.42), rgba(255, 240, 246, 0.18));
}
.words-card::after {
  content: '🌸';
  position: absolute;
  right: -14px;
  bottom: -20px;
  font-size: 96px;
  opacity: 0.1;
  transform: rotate(-12deg);
}
.grammar-card {
  background: linear-gradient(135deg, rgba(209, 222, 250, 0.4), rgba(238, 243, 255, 0.14));
}
[data-theme="dark"] .words-card {
  background: linear-gradient(135deg, rgba(224, 94, 142, 0.2), rgba(42, 26, 34, 0.12));
}
[data-theme="dark"] .grammar-card {
  background: linear-gradient(135deg, rgba(106, 128, 221, 0.18), rgba(42, 29, 56, 0.12));
}
.pc-left { display: flex; align-items: center; gap: 15px; position: relative; z-index: 1; min-width: 0; }
.pc-icon {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 14px rgba(244, 92, 142, 0.14);
}
.grammar-card .pc-icon {
  background: rgba(255, 255, 255, 0.65);
  box-shadow: 0 6px 16px rgba(70, 100, 200, 0.12);
}
[data-theme="dark"] .pc-icon { background: rgba(255, 255, 255, 0.07); box-shadow: none; }
.pc-text { min-width: 0; }
.pc-title { font-size: 19px; font-weight: 800; letter-spacing: 0.5px; }
.pc-sub { font-size: 12px; opacity: 0.8; margin-top: 3px; color: var(--text-light); }
.pc-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.pc-tag {
  font-size: 11px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.55);
  color: var(--text-light);
  border-radius: 20px;
  padding: 3px 11px;
}
.pc-tag.hot { background: #fff; color: var(--sakura-600); }
[data-theme="dark"] .pc-tag { background: rgba(255, 255, 255, 0.06); color: var(--text-light); }
[data-theme="dark"] .pc-tag.hot { background: rgba(255, 255, 255, 0.1); color: var(--sakura-500); }
.pc-right { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; position: relative; z-index: 1; flex-shrink: 0; }
.pc-ring { position: relative; width: 72px; height: 72px; }
.pc-ring-num {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 800;
  color: var(--sakura-600);
}
[data-theme="dark"] .pc-ring-num { color: var(--sakura-500); }
.pc-ring-label { font-size: 11px; color: var(--text-light); }
.pc-big-num {
  font-size: 42px;
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(120deg, #6a86d6, #4a5fc0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
[data-theme="dark"] .pc-big-num {
  background: linear-gradient(120deg, #93a8ec, #6a80dd);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.pc-big-label { font-size: 11px; color: var(--text-light); }
.pc-mini-bar { width: 92px; height: 6px; border-radius: 3px; background: rgba(122, 138, 190, 0.18); overflow: hidden; margin-top: 3px; }
.pc-mini-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #7d97e8, #4a5fc0);
  transition: width 0.5s;
}
[data-theme="dark"] .pc-mini-bar { background: rgba(255, 255, 255, 0.1); }

/* ===== 练习区：大数字卡 + 横通分割条 ===== */
.practice-zone { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.num-card {
  border-radius: 20px;
  padding: 18px;
  cursor: pointer;
  transition: all 0.22s;
  display: flex;
  flex-direction: column;
}
.quiz-card {
  background: linear-gradient(135deg, rgba(255, 216, 170, 0.5), rgba(255, 247, 230, 0.2));
}
.mock-card {
  background: linear-gradient(135deg, rgba(172, 230, 200, 0.5), rgba(234, 250, 240, 0.2));
}
[data-theme="dark"] .quiz-card { background: linear-gradient(135deg, rgba(217, 152, 61, 0.2), rgba(42, 34, 26, 0.1)); }
[data-theme="dark"] .mock-card { background: linear-gradient(135deg, rgba(79, 187, 135, 0.2), rgba(29, 42, 36, 0.1)); }
.num-card:hover { transform: translateY(-3px); }
.nc-head { display: flex; align-items: center; gap: 8px; }
.nc-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
}
.quiz-card .nc-icon { background: #fff3e0; }
.mock-card .nc-icon { background: #e4f7ec; }
[data-theme="dark"] .quiz-card .nc-icon { background: rgba(255, 255, 255, 0.08); }
[data-theme="dark"] .mock-card .nc-icon { background: rgba(255, 255, 255, 0.08); }
.nc-name { font-size: 14.5px; font-weight: 800; color: var(--text); flex: 1; }
.nc-go { font-size: 18px; color: var(--text-faint); }
.nc-body { margin-top: 12px; display: flex; flex-direction: column; align-items: flex-start; }
.nc-num {
  font-size: 40px;
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(120deg, #ff9db8, #e03e74);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.mock-card .nc-num {
  background: linear-gradient(120deg, #6fd3a0, #2ba66e);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
[data-theme="dark"] .nc-num {
  background: linear-gradient(120deg, #ff87ae, #e05e8e);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
[data-theme="dark"] .mock-card .nc-num {
  background: linear-gradient(120deg, #7fe0b0, #4cbf8c);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.nc-unit { font-size: 11px; color: var(--text-light); margin-top: 3px; }
.nc-foot { font-size: 11.5px; color: var(--text-light); margin-top: 10px; line-height: 1.5; }
.nc-foot b { color: var(--sakura-600); }
.mock-card .nc-foot b { color: var(--green); }

.split-row {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-radius: 20px;
  overflow: hidden;
}
.split-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 18px;
  cursor: pointer;
  transition: background 0.18s;
}
.reading-split {
  background: linear-gradient(135deg, rgba(199, 221, 255, 0.5), rgba(238, 245, 255, 0.2));
}
.listening-split {
  background: linear-gradient(135deg, rgba(222, 202, 255, 0.5), rgba(246, 239, 255, 0.2));
}
[data-theme="dark"] .reading-split { background: linear-gradient(135deg, rgba(106, 128, 221, 0.18), rgba(29, 36, 52, 0.1)); }
[data-theme="dark"] .listening-split { background: linear-gradient(135deg, rgba(150, 108, 220, 0.18), rgba(40, 30, 52, 0.1)); }
.split-item:hover { background: rgba(255, 255, 255, 0.45); }
[data-theme="dark"] .split-item:hover { background: rgba(255, 255, 255, 0.05); }
.split-item + .split-item { border-left: 1px solid var(--line); }
.si-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.reading-split .si-icon { background: linear-gradient(145deg, #eef5ff, #dcebff); }
.listening-split .si-icon { background: linear-gradient(145deg, #f6efff, #e9dcff); }
[data-theme="dark"] .si-icon { background: rgba(255, 255, 255, 0.08); }
.si-text { flex: 1; min-width: 0; }
.si-text b { font-size: 14.5px; font-weight: 800; color: var(--text); display: block; }
.si-text span { font-size: 11px; color: var(--text-light); display: block; margin-top: 2px; }
.si-num { font-size: 22px; font-weight: 800; color: var(--sakura-600); flex-shrink: 0; }
.si-num small { font-size: 11px; font-weight: 600; color: var(--text-light); margin-left: 2px; }
.si-go { font-size: 16px; color: var(--text-faint); flex-shrink: 0; }

@media (max-width: 760px) {
  .practice-zone { grid-template-columns: 1fr; gap: 12px; }
  .split-row { grid-template-columns: 1fr 1fr; }
  .primary-card { padding: 16px 18px; }
  .pc-icon { width: 46px; height: 46px; font-size: 22px; border-radius: 14px; }
  .pc-big-num { font-size: 34px; }
}
@media (max-width: 420px) {
  .split-row { grid-template-columns: 1fr; }
  .split-item + .split-item { border-left: none; border-top: 1px solid var(--border); }
  .pc-tag.hot { order: -1; }
}
</style>
