<template>
  <div class="reader-page">
    <!-- 顶部工具条 -->
    <div class="reader-bar">
      <button class="btn btn-ghost btn-sm" @click="$router.push('/study')">← 学习</button>
      <span class="reader-title">{{ level?.name.replace(' 文法详解（整理版）', '') || '' }} <span class="reader-sub">{{ points.length }} 点</span></span>
      <div class="reader-actions">
        <button class="mode-toggle" :class="{ active: mode === 'paged' }" @click="setMode('paged')">分页阅读</button>
        <button class="mode-toggle" :class="{ active: mode === 'sequential' }" @click="setMode('sequential')">顺序阅读</button>
        <button class="toc-btn" @click="tocOpen = true">☰ 目录<span v-if="markedCount" class="marked-badge">{{ markedCount }}</span></button>
      </div>
    </div>

    <!-- 分页模式：上一页/下一页 -->
    <div v-if="mode === 'paged'" class="pager-bar">
      <button class="page-btn" :disabled="currentIndex <= 0" @click="prevPage">← 上一页 <span class="kbd">A</span></button>
      <span class="page-indicator">第 {{ currentIndex + 1 }} / {{ points.length }} 点</span>
      <button class="page-btn" :disabled="currentIndex >= points.length - 1" @click="nextPage"><span class="kbd">D</span> 下一页 →</button>
    </div>

    <!-- 主阅读区 -->
    <div
      ref="contentEl"
      class="reader-content"
      :class="{ paged: mode === 'paged', sequential: mode === 'sequential' }"
      @pointerdown="onPointerDown"
    >
      <!-- 顺序阅读：连续滚动 -->
      <template v-if="mode === 'sequential'">
        <div v-for="(u, ui) in level.units" :key="u.id" class="unit-block">
          <div class="unit-head" :data-unit="ui"><span class="unit-dot"></span>{{ u.title }}</div>
          <section
            v-for="p in u.points"
            :key="p.id"
            :id="'gp-' + p.id"
            :data-pid="p.id"
            class="gp-card"
            :class="{ marked: isMarked(p.id), current: p.id === currentPointId }"
          >
            <div class="gp-head">
              <h3 class="gp-title">{{ p.title }}</h3>
              <button class="mark-btn" :class="{ active: isMarked(p.id) }" @click="toggleMark(p.id)" title="在目录中标记/取消此点">★</button>
            </div>
            <div class="gp-body">
              <template v-for="(b, i) in p.blocks" :key="i">
                <div v-if="b.t === 'label'" class="gp-row">
                  <span class="gp-label">{{ b.label }}</span>
                  <span v-if="b.text" class="gp-text" v-html="blockHtml(b)"></span>
                </div>
                <div v-else-if="b.t === 'sub'" class="gp-sub" v-html="blockHtml(b)"></div>
                <div v-else class="gp-line" v-html="blockHtml(b)"></div>
              </template>
            </div>
          </section>
        </div>
      </template>

      <!-- 分页阅读：每点一页 -->
      <template v-else>
        <div v-if="currentPoint" class="page-wrap" :class="{ marked: isMarked(currentPoint.id) }">
          <div class="page-meta">{{ currentPoint.unitTitle }}</div>
          <div class="gp-head">
            <h3 class="gp-title">{{ currentPoint.title }}</h3>
            <button class="mark-btn" :class="{ active: isMarked(currentPoint.id) }" @click="toggleMark(currentPoint.id)" title="在目录中标记/取消此点">★</button>
          </div>
          <div class="gp-body">
            <template v-for="(b, i) in currentPoint.blocks" :key="i">
              <div v-if="b.t === 'label'" class="gp-row">
                <span class="gp-label">{{ b.label }}</span>
                <span v-if="b.text" class="gp-text" v-html="blockHtml(b)"></span>
              </div>
              <div v-else-if="b.t === 'sub'" class="gp-sub" v-html="blockHtml(b)"></div>
              <div v-else class="gp-line" v-html="blockHtml(b)"></div>
            </template>
          </div>
        </div>
        <div class="page-hint">拖动或点击左右两侧翻页 · <span class="kbd">A</span> / <span class="kbd">D</span> 快捷键</div>
      </template>
    </div>

    <!-- 侧边目录 -->
    <div v-if="tocOpen" class="toc-backdrop" @click="tocOpen = false"></div>
    <aside v-if="tocOpen" class="toc">
      <div class="toc-header">
        <span class="toc-title">目录 · {{ level?.name.replace(' 文法详解（整理版）', '') }}</span>
        <button class="toc-close" @click="tocOpen = false">✕</button>
      </div>
      <div class="toc-list">
        <div v-for="(u, ui) in level.units" :key="u.id" class="toc-unit">
          <div class="toc-unit-title">{{ u.title }}</div>
          <div
            v-for="p in u.points"
            :key="p.id"
            class="toc-item"
            :class="{ current: p.id === currentPointId, marked: isMarked(p.id) }"
            :ref="el => setTocRef(el, p.id)"
          >
            <button class="toc-mark" :class="{ active: isMarked(p.id) }" @click.stop="toggleMark(p.id)" :title="isMarked(p.id) ? '取消标记' : '标记此点'">
              {{ isMarked(p.id) ? '★' : '☆' }}
            </button>
            <span class="toc-label" @click="jumpTo(p.id)">{{ p.title }}</span>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { grammarLevels } from '../data/grammar'
import { useGrammarStore } from '../store/grammarStore'
import { useFurigana } from '../composables/useFurigana'

const route = useRoute()
const store = useGrammarStore()
const furigana = useFurigana()

const levelId = computed(() => String(route.params.level || '').toUpperCase())
const level = computed(() => grammarLevels.find(l => l.id === levelId.value) || grammarLevels[0])
const points = computed(() => {
  const arr = []
  if (!level.value) return arr
  level.value.units.forEach(u => {
    u.points.forEach(p => arr.push(p))
  })
  return arr
})
const allIds = computed(() => points.value.map(p => p.id))

// ===== 状态 =====
const mode = ref('paged')
const tocOpen = ref(false)
const currentIndex = ref(0)
const currentPointId = ref('')
const contentEl = ref(null)
const tocRefs = {}
const markedCount = computed(() => store.markedCountOf(points.value))

const currentPoint = computed(() => points.value[currentIndex.value] || null)

// ===== 富文本：转义 + 加粗；开启振假名时优先渲染 ruby 版本 =====
function fmt(s) {
  if (!s) return ''
  let h = String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  h = h.replace(/\n/g, '<br>')
  return h
}

// 输出某一块的 HTML：振假名开启且有 furi 数据时直接渲染 ruby，否则走普通格式化
function blockHtml(b) {
  if (furigana.isEnabled.value && b.furi) return b.furi
  return fmt(b.text)
}

function isMarked(pid) { return store.isMarked(pid) }
function toggleMark(pid) { store.toggleMark(pid) }

// ===== 翻页 =====
function nextPage() {
  if (currentIndex.value < points.value.length - 1) {
    currentIndex.value++
    syncProgress()
  }
}
function prevPage() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    syncProgress()
  }
}

function syncProgress() {
  const p = points.value[currentIndex.value]
  if (p) store.setLastPoint(level.value.id, p.id)
}

// ===== 跳转到某一点 =====
function jumpTo(pid) {
  const idx = allIds.value.indexOf(pid)
  if (idx < 0) return
  currentIndex.value = idx
  currentPointId.value = pid
  store.setLastPoint(level.value.id, pid)
  if (mode.value === 'sequential') {
    nextTick(() => {
      const el = document.getElementById('gp-' + pid)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
  tocOpen.value = false
}

// ===== 模式切换 =====
function setMode(m) {
  if (mode.value === m) return
  mode.value = m
  store.setMode(level.value.id, m)
  if (m === 'sequential') {
    // 切到顺序阅读：滚到当前点
    nextTick(() => {
      const p = points.value[currentIndex.value]
      if (p) {
        const el = document.getElementById('gp-' + p.id)
        if (el) el.scrollIntoView({ block: 'start' })
      }
    })
  }
}

// ===== 键盘：L 切换振假名；分页模式下 A 上一页 / D 下一页 =====
function onKeydown(e) {
  const t = e.target
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
  const k = e.key
  // 振假名快捷键（与全站一致）
  if (k === 'l' || k === 'L') {
    e.preventDefault()
    furigana.toggle()
    return
  }
  if (mode.value !== 'paged') return
  if (k === 'a' || k === 'A') { e.preventDefault(); prevPage() }
  else if (k === 'd' || k === 'D') { e.preventDefault(); nextPage() }
}

// ===== 鼠标拖动 / 点击区域翻页（分页模式）=====
let drag = null
function onPointerDown(e) {
  if (mode.value !== 'paged') return
  drag = { x: e.clientX, y: e.clientY, moved: false }
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}
function onPointerMove(e) {
  if (!drag) return
  const dx = e.clientX - drag.x
  const dy = e.clientY - drag.y
  if (Math.abs(dx) > 8 || Math.abs(dy) > 8) drag.moved = true
}
function onPointerUp(e) {
  if (!drag) return
  const dx = e.clientX - drag.x
  const dy = e.clientY - drag.y
  const wasMove = drag.moved
  drag = null
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  if (wasMove) {
    // 向左拖 -> 下一页；向右拖 -> 上一页
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) nextPage()
      else prevPage()
    }
    return
  }
  // 点击：右侧翻下一页，左侧翻上一页
  const el = contentEl.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const x = e.clientX - rect.left
  const w = rect.width
  if (x > w * 0.62) nextPage()
  else if (x < w * 0.38) prevPage()
}

// ===== 顺序阅读：滚动定位当前点 =====
let scTicking = false
function onScroll() {
  if (mode.value !== 'sequential' || scTicking) return
  scTicking = true
  requestAnimationFrame(() => {
    scTicking = false
    const secs = contentEl.value ? contentEl.value.querySelectorAll('[data-pid]') : []
    let cur = 0
    const top = contentEl.value ? contentEl.value.getBoundingClientRect().top : 0
    const threshold = top + 160
    for (let i = 0; i < secs.length; i++) {
      const r = secs[i].getBoundingClientRect()
      if (r.top <= threshold) cur = i
      else break
    }
    if (secs[cur]) {
      const pid = secs[cur].getAttribute('data-pid')
      const idx = allIds.value.indexOf(pid)
      if (idx >= 0 && idx !== currentIndex.value) {
        currentIndex.value = idx
        currentPointId.value = pid
        store.setLastPoint(level.value.id, pid)
      }
    }
  })
}

// ===== 目录项引用（用于打开时滚动到当前项）=====
function setTocRef(el, pid) {
  if (el) tocRefs[pid] = el
}

function scrollTocToCurrent() {
  const pid = currentPointId.value
  if (pid && tocRefs[pid]) {
    tocRefs[pid].scrollIntoView({ block: 'center' })
  }
}

// ===== 初始化 / 恢复进度 =====
function restore() {
  mode.value = store.getMode(level.value.id)
  const lastPid = store.getLastPoint(level.value.id)
  const idx = lastPid ? allIds.value.indexOf(lastPid) : -1
  currentIndex.value = idx >= 0 ? idx : 0
  const p = points.value[currentIndex.value]
  currentPointId.value = p ? p.id : ''
  nextTick(() => {
    if (mode.value === 'sequential' && p) {
      const el = document.getElementById('gp-' + p.id)
      if (el) el.scrollIntoView({ block: 'start' })
    }
  })
}

watch(levelId, () => { restore() })

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  restore()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
})

watch(tocOpen, (v) => {
  if (v) nextTick(scrollTocToCurrent)
})
</script>

<style scoped>
.reader-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px 20px 48px;
  position: relative;
  z-index: 1;
}
.reader-bar {
  position: sticky;
  top: 60px;
  z-index: 90;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(255, 250, 245, 0.94);
  backdrop-filter: blur(10px);
  border: 2px solid #ffe3ec;
  border-radius: 14px;
}
.reader-title {
  font-size: 18px;
  font-weight: 700;
  color: #c2556f;
  margin-right: auto;
}
.reader-sub { font-size: 12px; color: #b98a94; font-weight: 400; margin-left: 6px; }
.reader-actions { display: flex; align-items: center; gap: 8px; }
.mode-toggle {
  padding: 7px 14px;
  border-radius: 18px;
  border: 2px solid #ffd3e0;
  background: #fffafc;
  color: #b98a94;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.mode-toggle:hover { border-color: #ff9dbd; color: #c2556f; }
.mode-toggle.active {
  background: linear-gradient(145deg, #ff9dbd, #ff7da0);
  color: #fff;
  border-color: #ff7da0;
  box-shadow: 0 4px 12px rgba(255, 125, 160, 0.3);
}
.toc-btn {
  position: relative;
  padding: 7px 14px;
  border-radius: 18px;
  border: 2px solid #ffd3e0;
  background: #fffafc;
  color: #c2556f;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.toc-btn:hover { border-color: #ff9dbd; background: #fff0f5; }
.marked-badge {
  display: inline-block;
  background: #e08a00;
  color: #fff;
  font-size: 11px;
  min-width: 17px;
  height: 17px;
  line-height: 17px;
  border-radius: 9px;
  margin-left: 4px;
  padding: 0 4px;
}

/* 分页工具栏 */
.pager-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}
.page-btn {
  padding: 8px 16px;
  border-radius: 18px;
  border: 2px solid #ffd3e0;
  background: #fffafc;
  color: #c2556f;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.page-btn:hover:not(:disabled) { border-color: #ff9dbd; background: #fff0f5; }
.page-btn:disabled { opacity: 0.4; cursor: default; }
.page-indicator { font-size: 13px; color: #b98a94; }
.kbd {
  display: inline-block;
  background: #fff;
  border: 1px solid #ffc9d9;
  border-bottom-width: 2px;
  border-radius: 5px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: #c2556f;
  font-family: inherit;
}

/* 阅读内容区 */
.reader-content { position: relative; }
.reader-content.paged { user-select: none; -webkit-user-select: none; cursor: default; }
.reader-content.paged .page-wrap { cursor: grab; }
.reader-content.paged .page-wrap:active { cursor: grabbing; }

/* 顺序阅读：单元 */
.unit-block { margin-bottom: 26px; }
.unit-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #a8436a;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #ffd3e0;
}
.unit-dot { width: 8px; height: 8px; border-radius: 50%; background: linear-gradient(145deg, #ff9dbd, #ff7da0); flex-shrink: 0; }

/* 文法点卡片 */
.gp-card {
  background: #fffafc;
  border: 2px solid #ffe3ec;
  border-radius: 16px;
  padding: 18px 20px;
  margin-bottom: 14px;
  scroll-margin-top: 90px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.gp-card.current { border-color: #ff9dbd; box-shadow: 0 4px 16px rgba(255, 125, 160, 0.15); }
.gp-card.marked { border-left: 5px solid #ffb347; }
.gp-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.gp-title { font-size: 16.5px; font-weight: 700; color: #7a3a52; line-height: 1.5; flex: 1; }
.mark-btn {
  flex-shrink: 0;
  font-size: 20px;
  color: #d8bcc4;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
  padding: 2px;
}
.mark-btn:hover { transform: scale(1.2); }
.mark-btn.active { color: #ffb347; text-shadow: 0 0 6px rgba(255, 179, 71, 0.4); }
.gp-body { display: flex; flex-direction: column; gap: 6px; }
.gp-row { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.gp-label {
  flex-shrink: 0;
  background: #ffe9f0;
  color: #c2556f;
  font-size: 13px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 10px;
  line-height: 1.7;
}
.gp-text { font-size: 14.5px; color: #5c3b47; line-height: 1.8; }
.gp-sub {
  margin-top: 4px;
  font-size: 14px;
  font-weight: 700;
  color: #b36a5e;
  background: #fff3f6;
  border-left: 3px solid #f79ab4;
  padding: 4px 10px;
  border-radius: 0 8px 8px 0;
}
.gp-line {
  font-size: 14.5px;
  color: #4a3a44;
  line-height: 1.9;
  padding-left: 4px;
}
.gp-line:lang(ja), .gp-text:lang(ja), .gp-title:lang(ja) { font-family: 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', 'Meiryo', serif; }

/* 分页阅读：单页 */
.page-wrap {
  background: #fffafc;
  border: 2px solid #ffe3ec;
  border-radius: 18px;
  padding: 26px 30px;
  min-height: 46vh;
  box-shadow: 0 8px 26px rgba(255, 125, 160, 0.12);
  margin: 0 auto;
  max-width: 780px;
  transition: border-color 0.2s;
}
.page-wrap.marked { border-color: #ffd59a; }
.page-meta {
  font-size: 12px;
  color: #b98a94;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}
.page-hint {
  text-align: center;
  color: #b98a94;
  font-size: 12px;
  margin-top: 14px;
}

/* 侧边目录 */
.toc-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(74, 58, 68, 0.35);
  z-index: 94;
}
.toc {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: min(340px, 88vw);
  background: #fffafc;
  border-left: 2px solid #ffd3e0;
  z-index: 95;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 28px rgba(74, 58, 68, 0.15);
  animation: slideIn 0.22s ease;
}
@keyframes slideIn {
  from { transform: translateX(40px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.toc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 2px solid #ffe3ec;
}
.toc-title { font-size: 16px; font-weight: 700; color: #c2556f; }
.toc-close {
  font-size: 16px;
  color: #b98a94;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
}
.toc-close:hover { background: #ffe9f0; color: #c2556f; }
.toc-list { flex: 1; overflow-y: auto; padding: 10px 12px 24px; }
.toc-unit { margin-bottom: 8px; }
.toc-unit-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #b36a5e;
  padding: 6px 8px;
  background: #fff3f6;
  border-radius: 8px;
  margin-bottom: 2px;
}
.toc-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 8px;
  cursor: pointer;
  border-left: 3px solid transparent;
}
.toc-item:hover { background: #fff0f5; }
.toc-item.current { background: #ffe9f0; border-left-color: #ff7da0; }
.toc-item.marked .toc-label { color: #b06a10; }
.toc-mark {
  flex-shrink: 0;
  background: none;
  border: none;
  font-size: 15px;
  color: #d8bcc4;
  cursor: pointer;
  padding: 2px;
  line-height: 1;
}
.toc-mark:hover { color: #ffb347; }
.toc-mark.active { color: #ffb347; }
.toc-label {
  flex: 1;
  font-size: 13px;
  color: #6b4a52;
  line-height: 1.5;
  word-break: break-all;
}
.toc-item.current .toc-label { font-weight: 700; color: #a8436a; }

@media (max-width: 640px) {
  .reader-page { padding: 12px 12px 40px; }
  .reader-actions { flex-wrap: wrap; }
  .mode-toggle { padding: 6px 10px; font-size: 12px; }
  .page-wrap { padding: 18px 16px; }
}
</style>
