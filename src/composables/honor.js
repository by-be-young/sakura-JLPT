import { ref } from 'vue'
import { getDeviceInfo, isNativeApp } from './nativeBridge'

/**
 * 荣耀设备检测（模块级单例，全应用共享一次检测结果）。
 * 口径与设计方案一致：
 *   Build.BRAND / Build.MANUFACTURER == HONOR，或 Build.FINGERPRINT 以 "HONOR/" 开头。
 * 老荣耀（HUAWEI 品牌字段）默认不判定为荣耀专属设备。
 * Web 端（PWA/Electron）拿不到 Build 信息，直接判定为非荣耀。
 */
const isHonor = ref(null)   // null=检测中，false=非荣耀，true=荣耀
const deviceInfo = ref(null)
let detected = false

export function useHonor() {
  async function detect() {
    if (detected) return isHonor.value
    detected = true
    if (!isNativeApp()) {
      isHonor.value = false
      return false
    }
    const info = await getDeviceInfo()
    deviceInfo.value = info
    if (!info) {
      isHonor.value = false
      return false
    }
    const brand = String(info.brand || '').toUpperCase()
    const mfg = String(info.manufacturer || '').toUpperCase()
    const fp = String(info.fingerprint || '').toUpperCase()
    isHonor.value = brand === 'HONOR' || mfg === 'HONOR' || fp.startsWith('HONOR/')
    return isHonor.value
  }

  return { isHonor, deviceInfo, detect }
}
