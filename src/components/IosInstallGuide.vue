<template>
  <Teleport to="body">
    <Transition name="iosg">
      <div v-if="visible" class="modal-mask iosg-mask" @click.self="onKnow">
        <div class="modal-card iosg-card" role="dialog" aria-modal="true" aria-labelledby="iosg-title">
          <div class="modal-head">
            <div class="iosg-head">
              <span class="icon-tile sm" aria-hidden="true">🌸</span>
              <div class="iosg-head-text">
                <h3 id="iosg-title" class="modal-title">把樱花日语装到主屏幕</h3>
                <p class="iosg-sub">iPad / iPhone 装不了 exe 或 apk，这样加一次就是全屏离线的 App</p>
              </div>
            </div>
            <button class="modal-close" type="button" @click="onKnow" aria-label="关闭安装引导">✕</button>
          </div>

          <!-- Safari 工具栏示意：指出分享按钮在哪 -->
          <div class="iosg-toolbar" aria-hidden="true">
            <span class="iosg-tool-icon">‹</span>
            <span class="iosg-tool-icon">›</span>
            <span class="iosg-tool-share">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
                stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 15.5V4.2" />
                <path d="M8 8.2 12 4.2l4 4" />
                <path d="M5.5 12.2v6.3a1.6 1.6 0 0 0 1.6 1.6h9.8a1.6 1.6 0 0 0 1.6-1.6v-6.3" />
              </svg>
            </span>
            <span class="iosg-tool-icon">▭</span>
            <span class="iosg-tool-icon">❐</span>
            <span class="iosg-tool-caret">点这里</span>
          </div>

          <ol class="iosg-steps">
            <li v-for="(s, i) in steps" :key="s.title" class="iosg-step">
              <span class="iosg-no" aria-hidden="true">{{ i + 1 }}</span>
              <div class="iosg-step-text">
                <strong>{{ s.title }}</strong>
                <p>{{ s.desc }}</p>
              </div>
            </li>
          </ol>

          <ul class="iosg-tips">
            <li><span aria-hidden="true">📶</span>首次从图标打开时联网停十几秒，等资源缓存完，之后断网也能刷题</li>
            <li><span aria-hidden="true">💾</span>进度只存在这台设备：别清 Safari 网站数据，定期在设置里导出 JSON 备份</li>
            <li><span aria-hidden="true">🔄</span>以后有新版本，App 内会提示更新，不用重新添加</li>
          </ul>

          <div class="iosg-actions">
            <button class="btn btn-ghost btn-sm" type="button" @click="onNever">不再提示</button>
            <button class="btn btn-primary" type="button" @click="onKnow">知道了</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {
  shouldPromptIosInstall,
  snoozeIosInstall,
  disableIosInstallGuide,
} from '../composables/useIosInstallGuide'

const visible = ref(false)
let timer = 0

const steps = [
  {
    title: '用 Safari 打开本站',
    desc: '必须是 Safari。微信、QQ、Chrome 的内置浏览器里没有「添加到主屏幕」这个入口。',
  },
  {
    title: '点工具栏的分享按钮',
    desc: '就是上面高亮的那个方框加箭头，然后在菜单里选「添加到主屏幕」。',
  },
  {
    title: '保持「作为网页 App 打开」，点添加',
    desc: '名称保留「樱花日语」。iPadOS 26 起这个开关默认就是开着的，旧版系统会直接按 App 方式打开。',
  },
]

function onKnow() {
  visible.value = false
  snoozeIosInstall()
}

function onNever() {
  visible.value = false
  disableIosInstallGuide()
}

onMounted(() => {
  // 延迟弹出，别抢首屏和更新提示
  timer = window.setTimeout(() => {
    if (!shouldPromptIosInstall()) return
    if (document.visibilityState === 'hidden') return
    visible.value = true
  }, 2200)
})

onUnmounted(() => {
  clearTimeout(timer)
})
</script>

<style scoped>
.iosg-card {
  width: min(430px, 100%);
  overflow: hidden;
}

.iosg-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}
.iosg-head-text {
  min-width: 0;
}
.iosg-sub {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.55;
  color: var(--text-light);
}

/* ---------- Safari 工具栏示意 ---------- */
.iosg-toolbar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin: 4px 0 18px;
  padding: 9px 14px;
  border-radius: var(--radius-pill);
  background: var(--sakura-50);
  border: 1px solid var(--border);
  color: var(--text-faint);
  font-size: 15px;
  user-select: none;
}
.iosg-tool-icon {
  line-height: 1;
  opacity: 0.65;
}
.iosg-tool-share {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-pill);
  background: var(--grad-sakura);
  color: #fff;
  box-shadow: 0 6px 16px rgba(244, 92, 142, 0.34);
  animation: iosg-pulse 2.6s var(--ease-soft) infinite;
}
.iosg-tool-caret {
  position: absolute;
  top: -9px;
  left: 50%;
  transform: translateX(-50%);
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--sakura-600);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
@keyframes iosg-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 6px 16px rgba(244, 92, 142, 0.34); }
  50% { transform: scale(1.06); box-shadow: 0 8px 22px rgba(244, 92, 142, 0.46); }
}

/* ---------- 步骤 ---------- */
.iosg-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.iosg-step {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.iosg-no {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  margin-top: 1px;
  border-radius: 50%;
  background: var(--sakura-100);
  color: var(--sakura-700);
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  font-variant-numeric: tabular-nums;
}
.iosg-step-text strong {
  display: block;
  font-size: 13.5px;
  font-weight: 800;
  color: var(--text);
}
.iosg-step-text p {
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-light);
}

/* ---------- 提示 ---------- */
.iosg-tips {
  margin: 16px 0 0;
  padding: 11px 13px;
  border-radius: var(--radius-sm);
  background: var(--sakura-50);
  border: 1px solid var(--line);
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.iosg-tips li {
  display: flex;
  gap: 7px;
  font-size: 11.5px;
  line-height: 1.55;
  color: var(--text-light);
}
.iosg-tips li span {
  flex-shrink: 0;
  font-size: 12px;
}

.iosg-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
.iosg-actions .btn {
  flex: 1;
  min-height: 42px;
  border-radius: var(--radius-pill);
  font-size: 13.5px;
}
.iosg-actions .btn-ghost {
  flex: 0 0 auto;
  padding: 0 16px;
}

/* ---------- 进出场 ---------- */
.iosg-enter-active { transition: opacity var(--dur-3) var(--ease-out-expo); }
.iosg-leave-active { transition: opacity var(--dur-2) var(--ease-soft); }
.iosg-enter-from, .iosg-leave-to { opacity: 0; }
.iosg-enter-active .iosg-card { transition: transform var(--dur-4) var(--ease-spring); }
.iosg-enter-from .iosg-card { transform: translateY(14px) scale(0.96); }
</style>
