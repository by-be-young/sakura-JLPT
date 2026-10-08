<template>
  <div class="container">
    <!-- 无任何内容等级：占位 -->
    <div v-if="!hasQuiz && !readingAvailable" class="placeholder-card">
      <div class="emoji">📚</div>
      <h3>{{ currentTitle }}题库待补充</h3>
      <p>当前等级的刷题题库正在准备中，敬请期待。可以先通过「背词」和「文法」学习该等级内容。</p>
    </div>

    <!-- 选择：题库练习 / 模拟测试 / 读解 / 听解 -->
    <template v-else-if="!mode">
      <div class="learn-hero">
        <div>
          <div class="hero-title">📚 练习中心</div>
          <div class="hero-sub">{{ currentTitle }} · 真题演练 · 全真模拟</div>
        </div>
        <span class="hero-badge">{{ level }}</span>
      </div>

      <div class="learn-grid">
        <div class="learn-card lc-quiz" :class="{ disabled: !hasQuiz }" @click="hasQuiz && choose('bank')">
          <div class="lc-top">
            <span class="lc-icon">📝</span>
            <span class="lc-name">题库练习</span>
            <span class="lc-arrow">›</span>
          </div>
          <div class="lc-num">{{ quizStats.total }}<small>题</small></div>
          <div class="lc-desc">顺序 · 随机 · 单元三种模式，逐题巩固</div>
          <div class="lc-progress">
            <div class="bar-track"><div class="bar-fill" :style="{ width: quizStats.pct + '%' }"></div></div>
            <span class="lc-pct">{{ quizStats.pct }}%</span>
          </div>
        </div>

        <div class="learn-card lc-mock" :class="{ disabled: !hasQuiz }" @click="hasQuiz && choose('mock')">
          <div class="lc-top">
            <span class="lc-icon">🧪</span>
            <span class="lc-name">模拟测试</span>
            <span class="lc-arrow">›</span>
          </div>
          <div class="lc-num">{{ mockStats.count }}<small>套卷</small></div>
          <div class="lc-desc">{{ mockStats.done ? '已完成 ' + mockStats.done + ' 套 · 平均 ' + mockStats.avg + ' 分' : '按回次全真模拟，检验真实水平' }}</div>
          <div class="lc-progress">
            <div class="bar-track"><div class="bar-fill mock" :style="{ width: mockStats.pct + '%' }"></div></div>
            <span class="lc-pct">{{ mockStats.pct }}%</span>
          </div>
        </div>

        <div class="learn-card lc-reading" :class="{ disabled: !readingAvailable }" @click="readingAvailable && router.push('/reading')">
          <div class="lc-top">
            <span class="lc-icon">📖</span>
            <span class="lc-name">读解</span>
            <span class="lc-arrow">›</span>
          </div>
          <div class="lc-num">{{ readingCount }}<small>篇</small></div>
          <div class="lc-desc">文章阅读训练 · 答题解析{{ readingAvailable ? '' : '（待补充）' }}</div>
          <div class="lc-progress">
            <span class="lc-desc chip-tag">N1 / N2 已收录</span>
          </div>
        </div>

        <div class="learn-card lc-listen" @click="router.push('/listening')">
          <div class="lc-top">
            <span class="lc-icon">🎧</span>
            <span class="lc-name">听解</span>
            <span class="lc-arrow">›</span>
          </div>
          <div class="lc-num">{{ listeningCount }}<small>单元</small></div>
          <div class="lc-desc">词汇 · 题目 · 补充知识，自由练习</div>
          <div class="lc-progress">
            <span class="lc-desc chip-tag">自由练习</span>
          </div>
        </div>
      </div>
    </template>

    <!-- 题库练习 -->
    <template v-else-if="mode === 'bank'">
      <div class="list-header">
        <h2>📝 {{ currentTitle }} · 题库练习</h2>
        <button class="btn btn-ghost btn-sm" @click="$router.replace({ query: {} })">← 选择方式</button>
      </div>
      <div class="mode-info">
        <span>共 <b>{{ quizStats.total }}</b> 题</span>
        <span>已答 <b>{{ quizStats.answered }}</b> 题</span>
        <span v-if="quizStats.correctRate !== null">正确率 <b>{{ quizStats.correctRate }}%</b></span>
      </div>
      <div class="app-list">
        <div class="app-row" @click="router.push('/quiz/sequential')">
          <span class="row-icon ic-seq">📖</span>
          <div class="row-body">
            <div class="row-title">顺序答题</div>
            <div class="row-desc">按题目编号从指定题号开始，逐题系统复习。题号标记答题状态。</div>
          </div>
          <span class="row-arrow">›</span>
        </div>
        <div class="app-row" @click="router.push('/quiz/random')">
          <span class="row-icon ic-rand">🎲</span>
          <div class="row-body">
            <div class="row-title">随机抽题</div>
            <div class="row-desc">默认优先抽取未做过的题目，也可设置为完全随机，检验真实水平。</div>
          </div>
          <span class="row-arrow">›</span>
        </div>
        <div class="app-row" @click="router.push('/units')">
          <span class="row-icon ic-unit">📚</span>
          <div class="row-body">
            <div class="row-title">单元练习</div>
            <div class="row-desc">按教材单元逐题练习，即时查看解析，不限时，适合针对性巩固。</div>
          </div>
          <span class="row-arrow">›</span>
        </div>
      </div>
    </template>

    <!-- 模拟测试 -->
    <template v-else-if="mode === 'mock'">
      <div class="list-header">
        <h2>🧪 {{ currentTitle }} · 模拟测试</h2>
        <button class="btn btn-ghost btn-sm" @click="$router.replace({ query: {} })">← 选择方式</button>
      </div>
      <div class="mode-info">
        <span>共 <b>{{ mockStats.count }}</b> 套模拟卷</span>
        <span>已完成 <b>{{ mockStats.done }}</b> 套</span>
        <span v-if="mockStats.avg !== null">平均 <b>{{ mockStats.avg }}</b> 分</span>
      </div>
      <div class="mock-list">
        <div v-for="m in mockList" :key="m.id" class="mock-item"
          :class="{ disabled: !m.available }" @click="m.available && startMock(m.id)">
          <div class="round">第{{ m.id }}回</div>
          <div class="cnt">{{ m.available ? m.count + '题' : '待补充' }}</div>
          <div v-if="m.available && store.state.mockResults[m.mockKey]" class="score">
            {{ store.state.mockResults[m.mockKey].correct }}/{{ store.state.mockResults[m.mockKey].total }}
          </div>
          <div v-if="!m.available" class="coming">即将上线</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { levelConfig, levelTitle, hasQuizData, mockInfo, levelQuestionsAll } from '../data/questions'
import { readingN1 } from '../data/reading-n1'
import { readingN2 } from '../data/reading-n2'
import { listeningUnits as n2Listening } from '../data/listening'
import { listeningUnits as n1Listening } from '../data/listening-n1'
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

// 读解 / 听解
const readingCount = computed(() => (level.value === 'N1' ? readingN1 : readingN2).length)
const listeningCount = computed(() => (level.value === 'N1' ? n1Listening : n2Listening).length)

function choose(m) {
  router.replace({ query: { mode: m } })
}

function startMock(id) {
  router.push({ name: 'quiz', params: { mode: 'mock' }, query: { mock: id } })
}
</script>

<style scoped>
.level-sel {
  margin-bottom: 18px;
}
.placeholder-card {
  background: var(--card-hover);
  border: 2px dashed var(--sakura-200, #ffc9d9);
  border-radius: 20px;
  padding: 40px 24px;
  text-align: center;
  margin: 8px 0 8px;
}
.placeholder-card .emoji { font-size: 42px; margin-bottom: 10px; }
.placeholder-card h3 { color: var(--sakura-600); margin: 0 0 8px; }
.placeholder-card p { color: var(--text-light); font-size: 13px; line-height: 1.7; margin: 0; }

/* 页头 */
.learn-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 2px 18px;
}
.hero-title { font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
.hero-sub { font-size: 12px; color: var(--text-light); margin-top: 4px; }
.hero-badge {
  background: linear-gradient(145deg, #ff9dbd, #ff7da0);
  color: #fff;
  font-weight: 800;
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 13px;
  letter-spacing: 1px;
  box-shadow: 0 4px 14px rgba(255, 125, 160, 0.35);
}

/* 2×2 数据大卡 */
.learn-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 20px;
}
.learn-card {
  border-radius: 22px;
  padding: 18px 16px;
  box-shadow: var(--card-float);
  cursor: pointer;
  transition: all 0.22s;
  position: relative;
  overflow: hidden;
}
.learn-card:hover { transform: translateY(-3px); }
.lc-quiz { background: linear-gradient(150deg, rgba(255, 224, 178, 0.5), rgba(255, 247, 230, 0.2)); }
.lc-mock { background: linear-gradient(150deg, rgba(178, 233, 205, 0.5), rgba(234, 250, 240, 0.2)); }
.lc-reading { background: linear-gradient(150deg, rgba(204, 224, 255, 0.5), rgba(238, 245, 255, 0.2)); }
.lc-listen { background: linear-gradient(150deg, rgba(226, 208, 255, 0.5), rgba(246, 239, 255, 0.2)); }
[data-theme="dark"] .lc-quiz { background: linear-gradient(150deg, rgba(217, 152, 61, 0.18), rgba(42, 34, 26, 0.08)); }
[data-theme="dark"] .lc-mock { background: linear-gradient(150deg, rgba(76, 187, 135, 0.18), rgba(29, 42, 36, 0.08)); }
[data-theme="dark"] .lc-reading { background: linear-gradient(150deg, rgba(106, 128, 221, 0.18), rgba(29, 36, 52, 0.08)); }
[data-theme="dark"] .lc-listen { background: linear-gradient(150deg, rgba(150, 108, 220, 0.18), rgba(40, 30, 52, 0.08)); }
.learn-card.disabled { opacity: 0.5; cursor: not-allowed; }
.learn-card.disabled:hover { transform: none; }

.lc-top { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.lc-icon {
  width: 34px; height: 34px;
  border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  font-size: 17px;
  background: rgba(255, 255, 255, 0.55);
}
[data-theme="dark"] .lc-icon { background: rgba(255, 255, 255, 0.08); }
.lc-name { font-size: 15px; font-weight: 700; }
.lc-arrow { margin-left: auto; font-size: 20px; color: var(--text-faint); }
.lc-num { font-size: 30px; font-weight: 800; color: var(--text); line-height: 1; }
.lc-num small { font-size: 12px; color: var(--text-light); font-weight: 600; margin-left: 2px; }
.lc-desc { font-size: 11.5px; color: var(--text-light); margin-top: 5px; line-height: 1.5; }
.lc-progress { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
.lc-progress .bar-track {
  flex: 1; height: 5px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 3px; overflow: hidden;
}
[data-theme="dark"] .lc-progress .bar-track { background: rgba(255, 255, 255, 0.1); }
.lc-progress .bar-fill {
  height: 100%; border-radius: 3px;
  background: linear-gradient(90deg, var(--sakura-400), var(--sakura-600));
}
.lc-progress .bar-fill.mock { background: linear-gradient(90deg, #4cbb87, #2e9e6b); }
.lc-pct { font-size: 11px; color: var(--sakura-600); font-weight: 700; }
.chip-tag {
  background: rgba(255, 255, 255, 0.55);
  padding: 4px 10px;
  border-radius: 999px;
  margin-top: 0;
}
[data-theme="dark"] .chip-tag { background: rgba(255, 255, 255, 0.08); }

/* 子页信息条 */
.mode-info {
  display: flex;
  gap: 16px;
  padding: 0 2px 14px;
  font-size: 12.5px;
  color: var(--text-light);
  flex-wrap: wrap;
}
.mode-info b { color: var(--sakura-600); font-weight: 800; }

/* 入口图标色块（与首页一致） */
.app-row .row-icon.ic-seq { background: linear-gradient(145deg, #eef5ff, #dcebff); }
.app-row .row-icon.ic-rand { background: linear-gradient(145deg, #f3e8ff, #e9dcff); }
.app-row .row-icon.ic-unit { background: linear-gradient(145deg, #fff0f5, #ffe0ec); }

.mock-item.disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.mode-card.disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.mode-card.disabled:hover {
  transform: none;
  box-shadow: var(--shadow);
}
.mock-item.disabled:hover {
  transform: none;
  box-shadow: var(--shadow);
}
.coming {
  font-size: 11px;
  color: var(--sakura-600);
  margin-top: 4px;
  font-weight: 600;
}
</style>
