<template>
  <div class="word-card" :class="{ flipped }">
    <!-- 正面：汉字 + 音调 -->
    <div class="card-face card-front" :class="{ active: !flipped }" @click="flip">
      <span class="card-watermark" aria-hidden="true">あ</span>
      <div class="word-main">
        <span class="word-kanji" v-html="kanjiHtml"></span>
        <span v-if="word.pitch && word.pitch.length" class="pitch-tag">
          <span class="pitch-label">音调</span>{{ pitchStr }}
        </span>
      </div>
      <div class="card-rule" aria-hidden="true"></div>
      <div v-if="!word.kanji" class="card-hint">点击查看</div>
      <div v-else class="card-hint">点击翻面查看假名・释义</div>
      <span class="flip-cue" aria-hidden="true">↻ 翻面</span>
    </div>
    <!-- 背面：假名 + 词性 + 释义 + 例句 -->
    <div class="card-face card-back" :class="{ active: flipped }" @click="flip">
      <div class="back-head">
        <div class="word-main">
          <span class="word-kana">{{ word.kana }}</span>
          <span v-if="word.pitch && word.pitch.length" class="pitch-tag">
            <span class="pitch-label">音调</span>{{ pitchStr }}
          </span>
        </div>
        <span v-if="word.pos" class="word-pos">{{ word.pos }}</span>
      </div>
      <div class="word-meaning">{{ word.meaning }}</div>
      <div v-if="word.examples && word.examples.length" class="word-examples">
        <div class="ex-head">例句</div>
        <div v-for="(ex, i) in word.examples" :key="i" class="ex-item">
          <div class="ex-jp" v-html="exJpHtml(ex)"></div>
          <div class="ex-zh">{{ ex.zh }}</div>
        </div>
      </div>
      <div v-if="relations.syn.length || relations.ant.length" class="word-relations">
        <div v-if="relations.syn.length" class="rel-group">
          <span class="rel-label">近义词</span>
          <span class="rel-items">
            <span v-for="(s, i) in relations.syn" :key="i" class="rel-item">{{ s.t }}<span v-if="s.y" class="rel-kana">{{ s.y }}</span></span>
          </span>
        </div>
        <div v-if="relations.ant.length" class="rel-group">
          <span class="rel-label">反义词</span>
          <span class="rel-items">
            <span v-for="(a, i) in relations.ant" :key="i" class="rel-item">{{ a.t }}<span v-if="a.y" class="rel-kana">{{ a.y }}</span></span>
          </span>
        </div>
      </div>
      <div class="card-note">
        <button class="btn btn-secondary btn-sm btn-note" @click.stop="$emit('note')"
          :tabindex="flipped ? 0 : -1"
          :title="hasNote ? '编辑笔记 (N)' : '添加笔记 (N)'"
          :aria-label="hasNote ? '编辑当前单词笔记' : '为当前单词添加笔记'">
          📝 {{ hasNote ? '编辑笔记' : '添加笔记' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { pitchToCircle, wordRelationsOf } from '../../data/words'
import { useWordStore } from '../../store/wordStore'
import { useFurigana } from '../../composables/useFurigana'

const props = defineProps({
  word: { type: Object, required: true },
})
const emit = defineEmits(['note'])
const store = useWordStore()
const furigana = useFurigana()

const flipped = ref(false)
const pitchStr = computed(() => props.word.pitch.map(pitchToCircle).join(''))
const hasNote = computed(() => store.hasNote(props.word.id))
const relations = computed(() => wordRelationsOf(props.word.id))

// 振假名：开启时渲染汉字头顶假名（ruby）
const kanjiHtml = computed(() => {
  if (furigana.isEnabled.value && props.word.kanjiFurigana) return props.word.kanjiFurigana
  return props.word.kanji || props.word.kana
})
function exJpHtml(ex) {
  if (furigana.isEnabled.value && ex.jpFurigana) return ex.jpFurigana
  return ex.jp
}

function flip() {
  flipped.value = !flipped.value
}

// 供父组件快捷键调用
defineExpose({ flip, flipped })
</script>

<style scoped>
.word-card {
  position: relative;
  display: grid;
  width: 100%;
  min-height: 350px;
  perspective: 1200px;
  cursor: pointer;
  animation: card-in var(--dur-5) var(--ease-out-expo) both;
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(16px) scale(0.985); }
  to { opacity: 1; transform: none; }
}

.card-face {
  grid-area: 1 / 1;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 32px 28px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border);
  background: var(--card-grad);
  box-shadow: var(--card-float);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transition:
    transform 620ms var(--ease-out-expo),
    box-shadow var(--dur-3) var(--ease-out-expo),
    border-color var(--dur-3) var(--ease-soft);
  overflow: hidden;
  pointer-events: none;
}
.card-face.active { pointer-events: auto; }
.card-front {
  background: radial-gradient(120% 100% at 50% 0%, var(--sakura-50) 0%, var(--card) 64%);
}
.card-front::before {
  content: '';
  position: absolute;
  inset: 12px;
  border-radius: calc(var(--radius-xl) - 8px);
  border: 1px solid var(--border);
  opacity: 0.75;
  pointer-events: none;
}
.card-back {
  transform: rotateY(180deg);
  justify-content: center;
  align-items: stretch;
  text-align: left;
  padding-top: 24px;
  background: var(--card-grad);
}
.word-card.flipped .card-front { transform: rotateY(180deg); }
.word-card.flipped .card-back { transform: rotateY(0deg); }

@media (hover: hover) and (pointer: fine) {
  .word-card:hover .card-face {
    border-color: var(--border-strong);
    box-shadow: var(--shadow-lg);
  }
}

/* 正面装饰 */
.card-watermark {
  position: absolute;
  right: 10px;
  bottom: -20px;
  font-size: 132px;
  line-height: 1;
  font-weight: 800;
  color: var(--sakura-100);
  opacity: 0.55;
  pointer-events: none;
  user-select: none;
}
.word-main {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px 14px;
  min-width: 0;
  max-width: 100%;
}
.word-kanji {
  max-width: 100%;
  font-size: clamp(38px, 11vw, 72px);
  font-weight: 800;
  line-height: 1.16;
  letter-spacing: 0.04em;
  color: var(--sakura-600);
  text-align: center;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.word-kanji :deep(ruby), .ex-jp :deep(ruby) {
  ruby-position: over;
}
.word-kanji :deep(rt), .ex-jp :deep(rt) {
  font-size: 0.5em;
  color: var(--sakura-600);
  font-weight: 600;
}
.word-kanji :deep(rp), .ex-jp :deep(rp) {
  display: none;
}
.card-rule {
  width: 44px;
  height: 3px;
  margin: 18px 0 14px;
  border-radius: 2px;
  background: var(--grad-sakura);
  opacity: 0.5;
}
.card-hint {
  position: relative;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-light);
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  background: var(--sakura-50);
  border: 1px solid var(--border);
}
.flip-cue {
  position: absolute;
  right: 20px;
  bottom: 16px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--text-faint);
  opacity: 0.75;
  transition: opacity var(--dur-2), transform var(--dur-2) var(--ease-out-expo);
}

/* 音调 */
.pitch-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  border-radius: var(--radius-pill);
  background: var(--sakura-100);
  color: var(--sakura-700);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.06em;
  white-space: nowrap;
}
.pitch-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--sakura-600);
  opacity: 0.85;
}

/* 背面 */
.back-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}
.word-kana {
  max-width: 100%;
  font-size: clamp(32px, 8vw, 46px);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: 0.03em;
  color: var(--sakura-700);
  overflow-wrap: anywhere;
}
.word-pos {
  display: inline-flex;
  align-items: center;
  padding: 3px 12px;
  border-radius: var(--radius-pill);
  background: var(--sakura-50);
  border: 1px solid var(--border);
  color: var(--text-light);
  font-size: 12px;
  font-weight: 700;
}
.word-meaning {
  text-align: center;
  margin: 12px 0 16px;
  font-size: clamp(20px, 5vw, 26px);
  font-weight: 700;
  line-height: 1.5;
  color: var(--text);
}
.word-examples {
  width: 100%;
  text-align: left;
  background: var(--sakura-50);
  border: 1px solid var(--border);
  border-left: 3px solid var(--sakura-300);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
}
.ex-head {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: var(--text-light);
  margin-bottom: 8px;
}
.ex-item { margin-bottom: 10px; }
.ex-item:last-child { margin-bottom: 0; }
.ex-jp {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text);
}
.ex-zh {
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--text-light);
  margin-top: 2px;
}
.word-relations {
  width: 100%;
  margin-top: 10px;
  background: var(--iris-soft);
  border-radius: var(--radius-sm);
  padding: 10px 13px;
}
.rel-group {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.rel-group:last-child { margin-bottom: 0; }
.rel-label {
  font-size: 11px;
  color: var(--iris);
  background: var(--card);
  padding: 2px 9px;
  border-radius: var(--radius-pill);
  white-space: nowrap;
  font-weight: 700;
}
.rel-items {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.rel-item {
  font-size: 15px;
  color: var(--text);
  font-weight: 600;
}
.rel-kana {
  font-size: 12px;
  color: var(--text-light);
  margin-left: 4px;
  font-weight: 400;
}
.card-note {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding-bottom: 2px;
}
.btn-note {
  min-height: 40px;
  padding: 8px 18px;
  color: var(--sakura-700);
}

@media (max-width: 480px) {
  .word-card { min-height: 330px; }
  .card-face { padding: 24px 18px; }
  .card-front::before { inset: 9px; }
  .card-back { padding-top: 20px; }
  .card-watermark { font-size: 104px; bottom: -14px; right: 4px; }
  .flip-cue { right: 16px; bottom: 12px; }
  .word-examples { padding: 10px 12px; }
}
</style>
