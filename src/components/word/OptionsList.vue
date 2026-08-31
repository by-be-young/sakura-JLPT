<template>
  <div class="options-list">
    <div v-for="(opt, i) in question.options" :key="i" class="option-item"
      :class="optClass(i)" @click="select(i)">
      <span class="option-num">{{ i + 1 }}</span>
      <span class="option-text">{{ optText(opt) }}</span>
      <span v-if="optPitch(opt, i)" class="opt-pitch">{{ optPitch(opt, i) }}</span>
      <span v-if="answered && i === question.correctIndex" class="mark">✓</span>
      <span v-if="answered && selected === i && i !== question.correctIndex" class="mark">✗</span>
    </div>
  </div>
</template>

<script setup>
import { pitchToCircle } from '../../data/words'

const props = defineProps({
  question: { type: Object, required: true },
  selected: { type: Number, default: -1 },
  answered: { type: Boolean, default: false },
})
const emit = defineEmits(['select'])

function optText(opt) {
  if (typeof opt === 'string') return opt
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
  padding: 14px 18px;
  background: #fff;
  border: 2px solid #ffd3e0;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 15px;
  color: #7a4b55;
  font-family: inherit;
  animation: optionIn 0.25s ease both;
}
@keyframes optionIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.option-item:hover:not(.disabled) {
  border-color: #f79ab4;
  background: #fff5f8;
}
.option-item.selected {
  border-color: #f79ab4;
  background: #ffe9f0;
}
.option-item.correct {
  border-color: #7ed58a;
  background: #e8f7ef;
  animation: popCorrect 0.4s ease;
}
@keyframes popCorrect {
  0% { transform: scale(1); }
  40% { transform: scale(1.03); }
  100% { transform: scale(1); }
}
.option-item.wrong {
  border-color: #f79b9b;
  background: #fdecee;
  animation: shake 0.4s ease;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
.option-item.disabled { cursor: default; }
.option-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ffe9f0;
  color: #c2556f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}
.option-item.correct .option-num { background: #7ed58a; color: #fff; }
.option-item.wrong .option-num { background: #f79b9b; color: #fff; }
.option-text { flex: 1; }
.opt-pitch {
  font-size: 13px;
  color: #e884a0;
  font-weight: 700;
  flex-shrink: 0;
}
.mark {
  font-weight: 700;
  font-size: 18px;
  flex-shrink: 0;
}
.option-item.correct .mark { color: #3a8c63; }
.option-item.wrong .mark { color: #c0392b; }
</style>
