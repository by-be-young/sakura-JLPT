<template>
  <div class="question-card">
    <div class="question-sentence" v-html="displaySentence"></div>

    <div class="options-list" role="group" aria-label="选项">
      <button v-for="(opt, idx) in question.options" :key="idx" type="button"
        class="option-item"
        :class="optionClass(idx)"
        :disabled="showResult || flash"
        :aria-pressed="selected === idx + 1"
        @click="selectOption(idx)">
        <span class="option-num">{{ idx + 1 }}</span>
        <span class="option-text">{{ opt || '（选项缺失）' }}</span>
        <span v-if="(showResult || flash) && idx + 1 === question.answer" class="mark" aria-hidden="true">✓</span>
        <span v-if="(showResult || flash) && selected === idx + 1 && idx + 1 !== question.answer" class="mark" aria-hidden="true">✗</span>
      </button>
    </div>

    <div v-if="showResult" class="explanation-box surface">
      <div class="surface-head exp-head">
        <h3 class="surface-title">解析</h3>
        <span v-if="selected" class="exp-status" :class="selected === question.answer ? 'ok' : 'no'">
          {{ selected === question.answer ? '回答正确' : '回答错误' }}
        </span>
      </div>

      <div v-if="question.translation" class="translation">
        <span class="tr-label">译文</span>
        <span class="tr-text">{{ question.translation }}</span>
      </div>
      <div v-if="displayExplanation" class="detail" v-html="displayExplanation"></div>
      <div v-if="!question.translation && !question.explanation" class="detail muted">暂无解析</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useFurigana } from '../composables/useFurigana'

const props = defineProps({
  question: { type: Object, required: true },
  selected: { type: Number, default: 0 },
  showResult: { type: Boolean, default: false },
  flash: { type: Boolean, default: false },
})

const emit = defineEmits(['select'])
const furigana = useFurigana()

const displaySentence = computed(() => {
  let s = ''
  if (furigana.isEnabled.value && props.question.sentenceFurigana) {
    s = props.question.sentenceFurigana
  } else {
    s = props.question.sentence
  }
  // 排序题（含 ★）：把 ___ 与 ★ 渲染为独立的填空横线，互不粘连
  if (s && s.includes('★')) {
    return s
      .replaceAll('★', '<span class="sort-star">★</span>')
      .replaceAll('___', '<span class="sort-blank"></span>')
  }
  return s
})

const displayExplanation = computed(() => {
  if (furigana.isEnabled.value && props.question.explanationFurigana) {
    return props.question.explanationFurigana
  }
  return props.question.explanation
})

function selectOption(idx) {
  if (props.showResult || props.flash) return
  emit('select', idx + 1)
}

function optionClass(idx) {
  const num = idx + 1
  if (!props.showResult && !props.flash) {
    return { selected: props.selected === num, disabled: false }
  }
  return {
    disabled: true,
    correct: num === props.question.answer,
    wrong: props.selected === num && num !== props.question.answer,
  }
}
</script>

<style scoped>
.question-card { min-width: 0; }

/* ---------- 题干 ---------- */
.question-sentence {
  margin-bottom: 18px;
  padding: 18px 20px;
  border: 1px solid var(--border);
  border-left: 3px solid var(--sakura-300);
  border-radius: var(--radius);
  background: linear-gradient(160deg, var(--sakura-50), var(--card));
  color: var(--text);
  font-size: 17px;
  line-height: 1.95;
  word-break: break-word;
}
.question-sentence :deep(u) {
  text-decoration: none;
  border-bottom: 2px solid var(--sakura-400);
  padding-bottom: 1px;
  color: var(--sakura-700);
  font-weight: 600;
}

/* 排序题填空横线：独立框、互不粘连 */
.question-sentence :deep(.sort-blank),
.question-sentence :deep(.sort-star) {
  display: inline-block;
  min-width: 2.4em;
  border-bottom: 2px solid var(--sakura-400);
  padding: 0 6px;
  margin: 0 3px;
  vertical-align: baseline;
  line-height: 1.4;
}
.question-sentence :deep(.sort-star) {
  border-bottom-color: var(--sakura-400);
  color: var(--sakura-600);
  font-weight: 700;
  text-align: center;
}

/* ---------- 选项 ---------- */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  padding: 13px 16px;
  border: 1.5px solid var(--border);
  border-radius: 14px;
  background: var(--card);
  color: var(--text);
  font-family: inherit;
  font-size: 15px;
  line-height: 1.65;
  text-align: left;
}
.option-item:hover:not(.disabled) {
  background: var(--card-hover);
  border-color: var(--sakura-300);
}
.option-item.selected {
  border-color: var(--sakura-400);
  background: linear-gradient(135deg, var(--sakura-50), var(--sakura-100));
}
.option-item.correct {
  border-color: var(--green);
  background: var(--green-soft);
}
.option-item.wrong {
  border-color: var(--red);
  background: var(--red-soft);
}
.option-item.disabled,
.option-item:disabled {
  opacity: 1;
  cursor: default;
}
.option-text {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
.option-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--sakura-50);
  color: var(--text-light);
  font-size: 13px;
  font-weight: 800;
  transition:
    transform var(--dur-2) var(--ease-spring),
    background var(--dur-2) var(--ease-soft),
    border-color var(--dur-2) var(--ease-soft),
    color var(--dur-2) var(--ease-soft);
}
.option-item.selected .option-num {
  border-color: transparent;
  background: var(--sakura-500);
  color: #fff;
  transform: scale(1.04);
}
.option-item.correct .option-num {
  border-color: transparent;
  background: var(--green);
  color: #fff;
}
.option-item.wrong .option-num {
  border-color: transparent;
  background: var(--red);
  color: #fff;
}

.mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 800;
  animation: mark-pop 360ms var(--ease-spring) both;
}
.option-item.correct .mark {
  background: var(--green);
  color: #fff;
}
.option-item.wrong .mark {
  background: var(--red);
  color: #fff;
}
@keyframes mark-pop {
  from { opacity: 0; transform: scale(0.4); }
  60% { transform: scale(1.12); }
  to { opacity: 1; transform: none; }
}

/* ---------- 解析卡 ---------- */
.explanation-box {
  margin-top: 18px;
  padding: 18px 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--card-grad);
  box-shadow: var(--shadow-card);
}
.exp-head {
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.exp-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-size: 11.5px;
  font-weight: 700;
}
.exp-status::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.exp-status.ok { background: var(--green-soft); color: var(--green); }
.exp-status.no { background: var(--red-soft); color: var(--red); }

.question-card .translation {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--sakura-50);
  color: var(--text);
  font-size: 14.5px;
  line-height: 1.8;
  word-break: break-word;
}
.tr-label {
  flex-shrink: 0;
  margin-top: 4px;
  padding: 1px 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--card);
  color: var(--sakura-600);
  font-size: 11px;
  font-weight: 800;
}
.tr-text { min-width: 0; }

.question-card .detail {
  color: var(--text);
  font-size: 15px;
  line-height: 2;
  white-space: pre-wrap;
  word-break: break-word;
}
.detail.muted { color: var(--text-faint); }

/* 振假名 ruby 样式 */
.question-sentence :deep(ruby),
.detail :deep(ruby) {
  ruby-position: over;
}
.question-sentence :deep(rt),
.detail :deep(rt) {
  font-size: 0.55em;
  color: var(--sakura-500);
  font-weight: 500;
  letter-spacing: 0.02em;
}
.question-sentence :deep(rp),
.detail :deep(rp) {
  display: none;
}

@media (max-width: 640px) {
  .question-sentence {
    margin-bottom: 14px;
    padding: 14px 16px;
    font-size: 16px;
    line-height: 1.85;
  }
  .options-list { gap: 8px; }
  .option-item {
    min-height: 48px;
    padding: 12px 14px;
    border-radius: 12px;
    font-size: 14.5px;
  }
  .option-num {
    width: 28px;
    height: 28px;
    border-radius: 9px;
  }
  .explanation-box {
    margin-top: 14px;
    padding: 16px;
  }
  .question-card .translation {
    padding: 10px 12px;
    font-size: 14px;
  }
  .question-card .detail {
    font-size: 15px;
    line-height: 1.95;
  }
}
</style>
