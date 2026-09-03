<template>
  <div class="question-card">
    <div class="question-sentence" v-html="displaySentence"></div>

    <div class="options-list">
      <div v-for="(opt, idx) in question.options" :key="idx"
        class="option-item"
        :class="optionClass(idx)"
        @click="selectOption(idx)">
        <span class="option-num">{{ idx + 1 }}</span>
        <span class="option-text">{{ opt || '（选项缺失）' }}</span>
        <span v-if="(showResult || flash) && idx + 1 === question.answer" class="mark">✓</span>
        <span v-if="(showResult || flash) && selected === idx + 1 && idx + 1 !== question.answer" class="mark">✗</span>
      </div>
    </div>

    <div v-if="showResult" class="explanation-box">
      <div class="title">📖 解析</div>
      <div v-if="question.translation" class="translation">【译文】{{ question.translation }}</div>
      <div v-if="displayExplanation" class="detail" v-html="displayExplanation"></div>
      <div v-if="!question.translation && !question.explanation" class="detail">暂无解析</div>
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
.mark {
  font-weight: 700;
  font-size: 18px;
}
.option-item.correct .mark { color: var(--green); }
.option-item.wrong .mark { color: var(--red); }

/* v-html 内容样式 */
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
  border-bottom-color: #ff7da0;
  color: var(--sakura-600);
  font-weight: 700;
  text-align: center;
}

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
</style>
