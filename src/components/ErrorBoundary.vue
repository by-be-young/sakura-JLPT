<template>
  <!-- 必须是单根节点：<Transition> 无法对 fragment 根做动画（否则整站切换会异常） -->
  <div class="eb-root">
    <div v-if="error" class="eb">
      <div class="eb-card">
        <div class="eb-emoji">🫧</div>
        <div class="eb-title">这个页面出了点小问题</div>
        <div class="eb-desc">其他功能不受影响，可以重新加载或先回首页继续学习。</div>
        <div class="eb-detail" v-if="detail">{{ detail }}</div>
        <div class="eb-actions">
          <button class="btn btn-primary btn-sm" @click="reload">重新加载</button>
          <button class="btn btn-ghost btn-sm" @click="goHome">回到首页</button>
        </div>
      </div>
    </div>
    <slot v-else />
  </div>
</template>

<script setup>
// 页面级错误边界：单个视图渲染抛错时只替换该页，不再拖垮整个应用（白屏）
import { ref, onErrorCaptured, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const error = ref(false)
const detail = ref('')

// 切换路由时自动复位：一次页面错误不应该影响后续页面
watch(() => route.path, () => {
  error.value = false
  detail.value = ''
})

onErrorCaptured((err) => {
  error.value = true
  detail.value = String((err && err.message) || err || '').slice(0, 160)
  console.error('[页面渲染错误]', err)
  // 阻止继续向上冒泡，避免 App 级渲染链一起失效
  return false
})

function reload() {
  error.value = false
  detail.value = ''
  window.location.reload()
}

function goHome() {
  error.value = false
  detail.value = ''
  router.push('/').catch(() => window.location.reload())
}
</script>

<style scoped>
.eb { padding: 48px 16px; display: flex; justify-content: center; }
.eb-card {
  width: min(440px, 100%);
  text-align: center;
  padding: 32px 24px;
  border-radius: var(--radius-xl);
  background: var(--card-grad);
  border: 1px solid var(--border);
  box-shadow: var(--card-float);
}
.eb-emoji { font-size: 42px; margin-bottom: 10px; animation: float-soft 4.2s ease-in-out infinite; }
.eb-title { font-size: 16px; font-weight: 800; color: var(--text); }
.eb-desc { font-size: 13px; color: var(--text-light); line-height: 1.7; margin: 8px 0 4px; }
.eb-detail {
  font-size: 11px;
  color: var(--text-faint);
  background: var(--sakura-50);
  border-radius: 10px;
  padding: 8px 10px;
  margin: 10px 0 4px;
  word-break: break-all;
  text-align: left;
}
.eb-actions { display: flex; gap: 10px; justify-content: center; margin-top: 18px; }
@keyframes float-soft {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
</style>
