<template>
  <div class="container exam-page">
    <div class="exam-head">
      <button class="btn btn-ghost btn-sm" @click="$router.back()">← 返回</button>
      <h1>真题专区</h1>
      <span class="head-note">N2 / N3 真题 · 已内置随练</span>
    </div>

    <div class="pack-card" v-for="p in packs" :key="p.packId">
      <div class="pack-top">
        <span class="pack-icon">📕</span>
        <div class="pack-id">
          <div class="pack-name">
            {{ p.level }} 真题
            <span class="level-badge">{{ p.level }}</span>
            <span class="ver-badge">{{ p.session }}</span>
          </div>
          <div class="pack-summary">{{ p.session }} 场次 · 已随应用内置</div>
        </div>
        <span class="pack-state st-installed">已内置</span>
      </div>

      <p class="pack-desc">
        真题已直接内置在应用里，无需下载。{{ p.count }} 道题已并入 {{ p.level }} 题库：随机练习 / 错题重做 / 收藏练习均会包含真题；
        点「开始做题」进入真题专项（覆盖文字 / 語彙 / 文法 / 読解）。
      </p>

      <div class="pack-installed">
        <div class="pi-actions">
          <button class="btn btn-primary" @click="startPractice(p)">▶ 开始做题</button>
          <span class="btn btn-secondary btn-sm disabled">{{ p.count }} 题可练习</span>
        </div>
        <div class="pi-note">
          📚 题型分布：文字 {{ p.types['文字'] || 0 }} · 語彙 {{ p.types['語彙'] || 0 }} · 文法 {{ p.types['文法'] || 0 }} · 読解 {{ p.types['読解'] || 0 }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { zhentiQuestions, zhentiPacks } from '../data/questions'

const router = useRouter()

const packs = computed(() => zhentiPacks.map(p => {
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

.pack-desc { font-size: 12.5px; color: var(--text-light); margin: 12px 0 0; line-height: 1.7; }

.pack-installed { margin-top: 14px; }
.pi-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.btn.disabled { opacity: 0.75; cursor: default; }
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
</style>
