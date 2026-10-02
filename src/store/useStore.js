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

function isPlainObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

// 把任意形态的"key 列表"归一化为数组。
// 关键背景：wrong / favorites 必须是数组。云端或旧版本可能把它们写成对象
// （如 {} 或 {0:"N2:5"}）。一旦 state.wrong 变成对象，渲染时
// state.wrong.filter(...) 就会抛 TypeError，整个页面渲染失败（白屏）。
function toList(v) {
  if (Array.isArray(v)) {
    // 已经规整时原样返回，避免每次渲染都复制大数组
    for (const item of v) {
      if (typeof item !== 'string' && typeof item !== 'number') {
        return v.filter(i => typeof i === 'string' || typeof i === 'number')
      }
    }
    return v
  }
  if (isPlainObject(v)) {
    return Object.values(v).filter(i => typeof i === 'string' || typeof i === 'number')
  }
  if (v === null || v === undefined) return []
  return (typeof v === 'string' || typeof v === 'number') ? [v] : []
}

function toKeyList(v) {
  return toList(v).map(id => (isNumericKey(id) ? 'N2:' + id : String(id)))
}

// 兼容旧数据：旧版 key 为纯数字（当时只有 N2），迁移为 "N2:<id>"
// 必须对任何畸形数据保持健壮：以前 wrong/favorites 是对象时 (arr||[]).map 会抛错，
// 被 loadState 的 try/catch 吞掉，导致本地学习数据被静默清空（"重启后又能渲染"的假象）。
function migrate(raw) {
  const s = defaultState()
  if (!isPlainObject(raw)) return s

  const rawAnswered = isPlainObject(raw.answered) ? raw.answered : {}
  for (const k of Object.keys(rawAnswered)) {
    const nk = isNumericKey(k) ? 'N2:' + k : k
    s.answered[nk] = rawAnswered[k]
  }

  s.wrong = toKeyList(raw.wrong)
  s.favorites = toKeyList(raw.favorites)

  // 计数：旧 totalAnswered/totalCorrect 归入 N2；若有分级 counts 则覆盖
  if (isPlainObject(raw.counts)) {
    for (const lv of LEVELS) {
      const c = raw.counts[lv]
      if (isPlainObject(c)) {
        s.counts[lv].answered = Number(c.answered) || 0
        s.counts[lv].correct = Number(c.correct) || 0
      }
    }
  } else {
    s.counts.N2.answered = Number(raw.totalAnswered) || 0
    s.counts.N2.correct = Number(raw.totalCorrect) || 0
  }

  const rm = isPlainObject(raw.mockResults) ? raw.mockResults : {}
  for (const k of Object.keys(rm)) {
    s.mockResults[isNumericKey(k) ? 'N2:' + k : k] = rm[k]
  }
  return s
}

// 就地修复被写坏的字段（云端合并 / 旧数据读取后调用）。
// 形态已经正确时不改动任何值，避免无谓地触发深度 watch 与云同步。
function repairState() {
  if (!Array.isArray(state.wrong) || state.wrong.some(id => typeof id !== 'string')) {
    state.wrong = toKeyList(state.wrong)
  }
  if (!Array.isArray(state.favorites) || state.favorites.some(id => typeof id !== 'string')) {
    state.favorites = toKeyList(state.favorites)
  }
  if (!isPlainObject(state.answered)) state.answered = {}
  if (!isPlainObject(state.mockResults)) state.mockResults = {}
  if (!isPlainObject(state.counts)) state.counts = {}
  for (const lv of LEVELS) {
    const c = state.counts[lv]
    if (!isPlainObject(c)) {
      state.counts[lv] = { answered: 0, correct: 0 }
    } else {
      const answered = Number(c.answered) || 0
      const correct = Number(c.correct) || 0
      if (c.answered !== answered || c.correct !== correct) {
        state.counts[lv] = { answered, correct }
      }
    }
  }
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
    if (!isPlainObject(state.counts)) state.counts = {}
    if (!isPlainObject(state.counts[lv])) state.counts[lv] = { answered: 0, correct: 0 }
    if (!isPlainObject(state.answered)) state.answered = {}
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
    const wrong = toList(state.wrong)
    if (correct) {
      state.wrong = wrong.filter(id => id !== key)
    } else if (!wrong.includes(key)) {
      state.wrong = [...wrong, key]
    }
  }

  function toggleFavorite(key) {
    const favs = toList(state.favorites)
    if (favs.includes(key)) {
      state.favorites = favs.filter(id => id !== key)
    } else {
      state.favorites = [...favs, key]
    }
  }

  function isFavorite(key) {
    return toList(state.favorites).includes(key)
  }

  function isWrong(key) {
    return toList(state.wrong).includes(key)
  }

  function removeWrong(key) {
    state.wrong = toList(state.wrong).filter(id => id !== key)
  }

  function getAnswer(key) {
    return isPlainObject(state.answered) ? state.answered[key] : undefined
  }

  // mockKey 形如 "N2:1"
  function saveMockResult(mockKey, result) {
    if (!isPlainObject(state.mockResults)) state.mockResults = {}
    state.mockResults[mockKey] = { ...result, date: Date.now() }
  }

  // 某级别的错题数量
  function wrongCountOf(level) {
    const p = level + ':'
    return toList(state.wrong).filter(id => id.startsWith(p)).length
  }

  // ===== 独立清除（各记录互不影响） =====
  function clearAnswers(level) {
    const p = level + ':'
    if (isPlainObject(state.answered)) {
      for (const k of Object.keys(state.answered)) {
        if (k.startsWith(p)) delete state.answered[k]
      }
    }
    if (isPlainObject(state.counts) && state.counts[level]) {
      state.counts[level] = { answered: 0, correct: 0 }
    }
  }

  function clearWrong(level) {
    const p = level + ':'
    state.wrong = toList(state.wrong).filter(id => !id.startsWith(p))
  }

  function clearFavorites(level) {
    const p = level + ':'
    state.favorites = toList(state.favorites).filter(id => !id.startsWith(p))
  }

  function clearMockResults(level) {
    const p = level + ':'
    if (!isPlainObject(state.mockResults)) { state.mockResults = {}; return }
    for (const k of Object.keys(state.mockResults)) {
      if (k.startsWith(p)) delete state.mockResults[k]
    }
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
    clearAnswers,
    clearWrong,
    clearFavorites,
    clearMockResults,
    resetAll,
    normalizeState: migrate,   // 云端数据入库前归一化（含旧版纯数字 key 迁移）
    repairState,               // 云端合并后就地修复，防止坏形态进入渲染
  }
}
