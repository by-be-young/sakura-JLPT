<template>
  <Teleport to="body">
    <Transition name="upd-slide">
      <aside v-if="show" class="upd-toast" aria-label="应用更新提示">
        <!-- 有新版本 -->
        <template v-if="state.phase === 'available'">
          <div class="upd-head">
            <span class="upd-icon icon-tile sm" aria-hidden="true">✨</span>
            <div class="upd-head-text" role="status" aria-live="polite">
              <span class="upd-kicker">版本更新</span>
              <strong class="upd-title">发现新版本 v{{ state.latest }}</strong>
            </div>
          </div>
          <p class="upd-desc">当前版本 <b>v{{ state.current || '未知' }}</b> · 更新后体验最新功能</p>
          <div class="upd-actions">
            <button class="btn btn-primary btn-sm" @click="update">立即更新</button>
            <button class="btn btn-ghost btn-sm" @click="dismiss">稍后</button>
          </div>
        </template>

        <!-- 下载中 -->
        <template v-else-if="state.phase === 'downloading'">
          <div class="upd-head">
            <span class="upd-icon icon-tile sm iris" aria-hidden="true">⬇️</span>
            <div class="upd-head-text" role="status" aria-live="polite">
              <span class="upd-kicker">正在下载</span>
              <strong class="upd-title">更新 v{{ state.latest }}</strong>
            </div>
          </div>
          <div class="upd-progress" role="progressbar" :aria-valuenow="state.progress" aria-valuemin="0"
            aria-valuemax="100" :aria-label="`更新下载进度 ${state.progress}%`">
            <div class="upd-bar" :style="{ width: state.progress + '%' }"></div>
          </div>
          <p class="upd-desc upd-progress-text">
            <span>{{ state.progress }}%</span>
            <span>请保持网络连接</span>
          </p>
        </template>

        <!-- 下载完成 -->
        <template v-else-if="state.phase === 'downloaded'">
          <div class="upd-head">
            <span class="upd-icon icon-tile sm mint" aria-hidden="true">✅</span>
            <div class="upd-head-text" role="status" aria-live="polite">
              <span class="upd-kicker">准备就绪</span>
              <strong class="upd-title">更新 v{{ state.latest }} 已下载</strong>
            </div>
          </div>
          <p class="upd-desc">重启后即可使用新版本，学习进度不会丢失。</p>
          <div class="upd-actions">
            <button class="btn btn-primary btn-sm" @click="installNow">立即重启安装</button>
            <button class="btn btn-ghost btn-sm" @click="dismiss">稍后</button>
          </div>
        </template>

        <!-- 错误 -->
        <template v-else-if="state.phase === 'error'">
          <div class="upd-head">
            <span class="upd-icon icon-tile sm danger" aria-hidden="true">⚠️</span>
            <div class="upd-head-text" role="status" aria-live="polite">
              <span class="upd-kicker">更新提示</span>
              <strong class="upd-title">更新检查失败</strong>
            </div>
          </div>
          <div class="upd-alert">{{ state.error || '请稍后再试' }}</div>
          <div class="upd-actions">
            <button class="btn btn-secondary btn-sm" @click="dismiss">关闭</button>
          </div>
        </template>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useUpdater } from '../composables/useUpdater'

const { state, init, startDownload, installNow, dismiss } = useUpdater()

const show = computed(() => ['available', 'downloading', 'downloaded', 'error'].includes(state.phase))

const update = () => {
  if (state.platform === 'electron') {
    startDownload()
  } else {
    startDownload()
  }
}

onMounted(() => {
  // 延迟一点，避免抢占首屏
  setTimeout(init, 2500)
})
</script>

<style scoped>
.upd-toast {
  position: fixed;
  right: 20px;
  bottom: calc(20px + env(safe-area-inset-bottom));
  z-index: var(--z-toast);
  width: min(340px, calc(100vw - 40px));
  padding: 16px;
  border-radius: var(--radius-xl);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-lg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  color: var(--text);
  overflow: hidden;
}
/* 玻璃高光 + 柔和色团 */
.upd-toast::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--sakura-300), transparent);
  opacity: 0.55;
  pointer-events: none;
}
.upd-toast::after {
  content: '';
  position: absolute;
  top: -48px;
  right: -36px;
  z-index: 0;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  background: var(--grad-sakura);
  filter: blur(38px);
  opacity: 0.16;
  pointer-events: none;
}
.upd-head,
.upd-desc,
.upd-progress,
.upd-actions,
.upd-alert { position: relative; z-index: 1; }

/* ---------- 头部 ---------- */
.upd-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.upd-icon {
  font-size: 17px;
  flex-shrink: 0;
}
.upd-icon.danger { background: var(--red-soft); }
.upd-head-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.upd-kicker {
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--sakura-600);
}
.upd-title {
  font-size: 14px;
  font-weight: 800;
  line-height: 1.35;
  color: var(--text);
  overflow-wrap: anywhere;
}

/* ---------- 说明 / 操作 ---------- */
.upd-desc {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-light);
}
.upd-desc b {
  color: var(--text);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.upd-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.upd-actions .btn {
  flex: 1;
  min-height: 40px;
  padding: 0 12px;
  border-radius: var(--radius-pill);
  font-size: 12.5px;
  white-space: nowrap;
}

/* ---------- 进度条 ---------- */
.upd-progress {
  height: 7px;
  margin-top: 12px;
  border-radius: var(--radius-pill);
  background: var(--sakura-100);
  overflow: hidden;
}
.upd-bar {
  height: 100%;
  border-radius: inherit;
  background: var(--grad-sakura);
  transition: width var(--dur-4) var(--ease-out-expo);
  animation: upd-bar-pulse 1.8s var(--ease-soft) infinite;
}
@keyframes upd-bar-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.74; }
}
.upd-progress-text {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  font-variant-numeric: tabular-nums;
}
.upd-progress-text span:first-child {
  font-weight: 800;
  color: var(--sakura-600);
}

/* ---------- 错误提示条 ---------- */
.upd-alert {
  margin-top: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  background: var(--red-soft);
  color: var(--text);
  font-size: 12px;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

/* ---------- 进出场 ---------- */
.upd-slide-enter-active {
  transition: opacity var(--dur-3) var(--ease-out-expo), transform var(--dur-4) var(--ease-out-expo);
}
.upd-slide-leave-active {
  transition: opacity var(--dur-2) var(--ease-soft), transform var(--dur-2) var(--ease-soft);
}
.upd-slide-enter-from {
  opacity: 0;
  transform: translateY(18px) scale(0.97);
}
.upd-slide-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

/* ---------- 移动端：贴底安全区，避开 Dock ---------- */
@media (max-width: 640px) {
  .upd-toast {
    left: 12px;
    right: 12px;
    bottom: calc(82px + env(safe-area-inset-bottom));
    width: auto;
    max-width: 480px;
    margin: 0 auto;
    padding: 14px;
    border-radius: var(--radius-lg);
  }
}
</style>
