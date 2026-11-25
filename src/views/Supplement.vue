<template>
  <div class="container sup-page">
    <div class="list-header">
      <h2>📥 补充题库</h2>
      <button class="btn btn-ghost btn-sm" @click="router.push('/learn')">← 练习中心</button>
    </div>

    <template v-if="packs.length">
      <div class="sup-hero">
        <div>
          <div class="hero-title">补充题库 · {{ level }}</div>
          <div class="hero-sub">非红蓝宝书 · 独立统计 · 只收明确标注级别的练习题</div>
        </div>
        <div class="hero-num">
          <b>{{ total }}</b>
          <span>题</span>
        </div>
      </div>

      <div class="sup-note">
        本板块与「题库练习」完全分开：题目单独存放、答题记录单独统计，不会混进红蓝宝书题库。
        收录规则：题目必须明确标注 N3；未标注级别的练习题一律不采用。本板块不含真题。
      </div>

      <div class="sup-summary">
        <span>已答 <b>{{ stats.done }}</b> / {{ stats.total }} 题</span>
        <div class="bar-track"><div class="bar-fill" :style="{ width: stats.pct + '%' }"></div></div>
        <span class="pct">{{ stats.pct }}%</span>
        <span v-if="stats.rate !== null" class="rate">正确率 {{ stats.rate }}%</span>
      </div>

      <div v-if="recordCounts.wrong || recordCounts.fav" class="sup-record">
        <span class="rec-label">本板块记录</span>
        <button v-if="recordCounts.wrong" class="rec-btn wrong" @click="startRecord('wrong')">
          错题重练 <b>{{ recordCounts.wrong }}</b>
        </button>
        <button v-if="recordCounts.fav" class="rec-btn fav" @click="startRecord('fav')">
          收藏练习 <b>{{ recordCounts.fav }}</b>
        </button>
      </div>

      <div class="pack-list">
        <section v-for="p in packs" :key="p.id" class="pack-card">
          <div class="pack-head">
            <div class="pack-title">
              <span class="lv-tag">{{ p.level }}</span>
              <h3>{{ p.title }}</h3>
            </div>
            <div class="pack-count">{{ p.count }} 题</div>
          </div>

          <div class="pack-meta">
            <span class="provider">{{ p.provider }}</span>
            <a :href="p.url" target="_blank" rel="noopener" class="src-link" @click.stop>题目来源 ↗</a>
          </div>
          <div class="pack-note">{{ p.providerNote }}</div>

          <div class="pack-progress">
            <div class="bar-track"><div class="bar-fill" :style="{ width: packStats[p.id].pct + '%' }"></div></div>
            <span class="pct">{{ packStats[p.id].pct }}%</span>
          </div>

          <div class="part-chips">
            <button v-for="part in p.parts" :key="part.no" class="part-chip"
              @click="start(p.id, part.no)">
              {{ part.name }} <b>{{ part.count }}</b>
            </button>
          </div>

          <div class="pack-actions">
            <button class="btn btn-primary btn-sm" @click="start(p.id)">开始练习 →</button>
            <span class="pack-hint">可整包顺序做，也可按题型专练</span>
          </div>
        </section>
      </div>
    </template>

    <div v-else class="placeholder-card">
      <div class="emoji">📚</div>
      <h3>{{ level }} 暂无补充题库</h3>
      <p>目前补充题库优先收录 N3，N2 / N1 之后再补充。可以切换等级到 N3 查看。</p>
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
.sup-page { max-width: 980px; }

.sup-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
  margin-bottom: 14px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, rgba(204, 224, 255, 0.55), rgba(238, 245, 255, 0.25));
  border: 1px solid var(--border);
  box-shadow: var(--shadow-card);
}
.hero-title { font-size: 22px; font-weight: 800; color: var(--text); }
.hero-sub { margin-top: 6px; font-size: 12.5px; color: var(--text-light); }
.hero-num { text-align: right; line-height: 1; }
.hero-num b { font-size: 34px; font-weight: 800; color: var(--text); }
.hero-num span { margin-left: 4px; font-size: 12px; font-weight: 600; color: var(--text-light); }

.sup-note {
  padding: 12px 16px;
  margin-bottom: 14px;
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--sakura-300);
  background: var(--card-grad);
  font-size: 12.5px;
  line-height: 1.8;
  color: var(--text-light);
}

.sup-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 16px;
  margin-bottom: 18px;
  font-size: 12.5px;
  color: var(--text-light);
}
.sup-summary b { color: var(--text); }
.sup-summary .bar-track { flex: 1; min-width: 120px; height: 8px; border-radius: 999px; background: var(--sakura-50); overflow: hidden; }
.sup-summary .bar-fill { height: 100%; border-radius: 999px; background: var(--grad-sakura); }
.sup-summary .pct { font-weight: 700; color: var(--sakura-600); }
.sup-summary .rate { color: var(--green); font-weight: 700; }

.pack-list { display: flex; flex-direction: column; gap: 16px; }

.sup-record {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin: -6px 0 18px;
  font-size: 12.5px;
  color: var(--text-light);
}
.rec-label { font-weight: 600; }
.rec-btn {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
  font-size: 12px;
  cursor: pointer;
}
.rec-btn b { margin-left: 4px; }
.rec-btn.wrong { border-color: rgba(224, 122, 122, 0.4); }
.rec-btn.wrong b { color: var(--red); }
.rec-btn.fav { border-color: var(--sakura-300); }
.rec-btn.fav b { color: var(--sakura-600); }
.rec-btn:hover { background: var(--sakura-50); }

.pack-card {
  padding: 20px 22px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--card-grad);
  box-shadow: var(--shadow-card);
}
.pack-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.pack-title { display: flex; align-items: center; gap: 10px; }
.pack-title h3 { margin: 0; font-size: 17px; font-weight: 800; color: var(--text); }
.lv-tag {
  flex-shrink: 0;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--sakura-100);
  color: var(--sakura-600);
  font-size: 11.5px;
  font-weight: 800;
}
.pack-count { font-size: 12px; font-weight: 700; color: var(--text-light); white-space: nowrap; }
.pack-meta { display: flex; align-items: center; gap: 10px; margin-top: 10px; font-size: 12.5px; }
.provider { font-weight: 700; color: var(--text); }
.src-link { color: var(--sakura-600); text-decoration: none; border-bottom: 1px dashed var(--sakura-300); }
.pack-note { margin-top: 6px; font-size: 12px; line-height: 1.7; color: var(--text-light); }

.pack-progress { display: flex; align-items: center; gap: 10px; margin-top: 14px; }
.pack-progress .bar-track { flex: 1; height: 8px; border-radius: 999px; background: var(--sakura-50); overflow: hidden; }
.pack-progress .bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #6a80dd, #9db3ff); }
.pack-progress .pct { font-size: 11.5px; font-weight: 700; color: var(--text-light); }

.part-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.part-chip {
  padding: 6px 11px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.part-chip b { margin-left: 4px; color: var(--sakura-600); }
.part-chip:hover { border-color: var(--sakura-300); background: var(--sakura-50); }

.pack-actions { display: flex; align-items: center; gap: 12px; margin-top: 16px; }
.pack-hint { font-size: 11.5px; color: var(--text-faint); }

@media (max-width: 640px) {
  .sup-hero { padding: 18px; }
  .hero-title { font-size: 19px; }
  .hero-num b { font-size: 28px; }
  .pack-card { padding: 16px; }
  .pack-title h3 { font-size: 15.5px; }
}
</style>
