/**
 * iOS / iPadOS 安装引导
 *
 * 用途：iPad / iPhone 装不了 exe / apk，只能「添加到主屏幕」变成 PWA。
 * 这里只负责「该不该弹」的判断与状态存储，弹窗 UI 见 components/IosInstallGuide.vue。
 *
 * 状态存 localStorage：
 *   { never: boolean, snoozeUntil: number }
 *   - never = true：用户点了「不再提示」，永久关闭
 *   - snoozeUntil：用户点「知道了」后的静默期（默认 7 天）
 */
import { isNativeApp } from './nativeBridge'

const STORAGE_KEY = 'sakura:ios-install-guide'
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const obj = raw ? JSON.parse(raw) : null
    return obj && typeof obj === 'object' ? obj : {}
  } catch {
    return {}
  }
}

function writeState(patch) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readState(), ...patch }))
  } catch {
    // 无痕模式 / 存储被禁用时写不进去，直接忽略
  }
}

/**
 * 是否 iOS / iPadOS 设备。
 * iPadOS 13+ 默认发送桌面版 UA（Macintosh + 多点触控），必须靠 maxTouchPoints 兜住。
 */
export function isIosDevice() {
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/.test(ua)) return true
  const touch = navigator.maxTouchPoints || 0
  return touch > 1 && /Macintosh|Mac OS X/.test(ua)
}

/** 是否已经从主屏幕图标启动（说明已经装好了，没必要再引导） */
export function isInstalledWebApp() {
  if (navigator.standalone === true) return true
  return !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
}

/** 综合判断：现在要不要弹引导 */
export function shouldPromptIosInstall() {
  if (!isIosDevice()) return false
  if (isInstalledWebApp()) return false
  if (isNativeApp()) return false
  const s = readState()
  if (s.never) return false
  const snoozeUntil = Number(s.snoozeUntil) || 0
  if (snoozeUntil && Date.now() < snoozeUntil) return false
  return true
}

/** 仅本次关闭：静默 7 天 */
export function snoozeIosInstall() {
  writeState({ snoozeUntil: Date.now() + SNOOZE_MS })
}

/** 永久关闭 */
export function disableIosInstallGuide() {
  writeState({ never: true, snoozeUntil: 0 })
}

/** 重置（调试或用户手动重新打开引导时用） */
export function resetIosInstallGuide() {
  writeState({ never: false, snoozeUntil: 0 })
}
