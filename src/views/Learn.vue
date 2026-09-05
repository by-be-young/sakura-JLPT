<template>
  <div class="container">
    <!-- 难度选择 -->
    <LevelSelector class="level-sel" />

    <!-- 无任何内容等级：占位 -->
    <div v-if="!hasQuiz && !readingAvailable" class="placeholder-card">
      <div class="emoji">📚</div>
      <h3>{{ currentTitle }}题库待补充</h3>
      <p>当前等级的刷题题库正在准备中，敬请期待。可以先通过「背词」和「文法」学习该等级内容。</p>
    </div>

    <!-- 选择：题库练习 / 模拟测试 / 读解 -->
    <template v-else-if="!mode">
      <div class="list-header">
        <h2>📚 {{ currentTitle }} · 学习</h2>
      </div>
      <div class="mode-grid">
        <div class="mode-card" :class="{ disabled: !hasQuiz }" @click="hasQuiz && choose('bank')">
          <div class="emoji">📝</div>
          <h3>题库练习 {{ hasQuiz ? '' : '（待补充）' }}</h3>
          <p>顺序答题 · 随机抽题 · 单元练习，逐题巩固，即时解析。</p>
        </div>
        <div class="mode-card" :class="{ disabled: !hasQuiz }" @click="hasQuiz && choose('mock')">
          <div class="emoji">🧪</div>
          <h3>模拟测试 {{ hasQuiz ? '' : '（待补充）' }}</h3>
          <p>按回次模拟考试，检验真实水平，查看得分。</p>
        </div>
        <div class="mode-card" :class="{ disabled: !readingAvailable }" @click="readingAvailable && router.push('/reading')">
          <div class="emoji">📖</div>
          <h3>读解 {{ readingAvailable ? '' : '（待补充）' }}</h3>
          <p>文章阅读训练：读文章答问题，整篇完成后解锁全文翻译与难句分析。</p>
        </div>
        <div class="mode-card" @click="router.push('/listening')">
          <div class="emoji">🎧</div>
          <h3>听解</h3>
          <p>绿宝书N2听解：词汇 · 题目 · 补充知识，三个板块自由练习（当前 N2）。</p>
        </div>
      </div>
    </template>

    <!-- 题库练习 -->
    <template v-else-if="mode === 'bank'">
      <div class="list-header">
        <h2>📝 {{ currentTitle }} · 题库练习</h2>
        <button class="btn btn-ghost btn-sm" @click="$router.replace({ query: {} })">← 选择方式</button>
      </div>
      <div class="mode-grid">
        <div class="mode-card" @click="router.push('/quiz/sequential')">
          <div class="emoji">📖</div>
          <h3>顺序答题</h3>
          <p>按题目编号从指定题号开始，逐题系统复习。题号标记答题状态。</p>
        </div>
        <div class="mode-card" @click="router.push('/quiz/random')">
          <div class="emoji">🎲</div>
          <h3>随机抽题</h3>
          <p>默认优先抽取未做过的题目，也可设置为完全随机，检验真实水平。</p>
        </div>
        <div class="mode-card" @click="router.push('/units')">
          <div class="emoji">📚</div>
          <h3>单元练习</h3>
          <p>按教材单元逐题练习，即时查看解析，不限时，适合针对性巩固。</p>
        </div>
      </div>
    </template>

    <!-- 模拟测试 -->
    <template v-else-if="mode === 'mock'">
      <div class="list-header">
        <h2>🧪 {{ currentTitle }} · 模拟测试</h2>
        <button class="btn btn-ghost btn-sm" @click="$router.replace({ query: {} })">← 选择方式</button>
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
import { levelConfig, levelTitle, hasQuizData, mockInfo } from '../data/questions'
import { useStore } from '../store/useStore'
import { useLevel } from '../store/levelStore'
import LevelSelector from '../components/LevelSelector.vue'

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
  background: #fffafc;
  border: 2px dashed var(--sakura-200, #ffc9d9);
  border-radius: 20px;
  padding: 40px 24px;
  text-align: center;
  margin: 8px 0 8px;
}
.placeholder-card .emoji { font-size: 42px; margin-bottom: 10px; }
.placeholder-card h3 { color: #c2556f; margin: 0 0 8px; }
.placeholder-card p { color: #b98a94; font-size: 13px; line-height: 1.7; margin: 0; }
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
