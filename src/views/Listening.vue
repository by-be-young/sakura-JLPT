<template>
  <div class="container">
    <!-- 头部 -->
    <div class="list-header">
      <div class="list-title">
        <img class="hero-cover" src="./covers/listening-green.svg" alt="绿宝书 · 听解" />
        <h2>🎧 {{ level }} · 听解</h2>
      </div>
      <button class="btn btn-ghost btn-sm" @click="$router.push('/learn')">← 练习</button>
    </div>
    <p class="list-desc">
      绿宝书《新日本语能力考试{{ level }}听解（详解+练习）》单元训练。每单元含词汇、题目与补充知识，可扫码播放对应音频。
    </p>

    <!-- 单元列表 -->
    <div class="unit-grid stagger">
      <div v-for="u in units" :key="u.id" class="unit-card" @click="go(u.id)">
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
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { listeningUnits as n2Units, unitSummary as n2Summary } from '../data/listening'
import { listeningUnits as n1Units, unitSummary as n1Summary } from '../data/listening-n1'
import { useLevel } from '../store/levelStore'

const router = useRouter()
const { level } = useLevel()
const isN1 = computed(() => level.value === 'N1')
const units = computed(() => (isN1.value ? n1Units : n2Units))
function stats(u) { return (isN1.value ? n1Summary : n2Summary)(u) }
function go(id) { router.push('/listening/' + id) }
</script>

<style scoped>
/* 与读解列表页保持完全一致的页头说明 */
.list-desc {
  font-size: 13px;
  color: var(--ink-2, #888);
  margin: 0 0 16px;
  line-height: 1.7;
}
.unit-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.unit-card {
  background: var(--card-grad);
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
