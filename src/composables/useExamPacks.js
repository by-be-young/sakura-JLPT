// 真题拓展包：状态查询 / 按需下载 / 题库注入
// - Electron：走主进程 sakuraPacks IPC（下载走 GitHub Releases，解压到 <userData>/packs）
// - Web / PWA / Android（Capacitor）：GitHub 资产 CDN 无 CORS 头，浏览器无法直接 fetch，
//   采用「打开下载页手动下载 + 导入 zip」两步走；解压与安装走 fflate + IndexedDB
import { ref } from 'vue'
import { unzipSync, strFromU8 } from 'fflate'
import { EXAM_PACKS } from '../data/examPacks'
import { registerPackQuestions, clearPackQuestions } from '../data/packQuestions'
import { isNativeApp, downloadAsset, onAssetDownloadProgress } from './nativeBridge'

const isElectron = typeof window !== 'undefined' && !!window.sakuraPacks

// ---------- IndexedDB（Web / Android 端安装态） ----------
const DB_NAME = 'sakura-packs'
const DB_STORE = 'packs'

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(DB_STORE)) {
        req.result.createObjectStore(DB_STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbGet(id) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly')
    const req = tx.objectStore(DB_STORE).get(id)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

async function idbPut(rec) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite')
    tx.objectStore(DB_STORE).put(rec)
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}

// ---------- 包状态（响应式） ----------
export const packs = ref(EXAM_PACKS.map(p => ({
  ...p,
  status: 'unknown',      // unknown | idle | installing | installed | manual | error
  progress: 0,
  phase: '',
  error: '',
  files: [],
  sessions: [],
  questions: null,        // {session, count, types}
})))

export const getPack = (id) => packs.value.find(p => p.id === id)

// 把包内 questions.json 注入现有题库（Electron 走 sakura-pack://，Web 走内存数据）
function registerFrom(data, pack) {
  if (!data || !Array.isArray(data.questions) || !data.questions.length) return null
  const summary = { session: data.session || '', count: data.questions.length }
  registerPackQuestions({
    packId: pack.id,
    level: pack.level,
    session: data.session || '',
    questions: data.questions,
  })
  return summary
}

// ---------- Electron 端 ----------
async function electronStatus(pack) {
  const res = await window.sakuraPacks.status(pack.id)
  if (res && res.ok && res.installed) {
    pack.status = 'installed'
    pack.version = res.version
    pack.files = res.files || []
    pack.sessions = res.sessions || []
    try {
      const resp = await fetch(`sakura-pack://${pack.id}/questions.json`)
      if (resp.ok) pack.questions = registerFrom(await resp.json(), pack)
      else pack.questions = null
    } catch { pack.questions = null }
    return true
  }
  pack.status = 'idle'
  pack.files = []
  pack.sessions = []
  pack.questions = null
  return false
}

async function electronDownload(pack) {
  pack.status = 'installing'
  pack.progress = 0
  pack.phase = 'download'
  pack.error = ''
  const unsub = window.sakuraPacks.on('progress', (ev) => {
    if (!ev || ev.id !== pack.id) return
    if (ev.phase === 'error') {
      pack.status = 'error'
      pack.error = ev.message || '下载失败'
    } else {
      pack.phase = ev.phase
      pack.progress = ev.progress
      if (ev.phase === 'done') pack.status = 'installed'
    }
  })
  try {
    const res = await window.sakuraPacks.download(pack.id, pack.tag, pack.asset, pack.version)
    if (res && res.ok) {
      pack.status = 'installed'
      pack.files = res.files || []
      pack.sessions = res.sessions || []
      try {
        const resp = await fetch(`sakura-pack://${pack.id}/questions.json`)
        if (resp.ok) pack.questions = registerFrom(await resp.json(), pack)
      } catch { /* 题库可选，无则仅文件浏览 */ }
    } else {
      pack.status = 'error'
      pack.error = (res && res.reason) || '下载失败'
    }
  } catch (e) {
    pack.status = 'error'
    pack.error = String(e && e.message ? e.message : e)
  } finally {
    unsub()
  }
}

function electronView(pack, rel) {
  return window.sakuraPacks.viewFile(pack.id, rel)
}

// ---------- Web / Android 端 ----------
async function webStatus(pack) {
  const rec = await idbGet(pack.id)
  if (rec && rec.files && rec.files.length) {
    pack.status = 'installed'
    pack.version = rec.version
    pack.files = rec.files.map(f => ({ rel: f.rel, name: f.name, kind: f.kind, size: f.size }))
    pack.sessions = rec.sessions || []
    if (rec.questions) {
      pack.questions = registerFrom(rec.questions, pack)
    }
    return true
  }
  pack.status = 'idle'
  return false
}

// Web 端：打开 GitHub 资产下载页（CDN 无 CORS，只能手动下载后导入）
// - Capacitor 原生（Android/iOS）：window.open 会被 WebView 静默拦截，改用 @capacitor/browser
//   在系统浏览器 / Custom Tab 打开下载页（作为兜底；主路径为 nativeDownload 应用内下载）
// - 纯 Web / PWA：window.open 新标签页
async function openExternal(url) {
  const cap = typeof window !== 'undefined' && window.Capacitor
  if (cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) {
    try {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url })
      return
    } catch { /* 插件缺失/失败时回退 window.open */ }
  }
  window.open(url, '_blank')
}

async function webDownload(pack) {
  pack.status = 'manual'
  pack.error = ''
  let url = `https://github.com/by-be-young/sakura-JLPT/releases/tag/${pack.tag}`
  try {
    // 经 api.github.com（支持 CORS）取资产直链与大小
    const res = await fetch(`https://api.github.com/repos/by-be-young/sakura-JLPT/releases/tags/${pack.tag}`)
    if (res.ok) {
      const rel = await res.json()
      const asset = (rel.assets || []).find(a => a.name === pack.asset)
      if (asset) url = asset.browser_download_url
    }
  } catch { /* 保持默认 release 页 */ }
  await openExternal(url)
}

// ---------- Android 原生：应用内直接下载 + 进度 ----------
// 插件流式下载到应用缓存（<cache>/packs/<asset>），逐块回调进度；
// 完成后用 Filesystem 读回字节，走与「导入 zip」相同的解压/入库流程。
async function nativeDownload(pack) {
  pack.status = 'installing'
  pack.progress = 0
  pack.phase = 'download'
  pack.error = ''
  try {
    // 经 api.github.com（支持 CORS）取资产直链
    const res = await fetch(`https://api.github.com/repos/by-be-young/sakura-JLPT/releases/tags/${pack.tag}`)
    if (!res.ok) throw new Error('获取资产信息失败')
    const rel = await res.json()
    const asset = (rel.assets || []).find(a => a.name === pack.asset)
    if (!asset) throw new Error('未找到下载资产')

    const unsub = await onAssetDownloadProgress((ev) => {
      if (ev && ev.id === pack.id) {
        pack.phase = 'download'
        pack.progress = Math.round(ev.percent || 0)
      }
    })
    try {
      const r = await downloadAsset({ id: pack.id, url: asset.browser_download_url, fileName: pack.asset })
      if (!r || !r.ok) throw new Error((r && r.message) || '下载失败')
      const { Filesystem, Directory } = await import('@capacitor/filesystem')
      const read = await Filesystem.readFile({ path: `packs/${pack.asset}`, directory: Directory.Cache })
      const bytes = base64ToBytes(read.data)
      await installFromBytes(pack, bytes)
    } finally {
      if (unsub) unsub()
    }
  } catch (e) {
    pack.status = 'error'
    pack.error = String(e && e.message ? e.message : e)
  }
}

function base64ToBytes(b64) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

// 解析 zip 字节 → IndexedDB 落库 → 更新包状态 → 注入题库（原生下载 / 手动导入共用）
async function installFromBytes(pack, buf) {
  pack.status = 'installing'
  pack.phase = 'unzip'
  pack.error = ''
  const unzipped = unzipSync(buf)
  const files = []
  const textKinds = new Set(['txt', 'json', 'md'])
  for (const [rel, data] of Object.entries(unzipped)) {
    const name = rel.split('/').pop() || rel
    const ext = (name.includes('.') ? name.split('.').pop() : '').toLowerCase()
    const isText = textKinds.has(ext)
    const text = isText ? strFromU8(data) : ''
    files.push({
      rel,
      name,
      kind: isText ? 'text' : (ext === 'pdf' ? 'pdf' : 'bin'),
      size: data.length,
      data: isText ? undefined : data,
      text,
    })
  }
  let questions = null
  const qEntry = unzipped['questions.json']
  if (qEntry) {
    try { questions = JSON.parse(strFromU8(qEntry)) } catch { questions = null }
  }
  const rec = {
    id: pack.id,
    version: pack.version,
    installedAt: new Date().toISOString(),
    files: files.map(({ rel, name, kind, size, data, text }) => ({ rel, name, kind, size, data, text })),
    sessions: buildWebSessions(files),
    questions,
  }
  await idbPut(rec)
  pack.files = rec.files.map(f => ({ rel: f.rel, name: f.name, kind: f.kind, size: f.size }))
  pack.sessions = rec.sessions
  pack.status = 'installed'
  pack.phase = ''
  if (questions) pack.questions = registerFrom(questions, pack)
  return { ok: true }
}

// Web 端：导入用户手动下载的 zip 并安装（fflate 解压 + IndexedDB 持久化）
export async function importZip(packId, file) {
  const pack = getPack(packId)
  if (!pack) return { ok: false, reason: '未知拓展包' }
  try {
    const buf = new Uint8Array(await file.arrayBuffer())
    return await installFromBytes(pack, buf)
  } catch (e) {
    pack.status = 'error'
    pack.error = String(e && e.message ? e.message : e)
    return { ok: false, reason: pack.error }
  }
}

// Web 端会话结构：按「YYYY-MM」目录分场（与 Electron buildSessions 对齐）
function buildWebSessions(files) {
  const map = new Map()
  for (const f of files) {
    const seg = f.rel.split('/')
    if (seg.length < 2) continue
    const session = seg[0]
    if (!map.has(session)) map.set(session, [])
    map.get(session).push(f)
  }
  return [...map.entries()].map(([session, list]) => ({
    session,
    files: list.map(f => ({ name: f.name, rel: f.rel, kind: f.kind })),
  })).sort((a, b) => a.session.localeCompare(b.session))
}

// Web 端查看文件：txt 返回文本，pdf 返回 blob URL（浏览器新标签页打开）
export async function readPackFile(packId, rel) {
  const pack = getPack(packId)
  if (!pack) return null
  if (isElectron) {
    const res = await window.sakuraPacks.viewFile(packId, rel)
    return { kind: 'viewed', ok: !!(res && res.ok) }
  }
  const rec = await idbGet(packId)
  const f = rec && rec.files.find(x => x.rel === rel)
  if (!f) return null
  if (f.kind === 'pdf') {
    const blob = new Blob([f.data], { type: 'application/pdf' })
    return { kind: 'pdf', url: URL.createObjectURL(blob) }
  }
  return { kind: 'text', text: f.text ?? '' }
}

// ---------- 对外统一 API ----------
export function useExamPacks() {
  async function refresh(packId) {
    const pack = packId ? getPack(packId) : null
    if (!pack) return null
    pack.error = ''
    return isElectron ? electronStatus(pack) : webStatus(pack)
  }

  async function init() {
    // 全部包并行刷新；已安装的包把题库注入做题体系
    await Promise.all(packs.value.map(p => refresh(p.id)))
  }

  async function download(packId) {
    const pack = getPack(packId)
    if (!pack || pack.status === 'installing') return
    if (pack.status === 'installed') return
    if (isElectron) return electronDownload(pack)
    if (isNativeApp()) return nativeDownload(pack)
    return webDownload(pack)
  }

  function viewFile(packId, rel) {
    return readPackFile(packId, rel)
  }

  function practicePath(pack) {
    // 真题专项练习：可跨当前等级，Quiz.vue 依据 level/source/pack 参数取题
    return `/quiz/sequential?source=zhenti&pack=${pack.id}&level=${pack.level}`
  }

  function removePack(packId) {
    clearPackQuestions(packId)
    const pack = getPack(packId)
    if (pack) {
      pack.status = 'idle'
      pack.files = []
      pack.sessions = []
      pack.questions = null
    }
  }

  return { packs, refresh, init, download, viewFile, practicePath, removePack }
}
