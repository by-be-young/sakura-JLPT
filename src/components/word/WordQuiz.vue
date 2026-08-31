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
        <button v-if="!showZh" class="btn-zh-toggle" @click="showZh = true">显示例句释义 ▾</button>
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
          音调：{{ question.prompt.pitch.map(pitchToCircle).join(' ') }}
        </div>
      </div>
      <OptionsList :question="question" :selected="selected" :answered="answered" @select="select" />
    </template>

    <!-- 笔记按钮 -->
    <div class="quiz-note-row">
      <button class="btn-note" title="添加笔记 (N)" @click="$emit('note')">📝 添加笔记</button>
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
.prompt-sentence :deep(.blank-line) {
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
.prompt-word :deep(ruby), .prompt-sentence :deep(ruby) {
  ruby-position: over;
}
.prompt-word :deep(rt), .prompt-sentence :deep(rt) {
  font-size: 0.55em;
  color: #e884a0;
  font-weight: 500;
  letter-spacing: 0.02em;
}
.prompt-word :deep(rp), .prompt-sentence :deep(rp) {
  display: none;
}
</style>
