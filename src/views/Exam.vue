<template>
  <div class="container exam-page journal-page">
    <header class="exam-head">
      <div class="exam-head-copy">
        <div class="journal-kicker">PAST PAPERS / {{ level }}</div>
        <div class="exam-title-row">
          <h1>真题专区</h1>
          <span class="head-note">{{ level }} 真题 · 整卷随练</span>
        </div>
      </div>
      <span class="back-slot">
        <button class="btn btn-ghost btn-sm" @click="$router.back()">← 返回</button>
      </span>
    </header>

    <div class="pack-card" v-for="p in packs" :key="p.packId">
      <div class="pack-top">
        <span class="pack-icon">真题</span>
        <div class="pack-id">
          <div class="pack-name">
            {{ p.level }} 真题
            <span class="level-badge">{{ p.level }}</span>
            <span class="ver-badge">{{ p.session }}</span>
          </div>
          <div class="pack-summary">{{ p.session }} 场次 · 共 {{ p.count }} 题</div>
        </div>
      </div>

      <div class="pack-installed">
        <div class="pi-actions">
          <button class="btn btn-primary" @click="startPractice(p)">▶ 开始做题</button>
        </div>
        <div class="pi-note">
          📚 题型分布：文字 {{ p.types['文字'] || 0 }} · 語彙 {{ p.types['語彙'] || 0 }} · 文法 {{ p.types['文法'] || 0 }} · 読解 {{ p.types['読解'] || 0 }}
        </div>
      </div>
    </div>

    <div v-if="!packs.length" class="pack-empty">
      当前难度（{{ level }}）暂无真题，可切换顶部难度。
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { zhentiQuestions, zhentiPacksOfLevel } from '../data/questions'
import { useLevel } from '../store/levelStore'

const router = useRouter()
const { level } = useLevel()

const packs = computed(() => zhentiPacksOfLevel(level.value).map(p => {
  const list = zhentiQuestions.filter(q => q.packId === p.packId)
  const types = {}
  for (const q of list) types[q.type] = (types[q.type] || 0) + 1
  return { ...p, count: list.length, types }
}))

function startPractice(p) {
  router.push(`/quiz/sequential?source=zhenti&level=${p.level}&pack=${p.packId}`)
}
</script>

<style scoped>
.exam-page { max-width: 860px; }
.exam-head {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  padding-bottom: 14px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--line);
  flex-wrap: wrap;
}
.exam-head-copy { min-width: 0; }
.exam-title-row { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-top: 6px; }
.exam-head h1 {
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(30px, 5vw, 42px);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: 0.02em;
  color: var(--text);
  margin: 0;
}
.head-note { font-size: 12px; color: var(--text-faint); }
.back-slot { margin-left: auto; padding-bottom: 2px; }

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

.pack-top { display: flex; align-items: center; gap: 14px; }
.pack-icon {
  width: 46px; height: 52px;
  border-radius: 5px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Noto Serif SC', serif;
  font-size: 12px; font-weight: 700; letter-spacing: 0.08em;
  color: var(--sakura-600);
  background: transparent;
  border: 1px solid var(--border-strong);
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

.pack-empty {
  padding: 34px 20px;
  text-align: center;
  font-size: 13px;
  color: var(--text-light);
  border-radius: var(--radius-xl);
  border: 1px dashed var(--border);
}
</style>
