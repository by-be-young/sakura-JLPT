<template>
  <div class="container">
    <!-- 难度选择 -->
    <LevelSelector show-hint class="level-sel" />

    <div class="hero">
      <h1>🌸 樱花日语</h1>
      <button class="btn btn-secondary btn-sm" @click="$router.push('/my')">📊 查看我的统计</button>
    </div>

    <!-- 学习板块：背词 + 文法 -->
    <div class="section-title">学习</div>
    <div class="mode-grid">
      <div class="mode-card" @click="$router.push('/words')">
        <div class="emoji">🌸</div>
        <h3>背词</h3>
        <p>词汇卡片 · 复习 · 笔记</p>
      </div>
      <div class="mode-card" @click="$router.push('/study')">
        <div class="emoji">📘</div>
        <h3>文法</h3>
        <p>文法详解 · 例句学习</p>
      </div>
    </div>

    <!-- 练习模式：学习中心入口 -->
    <div class="section-title">练习</div>
    <div class="mode-grid">
      <div class="mode-card" @click="$router.push({ path: '/learn', query: { mode: 'bank' } })">
        <div class="emoji">📝</div>
        <h3>题库练习</h3>
        <p>单元 / 顺序 / 随机刷题</p>
      </div>
      <div class="mode-card" @click="$router.push({ path: '/learn', query: { mode: 'mock' } })">
        <div class="emoji">🧪</div>
        <h3>模拟测试</h3>
        <p>全真模拟 · 成绩记录</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import LevelSelector from '../components/LevelSelector.vue'
</script>

<style scoped>
.level-sel {
  margin-bottom: 18px;
}
</style>
