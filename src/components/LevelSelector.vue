<template>
  <div class="level-card">
    <div class="level-head">
      <span class="level-icon">🎓</span>
      <div class="level-text">
        <div class="level-title">学习等级</div>
        <div class="level-sub">
          {{ showHint ? `当前 ${currentTitle} · 全局同步到所有学习模块` : '切换后全局学习模块同步生效' }}
        </div>
      </div>
      <span class="level-current">{{ level }}</span>
    </div>
    <div class="level-options">
      <button
        v-for="lv in APP_LEVELS"
        :key="lv.id"
        class="level-opt"
        :class="{ active: level === lv.id }"
        @click="setLevel(lv.id)"
      >
        <span class="opt-name">{{ lv.name }}</span>
        <span class="opt-desc">{{ lv.desc }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useLevel } from '../store/levelStore'
import { levelTitle } from '../data/questions'

defineProps({
  // 是否显示“当前：XX 级”副标题
  showHint: { type: Boolean, default: false },
})

const { level, setLevel, APP_LEVELS } = useLevel()
const currentTitle = computed(() => levelTitle(level.value))
</script>

<style scoped>
.level-card {
  background: var(--card-grad);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px 18px 18px;
  box-shadow: var(--shadow-card);
}
.level-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.level-icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: linear-gradient(145deg, var(--sakura-400), var(--sakura-600));
  box-shadow: 0 4px 12px rgba(244, 92, 142, 0.28);
}
.level-text { flex: 1; min-width: 0; }
.level-title { font-size: 14px; font-weight: 800; color: var(--text); }
.level-sub { font-size: 11.5px; color: var(--text-light); margin-top: 2px; }
.level-current {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 800;
  color: var(--sakura-600);
  background: var(--sakura-100);
  border-radius: 10px;
  padding: 3px 12px;
}

.level-options {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.level-opt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 4px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--card);
  transition: all 0.2s;
}
.level-opt:hover:not(.active) {
  border-color: var(--sakura-400);
  transform: translateY(-2px);
}
.level-opt.active {
  border-color: transparent;
  background: linear-gradient(145deg, var(--sakura-400), var(--sakura-600));
  box-shadow: 0 6px 16px rgba(244, 92, 142, 0.32);
}
.opt-name { font-size: 14px; font-weight: 800; color: var(--sakura-600); }
.level-opt.active .opt-name { color: #fff; }
.opt-desc { font-size: 10px; color: var(--text-faint); }
.level-opt.active .opt-desc { color: rgba(255, 255, 255, 0.86); }

@media (max-width: 480px) {
  .level-card { padding: 14px 14px 16px; }
  .level-options { gap: 5px; }
  .opt-desc { display: none; }
  .level-opt { padding: 9px 2px; }
}
</style>
