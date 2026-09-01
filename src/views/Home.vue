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

    <!-- 练习模式：学习中心入口 -->
    <div class="section-title">{{ currentTitle }} · 练习模式</div>
    <div class="mode-grid">
      <div class="mode-card" @click="$router.push({ path: '/learn', query: { mode: 'bank' } })">
        <div class="emoji">📝</div>
        <h3>题库练习</h3>
        <p>顺序答题 · 随机抽题 · 单元练习，逐题巩固，即时解析。</p>
      </div>
      <div class="mode-card" @click="$router.push({ path: '/learn', query: { mode: 'mock' } })">
        <div class="emoji">🧪</div>
        <h3>模拟测试</h3>
        <p>按回次模拟考试，检验真实水平，查看得分。</p>
      </div>
    </div>

    <div style="text-align:center; margin-top:32px;">
      <button class="btn btn-ghost btn-sm" @click="confirmReset">重置学习记录</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { levelTitle } from '../data/questions'
import { useStore } from '../store/useStore'
import { useLevel } from '../store/levelStore'
import LevelSelector from '../components/LevelSelector.vue'

const store = useStore()
const { level } = useLevel()

const currentTitle = computed(() => levelTitle(level.value))

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
</style>
