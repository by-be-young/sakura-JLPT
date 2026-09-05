<template>
  <div class="container">
    <div class="list-header">
      <h2>📖 {{ level }} · 读解</h2>
      <button class="btn btn-ghost btn-sm" @click="$router.push('/learn')">← 练习</button>
    </div>
    <p class="list-desc">
      橙宝书《新日本语能力考试{{ level }}读解》阅读训练。答完本篇文章全部题目后，可解锁查看全文翻译与难句分析。
    </p>

    <div v-if="groups.length === 0" class="placeholder-card">
      <div class="emoji">📖</div>
      <h3>读解题库待补充</h3>
      <p>当前等级的读解文章正在分批录入中，敬请期待。</p>
    </div>

    <div v-for="g in groups" :key="g.key" class="unit-group">
      <div class="unit-head">
        <span class="part-tag">{{ g.part }}</span>
        <span class="unit-title">Unit{{ g.unit }} · {{ g.unitTitle }}</span>
        <span class="unit-count">{{ g.items.length }} 篇</span>
      </div>
      <div class="reading-grid">
        <div v-for="r in g.items" :key="r.id" class="reading-card" @click="router.push('/reading/' + r.id)">
          <div class="r-num">読み物{{ r.num }}</div>
          <div class="r-meta">{{ r.questions.length }} 题</div>
          <div class="r-status" :class="statusClass(r)">{{ statusText(r) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { readingN2 } from '../data/reading-n2'
import { readingN1 } from '../data/reading-n1'
import { useLevel } from '../store/levelStore'

const router = useRouter()
const { level } = useLevel()

const readings = computed(() => level.value === 'N1' ? readingN1 : readingN2)

const groups = computed(() => {
  const map = {}
  for (const r of readings.value) {
    const key = r.part + '|' + r.unit
    if (!map[key]) {
      map[key] = { key, part: r.part, unit: r.unit, unitTitle: r.unitTitle, items: [] }
    }
    map[key].items.push(r)
  }
  return Object.values(map)
})

function progress(id) {
  try {
    const map = JSON.parse(localStorage.getItem('sakura_reading_progress')) || {}
    return map[id] || null
  } catch { return null }
}
function statusText(r) {
  const p = progress(r.id)
  if (!p) return '未开始'
  const done = p.answers.filter(a => a !== null).length
  return done >= r.questions.length ? '已完成 ✓' : done + '/' + r.questions.length + ' 题'
}
function statusClass(r) {
  const p = progress(r.id)
  if (!p) return 'todo'
  const done = p.answers.filter(a => a !== null).length
  return done >= r.questions.length ? 'done' : 'doing'
}
</script>

<style scoped>
.list-desc {
  font-size: 13px;
  color: var(--ink-2, #888);
  margin: 0 0 16px;
  line-height: 1.7;
}
.unit-group {
  margin-bottom: 18px;
}
.unit-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.part-tag {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(255, 157, 189, 0.14);
  color: var(--sakura-600, #c2556f);
  font-weight: 600;
}
.unit-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--ink, #333);
}
.unit-count {
  font-size: 12px;
  color: var(--ink-2, #999);
  margin-left: auto;
}
.reading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}
.reading-card {
  background: #fff;
  border: 2px solid var(--sakura-100, #ffe3ec);
  border-radius: 14px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all .15s;
}
.reading-card:hover {
  border-color: var(--sakura-300, #ffb9cf);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(233, 120, 150, .12);
}
.r-num {
  font-size: 15px;
  font-weight: 700;
  color: var(--sakura-600, #c2556f);
  margin-bottom: 4px;
}
.r-meta {
  font-size: 12px;
  color: var(--ink-2, #999);
  margin-bottom: 8px;
}
.r-status {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
  display: inline-block;
}
.r-status.todo { background: #f3f0ea; color: #a09a90; }
.r-status.doing { background: #eef4ff; color: #5a7bd6; }
.r-status.done { background: #eef8ee; color: #4a9a4f; }
</style>
