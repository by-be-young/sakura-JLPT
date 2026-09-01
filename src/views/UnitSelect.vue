<template>
  <div class="container">
    <div class="list-header">
      <h2>📚 {{ level }} 单元练习</h2>
      <button class="btn btn-ghost btn-sm" @click="$router.push('/')">← 返回首页</button>
    </div>

    <p class="page-desc">按教材单元逐题练习，即时查看解析，不限时，适合针对性巩固。</p>

    <div class="unit-grid">
      <div v-for="u in unitList" :key="u.id" class="unit-card" @click="startUnit(u.id)">
        <div class="unit-header">
          <span class="unit-badge">第{{ u.id }}单元</span>
          <span class="unit-count">{{ u.count }}题</span>
        </div>
        <div class="unit-progress">
          <div class="unit-progress-bar" :style="{ width: u.progress + '%' }"></div>
        </div>
        <div class="unit-stats">
          <div class="stat">
            <span class="stat-num">{{ u.answered }}</span>
            <span class="stat-label">已答</span>
          </div>
          <div class="stat">
            <span class="stat-num" :class="u.answered > 0 && u.accuracy >= 60 ? 'good' : u.answered > 0 ? 'bad' : ''">
              {{ u.answered > 0 ? u.accuracy + '%' : '--' }}
            </span>
            <span class="stat-label">正确率</span>
          </div>
          <div class="stat">
            <span class="stat-num" style="color:var(--red);">{{ u.wrong }}</span>
            <span class="stat-label">错题</span>
          </div>
        </div>
        <div class="unit-footer">
          <span class="unit-range">No.{{ u.start }} ~ No.{{ u.end }}</span>
          <span class="start-text">开始练习 →</span>
        </div>
      </div>
    </div>

    <div v-if="unassignedCount > 0" class="unassigned-note">
      另有 {{ unassignedCount }} 题未划分单元，可通过「顺序答题」或「随机抽题」练习。
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { levelQuestions } from '../data/questions'
import { useStore } from '../store/useStore'
import { useLevel } from '../store/levelStore'

const router = useRouter()
const store = useStore()
const { level } = useLevel()

const levelQuestionsList = computed(() => levelQuestions(level.value))

const unitList = computed(() => {
  const unitIds = [...new Set(levelQuestionsList.value.filter(q => q.unit !== undefined).map(q => q.unit))]
    .sort((a, b) => a - b)
  return unitIds.map(id => {
    const qs = levelQuestionsList.value.filter(q => q.unit === id).sort((a, b) => a.id - b.id)
    const answered = qs.filter(q => store.getAnswer(q.key)).length
    const correct = qs.filter(q => {
      const a = store.getAnswer(q.key)
      return a && a.correct
    }).length
    const wrong = qs.filter(q => store.state.wrong.includes(q.key)).length
    return {
      id,
      count: qs.length,
      start: qs[0].id,
      end: qs[qs.length - 1].id,
      answered,
      wrong,
      progress: qs.length ? Math.round(answered / qs.length * 100) : 0,
      accuracy: answered ? Math.round(correct / answered * 100) : 0,
    }
  })
})

const unassignedCount = computed(() => levelQuestionsList.value.filter(q => q.unit === undefined).length)

function startUnit(id) {
  router.push({ name: 'quiz', params: { mode: 'unit' }, query: { unit: id } })
}
</script>

<style scoped>
.page-desc {
  color: var(--ink-light);
  font-size: 14px;
  margin-bottom: 20px;
}
.unit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.unit-card {
  background: #fff;
  border-radius: var(--radius);
  padding: 18px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow);
  border: 2px solid var(--sakura-50);
}
.unit-card:hover {
  transform: translateY(-4px);
  border-color: var(--sakura-300);
  box-shadow: 0 8px 24px rgba(233, 120, 150, 0.18);
}
.unit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.unit-badge {
  font-size: 17px;
  font-weight: 700;
  color: var(--sakura-700);
}
.unit-count {
  font-size: 12px;
  color: var(--ink-light);
  background: var(--sakura-50);
  padding: 2px 10px;
  border-radius: 10px;
}
.unit-progress {
  height: 8px;
  background: #f0ecee;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 14px;
}
.unit-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--sakura-300), var(--sakura-500));
  border-radius: 4px;
  transition: width 0.3s;
}
.unit-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 14px;
  padding: 10px 0;
  border-top: 1px solid var(--sakura-50);
  border-bottom: 1px solid var(--sakura-50);
}
.stat {
  text-align: center;
}
.stat-num {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: var(--ink);
}
.stat-num.good { color: var(--green); }
.stat-num.bad { color: var(--red); }
.stat-label {
  font-size: 11px;
  color: var(--ink-light);
}
.unit-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.unit-range {
  font-size: 11px;
  color: #bbb;
}
.start-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--sakura-600);
}
.unassigned-note {
  margin-top: 24px;
  padding: 12px 16px;
  background: #fff8f0;
  border-radius: 8px;
  font-size: 13px;
  color: #a07a4a;
  text-align: center;
}
</style>
