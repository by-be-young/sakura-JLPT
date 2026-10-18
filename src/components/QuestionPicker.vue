<template>
  <div class="picker">
    <div class="picker-header">
      <div class="picker-heading">
        <span class="picker-title">{{ title }}</span>
        <span class="chip-pill">{{ questions.length }} 题</span>
      </div>
      <div class="legend" aria-label="题号图例">
        <span class="legend-item"><span class="dot dot-current" aria-hidden="true"></span>当前</span>
        <span class="legend-item"><span class="dot dot-unseen" aria-hidden="true"></span>未做</span>
        <span class="legend-item"><span class="dot dot-correct" aria-hidden="true"></span>答对</span>
        <span class="legend-item"><span class="dot dot-wrong" aria-hidden="true"></span>答错</span>
      </div>
    </div>

    <div class="picker-search">
      <input type="number" v-model.number="jumpNum" :min="minId" :max="maxId"
        inputmode="numeric" placeholder="输入题号跳转" aria-label="输入题号跳转"
        @keyup.enter="jumpTo" />
      <button class="btn btn-primary btn-sm" @click="jumpTo">跳转</button>
    </div>

    <div class="picker-scroll">
      <div class="picker-grid">
        <button v-for="q in questions" :key="q.key" type="button"
          class="picker-cell"
          :class="cellClass(q.key)"
          :title="cellTitle(q.key)"
          :aria-label="cellTitle(q.key)"
          :aria-current="currentId && q.id === currentId ? 'true' : undefined"
          @click="$emit('select', q.id)">
          {{ q.id }}
        </button>
      </div>
      <span class="picker-fade" aria-hidden="true"></span>
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
  margin-bottom: 16px;
  padding: 18px;
  border-radius: var(--radius-lg);
  background: var(--card);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-card);
}

/* ---------- 头部 ---------- */
.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}
.picker-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.picker-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 11.5px;
  color: var(--text-light);
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: var(--radius-pill);
  background: var(--sakura-50);
  border: 1px solid var(--line);
}
.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 3px;
}
.dot-current { background: var(--grad-sakura); box-shadow: 0 0 0 2px var(--sakura-100); }
.dot-unseen { background: var(--card); border: 1px solid var(--border-strong); }
.dot-correct { background: var(--green); }
.dot-wrong { background: var(--red); }

/* ---------- 跳转 ---------- */
.picker-search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.picker-search input {
  flex: 1;
  max-width: 200px;
  min-height: 40px;
  padding: 8px 12px;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  background: var(--card);
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
  outline: none;
  transition: border-color var(--dur-2) var(--ease-soft), box-shadow var(--dur-2) var(--ease-soft);
}
.picker-search input::placeholder { color: var(--text-faint); }
.picker-search input:focus {
  border-color: var(--sakura-400);
  box-shadow: var(--focus-ring);
}
.picker-search .btn { min-height: 40px; flex-shrink: 0; }

/* ---------- 滚动题号区 ---------- */
.picker-scroll {
  position: relative;
  border-radius: var(--radius-sm);
}
.picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(46px, 1fr));
  gap: 7px;
  max-height: 320px;
  overflow-y: auto;
  padding: 4px 6px 36px;
  overscroll-behavior: contain;
}
.picker-cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 2px;
  border: 1px solid transparent;
  border-radius: 12px;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text-light);
  background: var(--sakura-50);
  cursor: pointer;
  transition:
    transform var(--dur-2) var(--ease-spring),
    background var(--dur-2) var(--ease-soft),
    border-color var(--dur-2) var(--ease-soft),
    color var(--dur-2) var(--ease-soft),
    box-shadow var(--dur-2) var(--ease-soft);
}
.picker-cell:active { transform: scale(0.94); }
.picker-cell.unseen {
  background: var(--sakura-50);
  border-color: var(--border);
  color: var(--text);
}
.picker-cell.correct {
  background: var(--green-soft);
  border-color: transparent;
  color: var(--green);
}
.picker-cell.wrong {
  background: var(--red-soft);
  border-color: transparent;
  color: var(--red);
}
.picker-cell.current {
  background: var(--grad-sakura);
  border-color: transparent;
  color: #fff;
  font-weight: 800;
  z-index: 1;
  box-shadow: 0 0 0 2px var(--card), 0 0 0 4px var(--sakura-400);
}
.picker-cell.current:hover { transform: none; }

@media (hover: hover) and (pointer: fine) {
  .picker-cell:hover {
    transform: translateY(-1px) scale(1.06);
    border-color: var(--sakura-300);
    color: var(--sakura-700);
    z-index: 2;
  }
  .picker-cell.correct:hover {
    border-color: var(--green);
    color: var(--green);
  }
  .picker-cell.wrong:hover {
    border-color: var(--red);
    color: var(--red);
  }
  .picker-cell.current:hover {
    transform: none;
    border-color: transparent;
    color: #fff;
    box-shadow: 0 0 0 2px var(--card), 0 0 0 4px var(--sakura-400);
    z-index: 1;
  }
}

/* 滚动渐隐提示 */
.picker-fade {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 34px;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  background: linear-gradient(to bottom, transparent, var(--card));
  pointer-events: none;
}

@media (max-width: 480px) {
  .picker { padding: 16px; }
  .picker-header { align-items: flex-start; }
  .picker-heading { width: 100%; justify-content: space-between; }
  .picker-grid {
    grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
    gap: 6px;
    max-height: 280px;
  }
  .picker-cell { min-height: 42px; }
}
</style>
