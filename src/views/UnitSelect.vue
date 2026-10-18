<template>
  <div class="container unit-page">
    <!-- 页头 -->
    <div class="page-head" v-reveal>
      <div class="page-head-main">
        <div class="icon-tile" aria-hidden="true">📚</div>
        <div class="page-head-text">
          <h1 class="page-title">{{ level }} 单元练习</h1>
          <p class="page-sub">共 {{ unitList.length }} 个单元 · {{ levelQuestionsList.length }} 题</p>
        </div>
      </div>
      <div class="page-actions">
        <button class="back-btn" title="返回学习" aria-label="返回学习" @click="$router.push({ path: '/learn', query: { mode: 'bank' } })">← 返回</button>
      </div>
    </div>

    <!-- 单元卡片 -->
    <div v-if="unitList.length" class="unit-grid stagger">
      <article v-for="u in unitList" :key="u.id" class="unit-card" role="button" tabindex="0"
        :aria-label="`第${u.id}单元，共${u.count}题，完成度${u.progress}%`"
        @click="startUnit(u.id)"
        @keydown.enter.prevent="startUnit(u.id)"
        @keydown.space.prevent="startUnit(u.id)">
        <div class="unit-top">
          <span class="unit-no" aria-hidden="true">{{ String(u.id).padStart(2, '0') }}</span>
          <span class="unit-heading">
            <span class="unit-name">第{{ u.id }}单元</span>
            <span class="unit-range">No.{{ u.start }} – No.{{ u.end }}</span>
          </span>
          <span class="unit-count">{{ u.count }} 题</span>
        </div>

        <div class="unit-progress">
          <div class="unit-progress-head">
            <span>完成度</span>
            <b>{{ u.progress }}%</b>
          </div>
          <div class="unit-track">
            <div class="unit-fill" :class="{ done: u.progress >= 100 }" :style="{ width: u.progress + '%' }"></div>
          </div>
        </div>

        <div class="unit-stats">
          <div class="unit-stat">
            <b>{{ u.answered }}</b>
            <span>已答</span>
          </div>
          <div class="unit-stat">
            <b :class="u.answered ? (u.accuracy >= 60 ? 'good' : 'bad') : ''">
              {{ u.answered ? u.accuracy + '%' : '--' }}
            </b>
            <span>正确率</span>
          </div>
          <div class="unit-stat">
            <b class="bad">{{ u.wrong }}</b>
            <span>错题</span>
          </div>
        </div>

        <div class="unit-foot">
          <span class="unit-cta">
            {{ u.progress >= 100 ? '再练一次' : u.progress > 0 ? '继续练习' : '开始练习' }}
            <span class="cta-arrow" aria-hidden="true">→</span>
          </span>
        </div>
      </article>
    </div>

    <!-- 空状态 -->
    <div v-else class="unit-empty surface">
      <div class="unit-empty-emoji" aria-hidden="true">📚</div>
      <p class="unit-empty-title">当前等级还没有单元内容</p>
      <p class="unit-empty-desc">可以先按顺序练习或随机抽题，单元题库正在补充中。</p>
      <div class="unit-empty-actions">
        <button class="btn btn-primary btn-sm" @click="router.push({ name: 'quiz', params: { mode: 'sequential' } })">顺序练习</button>
        <button class="btn btn-secondary btn-sm" @click="router.push({ name: 'quiz', params: { mode: 'random' } })">随机抽题</button>
      </div>
    </div>

    <!-- 未划分单元的题目提示 -->
    <div v-if="unassignedCount > 0" class="unassigned-note">
      <span class="unassigned-icon" aria-hidden="true">↗</span>
      <span>另有 {{ unassignedCount }} 题未划分单元，可通过「顺序答题」或「随机抽题」练习。</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { levelQuestions } from '../data/questions'
import { useStore } from '../store/useStore'
import { useLevel } from '../store/levelStore'

const router = useRouter()
const store = useStore()
const { level } = useLevel()

const levelQuestionsList = computed(() => levelQuestions(level.value))

const unitList = computed(() => {
  const unitIds = [...new Set(levelQuestionsList.value.filter(q => q.unit !== undefined).map(q => q.unit))]
    .sort((a, b) => a - b)
  return unitIds.map(id => {
    const qs = levelQuestionsList.value.filter(q => q.unit === id).sort((a, b) => a.id - b.id)
    const answered = qs.filter(q => store.getAnswer(q.key)).length
    const correct = qs.filter(q => {
      const a = store.getAnswer(q.key)
      return a && a.correct
    }).length
    const wrong = qs.filter(q => store.state.wrong.includes(q.key)).length
    return {
      id,
      count: qs.length,
      start: qs[0].id,
      end: qs[qs.length - 1].id,
      answered,
      wrong,
      progress: qs.length ? Math.round(answered / qs.length * 100) : 0,
      accuracy: answered ? Math.round(correct / answered * 100) : 0,
    }
  })
})

const unassignedCount = computed(() => levelQuestionsList.value.filter(q => q.unit === undefined).length)

function startUnit(id) {
  router.push({ name: 'quiz', params: { mode: 'unit' }, query: { unit: id } })
}
</script>

<style scoped>
.unit-page .back-btn { min-height: 40px; }

.unit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}

/* ---------- 单元卡片 ---------- */
.unit-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  padding: 18px;
  overflow: hidden;
  text-align: left;
  color: var(--text);
  background: var(--card-grad);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition:
    transform var(--dur-3) var(--ease-out-expo),
    box-shadow var(--dur-3) var(--ease-out-expo),
    border-color var(--dur-3) var(--ease-out-expo);
}
.unit-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--grad-sakura);
  opacity: 0;
  transition: opacity var(--dur-3) var(--ease-soft);
}
.unit-card:active { transform: scale(0.992); }
.unit-card:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring), var(--shadow-card);
}
.unit-card:focus-visible .cta-arrow { transform: translateX(4px); }
@media (hover: hover) and (pointer: fine) {
  .unit-card:hover {
    transform: translateY(-4px);
    border-color: var(--sakura-200);
    box-shadow: var(--card-float);
  }
  .unit-card:hover::before { opacity: 1; }
  .unit-card:hover .cta-arrow { transform: translateX(4px); }
}

.unit-top {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.unit-no {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 13px;
  background: var(--sakura-50);
  border: 1px solid var(--border);
  color: var(--sakura-600);
  font-size: 19px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
}
.unit-heading {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
}
.unit-name {
  font-size: 16px;
  font-weight: 800;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.unit-range {
  font-size: 11.5px;
  color: var(--text-faint);
  font-variant-numeric: tabular-nums;
}
.unit-count {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  background: var(--sakura-50);
  border: 1px solid var(--border);
  color: var(--text-light);
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
}

/* 进度 */
.unit-progress { display: flex; flex-direction: column; gap: 6px; }
.unit-progress-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-faint);
}
.unit-progress-head b {
  color: var(--sakura-600);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.unit-track {
  height: 6px;
  border-radius: var(--radius-pill);
  background: var(--sakura-100);
  overflow: hidden;
}
.unit-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--grad-sakura);
  transform-origin: left center;
  animation: unit-bar 700ms var(--ease-out-expo) both;
  transition: background var(--dur-3) var(--ease-soft);
}
.unit-fill.done { background: var(--grad-mint); }
@keyframes unit-bar {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

/* 统计 */
.unit-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 10px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}
.unit-stat {
  position: relative;
  text-align: center;
}
.unit-stat + .unit-stat::before {
  content: '';
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 0;
  width: 1px;
  background: var(--line);
}
.unit-stat b {
  display: block;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.25;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}
.unit-stat b.good { color: var(--green); }
.unit-stat b.bad { color: var(--red); }
.unit-stat span {
  font-size: 10.5px;
  color: var(--text-faint);
}

/* 底部入口 */
.unit-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.unit-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--sakura-600);
}
.cta-arrow {
  display: inline-block;
  transition: transform var(--dur-2) var(--ease-out-expo);
}

/* ---------- 空状态 ---------- */
.unit-empty {
  padding: 40px 24px;
  text-align: center;
}
.unit-empty-emoji {
  display: inline-block;
  font-size: 44px;
  margin-bottom: 10px;
  animation: float-soft 4.2s ease-in-out infinite;
}
.unit-empty-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text);
}
.unit-empty-desc {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-light);
}
.unit-empty-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}
.unit-empty-actions .btn { min-height: 42px; }

/* ---------- 未划分单元提示 ---------- */
.unassigned-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 18px;
  padding: 12px 16px;
  border-radius: var(--radius);
  background: var(--amber-soft);
  color: var(--text);
  font-size: 12.5px;
  line-height: 1.6;
}
.unassigned-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-top: 1px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--card);
  color: var(--amber);
  font-size: 12px;
  font-weight: 800;
}

@media (max-width: 640px) {
  .unit-grid { gap: 12px; }
  .unit-card { padding: 16px; }
}
@media (max-width: 414px) {
  .unit-top { gap: 10px; }
  .unit-no {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    font-size: 17px;
  }
  .unit-name { font-size: 15px; }
  .unit-count { padding: 3px 8px; font-size: 11px; }
}
</style>
