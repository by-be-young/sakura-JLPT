import { watch } from 'vue'
import { words } from '../data/words'
import { useWordStore } from '../store/wordStore'
import { useLevel } from '../store/levelStore'
import { useDaily } from '../store/dailyStore'
import { isNativeApp, writeSnapshot, updateWidgetNow } from './nativeBridge'
import { useWidgetDevice } from './widgetDevice'

/**
 * 桌面小组件数据同步（安卓常见品牌，主包内置 + 品牌白名单门禁）。
 *
 * 快照口径：
 *   - 只取「当前全局难度」的词（levelStore.level），切难度后立即重建快照；
 *   - 待复习优先：isDueForReview（错 ≥2 次 或 距上次复习 ≥2 天），排除熟词；
 *   - 待复习池不足时回落到未学词；
 *   - pool 上限 80 条，附 dueCount / newCount / today 进度，写入应用私有目录
 *     widget_snapshot.json。组件离线只读该文件：数据超过 24h 仍可展示与换词，
 *     只在页脚标注同步时间，不再锁死卡片。
 */
const ENABLE_KEY = 'sakura_widget_enabled'
const MIRROR_KEY = 'sakura_widget_snapshot_mirror'
const POOL_SIZE = 80

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

/** 当前难度下的候选词（排除熟词），待复习在前 */
function poolOfLevel(level) {
  const wordStore = useWordStore()
  const learned = wordStore.state.learned || {}
  const familiar = wordStore.state.familiar || {}

  const all = words.filter(w => w.level === level && !familiar[w.id])
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
  return { due, unseen, pool }
}

export function buildSnapshot() {
  const wordStore = useWordStore()
  const daily = useDaily()
  const { level } = useLevel()
  const { state } = wordStore

  const { due, unseen, pool } = poolOfLevel(level.value)

  return {
    v: 2,
    generatedAt: Date.now(),
    level: level.value,
    levelLabel: level.value + ' 级',
    dueCount: due.length,
    newCount: unseen.length,
    totalCount: pool.length,
    today: {
      done: daily.todayWord.value || 0,
      goal: Number(state.settings && state.settings.dailyGoal) || 20,
    },
    pool,
  }
}

export function useWidgetSync() {
  const device = useWidgetDevice()
  let timer = null

  async function sync(force = false) {
    if (!isNativeApp()) return
    if (!force && !isWidgetEnabled()) return
    if (device.isSupported.value !== true) return
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
    device.detect().then(h => {
      if (!h) return
      if (isWidgetEnabled()) sync(true)
      // 学习/打卡/难度变化时自动重建快照
      const wordStore = useWordStore()
      const daily = useDaily()
      const { level } = useLevel()
      watch(
        () => [
          wordStore.state.learned,
          wordStore.state.familiar,
          wordStore.state.settings && wordStore.state.settings.dailyGoal,
          daily.state.days,
          level.value,
        ],
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
