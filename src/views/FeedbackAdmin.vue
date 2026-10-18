<template>
  <div class="container admin-page">
    <!-- 页头 -->
    <div class="page-head" v-reveal>
      <div class="page-head-main">
        <div class="icon-tile amber" aria-hidden="true">📋</div>
        <div class="page-head-text">
          <h1 class="page-title">反馈管理</h1>
          <p class="page-sub">{{ subtitle }}</p>
        </div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm refresh-btn" @click="load" :disabled="loading"
          title="刷新反馈列表" aria-label="刷新反馈列表">
          <span class="refresh-icon" :class="{ spin: loading }" aria-hidden="true">↻</span>
          刷新
        </button>
        <button class="back-btn" @click="$router.push('/my')" title="返回我的" aria-label="返回我的">← 返回</button>
      </div>
    </div>

    <!-- 非管理员 -->
    <div v-if="!authState.isAdmin" class="surface admin-gate">
      <div class="gate-icon" aria-hidden="true">🔒</div>
      <div class="gate-body">
        <p class="gate-title">仅管理员可见</p>
        <p class="gate-desc">请使用管理员账号登录后查看反馈内容。</p>
      </div>
    </div>

    <template v-else>
      <!-- 加载骨架 -->
      <div v-if="loading" class="fb-list" aria-busy="true" aria-label="加载中">
        <div v-for="n in 3" :key="n" class="fb-skeleton surface">
          <div class="skeleton sk-short"></div>
          <div class="skeleton"></div>
          <div class="skeleton sk-mid"></div>
        </div>
      </div>

      <!-- 错误 -->
      <div v-else-if="error" class="surface admin-state">
        <div class="state-emoji" aria-hidden="true">⚠️</div>
        <p class="state-title">加载失败</p>
        <p class="state-desc">{{ error }}</p>
        <button class="btn btn-secondary btn-sm" @click="load">重新加载</button>
      </div>

      <!-- 空 -->
      <div v-else-if="items.length === 0" class="surface admin-state">
        <div class="state-emoji" aria-hidden="true">🎉</div>
        <p class="state-title">暂无反馈</p>
        <p class="state-desc">收到新的反馈后会显示在这里。</p>
      </div>

      <!-- 反馈列表 -->
      <div v-else class="fb-list" :class="{ stagger: items.length <= 12 }">
        <article v-for="it in items" :key="it.id" class="fb-item surface" :class="{ 'fb-done': it.status === 'resolved' }">
          <div class="fb-top">
            <span class="chip-pill" :class="it.type === 'question' ? 'iris' : 'accent'">
              {{ it.type === 'question' ? '题目' : '一般' }}
            </span>
            <span v-if="it.question_id" class="qid-tag">{{ it.question_id }}</span>
            <span class="chip-pill fb-status" :class="it.status === 'resolved' ? 'mint' : 'amber'">
              <span class="status-dot" aria-hidden="true"></span>
              {{ it.status === 'resolved' ? '已处理' : '待处理' }}
            </span>
            <time class="fb-time">{{ formatTime(it.created_at) }}</time>
          </div>

          <p class="fb-content">{{ it.content }}</p>

          <div class="fb-bottom">
            <span v-if="it.contact" class="fb-contact">📮 {{ it.contact }}</span>
            <span v-else class="fb-contact muted">未留联系方式</span>
            <button v-if="it.status !== 'resolved'" class="btn btn-primary btn-sm" @click="setStatus(it, 'resolved')">标记已处理</button>
            <button v-else class="btn btn-ghost btn-sm" @click="setStatus(it, 'open')">恢复待处理</button>
          </div>
        </article>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getSupabase } from '../composables/supabaseClient'
import { useAuth } from '../composables/useAuth'

const { state: authState } = useAuth()
const items = ref([])
const loading = ref(true)
const error = ref('')

const pendingCount = computed(() => items.value.filter(it => it.status !== 'resolved').length)
const resolvedCount = computed(() => items.value.filter(it => it.status === 'resolved').length)
const subtitle = computed(() => {
  if (!authState.isAdmin) return '仅管理员可查看'
  if (loading.value) return '正在同步最新反馈…'
  if (error.value) return '加载失败，请稍后重试'
  if (!items.value.length) return '暂无反馈'
  return `共 ${items.value.length} 条 · 待处理 ${pendingCount.value} 条 · 已处理 ${resolvedCount.value} 条`
})

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
.admin-page .back-btn,
.admin-page .refresh-btn { min-height: 40px; }

.refresh-icon {
  display: inline-block;
  font-size: 15px;
  line-height: 1;
  transition: transform var(--dur-3) var(--ease-soft);
}
.refresh-icon.spin { animation: spin 900ms linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ---------- 状态面板 ---------- */
.admin-gate {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px;
}
.gate-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  border-radius: 15px;
  background: var(--amber-soft);
  font-size: 22px;
}
.gate-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--text);
}
.gate-desc {
  margin-top: 3px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--text-light);
}

.admin-state {
  padding: 44px 24px;
  text-align: center;
}
.state-emoji {
  display: inline-block;
  margin-bottom: 10px;
  font-size: 40px;
  animation: float-soft 4.2s ease-in-out infinite;
}
.state-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text);
}
.state-desc {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-light);
  overflow-wrap: anywhere;
}
.admin-state .btn {
  margin-top: 16px;
  min-height: 40px;
}

/* ---------- 骨架 ---------- */
.fb-skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
}
.fb-skeleton .skeleton { height: 14px; }
.fb-skeleton .sk-short { width: 38%; height: 18px; }
.fb-skeleton .sk-mid { width: 68%; }

/* ---------- 反馈列表 ---------- */
.fb-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.fb-item {
  padding: 16px 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--card-grad);
  box-shadow: var(--shadow-card);
  transition:
    opacity var(--dur-3) var(--ease-soft),
    border-color var(--dur-3) var(--ease-soft),
    box-shadow var(--dur-3) var(--ease-out-expo);
}
.fb-item.fb-done { opacity: 0.68; }
@media (hover: hover) and (pointer: fine) {
  .fb-item:hover { border-color: var(--border-strong); box-shadow: var(--card-float); }
  .fb-item.fb-done:hover { opacity: 0.82; }
}

.fb-top {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}
.fb-status { font-size: 11.5px; }
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.fb-time {
  margin-left: auto;
  font-size: 11.5px;
  color: var(--text-faint);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.fb-content {
  font-size: 14px;
  line-height: 1.75;
  color: var(--text);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.fb-bottom {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}
.fb-contact {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--cyan);
  overflow-wrap: anywhere;
}
.fb-contact.muted { color: var(--text-faint); }
.fb-bottom .btn {
  margin-left: auto;
  min-height: 40px;
  flex-shrink: 0;
}

@media (max-width: 480px) {
  .fb-item { padding: 14px; }
  .fb-time { width: 100%; margin-left: 0; }
  .fb-bottom .btn { margin-left: 0; width: 100%; }
  .admin-page .page-actions { width: 100%; justify-content: flex-end; }
}
</style>
