<template>
  <div class="container study-page">
    <div class="study-header">
      <button class="btn btn-ghost btn-sm" @click="$router.push('/')">← 返回</button>
      <h2 class="page-title">🌸 文法 · 蓝宝书</h2>
      <div class="header-spacer"></div>
    </div>

    <!-- 等级选择（与全局同步） -->
    <LevelSelector class="level-sel" />

    <!-- 当前等级章节 -->
    <div v-if="chapter" class="chapter-grid">
      <div class="chapter-card" :class="chapter.id.toLowerCase()" @click="openLevel(chapter.id)">
        <div class="chapter-top">
          <span class="chapter-badge">{{ chapter.id }}</span>
          <span class="chapter-count">{{ chapter.pointCount }} 点</span>
        </div>
        <div class="chapter-name">{{ chapter.title }}</div>
        <div class="chapter-meta">
          <span v-if="chapter.unitCount" class="meta-item">📚 {{ chapter.unitCount }} 个单元</span>
          <span class="meta-item">{{ chapter.pointCount }} 点</span>
          <span v-if="chapter.learnedCount" class="meta-item learned">📖 已学 {{ chapter.learnedCount }}</span>
          <span v-if="chapter.markedCount" class="meta-item marked">★ 已标记 {{ chapter.markedCount }}</span>
        </div>
        <div class="chapter-progress">
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: chapter.learnedPercent + '%' }"></div>
          </div>
          <span class="progress-text">{{ chapter.learnedPercent }}%</span>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <div class="emoji">📘</div>
      <p>当前等级暂无文法内容</p>
    </div>

    <div class="reset-area">
      <button class="btn btn-ghost btn-sm" @click="confirmClearMarks">🗑 清空标记</button>
      <button class="btn btn-ghost btn-sm" @click="confirmClearProgress">🗑 清空学习进度</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { grammarLevels } from '../data/grammar'
import { useGrammarStore } from '../store/grammarStore'
import { useLevel } from '../store/levelStore'
import { levelTitle } from '../data/questions'
import LevelSelector from '../components/LevelSelector.vue'

const router = useRouter()
const store = useGrammarStore()
const { level } = useLevel()
const currentTitle = computed(() => levelTitle(level.value))

const chapter = computed(() => {
  const lv = grammarLevels.find(l => l.id === level.value)
  if (!lv) return null
  const points = lv.units.flatMap(u => u.points)
  const markedCount = store.markedCountOf(points)
  const learnedCount = store.learnedCountOf(points)
  return {
    id: lv.id,
    title: lv.name.replace(' 文法详解（整理版）', '').replace('文法详解（整理版）', ''),
    unitCount: lv.units.length,
    pointCount: points.length,
    markedCount,
    learnedCount,
    markedPercent: points.length ? Math.round(markedCount / points.length * 100) : 0,
    learnedPercent: points.length ? Math.round(learnedCount / points.length * 100) : 0,
  }
})

function openLevel(id) {
  router.push({ path: `/study/${id.toLowerCase()}` })
}

function confirmClearMarks() {
  if (confirm('确定要清空所有 ★ 文法标记吗？阅读进度不受影响。')) {
    store.clearMarks()
  }
}

function confirmClearProgress() {
  if (confirm('确定要清空文法阅读进度（已读、位置、阅读模式）吗？标记不受影响。')) {
    store.clearProgress()
  }
}
</script>

<style scoped>
.study-page { max-width: 960px; }
.study-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.page-title { margin: 0; font-size: 22px; color: #c2556f; }
.header-spacer { flex: 1; }
.level-sel {
  margin-bottom: 16px;
}
.chapter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}
.chapter-card {
  background: #fffafc;
  border: 2px solid #ffd3e0;
  border-radius: 18px;
  padding: 18px;
  cursor: pointer;
  transition: all 0.22s;
  position: relative;
  overflow: hidden;
}
.chapter-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ff9dbd, #ff7da0);
  opacity: 0;
  transition: opacity 0.22s;
}
.chapter-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 26px rgba(255, 125, 160, 0.22);
  border-color: #ff9dbd;
}
.chapter-card:hover::before { opacity: 1; }
.chapter-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.chapter-badge {
  background: linear-gradient(145deg, #ff9dbd, #ff7da0);
  color: #fff;
  font-weight: 800;
  font-size: 15px;
  padding: 4px 14px;
  border-radius: 14px;
  letter-spacing: 1px;
}
.chapter-count { font-size: 12px; color: #b98a94; }
.chapter-name { font-size: 17px; font-weight: 700; color: #7a4b55; margin-bottom: 8px; }
.chapter-meta { display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
.meta-item { font-size: 12px; color: #b98a94; }
.meta-item.learned { color: #5b9d7a; }
.meta-item.marked { color: #e08a00; }
.chapter-progress { display: flex; align-items: center; gap: 10px; }
.progress-track {
  flex: 1;
  height: 8px;
  background: #ffe3ec;
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff9dbd, #ff7da0);
  border-radius: 4px;
  transition: width 0.4s;
}
.progress-text { font-size: 12px; color: #c2556f; font-weight: 600; min-width: 38px; text-align: right; }

.reset-area {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
  flex-wrap: wrap;
}

@media (max-width: 480px) {
  .chapter-grid { grid-template-columns: 1fr; }
}
</style>
