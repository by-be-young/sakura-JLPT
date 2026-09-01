<template>
  <div class="container study-page">
    <div class="study-header">
      <button class="btn btn-ghost btn-sm" @click="$router.push('/')">← 返回</button>
      <h2 class="page-title">🌸 文法 · 蓝宝书</h2>
      <div class="header-spacer"></div>
    </div>

    <!-- 等级选择（与全局同步） -->
    <div class="level-tabs">
      <button v-for="lv in APP_LEVELS" :key="lv.id" class="level-tab"
        :class="{ active: level === lv.id }" @click="setLevel(lv.id)">
        {{ lv.name }}
      </button>
    </div>

    <p class="study-sub">《超值白金版·蓝宝书大全集 新日本语能力考试 N1-N5 文法详解》整理版。当前显示 {{ currentTitle }} 章节，选择章节开始阅读，可在目录中对某个文法点做标记。</p>

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

    <div class="study-tips">
      <div class="section-title">阅读方式</div>
      <div class="tip-list">
        <div class="tip-item"><b>顺序阅读</b>：进入后按章节连续向下滚动，目录点击可跳转。</div>
        <div class="tip-item"><b>分页阅读</b>：每个文法点占一页。<span class="kbd">D</span> 或鼠标向左拖动、或点击页面右侧翻下一页；<span class="kbd">A</span> 或点击页面左侧翻上一页。</div>
        <div class="tip-item"><b>目录标记</b>：打开侧边目录，可对任意文法点点击 ★ 做标记，便于复习定位。</div>
      </div>
    </div>

    <div class="reset-area">
      <button class="btn btn-ghost btn-sm" @click="confirmReset">🗑 清空学习记录</button>
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

const router = useRouter()
const store = useGrammarStore()
const { level, setLevel, APP_LEVELS } = useLevel()
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

function confirmReset() {
  if (confirm('确定要清空学习板块的所有记录（目录标记、阅读进度、阅读模式）吗？')) {
    store.resetAll()
  }
}
</script>

<style scoped>
.study-page { max-width: 860px; }
.study-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.page-title { margin: 0; font-size: 22px; color: #c2556f; }
.header-spacer { flex: 1; }
.level-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.level-tab {
  padding: 8px 18px;
  border-radius: 24px;
  border: 2px solid #ffd3e0;
  background: #fffafc;
  color: #c2556f;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  font-size: 14px;
}
.level-tab.active {
  background: linear-gradient(145deg, #ff9dbd, #ff7da0);
  color: #fff;
  border-color: #ff7da0;
  box-shadow: 0 4px 14px rgba(255, 125, 160, 0.35);
}
.study-sub {
  color: #b98a94;
  font-size: 13px;
  line-height: 1.7;
  margin-bottom: 20px;
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

.study-tips { margin-bottom: 20px; }
.tip-list { display: flex; flex-direction: column; gap: 8px; }
.tip-item {
  background: #fffafc;
  border: 1px solid #ffe3ec;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
  color: #7a4b55;
  line-height: 1.6;
}
.kbd {
  display: inline-block;
  background: #fff;
  border: 1px solid #ffc9d9;
  border-bottom-width: 2px;
  border-radius: 5px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: #c2556f;
  font-family: inherit;
}
.reset-area { text-align: center; }

@media (max-width: 480px) {
  .chapter-grid { grid-template-columns: 1fr; }
}
</style>
