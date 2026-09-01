import { reactive, watch } from 'vue'
import { LEVELS } from '../data/questions'

const STORAGE_KEY = 'sakura_japanese_state_v1'

function defaultState() {
  const counts = {}
  for (const lv of LEVELS) counts[lv] = { answered: 0, correct: 0 }
  return {
    answered: {},        // "N2:5" -> { selected, correct, time }
    wrong: [],           // ["N2:5", "N3:9", ...]
    favorites: [],       // ["N2:5", ...]
    counts,              // 按级别计数
    mockResults: {},     // "N2:1" -> { correct, total, score, date }
  }
}

function isNumericKey(k) {
  return /^\d+$/.test(String(k))
}

// 兼容旧数据：旧版 key 为纯数字（当时只有 N2），迁移为 "N2:<id>"
function migrate(raw) {
  const s = defaultState()
  if (!raw || typeof raw !== 'object') return s

  const rawAnswered = raw.answered || {}
  for (const k of Object.keys(rawAnswered)) {
    const nk = isNumericKey(k) ? 'N2:' + k : k
    s.answered[nk] = rawAnswered[k]
  }

  const conv = (arr) => (arr || []).map(id =>
    isNumericKey(id) ? 'N2:' + id : String(id))
  s.wrong = conv(raw.wrong)
  s.favorites = conv(raw.favorites)

  // 计数：旧 totalAnswered/totalCorrect 归入 N2；若有分级 counts 则覆盖
  if (raw.counts && typeof raw.counts === 'object') {
    for (const lv of LEVELS) {
      const c = raw.counts[lv]
      if (c) {
        s.counts[lv].answered = c.answered || 0
        s.counts[lv].correct = c.correct || 0
      }
    }
  } else {
    s.counts.N2.answered = raw.totalAnswered || 0
    s.counts.N2.correct = raw.totalCorrect || 0
  }

  const rm = raw.mockResults || {}
  for (const k of Object.keys(rm)) {
    s.mockResults[isNumericKey(k) ? 'N2:' + k : k] = rm[k]
  }
  return s
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return migrate(JSON.parse(raw))
  } catch (e) {}
  return defaultState()
}

const state = reactive(loadState())

watch(state, (val) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  } catch (e) {}
}, { deep: true })

export function useStore() {
  // key 形如 "N2:5"
  function recordAnswer(key, selected, correct) {
    const lv = key.split(':')[0]
    if (!state.counts[lv]) state.counts[lv] = { answered: 0, correct: 0 }
    const c = state.counts[lv]
    const prev = state.answered[key]
    if (!prev) {
      c.answered++
      if (correct) c.correct++
    } else {
      if (prev.correct && !correct) c.correct--
      if (!prev.correct && correct) c.correct++
    }
    state.answered[key] = { selected, correct, time: Date.now() }
    if (correct) {
      state.wrong = state.wrong.filter(id => id !== key)
    } else {
      if (!state.wrong.includes(key)) state.wrong.push(key)
    }
  }

  function toggleFavorite(key) {
    if (state.favorites.includes(key)) {
      state.favorites = state.favorites.filter(id => id !== key)
    } else {
      state.favorites.push(key)
    }
  }

  function isFavorite(key) {
    return state.favorites.includes(key)
  }

  function isWrong(key) {
    return state.wrong.includes(key)
  }

  function removeWrong(key) {
    state.wrong = state.wrong.filter(id => id !== key)
  }

  function getAnswer(key) {
    return state.answered[key]
  }

  // mockKey 形如 "N2:1"
  function saveMockResult(mockKey, result) {
    state.mockResults[mockKey] = { ...result, date: Date.now() }
  }

  // 某级别的错题数量
  function wrongCountOf(level) {
    const p = level + ':'
    return state.wrong.filter(id => id.startsWith(p)).length
  }

  function resetAll() {
    state.answered = {}
    state.wrong = []
    state.favorites = []
    for (const lv of LEVELS) state.counts[lv] = { answered: 0, correct: 0 }
    state.mockResults = {}
  }

  return {
    state,
    recordAnswer,
    toggleFavorite,
    isFavorite,
    isWrong,
    removeWrong,
    getAnswer,
    saveMockResult,
    wrongCountOf,
    resetAll,
  }
}
