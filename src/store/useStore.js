import { reactive, watch } from 'vue'

const STORAGE_KEY = 'sakura_japanese_state_v1'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return {
    answered: {},
    wrong: [],
    favorites: [],
    totalAnswered: 0,
    totalCorrect: 0,
    mockResults: {},
  }
}

const state = reactive(loadState())

watch(state, (val) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  } catch (e) {}
}, { deep: true })

export function useStore() {
  function recordAnswer(qid, selected, correct) {
    const prev = state.answered[qid]
    if (!prev) {
      state.totalAnswered++
      if (correct) state.totalCorrect++
    } else {
      if (prev.correct && !correct) state.totalCorrect--
      if (!prev.correct && correct) state.totalCorrect++
    }
    state.answered[qid] = { selected, correct, time: Date.now() }
    if (correct) {
      state.wrong = state.wrong.filter(id => id !== qid)
    } else {
      if (!state.wrong.includes(qid)) state.wrong.push(qid)
    }
  }

  function toggleFavorite(qid) {
    if (state.favorites.includes(qid)) {
      state.favorites = state.favorites.filter(id => id !== qid)
    } else {
      state.favorites.push(qid)
    }
  }

  function isFavorite(qid) {
    return state.favorites.includes(qid)
  }

  function isWrong(qid) {
    return state.wrong.includes(qid)
  }

  function removeWrong(qid) {
    state.wrong = state.wrong.filter(id => id !== qid)
  }

  function getAnswer(qid) {
    return state.answered[qid]
  }

  function saveMockResult(mockId, result) {
    state.mockResults[mockId] = { ...result, date: Date.now() }
  }

  function resetAll() {
    state.answered = {}
    state.wrong = []
    state.favorites = []
    state.totalAnswered = 0
    state.totalCorrect = 0
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
    resetAll,
  }
}
