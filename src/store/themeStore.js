// 樱花日语 - 主题管理（浅色 / 深色 / 跟随系统）
import { ref, watch } from 'vue'

const STORAGE_KEY = 'sakura_theme_v1'

function loadMode() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch (e) {}
  return 'system'
}

const mode = ref(loadMode())

function mediaDark() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveDark() {
  return mode.value === 'dark' || (mode.value === 'system' && mediaDark())
}

function apply() {
  const dark = resolveDark()
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', dark ? '#1c1320' : '#ff8fbf')
}

function setMode(m) {
  mode.value = m
  try { localStorage.setItem(STORAGE_KEY, m) } catch (e) {}
  apply()
}

// 跟随系统变化
if (typeof window !== 'undefined' && window.matchMedia) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => { if (mode.value === 'system') apply() }
  if (mq.addEventListener) mq.addEventListener('change', handler)
  else if (mq.addListener) mq.addListener(handler)
}

// 初始化立即生效（避免闪烁）
apply()

// 外部（如设置页）改 mode 后自动应用
watch(mode, apply)

export function useTheme() {
  return { mode, setMode, isDark: resolveDark }
}
