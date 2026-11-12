import { ref } from 'vue'
import { getDeviceInfo, isNativeApp } from './nativeBridge'

/**
 * 桌面小组件的设备门禁（安卓常见品牌白名单）。
 *
 * 判定口径（与 SakuraNativePlugin.isWidgetSupportedDevice 一致）：
 *   Build.BRAND / Build.MANUFACTURER 命中白名单，或 Build.FINGERPRINT 以品牌前缀开头。
 *   白名单：荣耀、华为（含 2020 年前的老荣耀）、小米/Redmi/POCO、OPPO/一加/realme、
 *   vivo/iQOO、三星。其它品牌不渲染入口（组件仍会被系统列出，但数据不会同步）。
 * Web / PWA / Electron 拿不到 Build 信息，直接判定为不支持。
 */
const SUPPORTED_BRANDS = [
  'HONOR', 'HUAWEI',
  'XIAOMI', 'REDMI', 'POCO',
  'OPPO', 'ONEPLUS', 'REALME',
  'VIVO', 'IQOO',
  'SAMSUNG',
]

const BRAND_LABELS = {
  HONOR: '荣耀',
  HUAWEI: '华为',
  XIAOMI: '小米',
  REDMI: 'Redmi',
  POCO: 'POCO',
  OPPO: 'OPPO',
  ONEPLUS: '一加',
  REALME: 'realme',
  VIVO: 'vivo',
  IQOO: 'iQOO',
  SAMSUNG: '三星',
}

const isSupported = ref(null) // null=检测中，false=不支持，true=支持
const brandName = ref('')
const deviceInfo = ref(null)
let detected = false

function labelOf(brand, manufacturer) {
  const b = String(brand || '').toUpperCase()
  const m = String(manufacturer || '').toUpperCase()
  return BRAND_LABELS[b] || BRAND_LABELS[m] || b || m || '安卓'
}

export function useWidgetDevice() {
  async function detect() {
    if (detected) return isSupported.value
    detected = true
    if (!isNativeApp()) {
      isSupported.value = false
      return false
    }
    const info = await getDeviceInfo()
    deviceInfo.value = info
    if (!info) {
      isSupported.value = false
      return false
    }
    if (typeof info.supported === 'boolean') {
      // 原生插件已按白名单判定
      isSupported.value = info.supported
    } else {
      // 兼容旧版插件：只有 isHonor，按品牌字段兜底
      const b = String(info.brand || '').toUpperCase()
      const m = String(info.manufacturer || '').toUpperCase()
      const fp = String(info.fingerprint || '').toUpperCase()
      isSupported.value = SUPPORTED_BRANDS.includes(b)
        || SUPPORTED_BRANDS.includes(m)
        || SUPPORTED_BRANDS.some(x => fp.startsWith(x + '/'))
    }
    brandName.value = info.brandName || labelOf(info.brand, info.manufacturer)
    return isSupported.value
  }

  return { isSupported, brandName, deviceInfo, detect }
}
