// 樱花日语 - 学习数据云同步（Supabase）
// 登录后将题库进度/错题/收藏 + 背词进度/笔记 同步到云端，跨设备共用。
// 策略：
//   - 登录成功 → 拉取云端数据，与本地合并（数组取并集、对象键并集、计数取较大值，不丢数据）
//   - 本地数据变化 → 防抖 3 秒自动上传
//   - 未登录时完全本地，不影响使用
import { reactive, readonly, watch } from 'vue'
import { useStore } from '../store/useStore'
import { useWordStore } from '../store/wordStore'
import { getSupabase } from './supabaseClient'

const TABLE = 'user_profiles'
const FIELD_QUIZ = 'japanese_state'
const FIELD_WORD = 'word_state'

const store = useStore()
const wordStore = useWordStore()
const { normalizeState, repairState } = store
const { normalizeWordState, repairState: repairWordState } = wordStore

const syncState = reactive({
  enabled: false,   // 已登录且云端配置可用
  lastPushAt: 0,
  lastPullAt: 0,
  lastPushedQuiz: '',
  lastPushedWord: '',
  message: ''
})

// ---------- 合并工具 ----------
function isPlainObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

// 把任意形态的"列表"还原成数组：数组原样、旧版/畸形对象取 values。
// 这里曾经是严重 bug：deepMerge 只处理"两侧都是数组"，
// 于是本地 []（数组）遇到云端 {}（对象）时走了对象分支，结果变成 {}，
// 之后 state.wrong.filter / favorites.includes 在渲染时抛 TypeError，整页白屏。
function asList(v) {
  if (Array.isArray(v)) return v
  if (isPlainObject(v)) return Object.values(v)
  if (v === undefined || v === null) return []
  return [v]
}

function unionList(a, b) {
  return Array.from(new Set([...asList(a), ...asList(b)]))
}

function deepMerge(a, b) {
  // 任一侧是数组 → 结果必须是数组，绝不退化成对象
  if (Array.isArray(a) || Array.isArray(b)) {
    return unionList(a, b)
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const out = {}
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const k of keys) {
      const hasA = k in a
      const hasB = k in b
      if (!hasA) { out[k] = b[k]; continue }
      if (!hasB) { out[k] = a[k]; continue }
      const av = a[k]
      const bv = b[k]
      if (isCounter(av, bv)) {
        out[k] = mergeCounter(av, bv)
      } else {
        out[k] = deepMerge(av, bv)
      }
    }
    return out
  }
  return b === undefined || b === null ? a : b
}

function isCounter(a, b) {
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false
  const leaves = (o) => Object.values(o).every((v) => (v && typeof v === 'object') || typeof v === 'number' || typeof v === 'boolean')
  return leaves(a) && leaves(b)
}

function mergeCounter(a, b) {
  const out = {}
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const k of keys) {
    const av = a[k]
    const bv = b[k]
    if (av === undefined) { out[k] = bv; continue }
    if (bv === undefined) { out[k] = av; continue }
    if (isPlainObject(av) && isPlainObject(bv)) {
      out[k] = mergeCounter(av, bv)
    } else if (Array.isArray(av) || Array.isArray(bv)) {
      out[k] = unionList(av, bv)
    } else if (typeof av === 'boolean' || typeof bv === 'boolean') {
      out[k] = !!(av || bv)          // 布尔用"或"，不能 Math.max 变成 0/1
    } else if (typeof av === 'number' && typeof bv === 'number') {
      out[k] = Math.max(av, bv)       // 计数/时间戳取较大值
    } else {
      out[k] = bv || av
    }
  }
  return out
}

// 云端字段可能是 text 里的 JSON 字符串，也可能是 jsonb 直出的对象/数组
function parseCloudField(v) {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'object') return v
  try {
    return JSON.parse(v)
  } catch (e) {
    return null
  }
}

// ---------- 云端读写 ----------
function currentUser() {
  const sb = getSupabase()
  if (!sb) return null
  return sb.auth.getUser().then(({ data }) => data.user || null)
}

async function pull(userId) {
  const sb = getSupabase()
  const { data } = await sb.from(TABLE).select('*').eq('id', userId).maybeSingle()
  if (!data) return null

  // 云端数据先归一化（兼容旧版纯数字 key / 被写成对象的 wrong·favorites），
  // 合并后再 repairState() 兜底，确保进入渲染的数据形态一定合法。
  const cloudQuiz = normalizeState(parseCloudField(data[FIELD_QUIZ]))
  const cloudWord = normalizeWordState(parseCloudField(data[FIELD_WORD]))
  const rawQuiz = parseCloudField(data[FIELD_QUIZ])
  const rawWord = parseCloudField(data[FIELD_WORD])

  if (rawQuiz) Object.assign(store.state, deepMerge(store.state, cloudQuiz))
  if (rawWord) Object.assign(wordStore.state, deepMerge(wordStore.state, cloudWord))
  repairState()
  repairWordState()
  return { cloudQuiz: rawQuiz, cloudWord: rawWord }
}

async function push(userId) {
  const sb = getSupabase()
  repairState()      // 上传前保证结构合法，避免把坏形态写回云端
  repairWordState()
  const { error } = await sb.from(TABLE).upsert({
    id: userId,
    [FIELD_QUIZ]: JSON.stringify(store.state),
    [FIELD_WORD]: JSON.stringify(wordStore.state),
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' })
  if (error) throw error
  syncState.lastPushedQuiz = JSON.stringify(store.state)
  syncState.lastPushedWord = JSON.stringify(wordStore.state)
  syncState.lastPushAt = Date.now()
}

// ---------- 对外流程 ----------
let pushTimer = null

function armPush() {
  if (!syncState.enabled) return
  clearTimeout(pushTimer)
  pushTimer = setTimeout(async () => {
    try {
      const quiz = JSON.stringify(store.state)
      const word = JSON.stringify(wordStore.state)
      if (quiz === syncState.lastPushedQuiz && word === syncState.lastPushedWord) return
      const user = await currentUser()
      if (!user) return
      await push(user.id)
    } catch (e) {
      syncState.message = '同步失败：' + (e && e.message ? e.message : String(e))
    }
  }, 3000)
}

// 登录成功后调用：拉取云端并合并，随后开始自动上传
async function startSync() {
  const user = await currentUser()
  if (!user) { syncState.enabled = false; return }
  syncState.enabled = true
  try {
    await pull(user.id)
    syncState.lastPullAt = Date.now()
    syncState.message = '已同步'
  } catch (e) {
    syncState.message = '同步失败：' + (e && e.message ? e.message : String(e))
  }
  armPush()
}

// 登出后停止自动上传
function stopSync() {
  syncState.enabled = false
  clearTimeout(pushTimer)
  syncState.lastPushedQuiz = ''
  syncState.lastPushedWord = ''
  syncState.message = ''
}

// 监听本地数据变化 → 自动上传
watch(
  () => [store.state, wordStore.state],
  () => armPush(),
  { deep: true }
)

export function useSync() {
  return {
    syncState: readonly(syncState),
    startSync,
    stopSync
  }
}
