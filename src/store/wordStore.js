import { reactive, watch, computed } from 'vue'

const STORAGE_KEY = 'sakura_word_state_v1'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return {
    learned: {},      // wordId -> { learnedAt, wrongCount, reviewCount, lastReviewAt, types: {} }
    familiar: {},     // wordId -> true（熟词，不再进入学习/复习）
    notes: {},        // wordId -> 笔记文本
    settings: { dailyGoal: 20 },
  }
}

const state = reactive(loadState())

// 兼容旧数据：为已学单词补全 types 字段；补齐 familiar
for (const id of Object.keys(state.learned)) {
  if (!state.learned[id].types) state.learned[id].types = {}
}
if (!state.familiar) state.familiar = {}

watch(state, (val) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  } catch (e) {}
}, { deep: true })

export function useWordStore() {
  // 记录一次学习
  function markLearned(wordId) {
    const now = Date.now()
    if (!state.learned[wordId]) {
      state.learned[wordId] = { learnedAt: now, wrongCount: 0, reviewCount: 0, lastReviewAt: now, types: {} }
    } else {
      state.learned[wordId].learnedAt = now
      state.learned[wordId].lastReviewAt = now
    }
  }

  // 标记某词某题型已完成（答对即完成）
  function markTypeDone(wordId, type) {
    if (!state.learned[wordId]) return
    state.learned[wordId].types[type] = true
  }

  // 某词某题型是否已完成
  function isTypeDone(wordId, type) {
    return !!(state.learned[wordId] && state.learned[wordId].types[type])
  }

  // 某词已完成的题型集合（返回 Set）
  function doneTypes(wordId) {
    return new Set(state.learned[wordId] ? Object.keys(state.learned[wordId].types) : [])
  }

  // 某词是否"背完"：所有可用题型都已完成
  function isMastered(wordId, availTypes) {
    if (!state.learned[wordId]) return false
    return availTypes.every(t => state.learned[wordId].types[t])
  }

  // 清除某词错误记录（复习自评"没问题"时调用）
  function clearWrong(wordId) {
    if (state.learned[wordId]) {
      state.learned[wordId].wrongCount = 0
      state.learned[wordId].lastReviewAt = Date.now()
    }
  }

  // 记录答题结果（用于复习遗忘判定）
  function recordAnswer(wordId, correct) {
    const now = Date.now()
    if (!state.learned[wordId]) {
      state.learned[wordId] = { learnedAt: now, wrongCount: 0, reviewCount: 0, lastReviewAt: now, types: {} }
    }
    const rec = state.learned[wordId]
    rec.reviewCount++
    rec.lastReviewAt = now
    if (!correct) rec.wrongCount++
  }

  // 判断某词是否已学
  function isLearned(wordId) {
    return !!state.learned[wordId]
  }

  // 某词的错误次数
  function wrongCount(wordId) {
    return state.learned[wordId]?.wrongCount || 0
  }

  // 某词的复习次数
  function reviewCount(wordId) {
    return state.learned[wordId]?.reviewCount || 0
  }

  // 某词是否"生疏"（错过 >= 2 次 或 很久没复习）
  function isDueForReview(wordId) {
    const rec = state.learned[wordId]
    if (!rec) return false
    if (rec.wrongCount >= 2) return true
    const days = (Date.now() - rec.lastReviewAt) / 86400000
    return days >= 2
  }

  // 笔记
  function setNote(wordId, text) {
    if (text && text.trim()) {
      state.notes[wordId] = text.trim()
    } else {
      delete state.notes[wordId]
    }
  }

  function getNote(wordId) {
    return state.notes[wordId] || ''
  }

  function hasNote(wordId) {
    return !!state.notes[wordId]
  }

  // 统计
  const learnedCount = computed(() => Object.keys(state.learned).length)

  function unseenCount(totalWords) {
    return totalWords.filter(w => !isLearned(w.id)).length
  }

  function dueWords(allWords) {
    return allWords.filter(w => isLearned(w.id) && isDueForReview(w.id))
  }

  // 全部重置（仅清空背词记录，不影响题库答题记录）
  function resetAll() {
    state.learned = {}
    state.familiar = {}
    state.notes = {}
  }

  // 独立清除：仅清空学习进度（已学/熟词/题型），笔记保留
  function clearProgress() {
    state.learned = {}
    state.familiar = {}
  }

  // 独立清除：仅清空笔记，学习进度保留
  function clearNotes() {
    state.notes = {}
  }

  // ===== 熟词 =====
  // 标记为熟词：不再进入新学与复习；同时记为已学
  function markFamiliar(wordId) {
    state.familiar[wordId] = true
    if (!state.learned[wordId]) markLearned(wordId)
  }

  function isFamiliar(wordId) {
    return !!state.familiar[wordId]
  }

  // 取消熟词标记
  function unmarkFamiliar(wordId) {
    delete state.familiar[wordId]
  }

  const familiarCount = computed(() => Object.keys(state.familiar).length)

  return {
    state,
    markLearned,
    markTypeDone,
    isTypeDone,
    doneTypes,
    isMastered,
    clearWrong,
    recordAnswer,
    isLearned,
    wrongCount,
    reviewCount,
    isDueForReview,
    setNote,
    getNote,
    hasNote,
    learnedCount,
    unseenCount,
    dueWords,
    resetAll,
    clearProgress,
    clearNotes,
    markFamiliar,
    isFamiliar,
    unmarkFamiliar,
    familiarCount,
  }
}
