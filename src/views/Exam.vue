<template>
  <div class="container exam-page">
    <div class="exam-head">
      <button class="btn btn-ghost btn-sm" @click="$router.back()">← 返回</button>
      <h1>真题拓展包</h1>
      <span class="head-note">按需下载 · 不随安装包分发</span>
    </div>

    <div v-if="!packs.length" class="empty-state">
      <div class="emoji">🌸</div>
      <p>暂无可用拓展包</p>
    </div>

    <div v-for="pack in packs" :key="pack.id" class="pack-card" :class="'pc-level-' + pack.level">
      <div class="pack-top">
        <span class="pack-icon">{{ pack.icon }}</span>
        <div class="pack-id">
          <div class="pack-name">
            {{ pack.name }}
            <span class="level-badge">{{ pack.level }}</span>
            <span class="ver-badge">v{{ pack.version }}</span>
          </div>
          <div class="pack-summary">{{ pack.summary }}</div>
        </div>
        <span class="pack-state" :class="'st-' + pack.status">
          {{ stateText(pack) }}
        </span>
      </div>

      <p class="pack-desc">{{ pack.description }}</p>

      <!-- 下载中：进度条 -->
      <div v-if="pack.status === 'installing'" class="pack-progress">
        <div class="pp-bar"><div class="pp-fill" :style="{ width: pack.progress + '%' }"></div></div>
        <div class="pp-text">{{ phaseText(pack) }} {{ pack.progress }}%</div>
      </div>

      <!-- 已安装：文件浏览 + 做题入口 -->
      <div v-if="pack.status === 'installed'" class="pack-installed">
        <div class="pi-actions">
          <button class="btn btn-primary" @click="startPractice(pack)">▶ 开始做题</button>
          <button v-if="pack.questions" class="btn btn-secondary btn-sm" disabled>{{ pack.questions.count }} 题可练习</button>
          <button class="btn btn-ghost btn-sm" @click="remove(pack)">移除</button>
        </div>
        <div v-if="pack.questions" class="pi-note">
          📚 已并入「{{ pack.level }}」题库：随机练习 / 错题重做 / 收藏练习均会包含真题；
          点「开始做题」进入真题专项（共 {{ pack.questions.count }} 题，覆盖文字 / 語彙 / 文法 / 読解）
        </div>

        <div v-for="s in pack.sessions" :key="s.session" class="pi-session">
          <div class="pi-session-title">{{ s.session }} 场次</div>
          <div class="pi-files">
            <button v-for="f in s.files" :key="f.rel" class="file-chip" @click="openFile(pack, f)">
              <span class="file-emoji">{{ fileEmoji(f) }}</span>
              {{ f.name }}
            </button>
          </div>
        </div>
      </div>

      <!-- 未安装 / 手动下载 -->
      <div v-if="pack.status === 'idle'" class="pack-actions">
        <button class="btn btn-primary" @click="download(pack)">⬇ 下载（{{ sizeText }}）</button>
        <span class="act-hint">约 21 MB · 下载后自动解压</span>
      </div>

      <div v-if="pack.status === 'manual'" class="pack-manual">
        <div class="pm-text">📂 已在新标签页打开下载地址（GitHub Releases）。下载完成后点击「导入已下载的 zip」安装。</div>
        <label class="btn btn-primary file-btn">
          导入已下载的 zip
          <input type="file" accept=".zip" @change="onImport(pack, $event)" hidden />
        </label>
      </div>

      <div v-if="pack.status === 'error'" class="pack-error">
        <span>{{ pack.error || '操作失败' }}</span>
        <button class="btn btn-ghost btn-sm" @click="download(pack)">重试</button>
      </div>
    </div>

    <!-- Web 端 txt 文件内容弹层 -->
    <div v-if="textModal" class="modal-mask" @click.self="textModal = null">
      <div class="modal-card">
        <div class="modal-head">
          <b>{{ textModal.name }}</b>
          <button class="btn btn-ghost btn-sm" @click="textModal = null">✕</button>
        </div>
        <pre class="modal-body">{{ textModal.text }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useExamPacks, importZip } from '../composables/useExamPacks'

const router = useRouter()
const { packs, refresh, download, viewFile, practicePath, removePack } = useExamPacks()
const textModal = ref(null)

// N3 包 21MB 为固定提示（首个包）
const sizeText = '约 21 MB'

function stateText(pack) {
  const map = {
    unknown: '检查中…',
    idle: '未安装',
    installing: '安装中',
    installed: '已安装',
    manual: '待导入',
    error: '失败',
  }
  return map[pack.status] || pack.status
}

function phaseText(pack) {
  return pack.phase === 'unzip' ? '解压中' : '下载中'
}

function fileEmoji(f) {
  if (f.kind === 'pdf') return '📕'
  if (/答案|听力原文/.test(f.name)) return '📃'
  if (/试卷/.test(f.name)) return '📄'
  return '📄'
}

async function startPractice(pack) {
  router.push(practicePath(pack))
}

async function openFile(pack, f) {
  const r = await viewFile(pack.id, f.rel)
  if (!r) return
  if (r.kind === 'viewed') return // Electron 已开新窗口
  if (r.kind === 'pdf' && r.url) window.open(r.url, '_blank')
  if (r.kind === 'text') textModal.value = { name: f.name, text: r.text }
}

async function onImport(pack, e) {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  await importZip(pack.id, file)
}

function remove(pack) {
  removePack(pack.id)
}

onMounted(async () => {
  await Promise.all(packs.value.map(p => refresh(p.id)))
})
</script>

<style scoped>
.exam-page { max-width: 860px; }
.exam-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.exam-head h1 { font-size: 22px; font-weight: 800; color: var(--text); margin: 0; }
.head-note { font-size: 12px; color: var(--text-faint); margin-left: auto; }

.pack-card {
  border-radius: var(--radius-xl);
  padding: 20px 22px;
  margin-bottom: 16px;
  background:
    radial-gradient(120% 120% at 100% 0%, rgba(255, 205, 224, 0.35), transparent 55%),
    linear-gradient(135deg, rgba(255, 240, 246, 0.3), rgba(255, 255, 255, 0.55));
  border: 1px solid var(--border);
  box-shadow: var(--card-float);
}
[data-theme="dark"] .pack-card {
  background:
    radial-gradient(120% 120% at 100% 0%, rgba(224, 94, 142, 0.18), transparent 55%),
    linear-gradient(135deg, rgba(42, 26, 34, 0.35), rgba(42, 26, 34, 0.1));
}
.pc-level-N3 { background: radial-gradient(120% 120% at 100% 0%, rgba(255, 205, 224, 0.4), transparent 55%), linear-gradient(135deg, rgba(255, 240, 246, 0.32), rgba(255, 255, 255, 0.5)); }

.pack-top { display: flex; align-items: center; gap: 14px; }
.pack-icon {
  width: 52px; height: 52px;
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 6px 16px rgba(244, 92, 142, 0.18);
  flex-shrink: 0;
}
[data-theme="dark"] .pack-icon { background: rgba(255, 255, 255, 0.1); box-shadow: none; }
.pack-id { flex: 1; min-width: 0; }
.pack-name { font-size: 18px; font-weight: 800; color: var(--text); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.level-badge, .ver-badge {
  font-size: 11px; font-weight: 700;
  padding: 2px 9px; border-radius: var(--radius-pill);
}
.level-badge { background: var(--grad-sakura); color: #fff; }
.ver-badge { background: rgba(255, 255, 255, 0.7); color: var(--text-light); }
[data-theme="dark"] .ver-badge { background: rgba(255, 255, 255, 0.1); }
.pack-summary { font-size: 12px; color: var(--text-light); margin-top: 3px; }
.pack-state {
  font-size: 12px; font-weight: 700;
  padding: 4px 12px; border-radius: var(--radius-pill);
  flex-shrink: 0;
}
.st-installed { background: var(--green-soft); color: var(--green); }
.st-idle { background: rgba(255, 255, 255, 0.7); color: var(--text-light); }
.st-installing { background: #fff3e0; color: #c47a3a; }
.st-manual { background: #e8f4fd; color: #3a7ca5; }
.st-error { background: var(--red-soft); color: var(--red); }
[data-theme="dark"] .st-idle { background: rgba(255, 255, 255, 0.1); }

.pack-desc { font-size: 12.5px; color: var(--text-light); margin: 12px 0 0; line-height: 1.7; }

.pack-progress { margin-top: 14px; }
.pp-bar { height: 8px; border-radius: 5px; background: rgba(255, 255, 255, 0.65); overflow: hidden; }
[data-theme="dark"] .pp-bar { background: rgba(255, 255, 255, 0.1); }
.pp-fill {
  height: 100%; border-radius: 5px;
  background: var(--grad-sakura);
  transition: width 0.25s ease;
}
.pp-text { font-size: 12px; color: var(--text-light); margin-top: 6px; font-variant-numeric: tabular-nums; }

.pack-installed { margin-top: 14px; }
.pi-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.pi-note {
  margin-top: 10px;
  font-size: 12px; line-height: 1.8;
  color: var(--text-light);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: rgba(172, 230, 200, 0.25);
  border: 1px solid rgba(172, 230, 200, 0.5);
}
[data-theme="dark"] .pi-note { background: rgba(79, 187, 135, 0.12); border-color: rgba(79, 187, 135, 0.3); }
.pi-session { margin-top: 14px; }
.pi-session-title { font-size: 13px; font-weight: 800; color: var(--text); margin-bottom: 8px; }
.pi-files { display: flex; flex-wrap: wrap; gap: 8px; }
.file-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.7);
  font-size: 12.5px; color: var(--text);
  cursor: pointer;
  transition: transform var(--dur-2) var(--ease-spring), border-color var(--dur-2);
}
[data-theme="dark"] .file-chip { background: rgba(255, 255, 255, 0.07); }
.file-chip:hover { transform: translateY(-2px); border-color: var(--sakura-300); }
.file-emoji { font-size: 14px; }

.pack-actions { margin-top: 14px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.act-hint { font-size: 12px; color: var(--text-faint); }

.pack-manual { margin-top: 14px; display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
.pm-text { font-size: 13px; color: var(--text-light); line-height: 1.8; }
.file-btn { cursor: pointer; }

.pack-error {
  margin-top: 14px;
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: var(--red-soft);
  color: var(--red);
  font-size: 13px;
}

/* 文本文件弹层 */
.modal-mask {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(30, 10, 20, 0.45);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.modal-card {
  width: min(680px, 100%);
  max-height: 82vh;
  display: flex; flex-direction: column;
  border-radius: var(--radius-xl);
  background: var(--card);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}
.modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}
.modal-body {
  margin: 0; padding: 16px 18px;
  overflow-y: auto;
  font-family: inherit;
  font-size: 13.5px; line-height: 1.9;
  white-space: pre-wrap;
  color: var(--text);
}
</style>
