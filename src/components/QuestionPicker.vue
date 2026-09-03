<template>
  <div class="picker">
    <div class="picker-header">
      <span class="picker-title">{{ title }}（共 {{ questions.length }} 题）</span>
      <div class="legend">
        <span class="legend-item"><span class="dot dot-current"></span>当前</span>
        <span class="legend-item"><span class="dot dot-unseen"></span>未做</span>
        <span class="legend-item"><span class="dot dot-correct"></span>答对</span>
        <span class="legend-item"><span class="dot dot-wrong"></span>答错</span>
      </div>
    </div>
    <div class="picker-search">
      <input type="number" v-model.number="jumpNum" :min="minId" :max="maxId"
        placeholder="输入题号跳转" @keyup.enter="jumpTo" />
      <button class="btn btn-primary btn-sm" @click="jumpTo">跳转</button>
    </div>
    <div class="picker-grid">
      <div v-for="q in questions" :key="q.key"
        class="picker-cell"
        :class="cellClass(q.key)"
        :title="cellTitle(q.key)"
        @click="$emit('select', q.id)">
        {{ q.id }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from '../store/useStore'

const props = defineProps({
  questions: { type: Array, required: true },
  title: { type: String, default: '选择起始题号' },
  currentId: { type: Number, default: 0 },
})
const emit = defineEmits(['select'])

const store = useStore()
const jumpNum = ref(null)

const minId = computed(() => Math.min(...props.questions.map(q => q.id)))
const maxId = computed(() => Math.max(...props.questions.map(q => q.id)))

function cellClass(key) {
  const qid = Number(key.split(':')[1])
  if (props.currentId && qid === props.currentId) return 'current'
  const a = store.getAnswer(key)
  if (!a) return 'unseen'
  return a.correct ? 'correct' : 'wrong'
}

function cellTitle(key) {
  const qid = Number(key.split(':')[1])
  if (props.currentId && qid === props.currentId) return `第${qid}题 · 当前`
  const a = store.getAnswer(key)
  if (!a) return `第${qid}题 · 未做`
  return `第${qid}题 · ${a.correct ? '答对' : '答错'}`
}

function jumpTo() {
  if (jumpNum.value && jumpNum.value >= minId.value && jumpNum.value <= maxId.value) {
    const target = props.questions.reduce((prev, curr) =>
      Math.abs(curr.id - jumpNum.value) < Math.abs(prev.id - jumpNum.value) ? curr : prev
    )
    emit('select', target.id)
  }
}
</script>

<style scoped>
.picker {
  background: #fff;
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
  margin-bottom: 16px;
}
.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}
.picker-title {
  font-weight: 700;
  color: var(--ink);
  font-size: 15px;
}
.legend {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: var(--ink-light);
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
}
.dot-current { background: var(--sakura-400); }
.dot-unseen { background: #f0ecee; border: 1px solid #ddd; }
.dot-correct { background: var(--green); }
.dot-wrong { background: var(--red); }
.picker-search {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.picker-search input {
  flex: 1;
  max-width: 200px;
  padding: 8px 12px;
  border: 2px solid var(--sakura-100);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}
.picker-search input:focus {
  border-color: var(--sakura-400);
}
.picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
  gap: 6px;
  max-height: 320px;
  overflow-y: auto;
  padding: 4px;
}
.picker-cell {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
}
.picker-cell.current {
  background: var(--sakura-400);
  color: #fff;
  box-shadow: 0 0 0 2px #fff inset, 0 0 0 3px var(--sakura-400);
  font-weight: 700;
}
.picker-cell.unseen {
  background: #f7f4f5;
  color: var(--ink-light);
}
.picker-cell.correct {
  background: #e0f3ea;
  color: #3a8c63;
}
.picker-cell.wrong {
  background: #fde4e6;
  color: #c44a52;
}
.picker-cell:hover {
  transform: scale(1.1);
  border-color: var(--sakura-400);
  z-index: 1;
}
</style>
