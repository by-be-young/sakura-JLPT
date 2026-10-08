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
            <router-link to="/learn" class="nav-link" :class="{ active: $route.path.startsWith('/learn') }">练习</router-link>
            <router-link to="/words" class="nav-link" :class="{ active: $route.path.startsWith('/words') }">背词</router-link>
            <router-link to="/study" class="nav-link" :class="{ active: $route.path.startsWith('/study') }">文法</router-link>
            <router-link to="/my" class="nav-link" :class="{ active: ['/my', '/stats', '/wrong'].includes($route.path) }">
              我的<span v-if="wrongCount" class="badge">{{ wrongCount }}</span>
            </router-link>
          </div>
          <button class="furigana-toggle" :class="{ active: furigana.isEnabled.value, locked: furigana.isLocked.value }" @click="furigana.toggle()" :title="furigana.isLocked.value ? '提交答案后可开启振假名' : (furigana.isEnabled.value ? '关闭振假名 (L)' : '开启振假名（汉字上方标注平假名）(L)')">
            <span class="furi-icon">あ</span>
            <span class="furi-text">{{ furigana.isEnabled.value ? '振假名开' : '振假名关' }}</span>
          </button>
          <button class="icon-btn" @click="toggleTheme" :title="theme.isDark() ? '切换到浅色模式' : '切换到深色模式'">
            {{ theme.isDark() ? '☀️' : '🌙' }}
          </button>
          <router-link to="/settings" class="icon-btn" title="设置" :class="{ active: $route.path === '/settings' }">⚙️</router-link>
        </div>
      </div>
    </nav>

    <!-- 页面切换 -->
    <router-view v-slot="{ Component }">
      <transition name="page-fade" mode="out-in">
        <component :is="Component" :key="$route.path" />
      </transition>
    </router-view>

    <!-- 移动端底部 Tab -->
    <nav class="tabbar">
      <div class="tabbar-inner">
        <router-link to="/" class="tab-item" :class="{ active: $route.path === '/' }">
          <span class="tab-emoji">🏠</span><span>首页</span>
        </router-link>
        <router-link to="/learn" class="tab-item" :class="{ active: $route.path.startsWith('/learn') }">
          <span class="tab-emoji">📝</span><span>练习</span>
        </router-link>
        <router-link to="/words" class="tab-item" :class="{ active: $route.path.startsWith('/words') }">
          <span class="tab-emoji">🌸</span><span>背词</span>
        </router-link>
        <router-link to="/study" class="tab-item" :class="{ active: $route.path.startsWith('/study') }">
          <span class="tab-emoji">📘</span><span>文法</span>
        </router-link>
        <router-link to="/my" class="tab-item" :class="{ active: ['/my', '/stats', '/wrong', '/settings', '/admin'].some(p => $route.path.startsWith(p)) }">
          <span class="tab-emoji">👤</span><span>我的</span>
          <span v-if="wrongCount" class="tab-badge">{{ wrongCount }}</span>
        </router-link>
      </div>
    </nav>

    <!-- 更新提示 -->
    <AppUpdateToast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from './store/useStore'
import { useLevel } from './store/levelStore'
import { useFurigana } from './composables/useFurigana'
import { useTheme } from './store/themeStore'
import AppUpdateToast from './components/AppUpdateToast.vue'

const store = useStore()
const { level } = useLevel()
const furigana = useFurigana()
const theme = useTheme()
const wrongCount = computed(() => store.wrongCountOf(level.value))

function toggleTheme() {
  theme.setMode(theme.isDark() ? 'light' : 'dark')
}

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

<style scoped>
.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background: transparent;
  color: var(--text-light);
  transition: all 0.2s;
  flex-shrink: 0;
}
.icon-btn:hover { background: var(--sakura-100); transform: translateY(-1px); }
.icon-btn.active { background: var(--sakura-100); }
</style>
