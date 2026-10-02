<template>
  <Teleport to="body">
    <Transition name="fb-fade">
      <div v-if="visible" class="fb-mask" @click.self="close">
        <div class="fb-card">
          <button class="fb-close" @click="close" aria-label="关闭">✕</button>
          <h3 class="fb-title">{{ isQuestion ? '💬 反馈本题' : '📮 问题反馈' }}</h3>
          <p v-if="isQuestion && questionTag" class="fb-qid">{{ questionTag }}</p>
          <textarea v-model="content" class="fb-textarea" rows="4" maxlength="1000"
            :placeholder="isQuestion
              ? '这道题有什么问题？如：答案错误、解析有误、译文不通顺、漏字错字…'
              : '告诉我们你遇到的问题或建议，我们会尽快处理…'"></textarea>
          <input v-model="contact" class="fb-input" maxlength="100"
            placeholder="联系方式（选填，方便我们回复你）" />
          <div v-if="error" class="fb-error">⚠ {{ error }}</div>
          <div v-if="success" class="fb-success">✅ {{ success }}</div>
          <div class="fb-actions">
            <button class="btn btn-ghost btn-sm" @click="close">取消</button>
            <button class="btn btn-primary btn-sm" :disabled="busy || !content.trim()" @click="submit">
              {{ busy ? '提交中…' : '提交' }}
            </button>
          </div>
          <p class="fb-hint">反馈会直接送达开发者后台，未登录也可提交</p>
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
.fb-mask {
  position: fixed; inset: 0; z-index: 10001;
  background: rgba(60, 20, 35, 0.45);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.fb-card {
  position: relative; width: 100%; max-width: 380px;
  background: #fff; border-radius: 16px; padding: 24px 22px 18px;
  box-shadow: 0 12px 40px rgba(179, 74, 111, 0.25);
}
.fb-close {
  position: absolute; top: 10px; right: 12px;
  width: 28px; height: 28px; border: none; background: #fdeef3;
  color: #b34a6f; border-radius: 50%; font-size: 13px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.fb-close:hover { background: #ffd9e8; }
.fb-title { margin: 0 0 6px; font-size: 17px; color: #7a4b55; }
.fb-qid {
  display: inline-block; margin-bottom: 10px;
  background: #fff0f5; color: #b34a6f; font-weight: 700; font-size: 12px;
  padding: 2px 10px; border-radius: 10px;
}
.fb-textarea {
  width: 100%; box-sizing: border-box;
  border: 1.5px solid #ffd3e0; border-radius: 10px;
  padding: 10px 12px; font-size: 14px; line-height: 1.6;
  font-family: inherit; color: #333; resize: vertical;
  outline: none; min-height: 88px;
}
.fb-textarea:focus { border-color: #ff7da0; }
.fb-input {
  width: 100%; box-sizing: border-box; margin-top: 10px;
  border: 1.5px solid #ffd3e0; border-radius: 10px;
  padding: 9px 12px; font-size: 13px; font-family: inherit; color: #333;
  outline: none;
}
.fb-input:focus { border-color: #ff7da0; }
.fb-error { margin-top: 10px; font-size: 12.5px; color: #d64550; }
.fb-success { margin-top: 10px; font-size: 12.5px; color: #2ea06a; }
.fb-actions {
  display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px;
}
.fb-hint { margin: 10px 0 0; font-size: 11px; color: #c9a2ad; text-align: center; }

.fb-fade-enter-active, .fb-fade-leave-active { transition: opacity 0.18s ease; }
.fb-fade-enter-from, .fb-fade-leave-to { opacity: 0; }
</style>
