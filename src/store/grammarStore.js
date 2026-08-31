import { reactive, watch } from 'vue'

const STORAGE_KEY = 'sakura_grammar_state_v1'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return {
    marked: {},      // pointId -> true（在目录中对某一点做的标记）
    lastPoint: {},   // levelId -> pointId（各章最近读到的位置）
    mode: {},        // levelId -> 'sequential' | 'paged'
  }
}

const state = reactive(loadState())

watch(state, (val) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  } catch (e) {}
}, { deep: true })

export function useGrammarStore() {
  // ===== 目录标记 =====
  function isMarked(pid) {
    return !!state.marked[pid]
  }

  function toggleMark(pid) {
    if (state.marked[pid]) {
      delete state.marked[pid]
    } else {
      state.marked[pid] = true
    }
  }

  // 统计某章已标记点数（传入该章 points 数组）
  function markedCountOf(points) {
    return points.filter(p => state.marked[p.id]).length
  }

  // ===== 阅读进度 =====
  function setLastPoint(levelId, pid) {
    if (pid) state.lastPoint[levelId] = pid
  }

  function getLastPoint(levelId) {
    return state.lastPoint[levelId] || ''
  }

  // ===== 阅读模式 =====
  function getMode(levelId) {
    return state.mode[levelId] || 'paged'
  }

  function setMode(levelId, mode) {
    state.mode[levelId] = mode
  }

  function resetAll() {
    state.marked = {}
    state.lastPoint = {}
    state.mode = {}
  }

  return {
    state,
    isMarked,
    toggleMark,
    markedCountOf,
    setLastPoint,
    getLastPoint,
    getMode,
    setMode,
    resetAll,
  }
}
