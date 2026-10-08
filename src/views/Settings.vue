<template>
  <div class="container settings-page">
    <div class="list-header">
      <h2>⚙️ 设置</h2>
    </div>

    <!-- 外观 -->
    <div class="settings-group">
      <div class="settings-group-title">外观</div>
      <div class="settings-card">
        <div class="settings-row">
          <span class="set-icon">🎨</span>
          <div class="set-body">
            <div class="set-title">主题模式</div>
            <div class="set-desc">深色模式适合夜间学习</div>
          </div>
          <div class="set-right">
            <div class="segmented">
              <button :class="{ active: theme.mode.value === 'light' }" @click="theme.setMode('light')">浅色</button>
              <button :class="{ active: theme.mode.value === 'dark' }" @click="theme.setMode('dark')">深色</button>
              <button :class="{ active: theme.mode.value === 'system' }" @click="theme.setMode('system')">跟随系统</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 学习目标 -->
    <div class="settings-group">
      <div class="settings-group-title">学习目标</div>
      <div class="settings-card">
        <div class="settings-row">
          <span class="set-icon">📝</span>
          <div class="set-body">
            <div class="set-title">每日答题目标</div>
            <div class="set-desc">今日卡片进度环按此计算</div>
          </div>
          <div class="set-right">
            <input class="settings-num" type="number" min="1" max="500" :value="daily.state.settings.quizTarget"
              @change="setQuizTarget($event)" />
          </div>
        </div>
        <div class="settings-row">
          <span class="set-icon">🌸</span>
          <div class="set-body">
            <div class="set-title">每日背词目标</div>
            <div class="set-desc">同步到背词模块的每日计划</div>
          </div>
          <div class="set-right">
            <input class="settings-num" type="number" min="1" max="500" :value="daily.state.settings.wordTarget"
              @change="setWordTarget($event)" />
          </div>
        </div>
        <div class="settings-row">
          <span class="set-icon">🗓️</span>
          <div class="set-body">
            <div class="set-title">连续打卡</div>
            <div class="set-desc">每天答题或背词即算打卡，当前连续 {{ daily.streak.value }} 天</div>
          </div>
          <div class="set-right"><span class="set-value">🔥 {{ daily.streak.value }} 天</span></div>
        </div>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="settings-group">
      <div class="settings-group-title">数据管理</div>
      <div class="settings-card">
        <div class="settings-row">
          <span class="set-icon">📝</span>
          <div class="set-body">
            <div class="set-title">答题记录</div>
            <div class="set-desc">全部等级共 {{ totalAnswered }} 题 · 清除后正确率与已答题数归零（错题/收藏保留）</div>
          </div>
          <button class="set-del" @click="clearAllAnswers">清空</button>
        </div>
        <div class="settings-row">
          <span class="set-icon">🧾</span>
          <div class="set-body">
            <div class="set-title">错题本</div>
            <div class="set-desc">{{ totalWrong }} 条错题 · 清除后不再出现在错题重练</div>
          </div>
          <button class="set-del" @click="clearAllWrong">清空</button>
        </div>
        <div class="settings-row">
          <span class="set-icon">⭐</span>
          <div class="set-body">
            <div class="set-title">收藏</div>
            <div class="set-desc">{{ totalFavs }} 条收藏 · 清除后收藏列表为空</div>
          </div>
          <button class="set-del" @click="clearAllFavs">清空</button>
        </div>
        <div class="settings-row">
          <span class="set-icon">🧪</span>
          <div class="set-body">
            <div class="set-title">模拟测试成绩</div>
            <div class="set-desc">{{ totalMock }} 次成绩记录 · 清除后成绩列表为空</div>
          </div>
          <button class="set-del" @click="clearAllMocks">清空</button>
        </div>
        <div class="settings-row">
          <span class="set-icon">🌸</span>
          <div class="set-body">
            <div class="set-title">背词学习进度</div>
            <div class="set-desc">已学 {{ learnedWords }} 词 · 清除后恢复未学状态（笔记保留）</div>
          </div>
          <button class="set-del" @click="clearWordProgress">清空</button>
        </div>
        <div class="settings-row">
          <span class="set-icon">📝</span>
          <div class="set-body">
            <div class="set-title">单词笔记</div>
            <div class="set-desc">{{ noteWords }} 条笔记 · 清除后笔记列表为空（学习进度保留）</div>
          </div>
          <button class="set-del" @click="clearWordNotes">清空</button>
        </div>
        <div class="settings-row">
          <span class="set-icon">🗓️</span>
          <div class="set-body">
            <div class="set-title">每日打卡记录</div>
            <div class="set-desc">{{ dailyDays }} 天记录 · 清除后连续打卡天数归零</div>
          </div>
          <button class="set-del" @click="clearDaily">清空</button>
        </div>
      </div>
    </div>

    <!-- 数据备份 -->
    <div class="settings-group">
      <div class="settings-group-title">数据备份</div>
      <div class="settings-card">
        <div class="settings-row clickable" @click="exportData">
          <span class="set-icon">📤</span>
          <div class="set-body">
            <div class="set-title">导出学习数据</div>
            <div class="set-desc">下载 JSON 备份（题库进度、背词、笔记、每日记录）</div>
          </div>
          <span class="set-arrow">›</span>
        </div>
        <div class="settings-row clickable" @click="importClick">
          <span class="set-icon">📥</span>
          <div class="set-body">
            <div class="set-title">导入学习数据</div>
            <div class="set-desc">从备份 JSON 恢复（会合并到当前数据）</div>
          </div>
          <span class="set-arrow">›</span>
        </div>
        <div class="settings-row clickable danger" @click="clearAll">
          <span class="set-icon">🗑️</span>
          <div class="set-body">
            <div class="set-title">清空所有学习数据</div>
            <div class="set-desc">删除本地全部题库进度、错题、收藏、背词、笔记、打卡（云端数据保留）</div>
          </div>
          <span class="set-arrow">›</span>
        </div>
        <input ref="fileInput" type="file" accept=".json,application/json" style="display:none" @change="importData" />
      </div>
    </div>

    <!-- 关于 -->
    <div class="settings-group">
      <div class="settings-group-title">关于</div>
      <div class="settings-card">
        <div class="settings-row">
          <span class="set-icon">🌸</span>
          <div class="set-body">
            <div class="set-title">樱花日语</div>
            <div class="set-desc">日语学习 · JLPT N5–N1</div>
          </div>
          <div class="set-right"><span class="set-value">v{{ currentVersion }}</span></div>
        </div>
        <div class="settings-row clickable" @click="checkUpdate">
          <span class="set-icon">🔄</span>
          <div class="set-body">
            <div class="set-title">检查更新</div>
            <div class="set-desc">{{ updateDesc }}</div>
          </div>
          <span class="set-arrow">›</span>
        </div>
        <div class="settings-row clickable" @click="openFeedback">
          <span class="set-icon">📮</span>
          <div class="set-body">
            <div class="set-title">意见反馈</div>
            <div class="set-desc">告诉我们遇到的问题或建议</div>
          </div>
          <span class="set-arrow">›</span>
        </div>
        <a class="settings-row clickable" href="https://github.com/by-be-young/sakura-JLPT" target="_blank" rel="noopener">
          <span class="set-icon">🐙</span>
          <div class="set-body">
            <div class="set-title">项目主页</div>
            <div class="set-desc">GitHub · 版本历史与源码</div>
          </div>
          <span class="set-arrow">›</span>
        </a>
      </div>
    </div>

    <!-- 反馈弹窗 -->
    <FeedbackModal v-model:visible="feedbackVisible" type="general" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '../store/themeStore'
import { useDaily } from '../store/dailyStore'
import { useStore } from '../store/useStore'
import { useWordStore } from '../store/wordStore'
import { useLevel } from '../store/levelStore'
import { useUpdater } from '../composables/useUpdater'
import FeedbackModal from '../components/FeedbackModal.vue'

const router = useRouter()
const theme = useTheme()
const daily = useDaily()
const store = useStore()
const wordStore = useWordStore()
const updater = useUpdater()
const { APP_LEVELS } = useLevel()
const fileInput = ref(null)
const feedbackVisible = ref(false)
const currentVersion = ref('')

// ===== 数据管理：全等级统计 =====
const totalAnswered = computed(() => APP_LEVELS.reduce((s, l) => s + (store.state.counts?.[l.id]?.answered || 0), 0))
const totalWrong = computed(() => (store.state.wrong || []).length)
const totalFavs = computed(() => (store.state.favorites || []).length)
const totalMock = computed(() => Object.keys(store.state.mockResults || {}).length)
const learnedWords = computed(() => Object.keys(wordStore.state.learned || {}).length)
const noteWords = computed(() => Object.keys(wordStore.state.notes || {}).length)
const dailyDays = computed(() => Object.keys(daily.state.days || {}).length)

function clearAllAnswers() {
  if (confirm(`确定清空全部等级的答题记录吗？（共 ${totalAnswered.value} 题，错题/收藏保留）`)) {
    for (const l of APP_LEVELS) store.clearAnswers(l.id)
    alert('已清空答题记录')
  }
}
function clearAllWrong() {
  if (confirm(`确定清空全部错题吗？（共 ${totalWrong.value} 条）`)) {
    for (const l of APP_LEVELS) store.clearWrong(l.id)
    alert('已清空错题本')
  }
}
function clearAllFavs() {
  if (confirm(`确定清空全部收藏吗？（共 ${totalFavs.value} 条）`)) {
    for (const l of APP_LEVELS) store.clearFavorites(l.id)
    alert('已清空收藏')
  }
}
function clearAllMocks() {
  if (confirm(`确定清空全部模拟测试成绩吗？（共 ${totalMock.value} 次）`)) {
    for (const l of APP_LEVELS) store.clearMockResults(l.id)
    alert('已清空模拟成绩')
  }
}
function clearWordProgress() {
  if (confirm(`确定清空背词学习进度吗？（已学 ${learnedWords.value} 词，笔记保留）`)) {
    wordStore.clearProgress()
    alert('已清空背词进度')
  }
}
function clearWordNotes() {
  if (confirm(`确定清空全部单词笔记吗？（共 ${noteWords.value} 条，学习进度保留）`)) {
    wordStore.clearNotes()
    alert('已清空笔记')
  }
}
function clearDaily() {
  if (confirm(`确定清空每日打卡记录吗？（${dailyDays.value} 天，连续打卡归零）`)) {
    Object.assign(daily.state, { settings: daily.state.settings, days: {}, lastActive: '' })
    alert('已清空打卡记录')
  }
}

onMounted(async () => {
  try {
    const res = await fetch('./version.json', { cache: 'no-store' })
    const data = await res.json()
    currentVersion.value = (data.version || '').replace(/^v/, '')
  } catch (e) {
    currentVersion.value = ''
  }
  updater.init()
})

const updateDesc = computed(() => {
  switch (updater.state.phase) {
    case 'available': return `发现新版本 v${updater.state.latest}，点击跳转下载`
    case 'checking': return '正在检查更新…'
    case 'none': return '当前已是最新版本'
    case 'error': return '更新检查失败'
    default: return '启动时自动检查'
  }
})

function setQuizTarget(e) {
  daily.setTargets(e.target.value, daily.state.settings.wordTarget)
  e.target.value = daily.state.settings.quizTarget
}
function setWordTarget(e) {
  daily.setTargets(daily.state.settings.quizTarget, e.target.value)
  e.target.value = daily.state.settings.wordTarget
  wordStore.state.settings.dailyGoal = daily.state.settings.wordTarget
}

function exportData() {
  const data = {
    app: 'sakura-japanese',
    exportedAt: new Date().toISOString(),
    japanese: JSON.parse(JSON.stringify(store.state)),
    word: JSON.parse(JSON.stringify(wordStore.state)),
    daily: JSON.parse(JSON.stringify(daily.state)),
    theme: theme.mode.value,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `sakura-japanese-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 3000)
}

function importClick() {
  fileInput.value && fileInput.value.click()
}

function importData(e) {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result))
      if (data.japanese) {
        Object.assign(store.state, store.normalizeState(data.japanese))
        store.repairState()
      }
      if (data.word) {
        Object.assign(wordStore.state, JSON.parse(JSON.stringify(wordStore.state)), data.word)
        wordStore.repairState()
      }
      if (data.daily) {
        Object.assign(daily.state, daily.state, data.daily)
      }
      if (data.theme) theme.setMode(data.theme)
      alert('导入成功，数据已合并到本地')
    } catch (err) {
      alert('导入失败：文件格式不正确')
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}

function clearAll() {
  if (confirm('确定清空本地全部学习数据吗？\n（题库进度、错题、收藏、背词、笔记、每日记录；云端数据不受影响）')) {
    store.resetAll()
    wordStore.resetAll && wordStore.resetAll()
    Object.assign(daily.state, { settings: daily.state.settings, days: {}, lastActive: '' })
    alert('已清空本地学习数据')
  }
}

function checkUpdate() {
  if (updater.state.phase === 'available' && updater.state.releaseUrl) {
    window.open(updater.state.releaseUrl, '_blank', 'noopener')
  } else {
    updater.init()
    setTimeout(() => {
      if (updater.state.phase === 'available') {
        window.open(updater.state.releaseUrl, '_blank', 'noopener')
      } else {
        alert(updater.state.phase === 'none' ? '当前已是最新版本' : '正在检查，请稍后再试')
      }
    }, 1200)
  }
}

function openFeedback() {
  feedbackVisible.value = true
}
</script>

<style scoped>
.settings-page { max-width: 720px; }
.settings-row.danger .set-title { color: var(--red); }
.settings-row.danger:hover { background: var(--red-soft); }

/* 数据管理清空按钮 */
.set-del {
  flex-shrink: 0;
  border: 1.5px solid var(--red);
  background: transparent;
  color: var(--red);
  border-radius: 14px;
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s;
}
.set-del:hover { background: var(--red); color: #fff; }
</style>
