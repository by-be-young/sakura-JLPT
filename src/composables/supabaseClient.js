// 樱花日语 - Supabase 单例客户端
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG, isSupabaseConfigured } from '../supabase/config'

let client = null

export function getSupabase() {
  if (client) return client
  if (!isSupabaseConfigured()) return null
  client = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)
  return client
}

export function resetSupabase() {
  client = null
}
