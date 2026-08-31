<template>
  <div class="word-card" :class="{ flipped }">
    <!-- 正面：汉字 + 音调 -->
    <div class="card-face card-front" @click="flip">
      <div class="word-main">
        <span class="word-kanji">{{ word.kanji || word.kana }}</span>
        <span v-if="word.pitch && word.pitch.length" class="pitch-tag">{{ pitchStr }}</span>
      </div>
      <div v-if="!word.kanji" class="card-hint">点击查看</div>
      <div v-else class="card-hint">点击翻面查看假名・释义</div>
    </div>
    <!-- 背面：假名 + 词性 + 释义 + 例句 -->
    <div class="card-face card-back" @click="flip">
      <div class="word-main">
        <span class="word-kana">{{ word.kana }}</span>
        <span v-if="word.pitch && word.pitch.length" class="pitch-tag">{{ pitchStr }}</span>
      </div>
      <div v-if="word.pos" class="word-pos">{{ word.pos }}</div>
      <div class="word-meaning">{{ word.meaning }}</div>
      <div v-if="word.examples && word.examples.length" class="word-examples">
        <div v-for="(ex, i) in word.examples" :key="i" class="ex-item">
          <div class="ex-jp">{{ ex.jp }}</div>
          <div class="ex-zh">{{ ex.zh }}</div>
        </div>
      </div>
      <div class="card-note">
        <button class="btn-note" @click.stop="$emit('note')">📝 {{ hasNote ? '编辑笔记' : '添加笔记' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { pitchToCircle } from '../../data/words'
import { useWordStore } from '../../store/wordStore'

const props = defineProps({
  word: { type: Object, required: true },
})
const emit = defineEmits(['note'])
const store = useWordStore()

const flipped = ref(false)
const pitchStr = computed(() => props.word.pitch.map(pitchToCircle).join(''))
const hasNote = computed(() => store.hasNote(props.word.id))

function flip() {
  flipped.value = !flipped.value
}

// 供父组件快捷键调用
defineExpose({ flip, flipped })
</script>

<style scoped>
.word-card {
  position: relative;
  width: 100%;
  min-height: 280px;
  perspective: 1000px;
  cursor: pointer;
}
.card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 20px;
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.5s;
  box-shadow: 0 8px 24px rgba(255, 145, 179, 0.18);
  border: 2px solid #ffd3e0;
}
.card-front {
  background: linear-gradient(145deg, #fff5f8, #ffe9f0);
}
.card-back {
  background: linear-gradient(145deg, #fffdf9, #fff3e6);
  transform: rotateY(180deg);
}
.word-card.flipped .card-front { transform: rotateY(180deg); }
.word-card.flipped .card-back { transform: rotateY(0deg); }
.word-main {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
}
.word-kanji {
  font-size: 52px;
  font-weight: 700;
  color: #c2556f;
  letter-spacing: 0.05em;
}
.word-kana {
  font-size: 40px;
  font-weight: 700;
  color: #d9773e;
  letter-spacing: 0.03em;
}
.pitch-tag {
  font-size: 18px;
  color: #e884a0;
  font-weight: 700;
  letter-spacing: 0.05em;
}
.word-pos {
  font-size: 14px;
  color: #b98a94;
  background: #ffeef3;
  padding: 2px 10px;
  border-radius: 20px;
  margin-bottom: 10px;
}
.word-meaning {
  font-size: 22px;
  color: #6b4a52;
  font-weight: 600;
  text-align: center;
  margin-bottom: 14px;
}
.word-examples {
  width: 100%;
  text-align: left;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  padding: 12px 14px;
}
.ex-item { margin-bottom: 8px; }
.ex-item:last-child { margin-bottom: 0; }
.ex-jp { font-size: 16px; color: #8a5a45; }
.ex-zh { font-size: 13px; color: #b8a091; margin-top: 2px; }
.card-hint {
  font-size: 13px;
  color: #dba6b4;
  margin-top: 8px;
}
.card-note {
  margin-top: 14px;
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
</style>
