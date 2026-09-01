import { ref, watch } from 'vue'

// 全局统一的等级（背词 / 文法 / 练习 / 我的 共用，各页选择器互相同步）
export const APP_LEVELS = [
  { id: 'N5', name: 'N5', desc: '入门 · 基础' },
  { id: 'N4', name: 'N4', desc: '初级' },
  { id: 'N3', name: 'N3', desc: '中级' },
  { id: 'N2', name: 'N2', desc: '中高级' },
  { id: 'N1', name: 'N1', desc: '高级' },
]

const LEVEL_IDS = APP_LEVELS.map(l => l.id)
const STORAGE_KEY = 'sakura_japanese_level'
const OLD_WORD_KEY = 'sakura_word_level'

function initialLevel() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && LEVEL_IDS.includes(stored)) return stored
  // 兼容：此前背词等级独立存储，若用户已选过则沿用
  const wordStored = localStorage.getItem(OLD_WORD_KEY)
  if (wordStored && LEVEL_IDS.includes(wordStored)) return wordStored
  return 'N2'
}

const level = ref(initialLevel())

watch(level, (val) => {
  localStorage.setItem(STORAGE_KEY, val)
  // 同步旧背词等级键，兼容旧页面入口
  localStorage.setItem(OLD_WORD_KEY, val)
})

export function useLevel() {
  function setLevel(lv) {
    if (LEVEL_IDS.includes(lv)) level.value = lv
  }
  return { level, setLevel, APP_LEVELS }
}
