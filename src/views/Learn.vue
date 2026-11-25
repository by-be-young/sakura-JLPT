<template>
  <div class="container learn">
    <!-- 无内容等级的占位 -->
    <div v-if="!hasQuiz && !readingAvailable" class="empty-state">
      <div class="empty-kicker">LIBRARY / {{ level }}</div>
      <h1>{{ currentTitle }} · 题库准备中</h1>
      <p>当前难度的题库正在整理。可以先去背词或学习文法，等题库上线后再回来。</p>
      <div class="empty-actions">
        <router-link to="/words" class="empty-btn primary">去背词</router-link>
        <router-link to="/study" class="empty-btn">去学文法</router-link>
      </div>
    </div>

    <!-- ==================== 练习中心 ==================== -->
    <template v-else-if="!mode">
      <header class="learn-hero" v-reveal>
        <div class="hero-copy">
          <div class="hero-kicker"><span></span>PRACTICE / {{ level }}</div>
          <h1>练习</h1>
          <p>{{ currentTitle }} · 红蓝宝书主线，配合专项能力训练</p>
        </div>
        <div class="hero-side">
          <span class="level-stamp">{{ level }}</span>
          <span class="stamp-note">当前难度</span>
        </div>
      </header>

      <!-- 红蓝宝书 -->
      <section class="series-block" v-reveal="{ delay: 40 }">
        <div class="series-head">
          <div class="book-pair" aria-hidden="true">
            <img class="pair-red" src="./covers/vocabulary-red.svg" alt="" loading="eager" />
            <img class="pair-blue" src="./covers/grammar-blue.svg" alt="" loading="eager" />
            <span class="pair-band">合本</span>
          </div>
          <div class="series-copy">
            <div class="series-kicker">JLPT 备考系列</div>
            <h2>《红蓝宝书》</h2>
            <p>题库练习与模拟测试同属《红蓝宝书》合集，文字・語彙・文法一并覆盖。</p>
          </div>
          <div class="series-facts">
            <div><b>{{ quizStats.total || '—' }}</b><span>题库题量</span></div>
            <div><b>{{ mockStats.count || '—' }}</b><span>模拟套卷</span></div>
          </div>
        </div>

        <div class="series-grid">
          <div class="series-card" :class="{ disabled: !hasQuiz }" @click="hasQuiz && choose('bank')">
            <div class="card-top">
              <span class="card-tag">《红蓝宝书》题库</span>
              <span class="card-index">01</span>
            </div>
            <div class="card-title-row">
              <div>
                <h3>题库练习</h3>
                <p>顺序 · 随机 · 单元三种方式，逐题巩固。</p>
              </div>
              <div class="card-number">{{ quizStats.total || '—' }}<small>题</small></div>
            </div>
            <div class="card-bar">
              <div class="bar-track"><span :style="{ width: quizStats.pct + '%' }"></span></div>
              <em>{{ quizStats.pct }}%</em>
            </div>
            <div class="card-foot">
              <span v-if="quizStats.answered">已答 {{ quizStats.answered }} 题 · 正确率 {{ quizStats.correctRate === null ? '—' : quizStats.correctRate + '%' }}</span>
              <span v-else>尚未开始 · 选择一种方式进入</span>
              <span class="card-enter">选择模式 <i>→</i></span>
            </div>
          </div>

          <div class="series-card" :class="{ disabled: !hasQuiz || !mockStats.count }"
            @click="hasQuiz && mockStats.count && choose('mock')">
            <div class="card-top">
              <span class="card-tag">《红蓝宝书》模拟</span>
              <span class="card-index">02</span>
            </div>
            <div class="card-title-row">
              <div>
                <h3>模拟测试</h3>
                <p>按回次完整作答，检验真实水平。</p>
              </div>
              <div class="card-number">{{ mockStats.count || '—' }}<small>套</small></div>
            </div>
            <div class="card-bar">
              <div class="bar-track mock"><span :style="{ width: mockStats.pct + '%' }"></span></div>
              <em>{{ mockStats.pct }}%</em>
            </div>
            <div class="card-foot">
              <span v-if="mockStats.done">已完成 {{ mockStats.done }} 套 · 均分 {{ mockStats.avg }}</span>
              <span v-else-if="mockStats.count">尚未作答 · 全真模拟</span>
              <span v-else>本级模拟卷即将上线</span>
              <span class="card-enter">查看套卷 <i>→</i></span>
            </div>
          </div>
        </div>
      </section>

      <!-- 专项 -->
      <section class="special-block" v-reveal="{ delay: 100 }">
        <header class="special-head">
          <div><span class="special-index">02</span><h2>专项训练</h2></div>
          <p>题库之外的单项能力</p>
        </header>

        <div class="special-grid">
          <router-link to="/exam" class="special-card exam">
            <div class="special-top"><span class="special-label">真题</span><span class="special-arrow">↗</span></div>
            <h3>整卷真题</h3>
            <p>{{ examPackStats.desc }}</p>
            <div class="special-foot">
              <span class="special-num">{{ examPackStats.numText }}<small>{{ examPackStats.numUnit }}</small></span>
              <span v-if="examPackStats.tag" class="special-chip">{{ examPackStats.tag }}</span>
            </div>
          </router-link>

          <router-link to="/reading" class="special-card reading" :class="{ disabled: !readingAvailable }"
            @click="readingAvailable && router.push('/reading')">
            <div class="special-top"><span class="special-label">读解</span><span class="special-arrow">↗</span></div>
            <h3>阅读训练</h3>
            <p>{{ readingAvailable ? '橙宝书 · 文章阅读与答题解析' : '本级读解内容待补充' }}</p>
            <div class="special-foot">
              <span class="special-num">{{ readingAvailable ? readingCount : '—' }}<small>篇</small></span>
              <span class="special-chip">{{ readingAvailable ? 'N1 / N2 已收录' : '待补充' }}</span>
            </div>
          </router-link>

          <router-link to="/listening" class="special-card listening">
            <div class="special-top"><span class="special-label">听解</span><span class="special-arrow">↗</span></div>
            <h3>听力单元</h3>
            <p>绿宝书 · 词汇、题目与补充知识</p>
            <div class="special-foot">
              <span class="special-num">{{ listeningCount }}<small>单元</small></span>
              <span class="special-chip">自由练习</span>
            </div>
          </router-link>

          <router-link to="/supplement" class="special-card supplement" :class="{ disabled: !supStats.total }"
            @click="supStats.total && router.push('/supplement')">
            <div class="special-top"><span class="special-label">补充</span><span class="special-arrow">↗</span></div>
            <h3>补充题库</h3>
            <p>非红蓝宝书 · 独立统计</p>
            <div class="special-foot">
              <span class="special-num">{{ supStats.total || '—' }}<small>题</small></span>
              <span class="special-chip">{{ supStats.total ? '已答 ' + supStats.done + ' 题' : '优先收录 N3' }}</span>
            </div>
          </router-link>
        </div>
      </section>
    </template>

    <!-- ==================== 题库练习 ==================== -->
    <template v-else-if="mode === 'bank'">
      <header class="sub-head" v-reveal>
        <button class="back-link" @click="backToPick" aria-label="返回练习中心">← <span>返回</span></button>
        <div class="sub-copy">
          <span class="sub-kicker">《红蓝宝书》题库练习</span>
          <h1>{{ currentTitle }} · 题库</h1>
        </div>
        <span class="sub-level">{{ level }}</span>
      </header>

      <div class="bank-layout">
        <div class="mode-list" v-reveal="{ delay: 40 }">
          <div class="mode-card" @click="router.push('/quiz/sequential')">
            <span class="mode-index">01</span>
            <div class="mode-copy">
              <div class="mode-top"><h3>顺序答题</h3><span class="mode-tag">从指定题号开始</span></div>
              <p>按题目编号从头梳理，题号会标记答题状态，适合系统复习。</p>
            </div>
            <span class="mode-arrow">→</span>
          </div>

          <div class="mode-card" @click="router.push('/quiz/random')">
            <span class="mode-index">02</span>
            <div class="mode-copy">
              <div class="mode-top"><h3>随机抽题</h3><span class="mode-tag">优先未做过的题</span></div>
              <p>默认避开已完成题目，也可以切换为完全随机，检验真实水平。</p>
            </div>
            <span class="mode-arrow">→</span>
          </div>

          <div class="mode-card" @click="router.push('/units')">
            <span class="mode-index">03</span>
            <div class="mode-copy">
              <div class="mode-top"><h3>单元练习</h3><span class="mode-tag">按教材单元</span></div>
              <p>按单元逐题练习，不限时，适合针对薄弱环节集中巩固。</p>
            </div>
            <span class="mode-arrow">→</span>
          </div>
        </div>

        <aside class="bank-side" v-reveal="{ delay: 100 }">
          <div class="side-head"><span>本级题库</span><em>{{ level }}</em></div>
          <div class="side-number">{{ quizStats.total }}<small>题</small></div>
          <div class="side-grid">
            <div><b>{{ quizStats.answered }}</b><span>已作答</span></div>
            <div><b>{{ quizStats.correctRate === null ? '—' : quizStats.correctRate + '%' }}</b><span>正确率</span></div>
          </div>
          <div class="side-bar">
            <div class="side-bar-head"><span>完成度</span><em>{{ quizStats.pct }}%</em></div>
            <div class="side-track"><span :style="{ width: quizStats.pct + '%' }"></span></div>
          </div>
          <p class="side-note">题库练习取自《红蓝宝书》合集，与模拟测试同源。</p>
        </aside>
      </div>
    </template>

    <!-- ==================== 模拟测试 ==================== -->
    <template v-else-if="mode === 'mock'">
      <header class="sub-head" v-reveal>
        <button class="back-link" @click="backToPick" aria-label="返回练习中心">← <span>返回</span></button>
        <div class="sub-copy">
          <span class="sub-kicker">《红蓝宝书》模拟测试</span>
          <h1>{{ currentTitle }} · 全真模拟</h1>
        </div>
        <span class="sub-level">{{ level }}</span>
      </header>

      <div class="mock-summary" v-reveal="{ delay: 40 }">
        <div class="summary-main">
          <span>模拟卷</span>
          <b>{{ mockStats.count }}<small>套</small></b>
        </div>
        <div class="summary-item"><b>{{ mockStats.done }}</b><span>已完成</span></div>
        <div class="summary-item"><b>{{ mockStats.avg === null ? '—' : mockStats.avg }}</b><span>平均分</span></div>
        <p>每一回都是一套完整试卷。作答后自动记录成绩，可反复重做。</p>
      </div>

      <div class="ticket-grid" v-reveal="{ delay: 80 }">
        <div v-for="m in mockList" :key="m.id" class="ticket"
          :class="{ disabled: !m.available }" @click="m.available && startMock(m.id)">
          <div class="ticket-top">
            <span class="ticket-round">ROUND {{ pad(m.id) }}</span>
            <span class="ticket-status" :class="{ ready: m.available }">{{ m.available ? '可作答' : '待补充' }}</span>
          </div>
          <div class="ticket-body">
            <h3>第 {{ m.id }} 回</h3>
            <span class="ticket-count">{{ m.available ? m.count + ' 题' : '即将上线' }}</span>
          </div>
          <div class="ticket-rule"></div>
          <div class="ticket-foot">
            <span v-if="m.available && store.state.mockResults[m.mockKey]" class="ticket-score">
              <i>上次</i>{{ store.state.mockResults[m.mockKey].correct }}/{{ store.state.mockResults[m.mockKey].total }}
            </span>
            <span v-else-if="m.available" class="ticket-empty">尚未作答</span>
            <span v-else class="ticket-empty">暂不可用</span>
            <span v-if="m.available" class="ticket-go">开始 <i>→</i></span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { levelConfig, levelTitle, hasQuizData, mockInfo, levelQuestionsAll, levelPackQuestions } from '../data/questions'
import { readingN1 } from '../data/reading-n1'
import { readingN2 } from '../data/reading-n2'
import { listeningUnits as n2Listening } from '../data/listening'
import { listeningUnits as n1Listening } from '../data/listening-n1'
import { supplementStatsOfLevel } from '../data/supplement'
import { useStore } from '../store/useStore'
import { useLevel } from '../store/levelStore'

const route = useRoute()
const router = useRouter()
const store = useStore()
const { level } = useLevel()

const mode = computed(() => route.query.mode)
const currentTitle = computed(() => levelTitle(level.value))
const hasQuiz = computed(() => hasQuizData(level.value))
// 读解板块：收录 N1、N2（橙宝书读解）
const readingAvailable = computed(() => level.value === 'N1' || level.value === 'N2')

const mockList = computed(() => {
  const cfg = levelConfig[level.value]
  const count = cfg?.mockCount || 0
  const arr = []
  for (let id = 1; id <= count; id++) {
    const mockKey = level.value + ':' + id
    const info = mockInfo[mockKey]
    if (info) {
      arr.push({ id, mockKey, available: true, count: info.count })
    } else {
      arr.push({ id, mockKey, available: false, count: 0 })
    }
  }
  return arr
})

// 题库统计
const quizStats = computed(() => {
  const all = levelQuestionsAll(level.value)
  const answered = store.state.counts?.[level.value]?.answered || 0
  const correct = store.state.counts?.[level.value]?.correct || 0
  return {
    total: hasQuizData(level.value) ? all.length : 0,
    answered,
    correctRate: answered ? Math.round(correct / answered * 100) : null,
    pct: all.length ? Math.round(answered / all.length * 100) : 0,
  }
})

// 模拟测试统计
const mockStats = computed(() => {
  const count = levelConfig[level.value]?.mockCount || 0
  let done = 0, sum = 0
  for (const [k, v] of Object.entries(store.state.mockResults || {})) {
    if (k.startsWith(level.value + ':') && v) { done++; sum += (v.score || 0) }
  }
  return { count, done, avg: done ? Math.round(sum / done) : null, pct: count ? Math.round(done / count * 100) : 0 }
})

// 补充题库（独立于红蓝宝书题库）
const supStats = computed(() => {
  const s = supplementStatsOfLevel(level.value, store.state.answered)
  return { total: s.total, done: s.done, pct: s.pct }
})

// 读解 / 听解
const readingCount = computed(() => (level.value === 'N1' ? readingN1 : readingN2).length)
const listeningCount = computed(() => (level.value === 'N1' ? n1Listening : n2Listening).length)

// 真题状态（按当前难度统计本级真题套数与题量）
const examPackStats = computed(() => {
  const list = levelPackQuestions(level.value)
  const count = list.length
  if (!count) {
    return { numText: '—', numUnit: '', desc: '本级暂无真题 · 可切换难度查看 N1 / N2 / N3 / N4 / N5', tag: '' }
  }
  const packs = new Set(list.map(q => q.packId)).size
  return {
    numText: String(count),
    numUnit: '题可练',
    desc: level.value + ' 真题 · 随机 / 错题 / 收藏均含真题',
    tag: packs + ' 套整卷',
  }
})

function choose(m) {
  router.replace({ query: { mode: m } })
}

function backToPick() {
  router.replace({ query: {} })
}

function startMock(id) {
  router.push({ name: 'quiz', params: { mode: 'mock' }, query: { mock: id } })
}

function pad(n) {
  return String(n).padStart(2, '0')
}
</script>

<style scoped>
.learn { max-width: 1000px; }

/* ==================== 空状态 ==================== */
.empty-state {
  margin-top: 12px;
  padding: 48px 32px;
  border-radius: 26px;
  border: 1px dashed var(--border-strong);
  background: var(--card);
  text-align: center;
}
.empty-kicker { font-size: 10px; letter-spacing: 2.5px; color: var(--text-faint); font-weight: 700; }
.empty-state h1 {
  margin-top: 12px;
  font-family: 'Noto Serif SC', serif;
  font-size: 26px;
  font-weight: 700;
  color: var(--text);
}
.empty-state p { margin-top: 10px; font-size: 12.5px; line-height: 1.8; color: var(--text-light); }
.empty-actions { display: flex; justify-content: center; gap: 10px; margin-top: 22px; }
.empty-btn {
  padding: 9px 20px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-strong);
  font-size: 12.5px;
  font-weight: 700;
  color: var(--sakura-600);
  background: var(--card);
}
.empty-btn.primary { background: var(--grad-sakura); border-color: transparent; color: #fff; }

/* ==================== 练习中心页头 ==================== */
.learn-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 8px 2px 26px;
  border-bottom: 1px solid var(--border);
}
.hero-kicker {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 9.5px;
  letter-spacing: 2.5px;
  font-weight: 700;
  color: var(--text-faint);
}
.hero-kicker span { display: inline-block; width: 24px; height: 1px; background: var(--sakura-400); }
.hero-copy h1 {
  margin-top: 12px;
  font-family: 'Noto Serif SC', serif;
  font-size: 40px;
  font-weight: 700;
  letter-spacing: 4px;
  line-height: 1.1;
  color: var(--text);
}
.hero-copy p { margin-top: 9px; font-size: 12px; letter-spacing: 0.4px; color: var(--text-light); }
.hero-side { display: flex; flex-direction: column; align-items: center; gap: 5px; flex-shrink: 0; }
.level-stamp {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: 1px solid var(--sakura-300);
  background: rgba(255, 255, 255, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Noto Serif SC', serif;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--sakura-600);
}
[data-theme="dark"] .level-stamp { background: rgba(255, 255, 255, 0.06); }
.stamp-note { font-size: 9px; letter-spacing: 1.5px; color: var(--text-faint); }

/* ==================== 红蓝宝书 ==================== */
.series-block {
  margin-top: 28px;
  border-radius: 26px;
  border: 1px solid var(--border);
  background: var(--card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  position: relative;
}
.series-block::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: linear-gradient(90deg, #d95d73 0%, #d95d73 44%, #6677c9 56%, #6677c9 100%);
}
.series-head {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px 26px 20px;
  background: linear-gradient(105deg, rgba(255, 245, 247, 0.75), rgba(246, 247, 255, 0.55));
  border-bottom: 1px solid var(--border);
}
[data-theme="dark"] .series-head { background: linear-gradient(105deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.025)); }
.book-pair { position: relative; width: 82px; height: 88px; flex-shrink: 0; }
.book-pair img { position: absolute; width: 55px; height: auto; border-radius: 5px; box-shadow: 0 10px 20px -10px rgba(60, 20, 40, 0.6); }
.pair-red { left: 0; top: 10px; transform: rotate(-8deg); z-index: 1; }
.pair-blue { right: 0; top: 0; transform: rotate(6deg); z-index: 2; }
.pair-band {
  position: absolute;
  left: 50%;
  bottom: 0;
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
.series-kicker { font-size: 9.5px; letter-spacing: 2px; color: var(--text-faint); font-weight: 700; }
.series-copy h2 {
  margin-top: 6px;
  font-family: 'Noto Serif SC', serif;
  font-size: 23px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--text);
}
.series-copy p { margin-top: 5px; font-size: 11.5px; line-height: 1.65; color: var(--text-light); max-width: 520px; }
.series-facts { display: flex; gap: 22px; flex-shrink: 0; }
.series-facts div { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
.series-facts b { font-family: 'Noto Serif SC', serif; font-size: 22px; line-height: 1; color: var(--text); font-variant-numeric: tabular-nums; }
.series-facts span { font-size: 9px; letter-spacing: 1px; color: var(--text-faint); }

.series-grid { display: grid; grid-template-columns: 1fr 1fr; }
.series-card { position: relative; padding: 22px 24px 20px; cursor: pointer; transition: background var(--dur-3); }
.series-card:first-child { border-right: 1px solid var(--border); }
.series-card:hover { background: var(--card-hover); }
.series-card:active { background: var(--sakura-50); }
.series-card.disabled { opacity: 0.5; cursor: not-allowed; }
.series-card.disabled:hover { background: transparent; }
.card-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.card-tag {
  display: inline-flex;
  padding: 4px 9px;
  border-radius: 5px;
  background: var(--sakura-50);
  color: var(--sakura-600);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.4px;
}
[data-theme="dark"] .card-tag { background: rgba(255, 135, 174, 0.12); color: var(--sakura-500); }
.series-card:nth-child(2) .card-tag { background: rgba(102, 119, 201, 0.09); color: #5b6dbd; }
[data-theme="dark"] .series-card:nth-child(2) .card-tag { background: rgba(138, 149, 216, 0.14); color: #aab5ff; }
.card-index { font-family: 'Noto Serif SC', serif; font-size: 10px; letter-spacing: 1px; color: var(--text-faint); }
.card-title-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; margin-top: 16px; }
.card-title-row h3 { font-family: 'Noto Serif SC', serif; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; color: var(--text); }
.card-title-row p { margin-top: 6px; font-size: 11px; line-height: 1.6; color: var(--text-light); max-width: 240px; }
.card-number {
  flex-shrink: 0;
  font-family: 'Noto Serif SC', serif;
  font-size: 34px;
  line-height: 0.9;
  font-weight: 800;
  letter-spacing: -1px;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}
.card-number small { margin-left: 3px; font-size: 10px; font-weight: 600; letter-spacing: 0; color: var(--text-faint); }
.card-bar { display: flex; align-items: center; gap: 10px; margin-top: 17px; }
.bar-track { flex: 1; height: 4px; border-radius: 999px; background: var(--sakura-50); overflow: hidden; }
.bar-track span { display: block; height: 100%; border-radius: 999px; background: var(--grad-sakura); transition: width var(--dur-5) var(--ease-out-expo); }
.bar-track.mock span { background: linear-gradient(90deg, #9aa8e8, #6677c9); }
.card-bar em { font-style: normal; font-size: 9.5px; color: var(--text-faint); font-variant-numeric: tabular-nums; }
.card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  font-size: 10px;
  color: var(--text-light);
}
.card-enter { flex-shrink: 0; color: var(--text); font-weight: 700; letter-spacing: 0.3px; }
.card-enter i { font-style: normal; margin-left: 3px; color: var(--sakura-500); }

/* ==================== 专项 ==================== */
.special-block { margin-top: 36px; }
.special-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.special-head > div { display: flex; align-items: baseline; gap: 12px; }
.special-index { font-family: 'Noto Serif SC', serif; font-size: 12px; font-weight: 800; letter-spacing: 1px; color: var(--sakura-400); }
.special-head h2 { font-family: 'Noto Serif SC', serif; font-size: 23px; font-weight: 700; letter-spacing: 1px; color: var(--text); }
.special-head p { font-size: 10.5px; letter-spacing: 0.5px; color: var(--text-faint); }

.special-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.special-card {
  --accent: var(--sakura-500);
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 152px;
  padding: 17px 17px 15px;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  transition: transform var(--dur-3) var(--ease-out-expo), box-shadow var(--dur-3), border-color var(--dur-3);
}
.special-card.exam { --accent: var(--amber); }
.special-card.reading { --accent: #d98b45; }
.special-card.listening { --accent: #3fae83; }
.special-card.supplement { --accent: var(--iris); }
.special-card::after {
  content: '';
  position: absolute;
  right: -24px;
  top: -30px;
  width: 86px;
  height: 86px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.055;
}
.special-card.disabled { opacity: 0.5; cursor: not-allowed; }
@media (hover: hover) and (pointer: fine) {
  .special-card:not(.disabled):hover { transform: translateY(-3px); box-shadow: var(--shadow); border-color: var(--accent); }
  .special-card:not(.disabled):hover .special-arrow { transform: translate(2px, -2px); }
}
.special-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.special-label { font-size: 9.5px; letter-spacing: 2px; font-weight: 700; color: var(--accent); }
.special-arrow { font-size: 13px; color: var(--text-faint); transition: transform var(--dur-2); }
.special-card h3 { margin-top: 12px; font-family: 'Noto Serif SC', serif; font-size: 18px; font-weight: 700; letter-spacing: 0.5px; color: var(--text); }
.special-card p { margin-top: 4px; font-size: 10.5px; line-height: 1.55; color: var(--text-light); }
.special-foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; margin-top: auto; padding-top: 14px; }
.special-num { font-family: 'Noto Serif SC', serif; font-size: 22px; line-height: 1; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; }
.special-num small { margin-left: 3px; font-size: 9px; font-weight: 600; color: var(--text-faint); }
.special-chip {
  flex-shrink: 0;
  padding: 3px 7px;
  border-radius: 4px;
  background: var(--sakura-50);
  color: var(--text-light);
  font-size: 8.5px;
  letter-spacing: 0.2px;
  white-space: nowrap;
}
[data-theme="dark"] .special-chip { background: rgba(255, 255, 255, 0.06); }

/* ==================== 子页头 ==================== */
.sub-head {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 2px 22px;
  border-bottom: 1px solid var(--border);
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 34px;
  padding: 0 13px;
  flex-shrink: 0;
  border-radius: 999px;
  border: 1px solid var(--border-strong);
  background: var(--card);
  color: var(--text);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  box-shadow: var(--shadow-card);
  transition: all var(--dur-2);
}
.back-link:hover { border-color: var(--sakura-300); color: var(--sakura-600); background: var(--sakura-50); }
.back-link span { letter-spacing: 0.5px; }
.sub-copy { flex: 1; min-width: 0; }
.sub-kicker { font-size: 9.5px; letter-spacing: 2px; font-weight: 700; color: var(--sakura-500); }
.sub-copy h1 {
  margin-top: 5px;
  font-family: 'Noto Serif SC', serif;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: var(--text);
  line-height: 1.25;
}
.sub-level {
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid var(--sakura-300);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Noto Serif SC', serif;
  font-size: 17px;
  font-weight: 800;
  color: var(--sakura-600);
  letter-spacing: 1px;
}

/* ==================== 题库模式 ==================== */
.bank-layout { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(250px, 0.75fr); gap: 18px; margin-top: 22px; }
.mode-list { display: flex; flex-direction: column; gap: 12px; }
.mode-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 24px 22px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: var(--card);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: transform var(--dur-3) var(--ease-out-expo), box-shadow var(--dur-3), border-color var(--dur-3);
}
@media (hover: hover) and (pointer: fine) {
  .mode-card:hover { transform: translateX(4px); border-color: var(--sakura-200); box-shadow: var(--shadow); }
  .mode-card:hover .mode-arrow { color: var(--sakura-600); transform: translateX(3px); }
}
.mode-card:active { transform: scale(0.995); }
.mode-index {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--sakura-50);
  color: var(--sakura-600);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Noto Serif SC', serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
}
[data-theme="dark"] .mode-index { background: rgba(255, 135, 174, 0.12); color: var(--sakura-500); }
.mode-copy { flex: 1; min-width: 0; }
.mode-top { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
.mode-top h3 { font-family: 'Noto Serif SC', serif; font-size: 19px; font-weight: 700; letter-spacing: 0.5px; color: var(--text); }
.mode-tag {
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid var(--border);
  color: var(--text-faint);
  font-size: 9px;
  letter-spacing: 0.4px;
  white-space: nowrap;
}
.mode-copy p { margin-top: 6px; font-size: 11.5px; line-height: 1.65; color: var(--text-light); }
.mode-arrow { flex-shrink: 0; font-size: 18px; color: var(--text-faint); transition: all var(--dur-2); }

.bank-side {
  align-self: start;
  padding: 22px 20px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: linear-gradient(160deg, var(--sakura-50), rgba(255, 255, 255, 0));
  position: sticky;
  top: 88px;
}
[data-theme="dark"] .bank-side { background: linear-gradient(160deg, rgba(255, 135, 174, 0.07), transparent); }
.side-head { display: flex; align-items: center; justify-content: space-between; font-size: 9.5px; letter-spacing: 1.5px; color: var(--text-faint); font-weight: 700; }
.side-head em { font-style: normal; color: var(--sakura-500); }
.side-number { margin-top: 16px; font-family: 'Noto Serif SC', serif; font-size: 42px; line-height: 1; font-weight: 800; letter-spacing: -1px; color: var(--text); font-variant-numeric: tabular-nums; }
.side-number small { margin-left: 4px; font-size: 11px; color: var(--text-faint); font-weight: 600; }
.side-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--border); }
.side-grid div { display: flex; flex-direction: column; gap: 3px; }
.side-grid b { font-family: 'Noto Serif SC', serif; font-size: 19px; line-height: 1; color: var(--text); font-variant-numeric: tabular-nums; }
.side-grid span { font-size: 9px; letter-spacing: 0.8px; color: var(--text-faint); }
.side-bar { margin-top: 18px; }
.side-bar-head { display: flex; justify-content: space-between; font-size: 9.5px; letter-spacing: 0.8px; color: var(--text-light); margin-bottom: 7px; }
.side-bar-head em { font-style: normal; font-variant-numeric: tabular-nums; }
.side-track { height: 4px; border-radius: 999px; background: rgba(224, 62, 116, 0.1); overflow: hidden; }
.side-track span { display: block; height: 100%; border-radius: 999px; background: var(--grad-sakura); transition: width var(--dur-5) var(--ease-out-expo); }
.side-note { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); font-size: 10px; line-height: 1.7; color: var(--text-faint); }

/* ==================== 模拟卷 ==================== */
.mock-summary {
  display: flex;
  align-items: center;
  gap: 30px;
  margin-top: 22px;
  padding: 20px 24px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: linear-gradient(110deg, rgba(255, 245, 247, 0.8), rgba(246, 247, 255, 0.55));
}
[data-theme="dark"] .mock-summary { background: linear-gradient(110deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02)); }
.summary-main { display: flex; align-items: baseline; gap: 8px; padding-right: 26px; border-right: 1px solid var(--border); }
.summary-main span { font-size: 9.5px; letter-spacing: 1px; color: var(--text-faint); }
.summary-main b { font-family: 'Noto Serif SC', serif; font-size: 30px; line-height: 1; color: var(--text); font-variant-numeric: tabular-nums; }
.summary-main small { margin-left: 3px; font-size: 10px; color: var(--text-faint); }
.summary-item { display: flex; flex-direction: column; gap: 3px; }
.summary-item b { font-family: 'Noto Serif SC', serif; font-size: 20px; line-height: 1; color: var(--text); font-variant-numeric: tabular-nums; }
.summary-item span { font-size: 9px; letter-spacing: 0.8px; color: var(--text-faint); }
.mock-summary p { margin-left: auto; max-width: 260px; font-size: 10px; line-height: 1.65; color: var(--text-faint); text-align: right; }

.ticket-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px; }
.ticket {
  position: relative;
  padding: 18px 18px 16px;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--card);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  overflow: hidden;
  transition: transform var(--dur-3) var(--ease-out-expo), box-shadow var(--dur-3), border-color var(--dur-3);
}
.ticket::before {
  content: '';
  position: absolute;
  left: 0;
  top: 18px;
  bottom: 18px;
  width: 2px;
  background: linear-gradient(180deg, #d95d73, #6677c9);
  border-radius: 0 2px 2px 0;
  opacity: 0.75;
}
.ticket.disabled { opacity: 0.45; cursor: not-allowed; }
@media (hover: hover) and (pointer: fine) {
  .ticket:not(.disabled):hover { transform: translateY(-3px); box-shadow: var(--shadow); border-color: var(--sakura-200); }
  .ticket:not(.disabled):hover .ticket-go { color: var(--sakura-600); }
}
.ticket:active { transform: scale(0.995); }
.ticket-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.ticket-round { font-size: 9px; letter-spacing: 1.5px; color: var(--text-faint); font-weight: 700; }
.ticket-status {
  padding: 3px 7px;
  border-radius: 4px;
  background: var(--sakura-50);
  color: var(--text-faint);
  font-size: 8.5px;
  letter-spacing: 0.3px;
}
.ticket-status.ready { color: var(--sakura-600); }
[data-theme="dark"] .ticket-status { background: rgba(255, 255, 255, 0.06); }
.ticket-body { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; margin-top: 16px; }
.ticket-body h3 { font-family: 'Noto Serif SC', serif; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; color: var(--text); }
.ticket-count { font-size: 10px; color: var(--text-light); }
.ticket-rule { height: 1px; background: var(--border); margin: 14px 0 11px; }
.ticket-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 9.5px; color: var(--text-faint); }
.ticket-score { color: var(--text-light); font-variant-numeric: tabular-nums; }
.ticket-score i { font-style: normal; margin-right: 6px; color: var(--text-faint); }
.ticket-empty { color: var(--text-faint); }
.ticket-go { color: var(--text); font-weight: 700; transition: color var(--dur-2); }
.ticket-go i { font-style: normal; margin-left: 2px; }

/* ==================== 响应式 ==================== */
@media (max-width: 900px) {
  .series-facts { display: none; }
  .special-grid { grid-template-columns: repeat(2, 1fr); }
  .ticket-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 760px) {
  .hero-copy h1 { font-size: 33px; }
  .learn-hero { align-items: center; }
  .series-grid { grid-template-columns: 1fr; }
  .series-card:first-child { border-right: 0; border-bottom: 1px solid var(--border); }
  .bank-layout { grid-template-columns: 1fr; }
  .bank-side { position: static; }
  .mock-summary { flex-wrap: wrap; gap: 20px; }
  .summary-main { padding-right: 18px; }
  .mock-summary p { flex-basis: 100%; max-width: none; text-align: left; margin-left: 0; }
}
@media (max-width: 620px) {
  .series-head { align-items: flex-start; padding: 22px 20px 18px; gap: 16px; }
  .book-pair { width: 70px; height: 78px; }
  .book-pair img { width: 47px; }
  .series-copy h2 { font-size: 20px; }
  .series-card { padding: 20px 20px 18px; }
  .special-card { min-height: 142px; }
  .sub-copy h1 { font-size: 23px; }
  .sub-level { width: 42px; height: 42px; font-size: 15px; }
  .ticket-grid { grid-template-columns: 1fr; }
  .mock-summary { padding: 18px 20px; }
}
@media (max-width: 480px) {
  .learn-hero { padding-bottom: 20px; }
  .hero-side { display: none; }
  .hero-copy h1 { font-size: 30px; }
  .hero-copy p { font-size: 11px; }
  .series-head { flex-wrap: wrap; }
  .series-copy { flex-basis: calc(100% - 86px); }
  .special-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .special-card { min-height: 132px; padding: 14px 13px 13px; }
  .special-card h3 { font-size: 16px; margin-top: 9px; }
  .special-card p { font-size: 9.5px; }
  .special-foot { padding-top: 10px; }
  .special-num { font-size: 19px; }
  .special-chip { display: none; }
  .mode-card { padding: 20px 16px; gap: 13px; }
  .mode-index { width: 30px; height: 30px; }
  .mode-top h3 { font-size: 17px; }
  .mode-copy p { font-size: 10.5px; }
  .mock-summary { gap: 16px; }
}
@media (max-width: 360px) {
  .special-grid { grid-template-columns: 1fr; }
  .special-card { min-height: 118px; }
  .empty-state { padding: 36px 20px; }
  .empty-actions { flex-direction: column; align-items: stretch; }
}
</style>
