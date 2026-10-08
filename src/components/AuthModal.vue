<template>
  <Transition name="auth-fade">
    <div v-if="visible" class="auth-mask" @click.self="close">
      <div class="auth-card">
        <button class="auth-close" @click="close">✕</button>
        <div class="auth-title">🌸 {{ mode === 'login' ? '登录' : mode === 'register' ? '注册账号' : '找回密码' }}</div>

        <!-- 未配置云端 -->
        <div v-if="!configured" class="auth-notice">
          <p>尚未配置云端服务。</p>
          <p>请按 README「Supabase 账号接入」章节创建项目并建表，将 Project URL / anon key 填入
            <code>src/supabase/config.js</code> 后重新构建即可启用登录与云同步。</p>
        </div>

        <template v-else>
          <!-- 表单 -->
          <form @submit.prevent="submit">
            <label class="auth-label">邮箱</label>
            <input v-model.trim="email" class="auth-input" type="email" placeholder="you@example.com"
              autocomplete="email" required />

            <template v-if="mode !== 'reset'">
              <label class="auth-label">密码</label>
              <input v-model="password" class="auth-input" type="password" placeholder="至少 6 位"
                :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" required />
              <template v-if="mode === 'register'">
                <label class="auth-label">确认密码</label>
                <input v-model="password2" class="auth-input" type="password" placeholder="再次输入密码" required />
              </template>
            </template>

            <p v-if="error" class="auth-error">{{ error }}</p>
            <p v-if="success" class="auth-success">{{ success }}</p>

            <button class="auth-btn" type="submit" :disabled="busy">
              {{ busy ? '请稍候…' : (mode === 'login' ? '登录' : mode === 'register' ? '注册' : '发送重置邮件') }}
            </button>
          </form>

          <!-- 切换 -->
          <div class="auth-switch">
            <template v-if="mode === 'login'">
              <a @click="mode = 'register'">没有账号？去注册</a>
              <a @click="mode = 'reset'">忘记密码？</a>
            </template>
            <template v-else-if="mode === 'register'">
              <a @click="mode = 'login'">已有账号？去登录</a>
            </template>
            <template v-else>
              <a @click="mode = 'login'">返回登录</a>
            </template>
          </div>
        </template>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref } from 'vue'
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
.auth-mask {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(60, 20, 35, 0.45);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.auth-card {
  position: relative; width: 100%; max-width: 360px;
  background: var(--card); border-radius: 16px; padding: 28px 26px 22px;
  box-shadow: 0 12px 40px rgba(179, 74, 111, 0.25);
}
.auth-close {
  position: absolute; top: 10px; right: 12px;
  border: none; background: none; font-size: 16px; color: #b98a9c; cursor: pointer;
}
.auth-title {
  font-size: 18px; font-weight: 700; color: var(--sakura-600); margin-bottom: 18px; text-align: center;
}
.auth-label { display: block; font-size: 12px; color: var(--text-light); margin: 10px 0 4px; }
.auth-input {
  width: 100%; box-sizing: border-box;
  padding: 9px 12px; border: 1px solid #ffd0e0; border-radius: 8px;
  font-size: 14px; color: var(--text); background: var(--card);
}
.auth-input:focus { outline: none; border-color: #ff8fbf; }
.auth-error { color: var(--sakura-600); font-size: 12px; margin: 8px 0 0; }
.auth-success { color: var(--green); font-size: 12px; margin: 8px 0 0; }
.auth-btn {
  width: 100%; margin-top: 16px; padding: 10px 0;
  border: none; border-radius: 10px; background: linear-gradient(90deg, #ff9ec6, #ff6fa8);
  color: #fff; font-size: 15px; font-weight: 600; cursor: pointer;
}
.auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.auth-switch { display: flex; justify-content: space-between; margin-top: 14px; font-size: 13px; }
.auth-switch a { color: var(--sakura-600); cursor: pointer; text-decoration: none; }
.auth-notice { font-size: 13px; color: var(--text-light); line-height: 1.7; }
.auth-notice code { background: var(--sakura-100); padding: 1px 5px; border-radius: 4px; color: var(--sakura-600); }
.auth-fade-enter-active, .auth-fade-leave-active { transition: opacity 0.2s; }
.auth-fade-enter-from, .auth-fade-leave-to { opacity: 0; }
</style>
