<template>
  <div class="level-card" :class="{ 'with-hint': showHint }">
    <div class="level-card-head">
      <span class="level-card-icon">🎓</span>
      <div class="level-card-text">
        <div class="level-card-title">学习等级</div>
        <div class="level-card-sub" v-if="showHint">当前 {{ currentTitle }} · 全局同步到所有学习模块</div>
        <div class="level-card-sub" v-else>切换后全局学习模块同步生效</div>
      </div>
      <span class="level-card-current">{{ level }}</span>
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

const props = defineProps({
  // 是否显示“当前：XX 级”副标题
  showHint: { type: Boolean, default: false },
})

const { level, setLevel, APP_LEVELS } = useLevel()
const currentTitle = computed(() => levelTitle(level.value))
</script>

<style scoped>
.level-card {
  background: linear-gradient(150deg, var(--sakura-100), var(--card) 60%);
  border-radius: 18px;
  padding: 16px 18px 14px;
  box-shadow: var(--card-float);
}
.level-card-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.level-card-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(145deg, var(--sakura-400), var(--sakura-600));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(244, 92, 142, 0.3);
}
.level-card-text { flex: 1; min-width: 0; }
.level-card-title { font-size: 15px; font-weight: 800; color: var(--text); }
.level-card-sub { font-size: 11.5px; color: var(--text-light); margin-top: 2px; }
.level-card-current {
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(145deg, var(--sakura-400), var(--sakura-600));
  border-radius: 10px;
  padding: 4px 12px;
  flex-shrink: 0;
}
.level-options {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.level-opt {
  border: 1.5px solid var(--border-strong);
  background: var(--card);
  border-radius: 12px;
  padding: 10px 4px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.level-opt:hover:not(.active) { border-color: var(--sakura-400); transform: translateY(-2px); }
.level-opt.active {
  background: linear-gradient(145deg, var(--sakura-400), var(--sakura-600));
  border-color: transparent;
  box-shadow: 0 6px 16px rgba(244, 92, 142, 0.32);
}
.opt-name { font-size: 14px; font-weight: 800; color: var(--sakura-600); }
.level-opt.active .opt-name { color: #fff; }
.opt-desc { font-size: 10px; color: var(--text-faint); }
.level-opt.active .opt-desc { color: rgba(255, 255, 255, 0.85); }

@media (max-width: 480px) {
  .level-options { gap: 5px; }
  .opt-desc { display: none; }
  .level-opt { padding: 9px 2px; }
}
</style>
