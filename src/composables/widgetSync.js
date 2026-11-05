import { watch } from 'vue'
import { words } from '../data/words'
import { useWordStore } from '../store/wordStore'
import { useLevel } from '../store/levelStore'
import { useDaily } from '../store/dailyStore'
import { isNativeApp, writeSnapshot, updateWidgetNow } from './nativeBridge'
import { useHonor } from './honor'

/**
 * 桌面小组件数据同步（荣耀专属，P0：主包内置 + 门禁）。
 *
 * 快照口径（与设计方案 §3 一致，选词复用 wordStore 的同一套判定）：
 *   - 待复习优先：isDueForReview（错 ≥2 次 或 距上次复习 ≥2 天），排除熟词
 *   - 待复习池不足时回落到未学词
 *   - pool ≤ 30 条，附 dueCount / newCount / today 进度，写入应用私有目录
 *     widget_snapshot.json，组件离线只读；>24h 未更新显示「打开应用同步」。
 */
const ENABLE_KEY = 'sakura_widget_enabled'
const MIRROR_KEY = 'sakura_widget_snapshot_mirror'
const POOL_SIZE = 30

export function isWidgetEnabled() {
  try {
    return localStorage.getItem(ENABLE_KEY) === '1'
  } catch {
    return false
  }
}

export function setWidgetEnabled(on) {
  try {
    localStorage.setItem(ENABLE_KEY, on ? '1' : '0')
  } catch {
    // 忽略
  }
}

export function buildSnapshot() {
  const wordStore = useWordStore()
  const daily = useDaily()
  const { level } = useLevel()
  const { state } = wordStore

  const learned = state.learned || {}
  const familiar = state.familiar || {}
  const all = words.filter(w => !familiar[w.id])

  const due = all.filter(w => learned[w.id] && wordStore.isDueForReview(w.id))
  const unseen = all.filter(w => !learned[w.id])

  const pool = []
  for (const w of due) {
    if (pool.length >= POOL_SIZE) break
    pool.push({ id: w.id, kanji: w.kanji, kana: w.kana, meaning: w.meaning, level: w.level, tag: 'review' })
  }
  for (const w of unseen) {
    if (pool.length >= POOL_SIZE) break
    pool.push({ id: w.id, kanji: w.kanji, kana: w.kana, meaning: w.meaning, level: w.level, tag: 'new' })
  }

  return {
    v: 1,
    generatedAt: Date.now(),
    level: level.value,
    dueCount: due.length,
    newCount: unseen.length,
    today: {
      done: daily.todayWord.value || 0,
      goal: Number(state.settings && state.settings.dailyGoal) || 20,
    },
    pool,
  }
}

export function useWidgetSync() {
  const honor = useHonor()
  let timer = null

  async function sync(force = false) {
    if (!isNativeApp()) return
    if (!force && !isWidgetEnabled()) return
    if (honor.isHonor.value !== true) return
    const snap = buildSnapshot()
    const ok = await writeSnapshot(JSON.stringify(snap))
    if (ok) {
      // 本地镜像：调试 / 前端展示用，组件本体读私有目录文件
      try {
        localStorage.setItem(MIRROR_KEY, JSON.stringify(snap))
      } catch {
        // 忽略
      }
      updateWidgetNow()
    }
  }

  function schedule() {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => sync(false), 800)
  }

  function init() {
    honor.detect().then(h => {
      if (!h) return
      if (isWidgetEnabled()) sync(true)
      // 学习/打卡状态变化时自动重建快照
      const wordStore = useWordStore()
      const daily = useDaily()
      watch(
        () => [wordStore.state.learned, wordStore.state.familiar, wordStore.state.settings && wordStore.state.settings.dailyGoal, daily.state.days],
        schedule,
        { deep: true }
      )
      // 回到前台时补一次同步（例如在桌面完成复习后）
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') sync(false)
      })
    })
  }

  return { sync, init, schedule }
}
