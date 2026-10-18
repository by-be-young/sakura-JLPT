<template>
  <Teleport to="body">
    <Transition name="fb-fade">
      <div v-if="visible" class="modal-mask fb-mask" @click.self="close">
        <div class="modal-card fb-card" role="dialog" aria-modal="true" aria-labelledby="fb-title">
          <div class="modal-head fb-head">
            <div class="fb-head-main">
              <span class="icon-tile sm" :class="isQuestion ? 'iris' : 'amber'" aria-hidden="true">
                {{ isQuestion ? '💬' : '📮' }}
              </span>
              <div class="fb-head-text">
                <h3 id="fb-title" class="modal-title">{{ isQuestion ? '反馈本题' : '问题反馈' }}</h3>
                <p class="fb-sub">
                  {{ isQuestion ? '答案、解析或译文有问题？告诉我们' : '遇到问题或有建议？欢迎告诉我们' }}
                </p>
              </div>
            </div>
            <button class="modal-close fb-close" type="button" @click="close" aria-label="关闭反馈窗口">✕</button>
          </div>

          <span v-if="isQuestion && questionTag" class="chip-pill accent fb-qid">
            <span aria-hidden="true">📌</span>{{ questionTag }}
          </span>

          <div class="fb-field">
            <textarea v-model="content" class="fb-textarea" rows="4" maxlength="1000" aria-label="反馈内容"
              :placeholder="isQuestion
                ? '这道题有什么问题？如：答案错误、解析有误、译文不通顺、漏字错字…'
                : '告诉我们你遇到的问题或建议，我们会尽快处理…'"></textarea>
            <span class="fb-counter">{{ content.length }} / 1000</span>
          </div>

          <input v-model="contact" class="fb-input" maxlength="100" aria-label="联系方式（选填）"
            placeholder="联系方式（选填，方便我们回复你）" />

          <div v-if="error" class="fb-alert error" role="alert">
            <span class="fb-alert-icon" aria-hidden="true">⚠</span><span>{{ error }}</span>
          </div>
          <div v-if="success" class="fb-alert success" role="status">
            <span class="fb-alert-icon" aria-hidden="true">✓</span><span>{{ success }}</span>
          </div>

          <div class="fb-actions">
            <button class="btn btn-ghost" type="button" @click="close">取消</button>
            <button class="btn btn-primary" type="button" :disabled="busy || !content.trim()"
              :aria-busy="busy" @click="submit">
              <span v-if="busy" class="fb-spinner" aria-hidden="true"></span>
              <span>{{ busy ? '提交中…' : '提交反馈' }}</span>
            </button>
          </div>
          <p class="fb-hint">
            <span aria-hidden="true">🔒</span>反馈会直接送达开发者后台，未登录也可提交
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useFeedback } from '../composables/useFeedback'

const props = defineProps({
  visible: { type: Boolean, default: false },
  type: { type: String, default: 'general' }, // 'question' | 'general'
  questionId: { type: String, default: '' },  // 形如 N2-123
  questionTag: { type: String, default: '' }, // 形如 N2 No.123
})
const emit = defineEmits(['update:visible', 'submitted'])

const { submitFeedback } = useFeedback()
const content = ref('')
const contact = ref('')
const busy = ref(false)
const error = ref('')
const success = ref('')

const isQuestion = computed(() => props.type === 'question')

watch(() => props.visible, (v) => {
  if (v) {
    content.value = ''
    contact.value = ''
    busy.value = false
    error.value = ''
    success.value = ''
  }
})

function close() {
  emit('update:visible', false)
}

async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await submitFeedback({
      type: props.type,
      questionId: props.questionId || null,
      level: isQuestion.value && props.questionId ? props.questionId.split('-')[0] : null,
      content: content.value,
      contact: contact.value,
    })
    success.value = '反馈已提交，感谢你的帮助！'
    emit('submitted')
    setTimeout(() => close(), 1200)
  } catch (e) {
    error.value = (e && e.message) || '提交失败，请稍后再试'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.fb-card {
  width: min(440px, 100%);
  padding: 24px 24px 20px;
}
.fb-head {
  align-items: flex-start;
  margin-bottom: 14px;
}
.fb-head-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.fb-head-text { min-width: 0; }
.fb-sub {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-light);
}
.fb-close {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  margin: -6px -6px 0 0;
  font-size: 14px;
}
.fb-qid {
  margin: 0 0 12px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* ---------- 输入 ---------- */
.fb-field { min-width: 0; }
.fb-textarea {
  display: block;
  width: 100%;
  min-height: 120px;
  box-sizing: border-box;
  padding: 12px 13px;
  border: 1.5px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--card);
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.7;
  resize: vertical;
  transition: border-color var(--dur-2) var(--ease-soft), background var(--dur-2) var(--ease-soft);
}
.fb-input {
  width: 100%;
  height: 44px;
  box-sizing: border-box;
  margin-top: 10px;
  padding: 0 13px;
  border: 1.5px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--card);
  color: var(--text);
  font-family: inherit;
  font-size: 13px;
  transition: border-color var(--dur-2) var(--ease-soft), background var(--dur-2) var(--ease-soft);
}
.fb-textarea::placeholder,
.fb-input::placeholder { color: var(--text-faint); }
@media (hover: hover) and (pointer: fine) {
  .fb-textarea:hover,
  .fb-input:hover { border-color: var(--sakura-300); }
}
.fb-counter {
  display: block;
  margin-top: 6px;
  text-align: right;
  font-size: 11px;
  color: var(--text-faint);
  font-variant-numeric: tabular-nums;
}

/* ---------- 提示条 ---------- */
.fb-alert {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--text);
  word-break: break-word;
}
.fb-alert.error { background: var(--red-soft); }
.fb-alert.success { background: var(--green-soft); }
.fb-alert.error .fb-alert-icon { color: var(--red); }
.fb-alert.success .fb-alert-icon { color: var(--green); }
.fb-alert-icon {
  flex-shrink: 0;
  font-weight: 800;
  line-height: 1.4;
}

/* ---------- 操作 ---------- */
.fb-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}
.fb-actions .btn {
  min-height: 44px;
  padding: 0 22px;
  font-size: 14px;
}
.fb-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  opacity: 0.85;
  animation: fb-spin 700ms linear infinite;
}
@keyframes fb-spin { to { transform: rotate(360deg); } }
.fb-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin: 12px 0 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--text-faint);
  text-align: center;
}

/* ---------- 进出场 ---------- */
.fb-fade-enter-active,
.fb-fade-leave-active { transition: opacity var(--dur-2) var(--ease-soft); }
.fb-fade-enter-from,
.fb-fade-leave-to { opacity: 0; }
.fb-fade-leave-active .fb-card {
  transition: transform var(--dur-2) var(--ease-soft), opacity var(--dur-2) var(--ease-soft);
  transform: translateY(14px) scale(0.99);
  opacity: 0;
}

@media (max-width: 640px) {
  .fb-card {
    width: 100%;
    max-width: none;
    padding: 20px 18px calc(20px + env(safe-area-inset-bottom));
  }
  .fb-textarea,
  .fb-input { font-size: 16px; }
  .fb-actions .btn {
    flex: 1;
    min-height: 46px;
    padding: 0 12px;
  }
}
</style>
