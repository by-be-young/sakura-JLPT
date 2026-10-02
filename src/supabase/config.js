// 樱花日语 - Supabase 云端配置
// ============================================================
// ⚠️ 这里只允许填 **anon public key**（设计上就是公开的、随客户端分发）。
//    service_role / secret key 是数据库最高权限：一旦打进 exe/apk，
//    任何下载安装包的人都能读写、删除全部用户数据。
//    构建时会自动解码校验（scripts/check_supabase_key.cjs），
//    填成非 anon 的 key 会直接让 `npm run build` / `build:win` / `build:android` 失败。
//
// 配置方式（二选一，环境变量优先）：
//   A. 环境变量（推荐，密钥不落仓库）：复制 .env.example 为 .env.local 后填写
//        VITE_SUPABASE_URL=https://xxxx.supabase.co
//        VITE_SUPABASE_ANON_KEY=<anon public key>
//   B. 直接改下面的默认值（anon key 是公开的，提交进仓库也无妨）
// 接入步骤见 README「Supabase 账号接入」章节。
// ============================================================

const ENV_URL = import.meta.env.VITE_SUPABASE_URL
const ENV_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Project URL（Supabase 后台 → Project Settings → API）
const DEFAULT_URL = 'https://qdsjpgkxgdzmialzssud.supabase.co'

// anon public key（Supabase 后台 → Project Settings → API → anon / public）
// 留空时应用保持纯本地模式，登录入口会提示「未配置云端」。
const DEFAULT_ANON_KEY = ''

export const SUPABASE_CONFIG = {
  url: ENV_URL || DEFAULT_URL,
  anonKey: ENV_ANON_KEY || DEFAULT_ANON_KEY,
}

export function isSupabaseConfigured() {
  return !!(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey)
}
