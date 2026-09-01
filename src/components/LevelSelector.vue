<template>
  <div class="level-switch" :class="{ 'with-hint': showHint }">
    <button
      v-for="lv in APP_LEVELS"
      :key="lv.id"
      class="level-btn"
      :class="{ active: level === lv.id }"
      @click="setLevel(lv.id)"
    >{{ lv.name }}</button>
    <span v-if="showHint" class="level-hint">当前：{{ currentTitle }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useLevel } from '../store/levelStore'
import { levelTitle } from '../data/questions'

const props = defineProps({
  // 是否在右侧显示“当前：XX 级”提示
  showHint: { type: Boolean, default: false },
})

const { level, setLevel, APP_LEVELS } = useLevel()
const currentTitle = computed(() => levelTitle(level.value))
</script>

<style scoped>
.level-switch {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  border-radius: 26px;
  padding: 6px;
  box-shadow: 0 2px 10px rgba(233, 120, 150, 0.12);
  border: 2px solid var(--sakura-50, #ffe3ec);
  width: fit-content;
  max-width: 100%;
  flex-wrap: wrap;
}
.level-btn {
  border: none;
  background: transparent;
  color: var(--ink-light);
  font-size: 14px;
  font-weight: 700;
  padding: 8px 22px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.level-btn.active {
  background: linear-gradient(145deg, #ff9dbd, #ff7da0);
  color: #fff;
  box-shadow: 0 4px 12px rgba(233, 120, 150, 0.3);
}
.level-btn:hover:not(.active) {
  background: var(--sakura-50, #ffe3ec);
  color: var(--sakura-700, #c2556f);
}
.level-hint {
  font-size: 13px;
  color: var(--ink-light);
  padding: 0 10px;
  white-space: nowrap;
}
</style>
