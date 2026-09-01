<template>
  <div class="container">
    <!-- 难度选择 -->
    <LevelSelector show-hint class="level-sel" />

    <div class="hero">
      <h1>🌸 樱花日语</h1>
      <p class="subtitle">红蓝宝书 · 文字·词汇·文法 · 纯前端离线学习</p>
      <button class="btn btn-secondary btn-sm" @click="$router.push('/my')">📊 查看我的统计</button>
    </div>

    <!-- 学习板块：背词 + 文法 -->
    <div class="section-title">学习</div>
    <div class="mode-grid">
      <div class="mode-card" @click="$router.push('/words')">
        <div class="emoji">🌸</div>
        <h3>背词</h3>
        <p>红宝书词汇 · 新学/复习/笔记 · 多种题型 · 音调标注</p>
      </div>
      <div class="mode-card" @click="$router.push('/study')">
        <div class="emoji">📘</div>
        <h3>文法</h3>
        <p>蓝宝书文法 N5~N1 · 顺序/分页阅读 · 目录标记</p>
      </div>
    </div>

    <!-- 练习模式 -->
    <template v-if="hasQuiz">
      <div class="section-title">{{ currentTitle }} · 练习模式</div>
      <div class="mode-grid">
        <div class="mode-card" @click="startQuiz('sequential')">
          <div class="emoji">📖</div>
          <h3>顺序答题</h3>
          <p>按题目编号从指定题号开始，逐题系统复习。题号标记答题状态。</p>
        </div>
        <div class="mode-card" @click="startQuiz('random')">
          <div class="emoji">🎲</div>
          <h3>随机抽题</h3>
          <p>默认优先抽取未做过的题目，也可设置为完全随机，检验真实水平。</p>
        </div>
        <div class="mode-card" @click="$router.push('/units')">
          <div class="emoji">📚</div>
          <h3>单元练习</h3>
          <p>按教材单元逐题练习，即时查看解析，不限时，适合针对性巩固。</p>
        </div>
      </div>

      <!-- 模拟测试 -->
      <div class="section-title">{{ currentTitle }} · 模拟测试（第1~5回）</div>
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

    <!-- 无题库等级：占位 -->
    <div v-else class="placeholder-card">
      <div class="emoji">📚</div>
      <h3>{{ currentTitle }}题库待补充</h3>
      <p>当前等级的刷题题库正在准备中，敬请期待。可以先通过「背词」和「文法」学习该等级内容。</p>
    </div>

    <div style="text-align:center; margin-top:32px;">
      <button class="btn btn-ghost btn-sm" @click="confirmReset">重置学习记录</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { levelConfig, levelTitle, hasQuizData, mockInfo } from '../data/questions'
import { useStore } from '../store/useStore'
import { useLevel } from '../store/levelStore'
import LevelSelector from '../components/LevelSelector.vue'

const router = useRouter()
const store = useStore()
const { level } = useLevel()

const currentTitle = computed(() => levelTitle(level.value))
const hasQuiz = computed(() => hasQuizData(level.value))

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

function startQuiz(mode) {
  router.push({ name: 'quiz', params: { mode } })
}

function startMock(id) {
  router.push({ name: 'quiz', params: { mode: 'mock' }, query: { mock: id } })
}

function confirmReset() {
  if (confirm('确定要清空所有学习记录（答题记录、错题、收藏）吗？')) {
    store.resetAll()
  }
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
