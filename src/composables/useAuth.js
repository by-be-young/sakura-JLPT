// 樱花日语 - Supabase 账号认证（邮箱注册/登录/登出/找回密码）
import { reactive, readonly } from 'vue'
import { isSupabaseConfigured } from '../supabase/config'
import { getSupabase } from './supabaseClient'

const state = reactive({
  ready: false,      // SDK 是否已初始化
  configured: false, // 是否已填入云端配置
  user: null,        // 当前登录用户 { email, createdAt }
  isAdmin: false,    // 是否为管理员（admins 表命中）
})

export function initSupabase() {
  state.configured = isSupabaseConfigured()
  if (!state.configured) {
    state.ready = true
    return
  }
  const sb = getSupabase()
  state.ready = true

  // 恢复会话
  sb.auth.getSession().then(({ data }) => {
    applySession(data.session)
  })
  sb.auth.onAuthStateChange((_event, session) => {
    applySession(session)
  })
}

function applySession(session) {
  if (session && session.user) {
    state.user = {
      id: session.user.id,
      email: session.user.email,
      createdAt: session.user.created_at
    }
    refreshAdmin()
  } else {
    state.user = null
    state.isAdmin = false
  }
}

// 查询当前用户是否在 admins 表中（RLS 未建表/未命中时容错为 false）
async function refreshAdmin() {
  const sb = getSupabase()
  if (!sb || !state.user) { state.isAdmin = false; return }
  try {
    const { data } = await sb.from('admins').select('user_id').eq('user_id', state.user.id).maybeSingle()
    state.isAdmin = !!data
  } catch {
    state.isAdmin = false
  }
}

// 邮箱注册；开启邮箱确认时返回 { needConfirm: true }
async function register(email, password) {
  const { data, error } = await getSupabase().auth.signUp({ email, password })
  if (error) throw error
  if (data.session) {
    applySession(data.session)
    return { needConfirm: false }
  }
  return { needConfirm: true }
}

// 邮箱登录
async function login(email, password) {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password })
  if (error) throw error
  applySession(data.session)
  return state.user
}

async function logout() {
  await getSupabase().auth.signOut()
  state.user = null
}

// 发送重置密码邮件（邮件链接需在 Supabase 后台配置 Site URL / Redirect URLs）
async function requestPasswordReset(email) {
  const { error } = await getSupabase().auth.resetPasswordForEmail(email)
  if (error) throw error
}

export function useAuth() {
  return {
    state: readonly(state),
    initSupabase,
    register,
    login,
    logout,
    requestPasswordReset,
    isConfigured: () => state.configured
  }
}
