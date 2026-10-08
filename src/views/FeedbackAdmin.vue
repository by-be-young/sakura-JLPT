<template>
  <div class="container">
    <div class="admin-head">
      <button class="btn btn-ghost btn-sm" @click="$router.push('/my')">← 返回</button>
      <h2 class="admin-title">📋 反馈管理</h2>
      <button class="btn btn-secondary btn-sm" @click="load">🔄 刷新</button>
    </div>

    <div v-if="!authState.isAdmin" class="card placeholder-card">
      <div class="empty-inline"><div class="emoji">🔒</div><p>仅管理员可见。</p></div>
    </div>

    <template v-else>
      <div v-if="loading" class="empty-inline"><p>加载中…</p></div>
      <div v-else-if="error" class="empty-inline"><div class="emoji">⚠️</div><p>{{ error }}</p></div>
      <div v-else-if="items.length === 0" class="empty-inline">
        <div class="emoji">🎉</div><p>暂无反馈</p>
      </div>

      <div v-else class="fb-list">
        <div v-for="it in items" :key="it.id" class="fb-item" :class="{ 'fb-done': it.status === 'resolved' }">
          <div class="fb-top">
            <span class="fb-tag" :class="it.type === 'question' ? 'tag-q' : 'tag-g'">
              {{ it.type === 'question' ? '题目' : '一般' }}
            </span>
            <span v-if="it.question_id" class="fb-qid">{{ it.question_id }}</span>
            <span class="fb-status" :class="it.status === 'resolved' ? 'st-done' : 'st-open'">
              {{ it.status === 'resolved' ? '已处理' : '待处理' }}
            </span>
            <span class="fb-time">{{ formatTime(it.created_at) }}</span>
          </div>
          <div class="fb-content">{{ it.content }}</div>
          <div class="fb-bottom">
            <span v-if="it.contact" class="fb-contact">📮 {{ it.contact }}</span>
            <span v-else class="fb-contact muted">未留联系方式</span>
            <button v-if="it.status !== 'resolved'" class="btn btn-primary btn-xs" @click="setStatus(it, 'resolved')">标记已处理</button>
            <button v-else class="btn btn-ghost btn-xs" @click="setStatus(it, 'open')">恢复待处理</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getSupabase } from '../composables/supabaseClient'
import { useAuth } from '../composables/useAuth'

const { state: authState } = useAuth()
const items = ref([])
const loading = ref(true)
const error = ref('')

async function load() {
  if (!authState.isAdmin) { loading.value = false; return }
  const sb = getSupabase()
  loading.value = true
  error.value = ''
  const { data, error: err } = await sb
    .from('feedbacks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (err) error.value = err.message
  else items.value = data || []
  loading.value = false
}

async function setStatus(item, status) {
  const sb = getSupabase()
  const { error: err } = await sb.from('feedbacks').update({ status }).eq('id', item.id)
  if (!err) item.status = status
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(load)
</script>

<style scoped>
.admin-head { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.admin-title { margin: 0; font-size: 20px; flex: 1; }

.fb-list { display: flex; flex-direction: column; gap: 12px; }
.fb-item {
  background: var(--card-grad); border: 1px solid var(--sakura-50, var(--sakura-100));
  border-radius: 14px; padding: 14px 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.fb-item.fb-done { opacity: 0.62; }
.fb-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.fb-tag { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9px; }
.tag-q { background: #e8f4fd; color: #3a7ca5; }
.tag-g { background: #f3e8fd; color: #7a5ca5; }
.fb-qid { font-size: 12px; font-weight: 700; color: var(--sakura-600); background: var(--sakura-100); padding: 2px 8px; border-radius: 9px; }
.fb-status { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 9px; }
.st-open { background: var(--red-soft); color: var(--red); }
.st-done { background: var(--green-soft); color: var(--green); }
.fb-time { margin-left: auto; font-size: 11px; color: var(--text-light); }
.fb-content { font-size: 14px; line-height: 1.7; color: #333; white-space: pre-wrap; word-break: break-word; }
.fb-bottom { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
.fb-contact { font-size: 12px; color: #3a7ca5; flex: 1; }
.fb-contact.muted { color: var(--text-light); }
.btn-xs { font-size: 12px; padding: 3px 10px; }
</style>
