<template>
  <div class="options-list" role="radiogroup" aria-label="选项">
    <div v-for="(opt, i) in question.options" :key="i" class="option-item"
      :class="optClass(i)"
      :style="{ '--i': i }"
      role="radio"
      :aria-checked="selected === i"
      :aria-disabled="answered"
      :tabindex="answered ? -1 : 0"
      @click="select(i)"
      @keydown.enter.prevent="select(i)"
      @keydown.space.prevent="select(i)">
      <span class="option-num">{{ i + 1 }}</span>
      <span class="option-text" v-html="optText(opt)"></span>
      <span v-if="optPitch(opt, i)" class="opt-pitch">{{ optPitch(opt, i) }}</span>
      <span v-if="answered && i === question.correctIndex" class="mark" aria-label="正确答案">✓</span>
      <span v-if="answered && selected === i && i !== question.correctIndex" class="mark" aria-label="你的选择">✗</span>
    </div>
  </div>
</template>

<script setup>
import { pitchToCircle } from '../../data/words'
import { useFurigana } from '../../composables/useFurigana'

const props = defineProps({
  question: { type: Object, required: true },
  selected: { type: Number, default: -1 },
  answered: { type: Boolean, default: false },
})
const emit = defineEmits(['select'])
const furigana = useFurigana()

function hasRealKanji(s) {
  return !!s && /[\u4e00-\u9fff]/.test(s)
}

function optText(opt) {
  if (typeof opt === 'string') return opt
  // 近反义词条目 { t: 表记, y: 读音 } —— 只显示表记
  if (opt.t !== undefined) {
    return opt.t
  }
  // 开启振假名且词有汉字时，显示汉字振假名（ruby HTML）
  if (furigana.isEnabled.value && opt.kanjiFurigana && hasRealKanji(opt.kanji)) {
    return opt.kanjiFurigana
  }
  return opt.kanji || opt.kana || ''
}

function optPitch(opt, i) {
  if (typeof opt === 'string') {
    // kanji2kana: 选项是假名，从 optionPitches 取音调
    if (props.question.optionPitches && props.question.optionPitches[i]) {
      return props.question.optionPitches[i].map(pitchToCircle).join('')
    }
    return ''
  }
  if (opt.pitch && opt.pitch.length) return opt.pitch.map(pitchToCircle).join('')
  return ''
}

function optClass(i) {
  if (!props.answered) return { selected: props.selected === i }
  return {
    correct: i === props.question.correctIndex,
    wrong: props.selected === i && i !== props.question.correctIndex,
    disabled: true,
  }
}

function select(i) {
  if (props.answered) return
  emit('select', i)
}
</script>

<style scoped>
.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 54px;
  padding: 13px 18px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  color: var(--text);
  font-size: 16px;
  font-family: inherit;
  animation: opt-in 420ms var(--ease-out-expo) both;
  animation-delay: calc(var(--i, 0) * 40ms);
  transition:
    transform var(--dur-2) var(--ease-spring),
    border-color var(--dur-2) var(--ease-soft),
    background var(--dur-2) var(--ease-soft),
    box-shadow var(--dur-2) var(--ease-soft);
}
@keyframes opt-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}
@media (hover: hover) and (pointer: fine) {
  .option-item:hover:not(.disabled) {
    transform: translateX(3px);
    border-color: var(--sakura-300);
    background: var(--card-hover);
    box-shadow: var(--shadow);
  }
}
.option-item.selected {
  border-color: var(--sakura-400);
  background: var(--sakura-100);
  box-shadow: 0 0 0 3px var(--sakura-100), var(--shadow-card);
}
.option-item.correct {
  border-color: var(--green);
  background: var(--green-soft);
  animation: opt-correct 520ms var(--ease-spring);
}
@keyframes opt-correct {
  0% { transform: scale(1); }
  38% { transform: scale(1.022); }
  100% { transform: scale(1); }
}
.option-item.wrong {
  border-color: var(--red);
  background: var(--red-soft);
  animation: opt-wrong 380ms var(--ease-soft);
}
@keyframes opt-wrong {
  0%, 100% { transform: translateX(0); }
  22% { transform: translateX(-6px); }
  55% { transform: translateX(5px); }
  80% { transform: translateX(-2px); }
}
.option-item.disabled { cursor: default; }
.option-num {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--sakura-100);
  color: var(--sakura-700);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  flex-shrink: 0;
  transition: transform var(--dur-2) var(--ease-spring), background var(--dur-2), color var(--dur-2);
}
@media (hover: hover) and (pointer: fine) {
  .option-item:hover:not(.disabled) .option-num { transform: scale(1.08); }
}
.option-item.correct .option-num {
  background: var(--green);
  color: var(--card);
}
.option-item.wrong .option-num {
  background: var(--red);
  color: var(--card);
}
.option-text {
  flex: 1;
  min-width: 0;
  line-height: 1.55;
  overflow-wrap: anywhere;
}
.option-text :deep(ruby) {
  ruby-position: over;
}
.option-text :deep(rt) {
  font-size: 0.55em;
  color: var(--sakura-600);
  font-weight: 600;
  letter-spacing: 0.02em;
}
.option-text :deep(rp) {
  display: none;
}
.opt-pitch {
  font-size: 13px;
  color: var(--sakura-700);
  font-weight: 800;
  flex-shrink: 0;
}
.mark {
  font-weight: 800;
  font-size: 19px;
  flex-shrink: 0;
}
.option-item.correct .mark { color: var(--green); }
.option-item.wrong .mark { color: var(--red); }

@media (max-width: 480px) {
  .option-item {
    min-height: 52px;
    padding: 12px 14px;
    gap: 10px;
    font-size: 15px;
  }
  .option-num { width: 28px; height: 28px; font-size: 13px; }
}
</style>
