<template>
  <Teleport to="body">
    <Transition name="auth-fade">
      <div v-if="visible" class="modal-mask auth-mask" @click.self="close">
        <div class="modal-card auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <div class="modal-head auth-head">
            <div class="auth-head-main">
              <span class="icon-tile sm auth-icon" aria-hidden="true">🌸</span>
              <div class="auth-head-text">
                <h2 id="auth-title" class="modal-title">{{ title }}</h2>
                <p class="auth-sub">{{ subtitle }}</p>
              </div>
            </div>
            <button class="modal-close auth-close" type="button" aria-label="关闭登录窗口" @click="close">✕</button>
          </div>

          <!-- 未配置云端：柔和提示条 -->
          <div v-if="!configured" class="auth-notice">
            <div class="auth-notice-head">
              <span aria-hidden="true">☁️</span>
              <span>尚未配置云端服务</span>
            </div>
            <p class="auth-notice-text">
              请按 README「Supabase 账号接入」章节创建项目并建表，将 Project URL / anon key 填入
              <code>src/supabase/config.js</code> 后重新构建即可启用登录与云同步。
            </p>
          </div>

          <template v-else>
            <!-- 表单 -->
            <form class="auth-form" @submit.prevent="submit">
              <label class="auth-label" for="auth-email">邮箱</label>
              <input id="auth-email" v-model.trim="email" class="auth-input" type="email" placeholder="you@example.com"
                autocomplete="email" required />

              <template v-if="mode !== 'reset'">
                <label class="auth-label" for="auth-password">密码</label>
                <input id="auth-password" v-model="password" class="auth-input" type="password" placeholder="至少 6 位"
                  :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" required />
                <template v-if="mode === 'register'">
                  <label class="auth-label" for="auth-password2">确认密码</label>
                  <input id="auth-password2" v-model="password2" class="auth-input" type="password"
                    placeholder="再次输入密码" autocomplete="new-password" required />
                </template>
              </template>

              <Transition name="auth-msg">
                <div v-if="error" class="auth-msg error" role="alert">
                  <span class="auth-msg-icon" aria-hidden="true">!</span>
                  <span>{{ error }}</span>
                </div>
              </Transition>
              <Transition name="auth-msg">
                <div v-if="success" class="auth-msg success" role="status">
                  <span class="auth-msg-icon" aria-hidden="true">✓</span>
                  <span>{{ success }}</span>
                </div>
              </Transition>

              <button class="btn btn-primary auth-submit" type="submit" :disabled="busy" :aria-busy="busy">
                <span v-if="busy" class="auth-spinner" aria-hidden="true"></span>
                <span>{{ submitLabel }}</span>
              </button>
            </form>

            <!-- 切换 -->
            <div class="auth-switch" :class="{ 'is-single': mode !== 'login' }">
              <template v-if="mode === 'login'">
                <button type="button" class="auth-link" @click="mode = 'register'">没有账号？<b>去注册</b></button>
                <button type="button" class="auth-link" @click="mode = 'reset'">忘记密码？</button>
              </template>
              <template v-else-if="mode === 'register'">
                <button type="button" class="auth-link" @click="mode = 'login'">已有账号？<b>去登录</b></button>
              </template>
              <template v-else>
                <button type="button" class="auth-link" @click="mode = 'login'">← <b>返回登录</b></button>
              </template>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useSync } from '../composables/useSync'

const props = defineProps({ visible: { type: Boolean, default: false } })
const emit = defineEmits(['update:visible', 'authed'])

const { state: authState, register, login, requestPasswordReset, isConfigured } = useAuth()
const { startSync } = useSync()

const configured = isConfigured()

const mode = ref('login')
const email = ref('')
const password = ref('')
const password2 = ref('')
const error = ref('')
const success = ref('')
const busy = ref(false)

const title = computed(() =>
  mode.value === 'login' ? '登录' : mode.value === 'register' ? '注册账号' : '找回密码'
)
const subtitle = computed(() =>
  mode.value === 'login'
    ? '登录后可在多台设备间同步学习进度'
    : mode.value === 'register'
      ? '创建账号，备份你的错题、收藏与学习记录'
      : '输入注册邮箱，我们会发送一封重置链接邮件'
)
const submitLabel = computed(() =>
  busy.value ? '请稍候…' : mode.value === 'login' ? '登录' : mode.value === 'register' ? '注册' : '发送重置邮件'
)

function close() {
  emit('update:visible', false)
}

async function submit() {
  error.value = ''
  success.value = ''
  if (mode.value === 'register' && password.value.length < 6) {
    error.value = '密码至少 6 位'
    return
  }
  if (mode.value === 'register' && password.value !== password2.value) {
    error.value = '两次输入的密码不一致'
    return
  }
  busy.value = true
  try {
    if (mode.value === 'login') {
      await login(email.value, password.value)
      await startSync()
      success.value = '登录成功，数据已同步'
      setTimeout(() => {
        emit('authed')
        close()
      }, 600)
    } else if (mode.value === 'register') {
      const res = await register(email.value, password.value)
      if (res && res.needConfirm) {
        // 开启了邮箱确认：注册成功但需先验证邮箱
        success.value = '注册成功！验证邮件已发送，请查收邮箱完成验证后再登录'
        password.value = ''
        password2.value = ''
        setTimeout(() => { mode.value = 'login' }, 800)
        return
      }
      await startSync()
      success.value = '注册成功，数据已同步'
      setTimeout(() => {
        emit('authed')
        close()
      }, 600)
    } else {
      await requestPasswordReset(email.value)
      success.value = '重置邮件已发送，请查收邮箱'
      password.value = ''
    }
  } catch (e) {
    const msg = (e && e.message) || String(e)
    // Supabase 常见错误信息精简
    if (/already registered|already taken|exists/i.test(msg)) error.value = '该邮箱已被注册'
    else if (/invalid login credentials|wrong password/i.test(msg)) error.value = '邮箱或密码不正确'
    else if (/not confirmed/i.test(msg)) error.value = '邮箱尚未验证，请先查收验证邮件'
    else if (/rate limit/i.test(msg)) error.value = '操作太频繁，请稍后再试'
    else if (/password|weak/i.test(msg)) error.value = '密码不符合要求（至少 6 位）'
    else error.value = msg
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.auth-card {
  width: min(400px, 100%);
  padding: 24px 24px 20px;
}
.auth-head {
  align-items: flex-start;
  margin-bottom: 18px;
}
.auth-head-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.auth-icon {
  background: var(--sakura-100);
  font-size: 18px;
}
.auth-head-text { min-width: 0; }
.auth-sub {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-light);
}
.auth-close {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  margin: -6px -6px 0 0;
  font-size: 14px;
}

/* ---------- 表单 ---------- */
.auth-form { display: flex; flex-direction: column; }
.auth-label {
  margin: 12px 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--text-light);
}
.auth-label:first-child { margin-top: 0; }
.auth-input {
  width: 100%;
  height: 44px;
  box-sizing: border-box;
  padding: 0 13px;
  border: 1.5px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--card);
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
  transition:
    border-color var(--dur-2) var(--ease-soft),
    background var(--dur-2) var(--ease-soft),
    box-shadow var(--dur-2) var(--ease-soft);
}
.auth-input::placeholder { color: var(--text-faint); }
@media (hover: hover) and (pointer: fine) {
  .auth-input:hover { border-color: var(--sakura-300); }
}

/* ---------- 提示条 ---------- */
.auth-msg {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  font-size: 12.5px;
  line-height: 1.55;
  background: var(--red-soft);
  color: var(--text);
  overflow-wrap: anywhere;
}
.auth-msg.success {
  background: var(--green-soft);
}
.auth-msg.error .auth-msg-icon { color: var(--red); }
.auth-msg.success .auth-msg-icon { color: var(--green); }
.auth-msg-icon {
  flex-shrink: 0;
  font-weight: 800;
  line-height: 1.4;
}

/* ---------- 主按钮 ---------- */
.auth-submit {
  width: 100%;
  min-height: 46px;
  margin-top: 18px;
  border-radius: var(--radius-pill);
  font-size: 15px;
}
.auth-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  opacity: 0.85;
  animation: auth-spin 700ms linear infinite;
}
@keyframes auth-spin { to { transform: rotate(360deg); } }

/* ---------- 模式切换 ---------- */
.auth-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
}
.auth-switch.is-single { justify-content: center; }
.auth-link {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 2px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-light);
  transition: color var(--dur-2) var(--ease-soft);
}
.auth-link b {
  margin-left: 2px;
  color: var(--sakura-600);
  font-weight: 700;
}
@media (hover: hover) and (pointer: fine) {
  .auth-link:hover { color: var(--sakura-600); }
}

/* ---------- 未配置云端 ---------- */
.auth-notice {
  position: relative;
  overflow: hidden;
  padding: 14px 16px 15px 18px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--line);
  background: var(--amber-soft);
}
.auth-notice::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--grad-amber);
}
.auth-notice-head {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 800;
  color: var(--text);
}
.auth-notice-text {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.8;
  color: var(--text-light);
}
.auth-notice-text code {
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--card);
  color: var(--sakura-700);
  font-size: 11.5px;
  word-break: break-all;
}

/* ---------- 进出场 ---------- */
.auth-fade-enter-active,
.auth-fade-leave-active { transition: opacity var(--dur-2) var(--ease-soft); }
.auth-fade-enter-from,
.auth-fade-leave-to { opacity: 0; }
.auth-fade-leave-active .auth-card {
  transition: transform var(--dur-2) var(--ease-soft), opacity var(--dur-2) var(--ease-soft);
  transform: translateY(12px) scale(0.99);
  opacity: 0;
}
.auth-msg-enter-active,
.auth-msg-leave-active {
  transition: opacity var(--dur-2) var(--ease-soft), transform var(--dur-2) var(--ease-soft);
}
.auth-msg-enter-from,
.auth-msg-leave-to { opacity: 0; transform: translateY(-4px); }

@media (max-width: 640px) {
  .auth-card {
    width: 100%;
    max-width: none;
    padding: 20px 18px calc(20px + env(safe-area-inset-bottom));
  }
  .auth-head { margin-bottom: 16px; }
  .auth-input { font-size: 16px; }
  .auth-submit { min-height: 48px; }
}
</style>
