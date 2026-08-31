<template>
  <div class="word-quiz">
    <!-- 看假名选汉字 -->
    <template v-if="type === 'kana2kanji'">
      <div class="quiz-prompt">
        <div class="prompt-label">选出与假名对应的汉字</div>
        <div class="prompt-word kana-big">{{ question.prompt }}</div>
        <div class="prompt-pitch" v-if="question.pitch && question.pitch.length">
          音调：{{ question.pitch.map(pitchToCircle).join(' ') }}
        </div>
      </div>
      <div class="options-grid">
        <button v-for="(opt, i) in question.options" :key="i" class="opt-btn"
          :class="optClass(i)"
          :disabled="answered"
          @click="select(i)">
          <span class="opt-text">{{ opt }}</span>
        </button>
      </div>
    </template>

    <!-- 看汉字选假名 -->
    <template v-else-if="type === 'kanji2kana'">
      <div class="quiz-prompt">
        <div class="prompt-label">选出汉字的正确读音</div>
        <div class="prompt-word kanji-big">{{ question.prompt }}</div>
      </div>
      <div class="options-grid">
        <button v-for="(opt, i) in question.options" :key="i" class="opt-btn"
          :class="optClass(i)"
          :disabled="answered"
          @click="select(i)">
          <span class="opt-text kana-opt">{{ opt }}</span>
          <span class="opt-pitch" v-if="question.optionPitches && question.optionPitches[i]">
            {{ question.optionPitches[i].map(pitchToCircle).join('') }}
          </span>
        </button>
      </div>
    </template>

    <!-- 看单词选释义 -->
    <template v-else-if="type === 'word2meaning'">
      <div class="quiz-prompt">
        <div class="prompt-label">选出与单词相符的释义</div>
        <div class="prompt-word word-big">
          {{ question.prompt.kanji || question.prompt.kana }}
          <span v-if="question.prompt.pitch && question.prompt.pitch.length" class="inline-pitch">{{ question.prompt.pitch.map(pitchToCircle).join('') }}</span>
        </div>
      </div>
      <div class="options-grid">
        <button v-for="(opt, i) in question.options" :key="i" class="opt-btn meaning-opt"
          :class="optClass(i)"
          :disabled="answered"
          @click="select(i)">
          <span class="opt-text">{{ opt }}</span>
        </button>
      </div>
    </template>

    <!-- 看释义选单词 -->
    <template v-else-if="type === 'meaning2word'">
      <div class="quiz-prompt">
        <div class="prompt-label">选出与释义相符的单词</div>
        <div class="prompt-word meaning-big">{{ question.prompt }}</div>
      </div>
      <div class="options-grid">
        <button v-for="(opt, i) in question.options" :key="i" class="opt-btn word-opt"
          :class="optClass(i)"
          :disabled="answered"
          @click="select(i)">
          <span class="opt-text">{{ opt.kanji || opt.kana }}</span>
          <span v-if="opt.pitch && opt.pitch.length" class="opt-pitch">{{ opt.pitch.map(pitchToCircle).join('') }}</span>
        </button>
      </div>
    </template>

    <!-- 例句挖空选单词 -->
    <template v-else-if="type === 'fillblank'">
      <div class="quiz-prompt">
        <div class="prompt-label">从例句中选出填入____的合适单词</div>
        <div class="prompt-sentence">{{ question.prompt.before }}<span class="blank-line"></span>{{ question.prompt.after }}</div>
        <button v-if="!showZh" class="btn-zh-toggle" @click="showZh = true">显示例句释义 ▾</button>
        <div v-if="showZh" class="prompt-sentence-zh">{{ question.prompt.zh }}</div>
      </div>
      <div class="options-grid">
        <button v-for="(opt, i) in question.options" :key="i" class="opt-btn word-opt"
          :class="optClass(i)"
          :disabled="answered"
          @click="select(i)">
          <span class="opt-text">{{ opt.kanji || opt.kana }}</span>
          <span v-if="opt.pitch && opt.pitch.length" class="opt-pitch">{{ opt.pitch.map(pitchToCircle).join('') }}</span>
        </button>
      </div>
    </template>

    <!-- 笔记按钮 -->
    <div class="quiz-note-row">
      <button class="btn-note" @click="$emit('note')">📝 添加笔记</button>
    </div>

    <div v-if="answered && feedback" class="feedback" :class="feedback.correct ? 'fb-correct' : 'fb-wrong'">
      <span class="fb-icon">{{ feedback.correct ? '✅' : '❌' }}</span>
      <span class="fb-text">
        {{ feedback.correct ? '回答正确！' : '回答错误' }}
        <template v-if="!feedback.correct">，正确答案：<b>{{ feedback.answerText }}</b></template>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { pitchToCircle } from '../../data/words'

const props = defineProps({
  type: { type: String, required: true },
  question: { type: Object, required: true },
})

const emit = defineEmits(['answer', 'note'])
const answered = ref(false)
const selected = ref(-1)
const showZh = ref(false)

const feedback = computed(() => {
  if (selected.value < 0) return null
  const correct = selected.value === props.question.correctIndex
  return {
    correct,
    answerText: props.question.answerText,
  }
})

function optClass(i) {
  if (!answered.value) return { selected: selected.value === i }
  return {
    correct: i === props.question.correctIndex,
    wrong: selected.value === i && i !== props.question.correctIndex,
    disabled: true,
  }
}

function select(i) {
  if (answered.value) return
  selected.value = i
  answered.value = true
  emit('answer', i === props.question.correctIndex)
}
</script>

<style scoped>
.word-quiz {
  width: 100%;
}
.quiz-prompt {
  text-align: center;
  margin-bottom: 24px;
}
.prompt-label {
  font-size: 14px;
  color: #b98a94;
  margin-bottom: 14px;
  letter-spacing: 0.05em;
}
.prompt-word {
  font-weight: 700;
  color: #c2556f;
}
.kana-big { font-size: 44px; letter-spacing: 0.06em; }
.kanji-big { font-size: 46px; letter-spacing: 0.08em; }
.word-big { font-size: 40px; }
.meaning-big { font-size: 26px; color: #6b4a52; }
.prompt-pitch {
  margin-top: 10px;
  font-size: 15px;
  color: #e884a0;
  font-weight: 600;
}
.inline-pitch {
  font-size: 18px;
  color: #e884a0;
  margin-left: 8px;
}
.prompt-sentence {
  font-size: 24px;
  color: #6b4a52;
  font-weight: 600;
  line-height: 1.8;
}
.blank-line {
  display: inline-block;
  min-width: 72px;
  border-bottom: 3px solid #e884a0;
  margin: 0 4px;
  vertical-align: baseline;
}
.prompt-sentence-zh {
  margin-top: 8px;
  font-size: 14px;
  color: #b8a091;
}
.btn-zh-toggle {
  margin-top: 10px;
  background: none;
  border: none;
  color: #b98a94;
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
  text-decoration: underline dotted;
}
.btn-zh-toggle:hover { color: #c2556f; }
.quiz-note-row {
  text-align: center;
  margin-top: 12px;
}
.btn-note {
  background: #fff;
  border: 2px solid #ffd3e0;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 13px;
  color: #c2556f;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.btn-note:hover {
  background: #ffeef3;
  border-color: #f79ab4;
}
.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.opt-btn {
  border: 2px solid #ffd3e0;
  background: #fffafc;
  border-radius: 14px;
  padding: 14px 12px;
  font-size: 18px;
  color: #7a4b55;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
}
.opt-btn:hover:not(.disabled) {
  border-color: #f79ab4;
  background: #fff0f5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 145, 179, 0.2);
}
.opt-btn.selected {
  border-color: #f79ab4;
  background: #ffe9f0;
}
.opt-btn.correct {
  border-color: #7ed58a;
  background: #eefbf0;
  color: #2d8a3e;
}
.opt-btn.wrong {
  border-color: #f79b9b;
  background: #fff0f0;
  color: #c0392b;
}
.opt-btn.disabled { cursor: default; }
.opt-text { flex: 1; }
.kana-opt { font-size: 20px; }
.opt-pitch {
  font-size: 13px;
  color: #e884a0;
  font-weight: 700;
}
.meaning-opt .opt-text {
  font-size: 16px;
  text-align: center;
  line-height: 1.5;
}
.word-opt .opt-text { font-size: 20px; font-weight: 600; }
.feedback {
  margin-top: 18px;
  padding: 12px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
}
.fb-correct { background: #eefbf0; color: #2d8a3e; }
.fb-wrong { background: #fff0f0; color: #c0392b; }
.fb-icon { font-size: 18px; }
@media (max-width: 480px) {
  .options-grid { grid-template-columns: 1fr; }
}
</style>
