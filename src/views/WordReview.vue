<template>
  <div class="container words-page">
    <!-- 顶部导航 -->
    <div class="words-header">
      <button class="btn btn-ghost btn-sm" @click="$router.push('/words')">← 返回</button>
      <h2 class="page-title">🌸 复习</h2>
      <div class="header-spacer"></div>
      <span class="level-tag">{{ levelName }}</span>
    </div>

    <!-- 复习进度 -->
    <div class="learn-progress" v-if="queue.length">
      <span>剩余 {{ queue.length }} 个单词</span>
      <div class="progress-bar-wrap"><div class="progress-bar-inner" :style="{ width: doneCount / totalCount * 100 + '%' }"></div></div>
    </div>

    <!-- 无待复习词 -->
    <div v-if="!queue.length && !reviewFinished" class="empty-state">
      <div class="empty-icon">🌸</div>
      <p>暂无需要复习的单词</p>
      <button class="btn btn-ghost" @click="$router.push('/words')">返回</button>
    </div>

    <!-- 复习卡片流程 -->
    <div v-if="queue.length" class="review-section">
      <!-- 阶段1：自评 -->
      <div v-if="reviewStage === 'eval'" class="review-card">
        <div class="word-main center">
          <span class="word-kanji">{{ currentWord.kanji || currentWord.kana }}</span>
          <span v-if="currentWord.pitch && currentWord.pitch.length" class="pitch-tag">{{ pitchStr }}</span>
        </div>
        <div class="eval-hint">你想起来了吗？</div>
        <div class="eval-actions">
          <button class="btn btn-remember" @click="selfEval('remember')">😄 记得</button>
          <button class="btn btn-blur" @click="selfEval('blur')">🤔 模糊</button>
          <button class="btn btn-forget" @click="selfEval('forget')">😵 不记得</button>
        </div>
      </div>

      <!-- 阶段2：翻开详情 -->
      <div v-else-if="reviewStage === 'reveal'" class="review-reveal">
        <div class="reveal-word">
          <span class="word-kanji">{{ currentWord.kanji || currentWord.kana }}</span>
          <span v-if="currentWord.pitch && currentWord.pitch.length" class="pitch-tag">{{ pitchStr }}</span>
          <div class="reveal-kana">{{ currentWord.kana }}<span v-if="currentWord.pitch && currentWord.pitch.length" class="pitch-tag">{{ pitchStr }}</span></div>
        </div>
        <div v-if="currentWord.pos" class="word-pos">{{ currentWord.pos }}</div>
        <div class="word-meaning">{{ currentWord.meaning }}</div>
        <div v-if="currentWord.examples && currentWord.examples.length" class="word-examples">
          <div v-for="(ex, i) in currentWord.examples" :key="i" class="ex-item">
            <div class="ex-jp">{{ ex.jp }}</div>
            <div class="ex-zh">{{ ex.zh }}</div>
          </div>
        </div>
        <div class="reveal-notes">
          <div v-if="noteText" class="reveal-note-text">{{ noteText }}</div>
          <button class="btn btn-ghost btn-sm" @click="openNote">{{ noteText ? '📝 编辑笔记' : '📝 添加笔记' }}</button>
        </div>
        <div class="reveal-actions">
          <button class="btn btn-correct" @click="confirmEval(true)">😄 没问题</button>
          <button class="btn btn-wrong" @click="confirmEval(false)">😵 记错了</button>
        </div>
      </div>

      <!-- 阶段3：完成提示 -->
      <div v-else class="review-finished">
        <div class="empty-icon">🌸</div>
        <div class="result-score">复习完成！</div>
        <div class="result-rate">本批共 {{ totalCount }} 个</div>
        <div class="result-actions">
          <button class="btn btn-ghost" @click="$router.push('/words')">返回背词</button>
          <button class="btn btn-primary" @click="restartReview">再来一轮</button>
        </div>
      </div>
    </div>

    <!-- 笔记弹窗 -->
    <WordNoteModal v-if="editingWord" :word="editingWord" @close="editingWord = null" @saved="onNoteSaved" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { wordsByLevel, levels, pitchToCircle } from '../data/words'
import { useWordStore } from '../store/wordStore'
import { availableTypes } from '../composables/wordQuiz'
import WordNoteModal from '../components/word/WordNoteModal.vue'

const route = useRoute()
const store = useWordStore()

const level = ref(route.query.level || localStorage.getItem('sakura_word_level') || 'N4N5')
const levelName = computed(() => (levels.find(l => l.id === level.value) || {}).name || level.value)
const pool = computed(() => wordsByLevel(level.value))

const queue = ref([])        // 待复习队列（词对象）
const totalCount = ref(0)
const doneCount = ref(0)
const reviewStage = ref('eval') // 'eval' | 'reveal' | 'done'
const editingWord = ref(null)

const currentWord = computed(() => queue.value[0] || null)
const pitchStr = computed(() => (currentWord.value && currentWord.value.pitch) ? currentWord.value.pitch.map(pitchToCircle).join('') : '')
const noteText = computed(() => currentWord.value ? store.getNote(currentWord.value.id) : '')

onMounted(() => {
  buildQueue()
})

function buildQueue() {
  // 已学但未背完 或 生疏需要复习
  const due = pool.value.filter(w => store.isLearned(w.id) && !store.isMastered(w.id, availableTypes(w)))
  if (!due.length) {
    // 生疏兜底
    queue.value = []
    reviewStage.value = 'done'
  } else {
    // 随机打乱
    const arr = [...due]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    queue.value = arr
    totalCount.value = arr.length
    doneCount.value = 0
    reviewStage.value = 'eval'
  }
}

function selfEval(level) {
  reviewStage.value = 'reveal'
}

function confirmEval(ok) {
  const w = currentWord.value
  if (ok) {
    // 没问题：视为掌握，清除错误计数
    store.clearWrong(w.id)
    queue.value.shift()
    doneCount.value++
  } else {
    // 记错了：记录错误，放回队列末尾，稍后再复习（不增加完成数）
    store.recordAnswer(w.id, false)
    queue.value.push(queue.value.shift())
  }
  if (queue.value.length === 0) {
    reviewStage.value = 'done'
  } else {
    reviewStage.value = 'eval'
  }
}

function openNote() {
  editingWord.value = currentWord.value
}

function onNoteSaved() {
  // 笔记保存后，刷新展示
}

function restartReview() {
  buildQueue()
}
</script>

<style scoped>
.words-page { max-width: 720px; }
.words-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}
.page-title { margin: 0; font-size: 22px; color: #c2556f; }
.header-spacer { flex: 1; }
.level-tag {
  background: #ffe9f0;
  color: #c2556f;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}
.learn-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #7a4b55;
  margin-bottom: 18px;
}
.progress-bar-wrap {
  flex: 1;
  height: 8px;
  background: #ffe3ec;
  border-radius: 8px;
  overflow: hidden;
}
.progress-bar-inner {
  height: 100%;
  background: linear-gradient(90deg, #ff9dbd, #ff7da0);
  border-radius: 8px;
  transition: width 0.3s;
}
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #b98a94;
}
.empty-icon { font-size: 60px; margin-bottom: 12px; }
.review-card {
  background: linear-gradient(145deg, #fff5f8, #ffe9f0);
  border: 2px solid #ffd3e0;
  border-radius: 20px;
  padding: 40px 24px;
  text-align: center;
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.word-main { display: flex; align-items: baseline; gap: 10px; }
.center { justify-content: center; }
.word-kanji {
  font-size: 52px;
  font-weight: 700;
  color: #c2556f;
  letter-spacing: 0.05em;
}
.pitch-tag {
  font-size: 18px;
  color: #e884a0;
  font-weight: 700;
  letter-spacing: 0.05em;
}
.eval-hint { font-size: 14px; color: #b98a94; margin: 18px 0; }
.eval-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
.btn-remember { background: #eefbf0; color: #2d8a3e; border: 2px solid #7ed58a; border-radius: 14px; padding: 12px 22px; font-weight: 700; cursor: pointer; font-size: 15px; font-family: inherit; }
.btn-blur { background: #fff8e6; color: #b8860b; border: 2px solid #e8c76a; border-radius: 14px; padding: 12px 22px; font-weight: 700; cursor: pointer; font-size: 15px; font-family: inherit; }
.btn-forget { background: #fff0f0; color: #c0392b; border: 2px solid #f79b9b; border-radius: 14px; padding: 12px 22px; font-weight: 700; cursor: pointer; font-size: 15px; font-family: inherit; }
.btn-correct { background: #eefbf0; color: #2d8a3e; border: 2px solid #7ed58a; border-radius: 14px; padding: 12px 24px; font-weight: 700; cursor: pointer; font-size: 15px; font-family: inherit; }
.btn-wrong { background: #fff0f0; color: #c0392b; border: 2px solid #f79b9b; border-radius: 14px; padding: 12px 24px; font-weight: 700; cursor: pointer; font-size: 15px; font-family: inherit; }
.review-reveal {
  background: linear-gradient(145deg, #fffdf9, #fff3e6);
  border: 2px solid #ffd3e0;
  border-radius: 20px;
  padding: 32px 28px;
}
.reveal-word { text-align: center; margin-bottom: 10px; }
.reveal-kana { font-size: 28px; color: #d9773e; font-weight: 700; margin-top: 6px; }
.word-pos {
  display: inline-block;
  font-size: 13px;
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
  box-sizing: border-box;
}
.ex-item { margin-bottom: 8px; }
.ex-item:last-child { margin-bottom: 0; }
.ex-jp { font-size: 16px; color: #8a5a45; }
.ex-zh { font-size: 13px; color: #b8a091; margin-top: 2px; }
.reveal-notes {
  margin-top: 14px;
  text-align: center;
}
.reveal-note-text {
  background: #fff5f8;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  color: #6b4a52;
  white-space: pre-wrap;
  margin-bottom: 8px;
  text-align: left;
}
.reveal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
  flex-wrap: wrap;
}
.review-finished {
  text-align: center;
  padding: 40px 20px;
  background: #fff5f8;
  border-radius: 20px;
}
.result-score { font-size: 18px; color: #7a4b55; margin-bottom: 6px; }
.result-rate { font-size: 22px; font-weight: 700; color: #c2556f; margin-bottom: 16px; }
.result-actions { display: flex; gap: 12px; justify-content: center; }
</style>
