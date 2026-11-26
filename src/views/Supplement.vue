<template>
  <div class="container sup-page journal-page">
    <template v-if="packs.length">
      <!-- 页头 -->
      <header class="sup-hero" v-reveal>
        <div class="hero-copy">
          <div class="hero-kicker">SUPPLEMENT / {{ level }}</div>
          <div class="hero-title-row">
            <h1>补充题库</h1>
            <div class="hero-count"><b>{{ total }}</b><span>题</span></div>
          </div>
        </div>
        <div class="hero-stamp">
          <span class="stamp-mark">{{ level }}</span>
          <span class="stamp-note">补充练习</span>
        </div>
      </header>

      <!-- 进度 -->
      <section class="progress-sheet" v-reveal="{ delay: 60 }">
        <div class="progress-head">
          <div>
            <span class="micro-label">本板块进度</span>
            <b>{{ stats.done }} <em>/ {{ stats.total }}</em></b>
          </div>
          <span class="progress-pct">{{ stats.pct }}%</span>
        </div>
        <div class="bar-track"><div class="bar-fill" :style="{ width: stats.pct + '%' }"></div></div>
        <div class="progress-foot">
          <span v-if="stats.rate !== null">正确率 <b>{{ stats.rate }}%</b></span>
          <span class="progress-rule"></span>
        </div>
        <div v-if="recordCounts.wrong || recordCounts.fav" class="record-row">
          <span class="record-label">本板块记录</span>
          <button v-if="recordCounts.wrong" class="record-btn wrong" @click="startRecord('wrong')">
            错题重练 <b>{{ recordCounts.wrong }}</b>
          </button>
          <button v-if="recordCounts.fav" class="record-btn fav" @click="startRecord('fav')">
            收藏练习 <b>{{ recordCounts.fav }}</b>
          </button>
        </div>
      </section>

      <!-- 分类题包 -->
      <section v-for="group in groups" :key="group.id" class="pack-section" :class="'dom-' + group.id" v-reveal="{ delay: 100 }">
        <header class="section-head">
          <span class="section-index">{{ group.index }}</span>
          <div class="section-copy">
            <h2>{{ group.title }}</h2>
          </div>
          <span class="section-line"></span>
          <span class="section-count">{{ group.total }} 题<template v-if="group.done"> · 已答 {{ group.done }}</template></span>
        </header>

        <div class="pack-grid">
          <article v-for="p in group.packs" :key="p.id" class="pack-card">
            <div class="pack-top">
              <div class="pack-title">
                <h3>{{ packName(p) }}</h3>
                <span v-if="p.series" class="pack-series">第{{ p.series }}套</span>
              </div>
              <span class="pack-count">{{ p.count }}<small>题</small></span>
            </div>

            <span v-if="p.type === '听解'" class="pack-flag">🎧 扫码听音频</span>

            <div class="pack-progress">
              <div class="bar-track"><div class="bar-fill" :style="{ width: packStats[p.id].pct + '%' }"></div></div>
              <span class="pct">{{ packStats[p.id].pct }}%</span>
            </div>

            <div v-if="p.parts.length > 1" class="part-chips">
              <button v-for="part in p.parts" :key="part.no" class="part-chip" @click="start(p.id, part.no)">
                {{ part.name }} <b>{{ part.count }}</b>
              </button>
            </div>

            <div class="pack-actions">
              <button class="pack-start" @click="start(p.id)">
                <span>开始练习</span><span class="arrow">→</span>
              </button>
            </div>
          </article>
        </div>
      </section>
    </template>

    <div v-else class="placeholder-card">
      <div class="placeholder-kicker">SUPPLEMENT / {{ level }}</div>
      <h3>{{ level }} 暂无补充题库</h3>
      <p>N1 / N4 / N5 暂未收录。</p>
      <button class="btn btn-primary btn-sm" @click="router.push('/learn')">返回练习中心</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLevel } from '../store/levelStore'
import { useStore } from '../store/useStore'
import { supplementPacksOfLevel, supplementQuestionsOfLevel, supplementStatsOfLevel, supplementPackStats } from '../data/supplement'

const router = useRouter()
const store = useStore()
const { level } = useLevel()

const packs = computed(() => supplementPacksOfLevel(level.value))
const total = computed(() => supplementQuestionsOfLevel(level.value).length)
const stats = computed(() => supplementStatsOfLevel(level.value, store.state.answered))
const packStats = computed(() => {
  const map = {}
  for (const p of packs.value) map[p.id] = supplementPackStats(p.id, level.value, store.state.answered)
  return map
})

const DOMAINS = [
  { id: 'vocab', title: '語彙', types: ['語彙', '文字', '文字・語彙', '語彙・文字', '文字・語彙・文法'] },
  { id: 'grammar', title: '文法', types: ['文法', '語法'] },
  { id: 'reading', title: '読解', types: ['読解', '阅读'] },
  { id: 'listening', title: '听解', types: ['听解', '聴解'] },
]
const groups = computed(() => DOMAINS.map((d, i) => {
  const list = packs.value.filter(p => d.types.includes(p.type))
    .map(p => ({ ...p, series: 0 }))
  if (list.length > 1) list.forEach((p, idx) => { p.series = idx + 1 })
  return {
    ...d,
    index: String(i + 1).padStart(2, '0'),
    packs: list,
    total: list.reduce((s, p) => s + (packStats.value[p.id]?.total || p.count || 0), 0),
    done: list.reduce((s, p) => s + (packStats.value[p.id]?.done || 0), 0),
  }
}).filter(g => g.packs.length))

function packName(p) {
  return (p.shortTitle || p.title || '').replace(/\s*\d+\s*题$/, '').trim()
}

const recordCounts = computed(() => {
  const keys = new Set(supplementQuestionsOfLevel(level.value).map(q => q.key))
  return {
    wrong: (store.state.wrong || []).filter(k => keys.has(k)).length,
    fav: (store.state.favorites || []).filter(k => keys.has(k)).length,
  }
})

function startRecord(kind) {
  const query = kind === 'wrong' ? { wrong: '1' } : { fav: '1' }
  router.push({ name: 'quiz', params: { mode: 'supplement' }, query })
}

function start(packId, part = 0) {
  const query = { pack: packId }
  if (part) query.part = part
  router.push({ name: 'quiz', params: { mode: 'supplement' }, query })
}
</script>

<style scoped>
.sup-page { max-width: 1040px; }

/* ---------- hero ---------- */
.sup-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 26px 4px 22px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 18px;
}
.hero-kicker {
  font-family: 'Noto Sans JP', sans-serif;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.24em;
  color: var(--sakura-600);
  text-transform: uppercase;
}
.hero-title-row { display: flex; align-items: flex-end; gap: 18px; margin-top: 8px; }
.hero-title-row h1 {
  font-family: 'Noto Serif SC', serif;
  margin: 0;
  font-size: clamp(34px, 5vw, 52px);
  line-height: 1.02;
  letter-spacing: 0.02em;
  color: var(--text);
}
.hero-count { display: flex; align-items: baseline; gap: 4px; padding-bottom: 4px; }
.hero-count b {
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(28px, 3.8vw, 42px);
  line-height: 1;
  color: var(--sakura-600);
  font-variant-numeric: tabular-nums;
}
.hero-count span { font-size: 11px; color: var(--text-light); letter-spacing: 0.08em; }
.hero-stamp { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 0 10px 8px; }
.stamp-mark {
  width: 64px; height: 64px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--sakura-300);
  border-radius: 50%;
  color: var(--sakura-600);
  font-family: 'Noto Serif SC', serif;
  font-size: 20px; font-weight: 700;
  letter-spacing: 0.03em;
}
.stamp-note { font-size: 10px; letter-spacing: 0.16em; color: var(--text-faint); }

/* ---------- progress ---------- */
.progress-sheet {
  padding: 18px 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: linear-gradient(160deg, var(--card) 0%, var(--sakura-50) 100%);
  box-shadow: var(--shadow-card);
  margin-bottom: 26px;
}
.progress-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
.micro-label { display: block; font-size: 10.5px; letter-spacing: 0.18em; color: var(--text-faint); margin-bottom: 5px; }
.progress-head b { font-family: 'Noto Serif SC', serif; font-size: 23px; color: var(--text); font-variant-numeric: tabular-nums; }
.progress-head b em { font-style: normal; font-size: 12px; font-weight: 500; color: var(--text-faint); }
.progress-pct { font-family: 'Noto Serif SC', serif; font-size: 25px; color: var(--sakura-600); }
.bar-track { height: 7px; margin-top: 12px; border-radius: 999px; background: var(--sakura-100); overflow: hidden; }
.bar-fill { height: 100%; border-radius: 999px; background: var(--grad-sakura); transition: width 0.35s var(--ease-out-expo); }
.progress-foot { display: flex; align-items: center; gap: 10px; margin-top: 10px; font-size: 11.5px; color: var(--text-light); }
.progress-foot b { color: var(--green); }
.progress-rule { flex: 1; height: 1px; background: var(--line); }
.record-row { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--border); }
.record-label { font-size: 11px; color: var(--text-faint); letter-spacing: 0.08em; }
.record-btn {
  padding: 5px 11px; border-radius: 999px; border: 1px solid var(--border);
  background: var(--card); color: var(--text); font-size: 11.5px; transition: all 0.16s;
}
.record-btn b { margin-left: 4px; }
.record-btn.wrong b { color: var(--red); }
.record-btn.fav b { color: var(--sakura-600); }
.record-btn:hover { border-color: var(--sakura-300); background: var(--sakura-50); }

/* ---------- sections ---------- */
.pack-section + .pack-section { margin-top: 28px; }
.dom-vocab { --dom: var(--sakura-600); }
.dom-grammar { --dom: var(--iris); }
.dom-reading { --dom: var(--amber); }
.dom-listening { --dom: var(--green); }
.section-head { display: flex; align-items: flex-end; gap: 12px; margin-bottom: 14px; }
.section-index {
  font-family: 'Noto Sans JP', sans-serif;
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em;
  color: var(--dom, var(--sakura-600));
  padding-bottom: 3px;
}
.section-copy h2 { margin: 0; font-family: 'Noto Serif SC', serif; font-size: 20px; line-height: 1.2; color: var(--text); }
.section-line { flex: 1; height: 1px; margin-bottom: 7px; background: linear-gradient(90deg, var(--dom, var(--line)), var(--line) 55%); }
.section-count { flex-shrink: 0; font-size: 10.5px; color: var(--text-faint); padding-bottom: 4px; }

.pack-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; }
.pack-card {
  display: flex; flex-direction: column;
  padding: 18px 18px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--card-grad);
  box-shadow: var(--shadow-card);
  min-width: 0;
  transition: transform 0.22s var(--ease-out-expo), box-shadow 0.22s, border-color 0.22s;
}
@media (hover: hover) and (pointer: fine) {
  .pack-card:hover { transform: translateY(-2px); box-shadow: var(--card-float); border-color: var(--sakura-300); }
}
.pack-top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.pack-title { display: flex; align-items: center; gap: 8px; min-width: 0; }
.pack-series {
  flex-shrink: 0;
  padding: 1px 6px;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-faint);
  font-size: 9.5px;
  letter-spacing: 0.04em;
  line-height: 1.6;
}
.pack-count { flex-shrink: 0; font-family: 'Noto Serif SC', serif; font-size: 15px; color: var(--dom, var(--text-light)); font-variant-numeric: tabular-nums; }
.pack-count small { margin-left: 2px; font-family: 'Noto Sans JP', sans-serif; font-size: 10px; font-weight: 500; color: var(--text-faint); }
.pack-card h3 {
  font-family: 'Noto Serif SC', serif;
  font-size: 17px; line-height: 1.35; color: var(--text);
  letter-spacing: 0.01em;
}
.pack-flag { align-self: flex-start; margin-top: 7px; padding: 2px 8px; border-radius: 999px; background: var(--green-soft, #e9f7f0); color: #2f8f6b; font-size: 10px; }
.pack-progress { display: flex; align-items: center; gap: 8px; margin-top: 13px; }
.pack-progress .bar-track { flex: 1; margin-top: 0; height: 5px; }
.pack-progress .pct { font-size: 10.5px; color: var(--text-faint); }
.part-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
.part-chip {
  padding: 4px 9px; border-radius: 999px; border: 1px solid var(--border);
  background: transparent; color: var(--text-light); font-size: 10.5px;
  transition: all 0.16s;
}
.part-chip b { margin-left: 3px; color: var(--dom, var(--sakura-600)); }
.part-chip:hover { border-color: var(--sakura-300); background: var(--sakura-50); color: var(--text); }
.pack-actions { display: flex; align-items: center; gap: 10px; margin-top: auto; padding-top: 14px; }
.pack-start {
  flex: 1; display: flex; align-items: center; justify-content: space-between;
  padding: 9px 12px; border-radius: 10px;
  border: 1px solid var(--border-strong);
  background: var(--card); color: var(--text);
  font-size: 12px; font-weight: 700;
  transition: all 0.18s;
}
.pack-start .arrow { color: var(--sakura-600); font-size: 14px; }
.pack-start:hover { background: var(--sakura-50); border-color: var(--sakura-400); color: var(--sakura-700); }
.pack-start:active { transform: scale(0.985); }

/* ---------- empty ---------- */
.placeholder-card {
  padding: 46px 24px;
  text-align: center;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-lg);
  background: var(--card-grad);
}
.placeholder-kicker { font-size: 10.5px; letter-spacing: 0.2em; color: var(--sakura-600); margin-bottom: 8px; }
.placeholder-card h3 { margin: 0 0 8px; font-family: 'Noto Serif SC', serif; font-size: 22px; }
.placeholder-card p { margin: 0 0 16px; font-size: 12.5px; color: var(--text-light); }

/* ---------- mobile ---------- */
@media (max-width: 760px) {
  .sup-hero { align-items: flex-start; padding: 18px 2px 16px; gap: 12px; }
  .hero-title-row { align-items: baseline; gap: 10px; }
  .hero-title-row h1 { font-size: clamp(30px, 9vw, 38px); }
  .hero-count b { font-size: 27px; }
  .hero-stamp { display: none; }
  .progress-sheet { padding: 15px 15px; border-radius: var(--radius); }
  .progress-head b { font-size: 21px; }
  .pack-grid { grid-template-columns: 1fr; gap: 11px; }
  .pack-card { padding: 15px 15px 14px; }
  .pack-card h3 { font-size: 16px; }
  .section-head { gap: 9px; align-items: flex-start; }
  .section-copy h2 { font-size: 18px; }
  .section-line { display: none; }
  .section-count { margin-left: auto; padding-top: 4px; }
  .pack-start { padding: 10px 12px; }
}
</style>
