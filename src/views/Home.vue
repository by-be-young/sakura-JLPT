<template>
  <div class="container">
    <div class="hero">
      <h1>🌸 樱花日语 N2 刷题</h1>
      <p class="subtitle">红蓝宝书1000题 · 文字·词汇·文法 · 纯前端离线学习</p>
      <button class="btn btn-secondary btn-sm" @click="$router.push('/stats')">📊 查看学习统计</button>
    </div>

    <!-- 背词板块 -->
    <div class="section-title">背词</div>
    <div class="mode-grid">
      <div class="mode-card" @click="$router.push('/words')">
        <div class="emoji">🌸</div>
        <h3>背词</h3>
        <p>红宝书词汇 · 新学/复习/笔记 · 多种题型 · 音调标注</p>
      </div>
    </div>

    <!-- 练习模式 -->
    <div class="section-title">练习模式</div>
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
    <div class="section-title">模拟测试（第1~5回）</div>
    <div class="mock-list">
      <div v-for="m in mockList" :key="m.id" class="mock-item" @click="startMock(m.id)">
        <div class="round">第{{ m.id }}回</div>
        <div class="cnt">{{ m.count }}题</div>
        <div v-if="store.state.mockResults[m.id]" class="score">
          {{ store.state.mockResults[m.id].correct }}/{{ store.state.mockResults[m.id].total }}
        </div>
      </div>
    </div>

    <div style="text-align:center; margin-top:32px;">
      <button class="btn btn-ghost btn-sm" @click="confirmReset">重置学习记录</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { mockInfo } from '../data/questions'
import { useStore } from '../store/useStore'

const router = useRouter()
const store = useStore()

const mockList = computed(() => {
  return Object.entries(mockInfo).map(([id, info]) => ({ id: Number(id), ...info }))
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
