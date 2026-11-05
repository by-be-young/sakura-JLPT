import { Capacitor } from '@capacitor/core'

/**
 * 原生桥：统一封装 Capacitor 本地插件（SakuraNative）的调用。
 * Web / Electron / 浏览器 下 plugin 为 null，所有方法静默降级为 null/false，
 * 保证多端共用同一套前端代码。
 */
const isCapacitor = Capacitor.isNativePlatform()
const plugin = isCapacitor ? Capacitor.Plugins.SakuraNative : null

export function isNativeApp() {
  return isCapacitor && !!plugin
}

export async function getDeviceInfo() {
  if (!plugin) return null
  try {
    return await plugin.getDeviceInfo()
  } catch {
    return null
  }
}

export async function writeSnapshot(json) {
  if (!plugin) return false
  try {
    await plugin.writeSnapshot({ json })
    return true
  } catch {
    return false
  }
}

export async function readSnapshot() {
  if (!plugin) return null
  try {
    return await plugin.readSnapshot()
  } catch {
    return null
  }
}

export async function updateWidgetNow() {
  if (!plugin) return
  try {
    await plugin.updateWidget()
  } catch {
    // 组件未添加时无 widget 可刷新，忽略
  }
}

export async function setSystemBarsHidden(hidden) {
  if (!plugin) return
  try {
    await plugin.setSystemBarsHidden({ hidden })
  } catch {
    // 隐藏失败时由 CSS safe-area 兜底，不阻塞
  }
}
