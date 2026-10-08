<template>
  <div class="container words-page">
    <!-- 页头 -->
    <div class="word-hero">
      <div>
        <div class="hero-title">🌸 背词</div>
        <div class="hero-sub">{{ level }} 级 · 每日新学 · 间隔复习</div>
      </div>
      <span class="hero-badge">{{ level }}</span>
    </div>

    <!-- 统计大卡 -->
    <div class="ws-grid" v-if="pool.length">
      <div class="ws-card ws-main">
        <div class="ws-label">已学</div>
        <div class="ws-num">{{ learnedCount }}<small>/{{ pool.length }}</small></div>
        <div class="ws-bar"><div class="ws-fill" :style="{ width: learnedPct + '%' }"></div></div>
        <div class="ws-pct">{{ learnedPct }}%</div>
      </div>
      <div class="ws-card ws-due">
        <div class="ws-label">待复习</div>
        <div class="ws-num">{{ dueCount }}</div>
        <div class="ws-desc">{{ dueCount ? '生疏优先 · 三档自评' : '暂无复习任务' }}</div>
      </div>
      <div class="ws-card ws-fam">
        <div class="ws-label">熟词</div>
        <div class="ws-num">{{ familiarCount }}</div>
        <div class="ws-desc">已熟练掌握</div>
      </div>
      <div class="ws-card ws-mast">
        <div class="ws-label">已背完</div>
        <div class="ws-num">{{ masteredCount }}</div>
        <div class="ws-desc">全部题型通过</div>
      </div>
    </div>
    <div class="ws-sub" v-if="pool.length">
      <span>📚 本等级总词 <b>{{ pool.length }}</b></span>
      <span>🆕 未学 <b>{{ unseenCount }}</b></span>
      <span>📝 有笔记 <b>{{ noteCount }}</b></span>
    </div>

    <!-- 今日复习任务卡 -->
    <div class="review-task" v-if="dueCount > 0" @click="goReview">
      <span class="rt-icon">🔁</span>
      <div class="rt-body">
        <div class="rt-title">今日待复习 {{ dueCount }} 词</div>
        <div class="rt-desc">生疏优先排序 · 记得/模糊/不记得三档自评</div>
      </div>
      <div class="rt-progress">
        <div class="rt-fill" :style="{ width: reviewProgress + '%' }"></div>
      </div>
      <span class="row-arrow">›</span>
    </div>
    <div class="review-task done" v-else>
      <span class="rt-icon">✅</span>
      <div class="rt-body">
        <div class="rt-title">今日没有待复习单词</div>
        <div class="rt-desc">去学新词，或明天再来巩固</div>
      </div>
    </div>

    <!-- 功能入口 -->
    <div class="app-list">
      <div class="app-row" @click="goLearn">
        <span class="row-icon ic-new">📖</span>
        <div class="row-body">
          <div class="row-title">新学单词 <span v-if="unseenCount" class="row-badge">{{ unseenCount }} 未学</span></div>
          <div class="row-desc">每次抽取 10 个新词，卡片学习后进入测验</div>
        </div>
        <span class="row-arrow">›</span>
      </div>
      <div class="app-row" :class="{ disabled: dueCount === 0 }" @click="goReview">
        <span class="row-icon ic-rv">🔁</span>
        <div class="row-body">
          <div class="row-title">复习单词 <span v-if="dueCount" class="row-badge">{{ dueCount }}</span></div>
          <div class="row-desc">生疏优先 · 三档自评 · 错误词自动回队</div>
        </div>
        <span class="row-arrow">›</span>
      </div>
      <div class="app-row" :class="{ disabled: noteCount === 0 }" @click="showNotes = true">
        <span class="row-icon ic-note">📝</span>
        <div class="row-body">
          <div class="row-title">我的笔记 <span v-if="noteCount" class="row-badge">{{ noteCount }}</span></div>
          <div class="row-desc">查看 / 编辑为单词添加的笔记</div>
        </div>
        <span class="row-arrow">›</span>
      </div>
    </div>

    <!-- 重置背词记录 -->
    <div class="reset-area">
      <button class="btn btn-ghost btn-sm" @click="confirmClearProgress">🗑 清空学习进度</button>
      <button class="btn btn-ghost btn-sm" @click="confirmClearNotes">🗑 清空笔记</button>
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
const unseenCount = computed(() => pool.value.filter(w => !store.isLearned(w.id) && !store.isFamiliar(w.id)).length)
const learnedPct = computed(() => pool.value.length ? Math.round(learnedCount.value / pool.value.length * 100) : 0)
// 复习完成度：用于任务卡进度条（按本等级已复习/待复习估算）
const reviewProgress = computed(() => {
  const done = pool.value.filter(w => store.isLearned(w.id) && store.isMastered(w.id, availableTypes(w)) && !store.isFamiliar(w.id)).length
  const total = pool.value.filter(w => store.isLearned(w.id) && !store.isFamiliar(w.id)).length
  return total ? Math.round(done / total * 100) : 100
})

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

function confirmClearProgress() {
  if (confirm('确定要清空所有背词学习进度（已学、熟词、题型完成）吗？笔记不受影响。')) {
    store.clearProgress()
  }
}

function confirmClearNotes() {
  if (confirm('确定要清空所有单词笔记吗？学习进度不受影响。')) {
    store.clearNotes()
    showNotes.value = false
  }
}
</script>

<style scoped>
.words-page { max-width: 960px; }
.level-sel {
  margin-bottom: 16px;
}
/* 页头 */
.word-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 2px 18px;
}
.hero-title { font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
.hero-sub { font-size: 12px; color: var(--text-light); margin-top: 4px; }
.hero-badge {
  background: linear-gradient(145deg, #ff9dbd, #ff7da0);
  color: #fff;
  font-weight: 800;
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 13px;
  letter-spacing: 1px;
  box-shadow: 0 4px 14px rgba(255, 125, 160, 0.35);
}

/* 统计大卡 */
.ws-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.ws-card {
  border-radius: 18px;
  padding: 16px 14px;
  box-shadow: var(--card-float);
}
.ws-main { background: linear-gradient(150deg, rgba(255, 224, 178, 0.5), rgba(255, 247, 230, 0.2)); }
.ws-due { background: linear-gradient(150deg, rgba(178, 233, 205, 0.5), rgba(234, 250, 240, 0.2)); }
.ws-fam { background: linear-gradient(150deg, rgba(204, 224, 255, 0.5), rgba(238, 245, 255, 0.2)); }
.ws-mast { background: linear-gradient(150deg, rgba(226, 208, 255, 0.5), rgba(246, 239, 255, 0.2)); }
[data-theme="dark"] .ws-main { background: linear-gradient(150deg, rgba(217, 152, 61, 0.18), rgba(42, 34, 26, 0.08)); }
[data-theme="dark"] .ws-due { background: linear-gradient(150deg, rgba(76, 187, 135, 0.18), rgba(29, 42, 36, 0.08)); }
[data-theme="dark"] .ws-fam { background: linear-gradient(150deg, rgba(106, 128, 221, 0.18), rgba(29, 36, 52, 0.08)); }
[data-theme="dark"] .ws-mast { background: linear-gradient(150deg, rgba(150, 108, 220, 0.18), rgba(40, 30, 52, 0.08)); }
.ws-label { font-size: 12px; color: var(--text-light); }
.ws-num { font-size: 26px; font-weight: 800; color: var(--text); margin: 4px 0 6px; line-height: 1; }
.ws-num small { font-size: 12px; color: var(--text-light); font-weight: 600; }
.ws-bar { height: 5px; background: rgba(255, 255, 255, 0.6); border-radius: 3px; overflow: hidden; }
[data-theme="dark"] .ws-bar { background: rgba(255, 255, 255, 0.1); }
.ws-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #e8b86d, #d99a3d); }
.ws-pct { font-size: 11px; color: #d99a3d; font-weight: 700; margin-top: 4px; }
.ws-desc { font-size: 11px; color: var(--text-light); margin-top: 4px; line-height: 1.4; }
.ws-sub {
  display: flex;
  gap: 16px;
  padding: 0 2px 16px;
  font-size: 12.5px;
  color: var(--text-light);
  flex-wrap: wrap;
}
.ws-sub b { color: var(--sakura-600); font-weight: 800; }
.function-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
/* 今日复习任务卡 */
.review-task {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, rgba(178, 233, 205, 0.5), rgba(234, 250, 240, 0.2));
  border-radius: 16px;
  padding: 16px 18px;
  margin-bottom: 14px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--card-float);
}
.review-task:hover { box-shadow: var(--shadow); transform: translateY(-1px); }
.review-task.done { background: linear-gradient(135deg, rgba(178, 233, 205, 0.35), rgba(234, 250, 240, 0.15)); cursor: default; }
[data-theme="dark"] .review-task { background: linear-gradient(135deg, rgba(76, 187, 135, 0.18), rgba(29, 42, 36, 0.08)); }
[data-theme="dark"] .review-task.done { background: linear-gradient(135deg, rgba(76, 187, 135, 0.12), rgba(29, 42, 36, 0.06)); }
.review-task.done:hover { transform: none; box-shadow: var(--card-float); }
.rt-icon { font-size: 28px; flex-shrink: 0; }
.rt-body { flex: 1; min-width: 0; }
.rt-title { font-size: 15px; font-weight: 800; color: var(--sakura-600); }
.review-task.done .rt-title { color: var(--green); }
.rt-desc { font-size: 12px; color: var(--text-light); margin-top: 2px; }
.rt-progress {
  width: 90px;
  height: 6px;
  background: var(--sakura-100);
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
}
.rt-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--sakura-400), var(--sakura-600));
  border-radius: 3px;
  transition: width 0.4s;
}
.reset-area {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.func-card {
  background: var(--card-hover);
  border: 2px solid var(--border-strong);
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
.func-name { font-weight: 700; color: var(--text); margin-bottom: 4px; }

/* 功能入口图标色块 */
.app-row .row-icon.ic-new { background: linear-gradient(145deg, #fff3e0, #ffe9c2); }
.app-row .row-icon.ic-rv { background: linear-gradient(145deg, #eafaf0, #d4f2e0); }
.app-row .row-icon.ic-note { background: linear-gradient(145deg, #f6efff, #e9dcff); }

/* 窄屏适配 */
@media (max-width: 520px) {
  .ws-grid { grid-template-columns: repeat(2, 1fr); }
}
.notes-panel {
  margin-top: 20px;
  background: var(--card-hover);
  border: 2px solid var(--border-strong);
  border-radius: 16px;
  padding: 18px;
}
.notes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.notes-header h3 { margin: 0; color: var(--sakura-600); }
.notes-empty { color: var(--text-light); text-align: center; padding: 20px; }
.note-item {
  background: var(--sakura-50);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 10px;
}
.note-word { display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
.note-kanji { font-size: 20px; font-weight: 700; color: var(--sakura-600); }
.note-kana { font-size: 14px; color: #d9773e; }
.note-meaning { font-size: 13px; color: var(--text); }
.note-text { font-size: 14px; color: #6b4a52; margin-bottom: 8px; white-space: pre-wrap; }
.btn-xs { font-size: 12px; padding: 3px 10px; }
@media (max-width: 480px) {
  .function-grid { grid-template-columns: 1fr; }
}
</style>

