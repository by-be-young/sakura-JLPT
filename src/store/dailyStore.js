// 樱花日语 - 每日学习与连续打卡
// 记录每天的学习活动（答题 / 背词），计算连续打卡天数，支持每日目标。
// 数据存本地（sakura_daily_v1），随设备走，不参与云端合并。
import { reactive, computed, watch } from 'vue'

const STORAGE_KEY = 'sakura_daily_v1'

function dayKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function todayKey() {
  return dayKey(new Date())
}

function defaultState() {
  return {
    settings: { quizTarget: 20, wordTarget: 20 },
    days: {},       // "2026-10-08" -> { quiz: 3, word: 5 }
    lastActive: '', // 最近活动日期
  }
}

function migrate(raw) {
  const s = defaultState()
  if (!raw || typeof raw !== 'object') return s
  const st = raw.settings && typeof raw.settings === 'object' ? raw.settings : {}
  s.settings.quizTarget = Number(st.quizTarget) || 20
  s.settings.wordTarget = Number(st.wordTarget) || 20
  if (raw.days && typeof raw.days === 'object') {
    for (const [k, v] of Object.entries(raw.days)) {
      if (v && typeof v === 'object') {
        s.days[k] = { quiz: Number(v.quiz) || 0, word: Number(v.word) || 0 }
      }
    }
  }
  s.lastActive = typeof raw.lastActive === 'string' ? raw.lastActive : ''
  return s
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return migrate(JSON.parse(raw))
  } catch (e) {}
  return defaultState()
}

const state = reactive(load())

watch(state, (val) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(val)) } catch (e) {}
}, { deep: true })

// 今日记录（不存在则补一个空记录）
function today() {
  const k = todayKey()
  if (!state.days[k]) state.days[k] = { quiz: 0, word: 0 }
  return state.days[k]
}

// 记录一次活动：type = 'quiz' | 'word'
function record(type) {
  const t = today()
  if (type === 'quiz') t.quiz++
  else if (type === 'word') t.word++
  state.lastActive = todayKey()
}

// 今日答题数 / 背词数
const todayQuiz = computed(() => today().quiz)
const todayWord = computed(() => today().word)

// 连续打卡天数：从今天（或昨天）往前数连续活跃的天数
const streak = computed(() => {
  let n = 0
  const d = new Date()
  // 今天还没活动时，从昨天开始数（今天仍有机会）
  if (!state.days[todayKey()]) {
    d.setDate(d.getDate() - 1)
  }
  // 最多回溯 366 天
  for (let i = 0; i < 366; i++) {
    const k = dayKey(d)
    const day = state.days[k]
    if (day && (day.quiz > 0 || day.word > 0)) {
      n++
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }
  return n
})

// 最近 7 天活跃（用于首页/统计展示）
const weekActive = computed(() => {
  const arr = []
  const d = new Date()
  for (let i = 6; i >= 0; i--) {
    const dd = new Date(d)
    dd.setDate(dd.getDate() - i)
    const k = dayKey(dd)
    const day = state.days[k] || { quiz: 0, word: 0 }
    arr.push({ date: k, quiz: day.quiz, word: day.word, active: day.quiz + day.word > 0 })
  }
  return arr
})

function setTargets(quizTarget, wordTarget) {
  state.settings.quizTarget = Math.max(1, Math.min(500, Math.round(Number(quizTarget) || 20)))
  state.settings.wordTarget = Math.max(1, Math.min(500, Math.round(Number(wordTarget) || 20)))
}

function exportJson() {
  return JSON.stringify({ daily: state, createdAt: Date.now() }, null, 2)
}

function importJson(json) {
  try {
    const parsed = JSON.parse(json)
    if (parsed && parsed.daily) {
      const next = migrate(parsed.daily)
      Object.assign(state, next)
      return true
    }
  } catch (e) {}
  return false
}

export function useDaily() {
  return {
    state,
    todayQuiz,
    todayWord,
    streak,
    weekActive,
    record,
    setTargets,
    exportJson,
    importJson,
  }
}
