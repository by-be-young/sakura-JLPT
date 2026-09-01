<template>
  <div class="container words-page">
    <!-- 顶部导航 -->
    <div class="words-header">
      <button class="btn btn-ghost btn-sm" @click="$router.push('/')">← 返回</button>
      <h2 class="page-title">🌸 背词</h2>
      <div class="header-spacer"></div>
    </div>

    <!-- 等级选择 -->
    <LevelSelector class="level-sel" />

    <!-- 等级统计条 -->
    <div class="level-stats" v-if="pool.length">
      <div class="stat-item">
        <span class="stat-num">{{ pool.length }}</span>
        <span class="stat-label">本等级总词</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">{{ learnedCount }}</span>
        <span class="stat-label">已学</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">{{ pool.length - learnedCount }}</span>
        <span class="stat-label">未学</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">{{ familiarCount }}</span>
        <span class="stat-label">熟词</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">{{ masteredCount }}</span>
        <span class="stat-label">已背完</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">{{ dueCount }}</span>
        <span class="stat-label">待复习</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">{{ noteCount }}</span>
        <span class="stat-label">有笔记</span>
      </div>
    </div>

    <!-- 功能入口 -->
    <div class="function-grid">
      <div class="func-card" @click="goLearn">
        <div class="func-icon">📖</div>
        <div class="func-name">新学单词</div>
        <div class="func-desc">学习未学的新单词</div>
      </div>
      <div class="func-card" :class="{ disabled: dueCount === 0 }" @click="goReview">
        <div class="func-icon">🔁</div>
        <div class="func-name">复习</div>
        <div class="func-desc">{{ dueCount ? '复习 ' + dueCount + ' 个待复习单词' : '暂无需复习的单词' }}</div>
      </div>
      <div class="func-card" :class="{ disabled: noteCount === 0 }" @click="showNotes = true">
        <div class="func-icon">📝</div>
        <div class="func-name">笔记</div>
        <div class="func-desc">{{ noteCount ? '查看 ' + noteCount + ' 条笔记' : '还没有笔记' }}</div>
      </div>
    </div>

    <!-- 重置背词记录 -->
    <div class="reset-area">
      <button class="btn btn-ghost btn-sm" @click="confirmResetWords">🗑 清空背词记录</button>
    </div>

    <!-- 笔记面板 -->
    <div v-if="showNotes" class="notes-panel">
      <div class="notes-header">
        <h3>📝 我的笔记</h3>
        <button class="btn btn-ghost btn-sm" @click="showNotes = false">关闭</button>
      </div>
      <div v-if="noteWords.length === 0" class="notes-empty">还没有笔记，在测验或学习时可为单词添加笔记</div>
      <div v-for="w in noteWords" :key="w.id" class="note-item">
        <div class="note-word">
          <span class="note-kanji">{{ w.kanji || w.kana }}</span>
          <span class="note-kana">{{ w.kanji ? w.kana : '' }}</span>
          <span class="note-meaning">{{ w.meaning }}</span>
        </div>
        <div class="note-text">{{ store.getNote(w.id) }}</div>
        <button class="btn btn-ghost btn-xs" @click="editNote(w)">编辑</button>
      </div>
    </div>

    <!-- 笔记编辑弹窗 -->
    <WordNoteModal v-if="editingWord" :word="editingWord" @close="editingWord = null" @saved="editingWord = null" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { wordsByLevel } from '../data/words'
import { useWordStore } from '../store/wordStore'
import { useLevel } from '../store/levelStore'
import { availableTypes } from '../composables/wordQuiz'
import WordNoteModal from '../components/word/WordNoteModal.vue'
import LevelSelector from '../components/LevelSelector.vue'

const router = useRouter()
const store = useWordStore()
const { level } = useLevel()

const pool = computed(() => wordsByLevel(level.value))

const learnedCount = computed(() => pool.value.filter(w => store.isLearned(w.id)).length)
const masteredCount = computed(() => pool.value.filter(w => store.isLearned(w.id) && store.isMastered(w.id, availableTypes(w)) && !store.isFamiliar(w.id)).length)
const dueCount = computed(() => pool.value.filter(w => store.isLearned(w.id) && !store.isMastered(w.id, availableTypes(w)) && !store.isFamiliar(w.id)).length)
const familiarCount = computed(() => pool.value.filter(w => store.isFamiliar(w.id)).length)
const noteCount = computed(() => pool.value.filter(w => store.hasNote(w.id)).length)
const noteWords = computed(() => pool.value.filter(w => store.hasNote(w.id)))

const showNotes = ref(false)
const editingWord = ref(null)

function goLearn() {
  router.push({ path: '/words/learn', query: { level: level.value } })
}

function goReview() {
  if (dueCount.value === 0) return
  router.push({ path: '/words/review', query: { level: level.value } })
}

function editNote(w) {
  editingWord.value = w
}

function confirmResetWords() {
  if (confirm('确定要清空所有背词记录（学习进度、题型完成、笔记）吗？题库答题记录不受影响。')) {
    store.resetAll()
    showNotes.value = false
  }
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
.level-sel {
  margin-bottom: 16px;
}
.level-stats {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.stat-item {
  flex: 1;
  min-width: 70px;
  background: #fff5f8;
  border-radius: 14px;
  padding: 10px 8px;
  text-align: center;
  border: 1px solid #ffe3ec;
}
.stat-num { display: block; font-size: 22px; font-weight: 700; color: #c2556f; }
.stat-label { font-size: 12px; color: #b98a94; }
.function-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.reset-area {
  text-align: center;
  margin-bottom: 16px;
}
.func-card {
  background: #fffafc;
  border: 2px solid #ffd3e0;
  border-radius: 16px;
  padding: 18px 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}
.func-card:hover:not(.disabled) {
  border-color: #f79ab4;
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(255, 145, 179, 0.2);
}
.func-card.disabled { opacity: 0.5; cursor: default; }
.func-icon { font-size: 32px; margin-bottom: 8px; }
.func-name { font-weight: 700; color: #7a4b55; margin-bottom: 4px; }
.func-desc { font-size: 12px; color: #b98a94; }
.notes-panel {
  margin-top: 20px;
  background: #fffafc;
  border: 2px solid #ffd3e0;
  border-radius: 16px;
  padding: 18px;
}
.notes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.notes-header h3 { margin: 0; color: #c2556f; }
.notes-empty { color: #b98a94; text-align: center; padding: 20px; }
.note-item {
  background: #fff5f8;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 10px;
}
.note-word { display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
.note-kanji { font-size: 20px; font-weight: 700; color: #c2556f; }
.note-kana { font-size: 14px; color: #d9773e; }
.note-meaning { font-size: 13px; color: #7a4b55; }
.note-text { font-size: 14px; color: #6b4a52; margin-bottom: 8px; white-space: pre-wrap; }
.btn-xs { font-size: 12px; padding: 3px 10px; }
@media (max-width: 480px) {
  .function-grid { grid-template-columns: 1fr; }
}
</style>

