<template>
  <div class="container study-page">
    <!-- 页头 -->
    <div class="study-hero">
      <div>
        <div class="hero-title">🌸 文法 · 蓝宝书</div>
        <div class="hero-sub">{{ currentTitle }} · 系统语法体系 · 详解例句</div>
      </div>
      <span class="hero-badge">{{ level }}</span>
    </div>

    <!-- 当前等级总览 -->
    <div v-if="chapter" class="grammar-overview" @click="openLevel(chapter.id)">
      <div class="go-left">
        <div class="go-badge">{{ chapter.id }}</div>
        <div class="go-name">{{ chapter.title }}</div>
        <div class="go-meta">
          <span>📚 {{ chapter.unitCount }} 个单元</span>
          <span>✦ 共 {{ chapter.pointCount }} 个语法点</span>
        </div>
        <div class="go-tags">
          <span v-if="chapter.learnedCount" class="go-tag learned">📖 已学 {{ chapter.learnedCount }}</span>
          <span v-if="chapter.markedCount" class="go-tag marked">★ 已标记 {{ chapter.markedCount }}</span>
          <span v-if="!chapter.learnedCount && !chapter.markedCount" class="go-tag hint">从第一个单元开始学习</span>
        </div>
      </div>
      <div class="go-right">
        <div class="go-ring">
          <svg width="112" height="112" viewBox="0 0 112 112">
            <defs>
              <linearGradient id="goGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ff9dbd" />
                <stop offset="100%" stop-color="#ff7da0" />
              </linearGradient>
            </defs>
            <circle cx="56" cy="56" r="47" fill="none" stroke="rgba(128,128,128,0.14)" stroke-width="10" />
            <circle cx="56" cy="56" r="47" fill="none" stroke="url(#goGrad)" stroke-width="10" stroke-linecap="round"
              :stroke-dasharray="goC" :stroke-dashoffset="goOffset" />
          </svg>
          <div class="go-ring-center">
            <div class="go-pct">{{ chapter.learnedPercent }}<small>%</small></div>
            <div class="go-pct-label">已学进度</div>
          </div>
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

const router = useRouter()
const store = useGrammarStore()
const { level } = useLevel()
const currentTitle = computed(() => levelTitle(level.value))

// 文法总览环：2π × 47
const goC = 2 * Math.PI * 47
const goOffset = computed(() => goC - (goC * (chapter.value?.learnedPercent || 0)) / 100)

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
.level-sel {
  margin-bottom: 16px;
}

/* 页头 */
.study-hero {
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

/* 文法总览大卡 */
.grammar-overview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  border-radius: 24px;
  padding: 26px 24px;
  box-shadow: var(--card-float);
  cursor: pointer;
  transition: all 0.22s;
  background: linear-gradient(150deg, rgba(255, 224, 178, 0.5), rgba(255, 247, 230, 0.2));
}
[data-theme="dark"] .grammar-overview { background: linear-gradient(150deg, rgba(217, 152, 61, 0.18), rgba(42, 34, 26, 0.08)); }
.grammar-overview:hover { transform: translateY(-3px); }
.go-left { min-width: 0; }
.go-badge {
  display: inline-block;
  background: linear-gradient(145deg, #ff9dbd, #ff7da0);
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  padding: 4px 14px;
  border-radius: 999px;
  letter-spacing: 1px;
}
.go-name { font-size: 22px; font-weight: 800; margin: 12px 0 8px; }
.go-meta { display: flex; gap: 14px; font-size: 12.5px; color: var(--text-light); flex-wrap: wrap; }
.go-tags { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
.go-tag { padding: 4px 12px; border-radius: 999px; font-size: 11.5px; font-weight: 600; }
.go-tag.learned { background: rgba(91, 157, 122, 0.14); color: #5b9d7a; }
.go-tag.marked { background: rgba(224, 138, 0, 0.14); color: #e08a00; }
.go-tag.hint { background: rgba(255, 125, 160, 0.12); color: var(--sakura-600); }
.go-right { flex-shrink: 0; }
.go-ring { position: relative; width: 112px; height: 112px; }
.go-ring svg { transform: rotate(-90deg); }
.go-ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.go-pct { font-size: 23px; font-weight: 800; color: var(--sakura-600); line-height: 1; }
.go-pct small { font-size: 12px; }
.go-pct-label { font-size: 10px; color: var(--text-light); margin-top: 3px; }

/* 窄屏适配 */
@media (max-width: 520px) {
  .grammar-overview { flex-direction: column; align-items: flex-start; }
  .go-right { align-self: center; }
}

.reset-area {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
  flex-wrap: wrap;
}
</style>
