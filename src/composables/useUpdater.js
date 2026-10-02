// 樱花日语 - 跨平台更新检查（Electron / Android / PWA 统一入口）
// 用法：useUpdater().init() 在应用启动后调用
import { reactive, readonly } from 'vue'

const UPDATE_CONFIG = typeof window !== 'undefined' ? (window.UPDATE_CONFIG || {}) : {}

const state = reactive({
  phase: 'idle', // idle | checking | available | downloading | downloaded | none | error
  current: '',
  latest: '',
  progress: 0, // 0-100
  error: '',
  platform: 'web', // electron | android | web
  releaseUrl: ''
})

let cleanupFns = []

function isElectron() {
  return typeof window !== 'undefined' && !!window.sakuraUpdater
}

function isAndroid() {
  return typeof window !== 'undefined' && (
    (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
    /Android/i.test(navigator.userAgent)
  )
}

async function fetchCurrentVersion() {
  try {
    const res = await fetch('./version.json', { cache: 'no-store' })
    const data = await res.json()
    return (data.version || '').replace(/^v/, '')
  } catch (e) {
    return ''
  }
}

function normalizeVersion(v) {
  return String(v || '').replace(/^v/, '').trim()
}

function compareVersions(a, b) {
  // a/b 形如 "1.2.3"，返回 a>b?1 a<b?-1 0
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0)
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0
    const y = pb[i] || 0
    if (x > y) return 1
    if (x < y) return -1
  }
  return 0
}

function githubLatestUrl() {
  const { provider, owner, repo } = UPDATE_CONFIG
  if (provider === 'github' && owner && repo && !/YOUR_/.test(owner)) {
    return `https://api.github.com/repos/${owner}/${repo}/releases/latest`
  }
  return ''
}

function releasePageUrl() {
  const { provider, owner, repo } = UPDATE_CONFIG
  if (provider === 'github' && owner && repo) {
    return `https://github.com/${owner}/${repo}/releases/latest`
  }
  return ''
}

function apkAssetUrl(assets) {
  if (!Array.isArray(assets)) return ''
  const apk = assets.find((a) => a.name && /\.apk$/i.test(a.name))
  return apk ? apk.browser_download_url : ''
}

// ---------- Electron ----------
async function checkElectron() {
  const api = window.sakuraUpdater
  state.platform = 'electron'
  const current = await api.getVersion().catch(() => '')
  state.current = normalizeVersion(current)

  cleanupFns.push(
    api.on('update-available', (info) => {
      state.phase = 'available'
      state.latest = normalizeVersion(info && (info.version || info.name))
    }),
    api.on('update-not-available', () => { state.phase = 'none' }),
    api.on('download-progress', (p) => {
      state.phase = 'downloading'
      state.progress = Math.round((p && p.percent) || 0)
    }),
    api.on('update-downloaded', (info) => {
      state.phase = 'downloaded'
      state.latest = normalizeVersion(info && (info.version || info.name))
    }),
    api.on('error', (err) => {
      state.phase = 'error'
      state.error = (err && err.message) || '更新检查失败'
    })
  )

  const res = await api.check().catch(() => ({ ok: false }))
  if (!res || !res.ok) {
    // 开发模式或未配置发布源时静默
    state.phase = 'none'
  } else {
    state.phase = 'checking'
  }
}

// ---------- Web / Android / PWA ----------
async function checkWeb() {
  state.platform = isAndroid() ? 'android' : 'web'
  state.current = await fetchCurrentVersion()

  const url = githubLatestUrl()
  if (!url) {
    // 未配置仓库：静默跳过
    state.phase = 'none'
    return
  }

  state.phase = 'checking'
  try {
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
    if (!res.ok) {
      state.phase = 'none'
      return
    }
    const data = await res.json()
    const latest = normalizeVersion(data.tag_name)
    state.latest = latest
    state.releaseUrl = data.html_url || releasePageUrl()

    if (latest && compareVersions(latest, state.current) > 0) {
      state.phase = 'available'
      // Android 记住 APK 下载地址
      if (state.platform === 'android') {
        const apk = apkAssetUrl(data.assets)
        if (apk) state.releaseUrl = apk
      }
    } else {
      state.phase = 'none'
    }
  } catch (e) {
    state.phase = 'none'
  }
}

// ---------- 对外动作 ----------
function startDownload() {
  if (state.platform === 'electron') {
    window.sakuraUpdater.download()
    state.phase = 'downloading'
  } else {
    // Android: _system 打开系统浏览器下载 APK；PWA: 打开 Releases 页面
    if (state.releaseUrl) {
      if (state.platform === 'android') {
        window.open(state.releaseUrl, '_system')
      } else {
        window.open(state.releaseUrl, '_blank', 'noopener')
      }
    }
  }
}

function installNow() {
  if (state.platform === 'electron' && window.sakuraUpdater) {
    window.sakuraUpdater.install()
  } else if (state.releaseUrl) {
    if (state.platform === 'android') {
      window.open(state.releaseUrl, '_system')
    } else {
      window.open(state.releaseUrl, '_blank', 'noopener')
    }
  }
}

function dismiss() {
  state.phase = 'none'
}

function init() {
  if (state.phase !== 'idle') return
  if (isElectron()) {
    checkElectron()
  } else {
    checkWeb()
  }
}

export function useUpdater() {
  return {
    state: readonly(state),
    init,
    startDownload,
    installNow,
    dismiss
  }
}
