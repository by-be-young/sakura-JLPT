import { reactive, watch } from 'vue'

const STORAGE_KEY = 'sakura_grammar_state_v1'

function loadState() {
  const def = {
    marked: {},      // pointId -> true（在目录中对某一点做的标记）
    learned: {},     // pointId -> true（已阅读/学习过的点）
    lastPoint: {},   // levelId -> pointId（各章最近读到的位置）
    mode: {},        // levelId -> 'sequential' | 'paged'
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...def, ...JSON.parse(raw) } // 合并默认值，兼容旧版本数据
  } catch (e) {}
  return def
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

  // ===== 学习进度 =====
  // 记录某一点已被阅读/学习过
  function markLearned(pid) {
    if (pid) state.learned[pid] = true
  }

  // 统计某章已学点数（传入该章 points 数组）
  function learnedCountOf(points) {
    return points.filter(p => state.learned[p.id]).length
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
    state.learned = {}
    state.lastPoint = {}
    state.mode = {}
  }

  return {
    state,
    isMarked,
    toggleMark,
    markedCountOf,
    markLearned,
    learnedCountOf,
    setLastPoint,
    getLastPoint,
    getMode,
    setMode,
    resetAll,
  }
}
