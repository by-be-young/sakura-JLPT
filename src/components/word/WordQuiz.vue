<template>
  <div class="word-quiz">
    <!-- 看假名选汉字 -->
    <template v-if="type === 'kana2kanji'">
      <div class="quiz-prompt">
        <div class="prompt-label">选出与假名对应的汉字</div>
        <div class="prompt-word kana-big">{{ question.prompt }}</div>
        <div class="prompt-pitch" v-if="question.pitch && question.pitch.length">
          <span class="pitch-label">音调</span>{{ question.pitch.map(pitchToCircle).join(' ') }}
        </div>
      </div>
      <OptionsList :question="question" :selected="selected" :answered="answered" @select="select" />
    </template>

    <!-- 看汉字选假名 -->
    <template v-else-if="type === 'kanji2kana'">
      <div class="quiz-prompt">
        <div class="prompt-label">选出汉字的正确读音</div>
        <div class="prompt-word kanji-big" v-html="promptHtml"></div>
      </div>
      <OptionsList :question="question" :selected="selected" :answered="answered" @select="select" />
    </template>

    <!-- 看单词选释义 -->
    <template v-else-if="type === 'word2meaning'">
      <div class="quiz-prompt">
        <div class="prompt-label">选出与单词相符的释义</div>
        <div class="prompt-word word-big" v-html="promptHtml">
        </div>
      </div>
      <OptionsList :question="question" :selected="selected" :answered="answered" @select="select" />
    </template>

    <!-- 看释义选单词 -->
    <template v-else-if="type === 'meaning2word'">
      <div class="quiz-prompt">
        <div class="prompt-label">选出与释义相符的单词</div>
        <div class="prompt-word meaning-big">{{ question.prompt }}</div>
      </div>
      <OptionsList :question="question" :selected="selected" :answered="answered" @select="select" />
    </template>

    <!-- 例句挖空选单词 -->
    <template v-else-if="type === 'fillblank'">
      <div class="quiz-prompt">
        <div class="prompt-label">从例句中选出填入____的合适单词</div>
        <div class="prompt-sentence" v-html="sentenceHtml"></div>
        <button v-if="!showZh" class="btn-zh-toggle" @click="showZh = true" title="显示例句中文释义">显示例句释义 ▾</button>
        <div v-if="showZh" class="prompt-sentence-zh">{{ question.prompt.zh }}</div>
      </div>
      <OptionsList :question="question" :selected="selected" :answered="answered" @select="select" />
    </template>

    <!-- 看单词选近义词 / 反义词 -->
    <template v-else-if="type === 'synonym' || type === 'antonym' || type === 'related'">
      <div class="quiz-prompt">
        <div class="prompt-label">{{ type === 'synonym' ? '选出下列单词的近义词' : type === 'antonym' ? '选出下列单词的反义词' : '选出下列单词的相关词' }}</div>
        <div class="prompt-word word-big" v-html="promptHtml"></div>
        <div class="prompt-pitch" v-if="question.prompt.pitch && question.prompt.pitch.length">
          <span class="pitch-label">音调</span>{{ question.prompt.pitch.map(pitchToCircle).join(' ') }}
        </div>
      </div>
      <OptionsList :question="question" :selected="selected" :answered="answered" @select="select" />
    </template>

    <!-- 笔记按钮 -->
    <div class="quiz-note-row">
      <button class="btn-note" title="添加笔记 (N)" aria-label="为当前单词添加笔记" @click="$emit('note')">📝 添加笔记</button>
    </div>

    <div v-if="answered && feedback" class="feedback" :class="feedback.correct ? 'fb-correct' : 'fb-wrong'">
      <span class="fb-icon" aria-hidden="true">{{ feedback.correct ? '✅' : '❌' }}</span>
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
import { useFurigana } from '../../composables/useFurigana'
import OptionsList from './OptionsList.vue'

const props = defineProps({
  type: { type: String, required: true },
  question: { type: Object, required: true },
})

const emit = defineEmits(['answer', 'note'])
const furigana = useFurigana()
const answered = ref(false)
const selected = ref(-1)
const showZh = ref(false)

// 供父组件快捷键调用
function selectByKey(n) {
  if (!answered.value && n >= 1 && n <= props.question.options.length) {
    select(n - 1)
  }
}

defineExpose({ selectByKey })

// 看汉字选假名：题干汉字带振假名
const promptHtml = computed(() => {
  if (typeHtml.value) return typeHtml.value
  return props.question.prompt
})
const typeHtml = computed(() => {
  if (props.type === 'kanji2kana') {
    const w = props.question.promptWord
    if (furigana.isEnabled.value && w && w.kanjiFurigana) return w.kanjiFurigana
    return props.question.prompt
  }
  if (props.type === 'word2meaning' || props.type === 'synonym' || props.type === 'antonym' || props.type === 'related') {
    const w = props.question.prompt
    if (furigana.isEnabled.value && w && w.kanjiFurigana) return w.kanjiFurigana
    return w.kanji || w.kana
  }
  return ''
})

// 例句挖空：振假名开启时显示挖空振假名，否则显示普通挖空
const sentenceHtml = computed(() => {
  const p = props.question.prompt
  if (!p) return ''
  if (furigana.isEnabled.value && p.furiganaBlank) {
    return p.furiganaBlank
  }
  return escapeHtml(p.before) + '<span class="blank-line"></span>' + escapeHtml(p.after)
})

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const feedback = computed(() => {
  if (selected.value < 0) return null
  const correct = selected.value === props.question.correctIndex
  return {
    correct,
    answerText: props.question.answerText,
  }
})

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
  position: relative;
  text-align: center;
  padding: 26px 22px 24px;
  margin-bottom: 16px;
  background: var(--card-grad);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  animation: prompt-in var(--dur-4) var(--ease-out-expo) both;
}
.quiz-prompt::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 64px;
  height: 3px;
  transform: translateX(-50%);
  border-radius: 0 0 3px 3px;
  background: var(--grad-sakura);
  opacity: 0.85;
}
.quiz-prompt::after {
  content: '';
  position: absolute;
  top: -96px;
  right: -64px;
  width: 190px;
  height: 190px;
  border-radius: 50%;
  background: var(--sakura-50);
  filter: blur(26px);
  opacity: 0.9;
  pointer-events: none;
  z-index: 0;
}
.quiz-prompt > * {
  position: relative;
  z-index: 1;
}
@keyframes prompt-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: none; }
}
.prompt-label {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 5px 13px;
  margin-bottom: 18px;
  border-radius: var(--radius-pill);
  background: var(--sakura-100);
  color: var(--sakura-700);
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.prompt-word {
  position: relative;
  font-weight: 800;
  line-height: 1.3;
  color: var(--sakura-600);
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.kana-big { font-size: clamp(36px, 9vw, 52px); letter-spacing: 0.05em; }
.kanji-big { font-size: clamp(36px, 9vw, 54px); letter-spacing: 0.06em; }
.word-big { font-size: clamp(30px, 8vw, 46px); letter-spacing: 0.03em; }
.meaning-big {
  font-size: clamp(19px, 5.5vw, 30px);
  color: var(--text);
  line-height: 1.55;
}
.prompt-pitch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  padding: 4px 11px;
  border-radius: var(--radius-pill);
  background: var(--sakura-100);
  color: var(--sakura-700);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.06em;
  position: relative;
}
.pitch-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--sakura-600);
  opacity: 0.85;
}
.prompt-sentence {
  position: relative;
  font-size: clamp(19px, 4.8vw, 25px);
  color: var(--text);
  font-weight: 600;
  line-height: 1.9;
  overflow-wrap: anywhere;
}
.prompt-sentence :deep(.blank-line) {
  display: inline-block;
  min-width: 72px;
  border-bottom: 3px solid var(--sakura-400);
  margin: 0 4px;
  vertical-align: baseline;
}
.prompt-sentence-zh {
  position: relative;
  margin-top: 10px;
  font-size: 13px;
  color: var(--text-light);
}
.btn-zh-toggle {
  position: relative;
  margin-top: 12px;
  min-height: 40px;
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--sakura-50);
  color: var(--text-light);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: color var(--dur-2), border-color var(--dur-2), background var(--dur-2);
}
.btn-zh-toggle:hover {
  color: var(--sakura-600);
  border-color: var(--sakura-300);
  background: var(--sakura-100);
}
.quiz-note-row {
  display: flex;
  justify-content: center;
  margin-top: 14px;
}
.btn-note {
  min-height: 40px;
  padding: 8px 18px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  font-size: 12.5px;
  font-weight: 700;
  color: var(--sakura-700);
  cursor: pointer;
  font-family: inherit;
  transition: background var(--dur-2), border-color var(--dur-2), transform var(--dur-2) var(--ease-spring), box-shadow var(--dur-2);
}
@media (hover: hover) and (pointer: fine) {
  .btn-note:hover {
    background: var(--sakura-50);
    border-color: var(--sakura-300);
    transform: translateY(-1px);
    box-shadow: var(--shadow-card);
  }
}
.btn-note:active { transform: scale(0.96); }
.feedback {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-top: 16px;
  padding: 13px 16px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.6;
  animation: fb-in var(--dur-3) var(--ease-out-expo) both;
}
@keyframes fb-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}
.fb-correct {
  background: var(--green-soft);
  border-color: var(--green);
}
.fb-wrong {
  background: var(--red-soft);
  border-color: var(--red);
}
.fb-icon { font-size: 18px; flex-shrink: 0; }
.fb-text { min-width: 0; }
.fb-text b { font-weight: 800; color: inherit; }
.prompt-word :deep(ruby), .prompt-sentence :deep(ruby) {
  ruby-position: over;
}
.prompt-word :deep(rt), .prompt-sentence :deep(rt) {
  font-size: 0.55em;
  color: var(--sakura-600);
  font-weight: 600;
  letter-spacing: 0.02em;
}
.prompt-word :deep(rp), .prompt-sentence :deep(rp) {
  display: none;
}

@media (max-width: 480px) {
  .quiz-prompt { padding: 22px 16px 20px; margin-bottom: 14px; }
  .prompt-label { margin-bottom: 16px; }
}
</style>
