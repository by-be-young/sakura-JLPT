// 樱花日语 - 用户反馈提交（Supabase）
// 反馈写入 feedbacks 表；审核在 Supabase 控制台 Table Editor 查看/标记（见 README）
import { getSupabase } from './supabaseClient'

const TABLE = 'feedbacks'

async function submitFeedback({ type = 'general', questionId = null, level = null, content, contact = '' }) {
  const sb = getSupabase()
  if (!sb) throw new Error('云端未配置，无法提交反馈')
  if (!content || !content.trim()) throw new Error('反馈内容不能为空')
  const { data: { user } } = await sb.auth.getUser()
  const { error } = await sb.from(TABLE).insert({
    user_id: user ? user.id : null,
    type,
    question_id: questionId,
    level,
    content: content.trim(),
    contact: contact.trim() || null,
  })
  if (error) throw error
}

export function useFeedback() {
  return { submitFeedback }
}
