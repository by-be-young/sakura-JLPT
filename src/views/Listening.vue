<template>
  <div class="container">
    <!-- 头部 -->
    <div class="list-header">
      <h2>🎧 听解 · 绿宝书 N2</h2>
    </div>

    <!-- 单元列表 -->
    <div class="unit-grid">
      <div v-for="u in listeningUnits" :key="u.id" class="unit-card" @click="go(u.id)">
        <div class="unit-head">
          <span class="unit-badge">Unit {{ u.id }}</span>
          <span class="unit-audio">🎧 音频</span>
        </div>
        <h3 class="unit-title">{{ u.title }}</h3>
        <p class="unit-theme">{{ u.theme }}</p>
        <div class="unit-stats">
          <span class="stat"><b>{{ stats(u).words }}</b> 词汇</span>
          <span class="stat"><b>{{ stats(u).questions }}</b> 题目</span>
          <span class="stat"><b>{{ stats(u).knowledge }}</b> 知识点</span>
        </div>
        <div class="unit-go">进入单元 →</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { listeningUnits, unitSummary } from '../data/listening'

const router = useRouter()
function stats(u) { return unitSummary(u) }
function go(id) { router.push('/listening/' + id) }
</script>

<style scoped>
.unit-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.unit-card {
  background: #fff;
  border-radius: var(--radius);
  padding: 22px;
  box-shadow: var(--shadow);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.25s;
  position: relative;
}
.unit-card:hover {
  border-color: var(--sakura-300);
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}
.unit-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.unit-badge {
  background: linear-gradient(135deg, var(--sakura-400), var(--sakura-600));
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: 20px;
}
.unit-audio { font-size: 13px; color: var(--ink-light); }
.unit-title { font-size: 22px; color: var(--ink); margin-bottom: 4px; }
.unit-theme { font-size: 13px; color: var(--ink-light); margin-bottom: 14px; }
.unit-stats {
  display: flex;
  gap: 14px;
  font-size: 13px;
  color: var(--ink-light);
  margin-bottom: 14px;
}
.unit-stats .stat b { color: var(--sakura-600); font-size: 16px; margin-right: 2px; }
.unit-go {
  font-size: 13px;
  font-weight: 600;
  color: var(--sakura-500);
}
@media (max-width: 640px) {
  .unit-grid { grid-template-columns: 1fr; }
}
</style>
