<template>
  <div class="app">
    <!-- 樱花飘落背景 -->
    <div class="sakura-bg">
      <span v-for="p in petals" :key="p.id" class="petal"
        :style="{ left: p.left + '%', animationDuration: p.dur + 's', animationDelay: p.delay + 's', width: p.size + 'px', height: p.size + 'px' }"></span>
    </div>

    <!-- 顶部导航 -->
    <nav class="nav">
      <div class="nav-inner">
        <router-link to="/" class="nav-logo">
          <span class="icon">🌸</span>
          <span>樱花日语</span>
        </router-link>
        <div class="nav-right">
          <div class="nav-links">
            <router-link to="/" class="nav-link" :class="{ active: $route.path === '/' }">首页</router-link>
            <router-link to="/stats" class="nav-link" :class="{ active: $route.path === '/stats' }">统计</router-link>
            <router-link to="/wrong" class="nav-link" :class="{ active: $route.path === '/wrong' }">
              错题本<span v-if="store.state.wrong.length" class="badge">{{ store.state.wrong.length }}</span>
            </router-link>
            <router-link to="/favorites" class="nav-link" :class="{ active: $route.path === '/favorites' }">收藏</router-link>
          </div>
          <button class="furigana-toggle" :class="{ active: furigana.isEnabled.value, locked: furigana.isLocked.value }" @click="furigana.toggle()" :title="furigana.isLocked.value ? '提交答案后可开启振假名' : (furigana.isEnabled.value ? '关闭振假名 (L)' : '开启振假名（汉字上方标注平假名）(L)')">
            <span class="furi-icon">あ</span>
            <span class="furi-text">{{ furigana.isEnabled.value ? '振假名开' : '振假名关' }}</span>
          </button>
        </div>
      </div>
    </nav>

    <router-view />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useStore } from './store/useStore'
import { useFurigana } from './composables/useFurigana'

const store = useStore()
const furigana = useFurigana()

// 生成樱花花瓣
const petals = ref([])
onMounted(() => {
  const arr = []
  for (let i = 0; i < 18; i++) {
    arr.push({
      id: i,
      left: Math.random() * 100,
      dur: 8 + Math.random() * 10,
      delay: Math.random() * 12,
      size: 10 + Math.random() * 10,
    })
  }
  petals.value = arr
})
</script>
