<template>
  <div class="container home">
    <!-- ==================== 今日 · 学习仪表盘 ==================== -->
    <section class="dayboard" v-reveal="'zoom'">
      <div class="day-left">
        <div class="day-meta">
          <span class="day-date">{{ dateLabel }}</span>
          <span class="meta-dot"></span>
          <span>{{ weekdayLabel }}</span>
          <span class="level-chip">{{ level }}</span>
        </div>

        <h1 class="day-greet">{{ greet() }}</h1>
        <p class="day-sub">把今天的一小步，留给明天的自己。</p>

        <div class="streak-pill" :class="{ quiet: !daily.streak.value }">
          <span class="streak-mark" aria-hidden="true"></span>
          <span v-if="daily.streak.value">连续学习 <b>{{ daily.streak.value }}</b> 天</span>
          <span v-else>从今天开始记录</span>
        </div>
      </div>

      <div class="day-right">
        <div class="goal-ring">
          <div class="ring-halo" aria-hidden="true"></div>
          <svg viewBox="0 0 124 124" aria-hidden="true">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffa6c4" />
                <stop offset="55%" stop-color="#ff7aa2" />
                <stop offset="100%" stop-color="#d93469" />
              </linearGradient>
            </defs>
            <circle class="ring-track" cx="62" cy="62" r="50" fill="none" stroke-width="10" />
            <circle class="ring-value" cx="62" cy="62" r="50" fill="none" stroke="url(#ringGrad)" stroke-width="10"
              :stroke-dasharray="C" :stroke-dashoffset="ringOffset" />
          </svg>
          <div class="ring-copy">
            <span class="ring-num">{{ displayPercent }}<small>%</small></span>
            <span class="ring-label">今日目标</span>
          </div>
        </div>

        <div class="day-meters">
          <div class="meter">
            <div class="meter-head">
              <span>答题</span>
              <b>{{ daily.todayQuiz.value }}<i>/ {{ daily.state.settings.quizTarget }}</i></b>
            </div>
            <div class="meter-track"><span :style="{ width: quizPercent + '%' }"></span></div>
          </div>

          <div class="meter">
            <div class="meter-head">
              <span>背词</span>
              <b>{{ daily.todayWord.value }}<i>/ {{ daily.state.settings.wordTarget }}</i></b>
            </div>
            <div class="meter-track word"><span :style="{ width: wordPercent + '%' }"></span></div>
          </div>
        </div>

        <div class="week">
          <div class="week-head">
            <span>近 7 天</span>
            <em>{{ activeDays }} 天有学习</em>
          </div>
          <div class="week-bars">
            <span v-for="(d, i) in daily.weekActive.value" :key="d.date"
              class="week-bar" :class="{ on: d.active, today: i === 6 }"
              :style="{ height: weekHeight(d) + 'px' }"
              :title="d.date + (d.active ? ` · 答题 ${d.quiz} / 背词 ${d.word}` : ' · 未学习')"></span>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 01 学习 ==================== -->
    <section class="block">
      <header class="block-head" v-reveal>
        <span class="block-index">01</span>
        <div class="block-copy">
          <h2>学习</h2>
          <p>两本教材，两条主线</p>
        </div>
        <span class="block-line"></span>
      </header>

      <div class="study-grid">
        <router-link to="/words" class="book-card words" v-reveal="{ delay: 40 }">
          <div class="book-text">
            <div class="book-kicker">文字・語彙 <span>VOCABULARY</span></div>
            <h3>背词</h3>
            <p class="book-sub">红宝书 · 文字词汇</p>

            <div class="book-metrics">
              <div><b>{{ wordStats.total }}</b><span>总词数</span></div>
              <div><b>{{ wordStats.learned }}</b><span>已学</span></div>
              <div><b>{{ wordStats.due }}</b><span>待复习</span></div>
            </div>

            <div class="book-bar"><span :style="{ width: wordStats.pct + '%' }"></span></div>
            <div class="book-foot">
              <span>进度 {{ wordStats.pct }}%</span>
              <span class="book-link">开始学习 <i>→</i></span>
            </div>
          </div>
          <div class="book-cover">
            <img src="./covers/vocabulary-red.svg" alt="红宝书 · 文字词汇" loading="eager" />
          </div>
        </router-link>

        <router-link to="/study" class="book-card grammar" v-reveal="{ delay: 110 }">
          <div class="book-text">
            <div class="book-kicker">文法 <span>GRAMMAR</span></div>
            <h3>文法</h3>
            <p class="book-sub">蓝宝书 · 文法详解</p>

            <div class="book-metrics">
              <div><b>{{ grammarStats.units }}</b><span>单元</span></div>
              <div><b>{{ grammarStats.points }}</b><span>知识点</span></div>
              <div><b>{{ grammarStats.learned }}</b><span>已掌握</span></div>
            </div>

            <div class="book-bar"><span :style="{ width: grammarStats.pct + '%' }"></span></div>
            <div class="book-foot">
              <span>进度 {{ grammarStats.pct }}%</span>
              <span class="book-link">开始学习 <i>→</i></span>
            </div>
          </div>
          <div class="book-cover">
            <img src="./covers/grammar-blue.svg" alt="蓝宝书 · 文法详解" loading="eager" />
          </div>
        </router-link>
      </div>
    </section>

    <!-- ==================== 02 练习 · 红蓝宝书 ==================== -->
    <section class="block">
      <header class="block-head" v-reveal>
        <span class="block-index">02</span>
        <div class="block-copy">
          <h2>练习</h2>
          <p>《红蓝宝书》题库与模拟</p>
        </div>
        <span class="block-line"></span>
      </header>

      <div class="series-panel" v-reveal="{ delay: 40 }">
        <div class="series-head">
          <div class="book-pair" aria-hidden="true">
            <img class="pair-red" src="./covers/vocabulary-red.svg" alt="" loading="eager" />
            <img class="pair-blue" src="./covers/grammar-blue.svg" alt="" loading="eager" />
            <span class="pair-band">合本</span>
          </div>
          <div class="series-copy">
            <div class="series-eyebrow">JLPT 备考系列</div>
            <h3>《红蓝宝书》</h3>
            <p>题库练习与模拟测试同属《红蓝宝书》系列，文字・語彙・文法一并覆盖。</p>
          </div>
          <div class="series-facts">
            <div><b>{{ quizStats.total || '—' }}</b><span>题库题量</span></div>
            <div><b>{{ mockStats.count || '—' }}</b><span>模拟套卷</span></div>
          </div>
        </div>

        <div class="series-cards">
          <router-link to="/learn?mode=bank" class="series-card" v-reveal="{ delay: 80 }">
            <div class="series-card-top">
              <span class="series-tag">《红蓝宝书》题库</span>
              <span class="series-no">01</span>
            </div>
            <div class="series-card-main">
              <div class="series-card-copy">
                <h4>题库练习</h4>
                <p>顺序 · 随机 · 单元三种方式，按自己的节奏逐题推进。</p>
              </div>
              <div class="series-num">{{ quizStats.total || '—' }}<small>题</small></div>
            </div>
            <div class="series-bar">
              <div class="series-bar-track"><span :style="{ width: quizStats.pct + '%' }"></span></div>
              <em>{{ quizStats.pct }}%</em>
            </div>
            <div class="series-foot">
              <span v-if="quizStats.answered">已答 <b>{{ quizStats.answered }}</b> 题 · 正确率 {{ quizStats.correctRate === null ? '—' : quizStats.correctRate + '%' }}</span>
              <span v-else>尚未开始 · 先做一题试试</span>
              <span class="series-enter">进入题库 <i>→</i></span>
            </div>
          </router-link>

          <router-link to="/learn?mode=mock" class="series-card" v-reveal="{ delay: 150 }">
            <div class="series-card-top">
              <span class="series-tag">《红蓝宝书》模拟</span>
              <span class="series-no">02</span>
            </div>
            <div class="series-card-main">
              <div class="series-card-copy">
                <h4>模拟测试</h4>
                <p>按回次完整作答，用一套卷子检验真实水平。</p>
              </div>
              <div class="series-num">{{ mockStats.count || '—' }}<small>套</small></div>
            </div>
            <div class="series-bar">
              <div class="series-bar-track"><span :style="{ width: mockStats.pct + '%' }"></span></div>
              <em>{{ mockStats.pct }}%</em>
            </div>
            <div class="series-foot">
              <span v-if="mockStats.done">已完成 <b>{{ mockStats.done }}</b> 套 · 均分 {{ mockStats.avg }}</span>
              <span v-else-if="mockStats.count">尚未作答 · 全真模拟</span>
              <span v-else>本级模拟卷即将上线</span>
              <span class="series-enter">开始模拟 <i>→</i></span>
            </div>
          </router-link>
        </div>
      </div>
    </section>

    <!-- ==================== 03 专项 ==================== -->
    <section class="block">
      <header class="block-head" v-reveal>
        <span class="block-index">03</span>
        <div class="block-copy">
          <h2>专项</h2>
          <p>真题与单项能力训练</p>
        </div>
        <span class="block-line"></span>
      </header>

      <div class="extra-grid">
        <router-link to="/exam" class="extra-card exam" v-reveal="{ delay: 40 }">
          <div class="extra-top"><span class="extra-label">真题</span><span class="extra-arrow">↗</span></div>
          <h3>整卷真题</h3>
          <p>{{ level }} · 按套练习</p>
          <div class="extra-num">{{ examCount }}<small>题</small></div>
        </router-link>

        <router-link to="/reading" class="extra-card reading" :class="{ disabled: !readingAvailable }"
          @click="readingAvailable ? null : $event.preventDefault()" v-reveal="{ delay: 100 }">
          <div class="extra-top"><span class="extra-label">读解</span><span class="extra-arrow">↗</span></div>
          <h3>阅读训练</h3>
          <p>{{ readingAvailable ? '橙宝书 · 文章与解析' : '本级读解内容待补充' }}</p>
          <div class="extra-num">{{ readingAvailable ? readingCount : '—' }}<small>篇</small></div>
        </router-link>

        <router-link to="/listening" class="extra-card listening" v-reveal="{ delay: 160 }">
          <div class="extra-top"><span class="extra-label">听解</span><span class="extra-arrow">↗</span></div>
          <h3>听力单元</h3>
          <p>绿宝书 · 单元与音频</p>
          <div class="extra-num">{{ listeningCount }}<small>单元</small></div>
        </router-link>

        <router-link to="/supplement" class="extra-card supplement" :class="{ disabled: !supStats.total }"
          @click="supStats.total ? null : $event.preventDefault()" v-reveal="{ delay: 220 }">
          <div class="extra-top"><span class="extra-label">补充</span><span class="extra-arrow">↗</span></div>
          <h3>补充题库</h3>
          <p>非红蓝宝书 · 独立统计</p>
          <div class="extra-num">{{ supStats.total || '—' }}<small>题</small></div>
        </router-link>
      </div>
    </section>
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
import { levelQuestionsAll, hasQuizData, levelConfig, levelPackQuestions } from '../data/questions'
import { readingN1 } from '../data/reading-n1'
import { readingN2 } from '../data/reading-n2'
import { supplementStatsOfLevel } from '../data/supplement'
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

// ===== 日期 =====
const now = new Date()
const dateLabel = `${now.getMonth() + 1}月${now.getDate()}日`
const weekdayLabel = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()]

// ===== 背词卡 =====
const wordStats = computed(() => {
  const pool = wordsByLevel(level.value)
  const learned = pool.filter(w => wordStore.isLearned(w.id)).length
  const due = pool.filter(w => wordStore.isLearned(w.id) && !wordStore.isMastered(w.id, availableTypes(w)) && !wordStore.isFamiliar(w.id)).length
  return {
    total: pool.length,
    learned,
    due,
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

// ===== 真题 / 读解 / 听解 =====
const examCount = computed(() => levelPackQuestions(level.value).length)
const readingAvailable = computed(() => level.value === 'N1' || level.value === 'N2')
const readingCount = computed(() => {
  if (level.value === 'N1') return readingN1.length
  if (level.value === 'N2') return readingN2.length
  return 0
})
const listeningCount = computed(() => ({
  N1: n1Listening,
  N2: n2Listening,
  N5: n5Listening,
  N4: n4Listening,
}[level.value] || n2Listening).length)

// ===== 补充题库（独立于红蓝宝书）=====
const supStats = computed(() => {
  const s = supplementStatsOfLevel(level.value, store.state.answered)
  return { total: s.total, done: s.done, pct: s.pct }
})

// ===== 今日目标 =====
const C = 2 * Math.PI * 50

const totalPercent = computed(() => {
  const q = Math.min(1, daily.todayQuiz.value / (daily.state.settings.quizTarget || 1))
  const w = Math.min(1, daily.todayWord.value / (daily.state.settings.wordTarget || 1))
  return Math.round(((q + w) / 2) * 100)
})

const ringDrawn = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { ringDrawn.value = true })
})
const ringOffset = computed(() => C - (C * (ringDrawn.value ? totalPercent.value : 0)) / 100)

const { display: displayPercent } = useCountUp(totalPercent, { duration: 1100, delay: 240 })

const quizPercent = computed(() => Math.min(100, Math.round(daily.todayQuiz.value / (daily.state.settings.quizTarget || 1) * 100)))
const wordPercent = computed(() => Math.min(100, Math.round(daily.todayWord.value / (daily.state.settings.wordTarget || 1) * 100)))
const activeDays = computed(() => (daily.weekActive.value || []).filter(d => d.active).length)

function weekHeight(d) {
  const items = daily.weekActive.value || []
  const max = Math.max(1, ...items.map(x => (x.quiz || 0) + (x.word || 0)))
  const v = (d.quiz || 0) + (d.word || 0)
  return Math.round(6 + (v / max) * 28)
}

function greet() {
  const h = new Date().getHours()
  if (h < 5) return '夜深了，早些休息'
  if (h < 11) return '早上好，开始今天的学习'
  if (h < 14) return '中午好，休息片刻再继续'
  if (h < 18) return '下午好，保持自己的节奏'
  return '晚上好，完成今天的一页'
}
</script>

<style scoped>
.home { max-width: 1000px; }

/* ==================== 今日仪表盘 ==================== */
.dayboard {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
  gap: 28px;
  padding: 34px 34px 30px;
  border-radius: 28px;
  border: 1px solid var(--border);
  background:
    radial-gradient(90% 140% at 0% 0%, rgba(255, 255, 255, 0.8), transparent 58%),
    linear-gradient(115deg, rgba(255, 232, 239, 0.82) 0%, rgba(255, 248, 240, 0.7) 52%, rgba(247, 238, 255, 0.55) 100%);
  box-shadow: var(--card-float);
  overflow: hidden;
}
[data-theme="dark"] .dayboard {
  background:
    radial-gradient(90% 140% at 0% 0%, rgba(255, 255, 255, 0.06), transparent 58%),
    linear-gradient(115deg, rgba(224, 94, 142, 0.16) 0%, rgba(54, 36, 42, 0.22) 52%, rgba(124, 108, 240, 0.12) 100%);
}
.dayboard::after {
  content: '学習';
  position: absolute;
  right: 30px;
  bottom: -34px;
  font-family: 'Noto Serif SC', serif;
  font-size: 116px;
  font-weight: 700;
  letter-spacing: 8px;
  color: rgba(224, 62, 116, 0.06);
  pointer-events: none;
  line-height: 1;
}
[data-theme="dark"] .dayboard::after { color: rgba(255, 255, 255, 0.04); }

.day-left { position: relative; z-index: 1; min-width: 0; }
.day-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11.5px;
  letter-spacing: 0.8px;
  color: var(--text-light);
  font-variant-numeric: tabular-nums;
}
.day-date { font-weight: 700; color: var(--text); }
.meta-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--sakura-300); }
.level-chip {
  margin-left: 2px;
  padding: 3px 9px;
  border-radius: 6px;
  background: var(--sakura-600);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  line-height: 1.4;
}
.day-greet {
  margin-top: 22px;
  font-family: 'Noto Serif SC', serif;
  font-size: 34px;
  line-height: 1.35;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--text);
}
.day-sub {
  margin-top: 10px;
  font-size: 13px;
  color: var(--text-light);
  letter-spacing: 0.4px;
}
.streak-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 26px;
  padding: 7px 14px 7px 11px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.9);
  font-size: 12px;
  color: #a56d17;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(160, 100, 20, 0.08);
}
[data-theme="dark"] .streak-pill {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.08);
  color: #e8b86d;
  box-shadow: none;
}
.streak-pill.quiet { color: var(--text-light); }
.streak-mark {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--grad-amber);
  box-shadow: 0 0 0 4px rgba(232, 184, 109, 0.16);
}
.streak-pill.quiet .streak-mark { background: var(--text-faint); box-shadow: 0 0 0 4px rgba(150, 130, 140, 0.1); }
.streak-pill b { font-size: 14px; font-variant-numeric: tabular-nums; }

.day-right {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  grid-template-rows: auto auto;
  align-items: center;
  gap: 16px 20px;
  padding: 22px 20px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.52);
  border: 1px solid rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(10px);
}
[data-theme="dark"] .day-right {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.07);
}

.goal-ring { position: relative; grid-column: 1; grid-row: 1; width: 112px; height: 112px; flex-shrink: 0; }
.goal-ring svg { width: 112px; height: 112px; display: block; transform: rotate(-90deg); }
.ring-track { stroke: rgba(255, 255, 255, 0.78); }
[data-theme="dark"] .ring-track { stroke: rgba(255, 255, 255, 0.12); }
.ring-value {
  stroke-linecap: round;
  transition: stroke-dashoffset 1.1s var(--ease-out-expo);
  filter: drop-shadow(0 4px 8px rgba(224, 62, 116, 0.28));
}
.ring-halo {
  position: absolute;
  inset: 16px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 122, 162, 0.2), transparent 70%);
}
.ring-copy {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.ring-num {
  font-family: 'Noto Serif SC', serif;
  font-size: 31px;
  font-weight: 800;
  line-height: 1;
  color: var(--sakura-600);
  letter-spacing: -1px;
  font-variant-numeric: tabular-nums;
}
.ring-num small { font-size: 13px; margin-left: 1px; }
.ring-label { margin-top: 5px; font-size: 10px; letter-spacing: 1.5px; color: var(--text-light); }

.day-meters { grid-column: 2; grid-row: 1; min-width: 0; display: flex; flex-direction: column; gap: 13px; }
.meter-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 11px;
  color: var(--text-light);
  letter-spacing: 0.5px;
}
.meter-head b { font-size: 15px; color: var(--text); font-variant-numeric: tabular-nums; }
.meter-head i { font-style: normal; font-size: 10.5px; color: var(--text-faint); font-weight: 500; margin-left: 2px; }
.meter-track {
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.66);
  overflow: hidden;
}
[data-theme="dark"] .meter-track { background: rgba(255, 255, 255, 0.1); }
.meter-track span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--grad-sakura);
  transition: width var(--dur-4) var(--ease-out-expo);
}
.meter-track.word span { background: var(--grad-amber); }

.week { grid-column: 1 / -1; grid-row: 2; min-width: 0; }
.week-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10.5px;
  letter-spacing: 0.8px;
  color: var(--text-light);
  margin-bottom: 7px;
}
.week-head em { font-style: normal; color: var(--text-faint); letter-spacing: 0.2px; }
.week-bars { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; height: 38px; align-items: end; }
.week-bar {
  justify-self: center;
  width: 100%;
  max-width: 34px;
  border-radius: 5px;
  background: rgba(224, 62, 116, 0.1);
  transition: background var(--dur-3), transform var(--dur-3) var(--ease-spring);
  animation: week-grow 650ms var(--ease-out-expo) backwards;
}
[data-theme="dark"] .week-bar { background: rgba(255, 255, 255, 0.13); }
.week-bar:nth-child(2) { animation-delay: 30ms; }
.week-bar:nth-child(3) { animation-delay: 60ms; }
.week-bar:nth-child(4) { animation-delay: 90ms; }
.week-bar:nth-child(5) { animation-delay: 120ms; }
.week-bar:nth-child(6) { animation-delay: 150ms; }
.week-bar:nth-child(7) { animation-delay: 180ms; }
@keyframes week-grow { from { transform: scaleY(0.2); opacity: 0; } to { transform: scaleY(1); opacity: 1; } }
.week-bar.on { background: var(--grad-sakura); }
.week-bar.today { outline: 2px solid var(--sakura-200); outline-offset: 2px; }

/* ==================== 分区标题 ==================== */
.block { margin-top: 42px; }
.block-head { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
.block-index {
  font-family: 'Noto Serif SC', serif;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--sakura-400);
  padding-top: 2px;
}
.block-copy { display: flex; align-items: baseline; gap: 12px; flex-shrink: 0; }
.block-copy h2 {
  font-family: 'Noto Serif SC', serif;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text);
  line-height: 1.2;
}
.block-copy p { font-size: 11.5px; color: var(--text-faint); letter-spacing: 0.4px; }
.block-line { flex: 1; height: 1px; background: var(--border); }

/* ==================== 学习卡 ==================== */
.study-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.book-card {
  position: relative;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  min-height: 218px;
  padding: 24px 22px 20px 26px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border);
  background: var(--card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  transition: transform var(--dur-3) var(--ease-out-expo), box-shadow var(--dur-3), border-color var(--dur-3);
}
.book-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 24px;
  bottom: 24px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--sakura-400);
}
.book-card.grammar::before { background: #8f9fe6; }
[data-theme="dark"] .book-card.grammar::before { background: #8a95d8; }
@media (hover: hover) and (pointer: fine) {
  .book-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--sakura-200); }
  .book-card:hover .book-cover img { transform: rotateY(-4deg) translateY(-5px); }
}
.book-card:active { transform: scale(0.995); }
.book-text { position: relative; z-index: 1; flex: 1; min-width: 0; display: flex; flex-direction: column; }
.book-kicker {
  font-size: 9.5px;
  letter-spacing: 2px;
  color: var(--text-faint);
  font-weight: 700;
}
.book-kicker span { margin-left: 6px; letter-spacing: 1px; opacity: 0.6; }
.book-text h3 {
  margin-top: 9px;
  font-family: 'Noto Serif SC', serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.5px;
  line-height: 1;
  color: var(--text);
}
.book-sub { margin-top: 7px; font-size: 11.5px; color: var(--text-light); letter-spacing: 0.3px; }
.book-metrics { display: flex; gap: 20px; margin-top: auto; padding-top: 20px; }
.book-metrics div { display: flex; flex-direction: column; gap: 2px; }
.book-metrics b { font-family: 'Noto Serif SC', serif; font-size: 21px; color: var(--text); font-variant-numeric: tabular-nums; line-height: 1; }
.book-metrics span { font-size: 9.5px; letter-spacing: 0.8px; color: var(--text-faint); }
.book-bar { margin-top: 14px; height: 4px; border-radius: 999px; background: var(--sakura-50); overflow: hidden; }
.book-bar span { display: block; height: 100%; border-radius: 999px; background: var(--grad-sakura); transition: width var(--dur-5) var(--ease-out-expo); }
.book-card.grammar .book-bar span { background: var(--grad-iris); }
.book-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 9px;
  font-size: 10px;
  color: var(--text-faint);
  font-variant-numeric: tabular-nums;
}
.book-link { color: var(--sakura-600); font-weight: 700; letter-spacing: 0.3px; }
.book-link i { font-style: normal; margin-left: 3px; }
.book-cover { position: relative; width: 88px; flex-shrink: 0; display: flex; align-items: center; padding-left: 14px; }
.book-cover::before {
  content: '';
  position: absolute;
  right: 4px;
  bottom: 18px;
  width: 76px;
  height: 24px;
  border-radius: 50%;
  background: rgba(90, 40, 60, 0.12);
  filter: blur(10px);
}
.book-cover img {
  position: relative;
  z-index: 1;
  width: 100%;
  height: auto;
  border-radius: 7px;
  transform: rotateY(-12deg) rotateX(2deg);
  transform-origin: left center;
  box-shadow: 0 14px 28px -12px rgba(60, 20, 40, 0.55);
  transition: transform var(--dur-4) var(--ease-out-expo);
}

/* ==================== 红蓝宝书 ==================== */
.series-panel {
  position: relative;
  border-radius: 26px;
  border: 1px solid var(--border);
  background: var(--card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}
.series-panel::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: linear-gradient(90deg, #d95d73 0%, #d95d73 44%, #6677c9 56%, #6677c9 100%);
  opacity: 0.85;
}
.series-head {
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 24px 26px 20px;
  background: linear-gradient(105deg, rgba(255, 245, 247, 0.7), rgba(246, 247, 255, 0.55));
  border-bottom: 1px solid var(--border);
}
[data-theme="dark"] .series-head { background: linear-gradient(105deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.025)); }
.book-pair { position: relative; width: 86px; height: 92px; flex-shrink: 0; }
.book-pair img { position: absolute; width: 58px; height: auto; border-radius: 5px; box-shadow: 0 10px 20px -10px rgba(60, 20, 40, 0.6); }
.pair-red { left: 0; top: 10px; transform: rotate(-8deg); z-index: 1; }
.pair-blue { right: 0; top: 0; transform: rotate(6deg); z-index: 2; }
.pair-band {
  position: absolute;
  left: 50%;
  bottom: 1px;
  transform: translateX(-50%);
  z-index: 3;
  padding: 2px 8px;
  border-radius: 4px;
  background: #3d3238;
  color: #fff;
  font-size: 9px;
  letter-spacing: 2px;
  white-space: nowrap;
  opacity: 0.9;
}
.series-copy { flex: 1; min-width: 0; }
.series-eyebrow { font-size: 9.5px; letter-spacing: 2px; color: var(--text-faint); font-weight: 700; }
.series-copy h3 {
  margin-top: 6px;
  font-family: 'Noto Serif SC', serif;
  font-size: 23px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--text);
  line-height: 1.25;
}
.series-copy p { margin-top: 6px; font-size: 11.5px; line-height: 1.65; color: var(--text-light); max-width: 520px; }
.series-facts { display: flex; gap: 24px; flex-shrink: 0; padding-left: 10px; }
.series-facts div { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
.series-facts b { font-family: 'Noto Serif SC', serif; font-size: 22px; line-height: 1; color: var(--text); font-variant-numeric: tabular-nums; }
.series-facts span { font-size: 9.5px; letter-spacing: 1px; color: var(--text-faint); }

.series-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
.series-card {
  position: relative;
  padding: 22px 26px 20px;
  display: flex;
  flex-direction: column;
  transition: background var(--dur-3);
}
.series-card:first-child { border-right: 1px solid var(--border); }
.series-card:hover { background: var(--card-hover); }
.series-card:active { background: var(--sakura-50); }
.series-card-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.series-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  border-radius: 5px;
  background: var(--sakura-50);
  color: var(--sakura-600);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.3px;
}
[data-theme="dark"] .series-tag { background: rgba(255, 135, 174, 0.12); color: var(--sakura-500); }
.series-no { font-family: 'Noto Serif SC', serif; font-size: 11px; color: var(--text-faint); letter-spacing: 1px; }
.series-card-main { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; margin-top: 16px; }
.series-card-copy { min-width: 0; }
.series-card-copy h4 { font-family: 'Noto Serif SC', serif; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; color: var(--text); }
.series-card-copy p { margin-top: 7px; font-size: 11.5px; line-height: 1.65; color: var(--text-light); max-width: 250px; }
.series-num {
  font-family: 'Noto Serif SC', serif;
  font-size: 36px;
  line-height: 0.9;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -1px;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.series-num small { font-size: 11px; margin-left: 3px; color: var(--text-faint); font-weight: 600; letter-spacing: 0; }
.series-bar { display: flex; align-items: center; gap: 10px; margin-top: 18px; }
.series-bar-track { flex: 1; height: 4px; border-radius: 999px; background: var(--sakura-50); overflow: hidden; }
.series-bar-track span { display: block; height: 100%; border-radius: 999px; background: var(--grad-sakura); transition: width var(--dur-5) var(--ease-out-expo); }
.series-card:nth-child(2) .series-bar-track span { background: linear-gradient(90deg, #9aa8e8, #6677c9); }
.series-bar em { font-style: normal; font-size: 10px; color: var(--text-faint); font-variant-numeric: tabular-nums; }
.series-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  font-size: 10.5px;
  color: var(--text-light);
}
.series-foot b { color: var(--sakura-600); }
.series-enter { flex-shrink: 0; color: var(--text); font-weight: 700; letter-spacing: 0.3px; }
.series-enter i { font-style: normal; margin-left: 3px; color: var(--sakura-500); }

/* ==================== 专项 ==================== */
.extra-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.extra-card {
  --accent: var(--sakura-500);
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 150px;
  padding: 18px 18px 16px;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  transition: transform var(--dur-3) var(--ease-out-expo), box-shadow var(--dur-3), border-color var(--dur-3);
}
.extra-card.exam { --accent: var(--amber); }
.extra-card.reading { --accent: #d98b45; }
.extra-card.listening { --accent: #3fae83; }
.extra-card.supplement { --accent: var(--iris); }
.extra-card::after {
  content: '';
  position: absolute;
  right: -22px;
  top: -30px;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.055;
}
@media (hover: hover) and (pointer: fine) {
  .extra-card:hover { transform: translateY(-3px); box-shadow: var(--shadow); border-color: var(--accent); }
  .extra-card:hover .extra-arrow { transform: translate(2px, -2px); }
}
.extra-card:active { transform: scale(0.995); }
.extra-card.disabled { opacity: 0.5; cursor: not-allowed; }
.extra-card.disabled:hover { transform: none; box-shadow: var(--shadow-card); border-color: var(--border); }
.extra-card.disabled .extra-arrow { transform: none; }
.extra-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.extra-label {
  font-size: 9.5px;
  letter-spacing: 2px;
  font-weight: 700;
  color: var(--accent);
}
.extra-arrow { font-size: 13px; color: var(--text-faint); transition: transform var(--dur-2); }
.extra-card h3 {
  margin-top: 13px;
  font-family: 'Noto Serif SC', serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--text);
}
.extra-card p { margin-top: 4px; font-size: 10.5px; color: var(--text-light); line-height: 1.5; }
.extra-num {
  margin-top: auto;
  padding-top: 14px;
  font-family: 'Noto Serif SC', serif;
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}
.extra-num small { margin-left: 3px; font-size: 9.5px; color: var(--text-faint); font-weight: 600; }

/* ==================== 响应式 ==================== */
@media (max-width: 900px) {
  .dayboard { grid-template-columns: 1fr; gap: 22px; padding: 28px 26px 26px; }
  .day-right { max-width: 560px; }
  .extra-grid { grid-template-columns: repeat(2, 1fr); }
  .series-facts { display: none; }
}
@media (max-width: 720px) {
  .home { max-width: 100%; }
  .study-grid, .series-cards { grid-template-columns: 1fr; }
  .series-card:first-child { border-right: 0; border-bottom: 1px solid var(--border); }
  .book-card { min-height: 0; padding: 20px 18px 18px 22px; }
  .book-cover { width: 76px; }
  .block { margin-top: 34px; }
  .block-copy { flex-direction: column; gap: 3px; }
  .block-copy h2 { font-size: 21px; }
  .day-greet { font-size: 27px; }
  .dayboard::after { font-size: 88px; }
  .series-head { align-items: flex-start; gap: 16px; padding: 22px 20px 18px; }
  .book-pair { width: 72px; height: 80px; }
  .book-pair img { width: 50px; }
  .series-copy h3 { font-size: 20px; }
  .series-card { padding: 20px 20px 18px; }
}
@media (max-width: 560px) {
  .dayboard { padding: 24px 20px 22px; border-radius: 24px; }
  .day-right { grid-template-columns: 1fr; grid-template-rows: auto auto auto; gap: 16px; padding: 18px; max-width: none; }
  .goal-ring { grid-column: 1; grid-row: 1; justify-self: center; align-self: center; }
  .day-meters { grid-column: 1; grid-row: 2; gap: 12px; }
  .week { grid-column: 1; grid-row: 3; }
  .day-sub { display: none; }
  .streak-pill { margin-top: 18px; }
  .block-head { gap: 10px; }
  .block-copy p { display: none; }
  .block-line { margin-left: 4px; }
  .extra-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .extra-card { min-height: 136px; padding: 15px 14px 14px; }
  .extra-card h3 { font-size: 16px; }
  .extra-card p { font-size: 9.5px; }
  .series-head { flex-wrap: wrap; }
  .series-copy { flex-basis: calc(100% - 90px); }
  .series-card-main { align-items: flex-start; }
  .series-num { font-size: 30px; }
  .series-foot { align-items: flex-start; flex-direction: column; gap: 6px; }
}
@media (max-width: 380px) {
  .book-cover { display: none; }
  .extra-grid { grid-template-columns: 1fr; }
  .extra-card { min-height: 112px; }
  .extra-card h3 { margin-top: 8px; }
  .extra-num { padding-top: 10px; }
}
</style>
