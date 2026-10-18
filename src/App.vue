<template>
  <div class="app">
    <!-- 背景：极光色团 + 樱花飘落 -->
    <div class="sakura-bg" aria-hidden="true">
      <span v-for="p in petals" :key="p.id" class="petal"
        :style="{ left: p.left + '%', animationDuration: p.dur + 's', animationDelay: p.delay + 's', width: p.size + 'px', height: p.size + 'px' }"></span>
    </div>

    <!-- 阅读/滚动进度条 -->
    <div class="scroll-progress" :class="{ on: scrolled }" :style="{ transform: `scaleX(${progress})` }" aria-hidden="true"></div>

    <!-- 顶部导航 -->
    <nav class="nav" :class="{ 'is-scrolled': scrolled }">
      <div class="nav-inner">
        <router-link to="/" class="nav-logo">
          <span class="icon">🌸</span>
          <span>樱花日语</span>
        </router-link>
        <div class="nav-right">
          <div class="nav-links" ref="linksRef">
            <span class="nav-ink" :class="{ ready: ink.ready }"
              :style="{ transform: `translateX(${ink.x}px)`, width: ink.w + 'px' }" aria-hidden="true"></span>
            <router-link to="/" class="nav-link" :class="{ active: isActive('/') }">首页</router-link>
            <router-link to="/learn" class="nav-link" :class="{ active: isActive('/learn') }">练习</router-link>
            <router-link to="/words" class="nav-link" :class="{ active: isActive('/words') }">背词</router-link>
            <router-link to="/study" class="nav-link" :class="{ active: isActive('/study') }">文法</router-link>
            <router-link to="/my" class="nav-link" :class="{ active: isActive('/my') }">
              我的<span v-if="wrongCount" class="badge">{{ wrongCount }}</span>
            </router-link>
          </div>
          <button class="furigana-toggle" :class="{ active: furigana.isEnabled.value, locked: furigana.isLocked.value }" @click="furigana.toggle()" :title="furigana.isLocked.value ? '提交答案后可开启振假名' : (furigana.isEnabled.value ? '关闭振假名 (L)' : '开启振假名（汉字上方标注平假名）(L)')">
            <span class="furi-icon">あ</span>
            <span class="furi-text">{{ furigana.isEnabled.value ? '振假名开' : '振假名关' }}</span>
          </button>
          <button class="icon-btn" @click="toggleTheme" :title="theme.isDark() ? '切换到浅色模式' : '切换到深色模式'">
            <span class="icon-emoji">{{ theme.isDark() ? '☀️' : '🌙' }}</span>
          </button>
          <router-link to="/settings" class="icon-btn" title="设置" :class="{ active: isActive('/settings') }">⚙️</router-link>
        </div>
      </div>
    </nav>

    <!-- 页面切换（错误边界在过渡外层：Transition 必须直接包裹单根路由组件）
         注意：这里不能用 mode="out-in"。个别页面（如听解单元页）在路由切换瞬间会重算
         依赖路由的 v-if，导致离场元素被提前移除、transitionend 不触发，out-in 会永久卡住
         （表现为切换后整站空白）。交叉淡入 + 离场绝对定位，既不会跳动也不会卡死。 -->
    <ErrorBoundary>
      <router-view v-slot="{ Component }">
        <transition name="page-fade">
          <component :is="Component" :key="$route.path" />
        </transition>
      </router-view>
    </ErrorBoundary>

    <!-- 移动端底部 Dock -->
    <nav class="tabbar">
      <div class="tabbar-inner">
        <router-link to="/" class="tab-item" :class="{ active: isActive('/') }">
          <span class="tab-emoji">🏠</span><span>首页</span>
        </router-link>
        <router-link to="/learn" class="tab-item" :class="{ active: isActive('/learn') }">
          <span class="tab-emoji">📝</span><span>练习</span>
        </router-link>
        <router-link to="/words" class="tab-item" :class="{ active: isActive('/words') }">
          <span class="tab-emoji">🌸</span><span>背词</span>
        </router-link>
        <router-link to="/study" class="tab-item" :class="{ active: isActive('/study') }">
          <span class="tab-emoji">📘</span><span>文法</span>
        </router-link>
        <router-link to="/my" class="tab-item" :class="{ active: isActive('/my') }">
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
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from './store/useStore'
import { useLevel } from './store/levelStore'
import { useFurigana } from './composables/useFurigana'
import { useTheme } from './store/themeStore'
import { prefersReducedMotion } from './composables/useMotion'
import AppUpdateToast from './components/AppUpdateToast.vue'
import ErrorBoundary from './components/ErrorBoundary.vue'

const route = useRoute()
const store = useStore()
const { level } = useLevel()
const furigana = useFurigana()
const theme = useTheme()
const wrongCount = computed(() => store.wrongCountOf(level.value))

// 当前路由是否命中某个一级入口（/my 同时点亮 设置、管理、错题等子页）
function isActive(base) {
  const p = route.path
  if (base === '/') return p === '/'
  if (base === '/my') return ['/my', '/stats', '/wrong', '/favorites', '/settings', '/admin'].some(x => p.startsWith(x))
  return p.startsWith(base)
}

// ===== 导航滑动墨迹 =====
const linksRef = ref(null)
const ink = reactive({ x: 0, w: 0, ready: false })

function updateInk() {
  const wrap = linksRef.value
  if (!wrap) return
  const el = wrap.querySelector('.nav-link.active')
  if (!el || !el.offsetWidth) {
    ink.ready = false
    return
  }
  ink.x = el.offsetLeft
  ink.w = el.offsetWidth
  // 首帧先定位再显示，避免从 0 滑入的“假动画”
  if (!ink.ready) requestAnimationFrame(() => { ink.ready = true })
}

// ===== 滚动状态 + 进度条 =====
const scrolled = ref(false)
const progress = ref(0)
let ticking = false

function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    const y = window.scrollY || 0
    const max = document.documentElement.scrollHeight - window.innerHeight
    scrolled.value = y > 6
    progress.value = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0
    ticking = false
  })
}

// ===== 主题切换：圆形揭示（View Transition） =====
function toggleTheme(e) {
  const next = theme.isDark() ? 'light' : 'dark'
  const reduce = prefersReducedMotion()
  if (!document.startViewTransition || reduce) {
    theme.setMode(next)
    return
  }
  const x = e && typeof e.clientX === 'number' ? e.clientX : window.innerWidth - 60
  const y = e && typeof e.clientY === 'number' ? e.clientY : 40
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  const transition = document.startViewTransition(() => theme.setMode(next))
  transition.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 560, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' }
      )
    })
    .catch(() => {})
}

// ===== 花瓣 =====
const petals = ref([])

let resizeTimer = 0
function onResize() {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(updateInk, 120)
}

onMounted(() => {
  const count = window.innerWidth < 760 ? 9 : 16
  const arr = []
  for (let i = 0; i < count; i++) {
    arr.push({
      id: i,
      left: Math.random() * 100,
      dur: 9 + Math.random() * 11,
      delay: Math.random() * 12,
      size: 9 + Math.random() * 10,
    })
  }
  petals.value = arr
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)
  onScroll()
  nextTick(updateInk)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onResize)
})

watch(() => route.path, () => nextTick(updateInk))
// 等字体就绪后再量一次，避免文字宽度变化导致墨迹偏移
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => nextTick(updateInk))
}
</script>

<style scoped>
.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background: transparent;
  color: var(--text-light);
  transition: background var(--dur-2) var(--ease-soft), transform var(--dur-3) var(--ease-spring);
  flex-shrink: 0;
}
.icon-btn:hover { background: var(--sakura-100); transform: translateY(-2px); }
.icon-btn:active { transform: scale(0.92); }
.icon-btn.active { background: var(--sakura-100); }
.icon-btn .icon-emoji {
  display: inline-block;
  transition: transform var(--dur-4) var(--ease-spring);
}
.icon-btn:hover .icon-emoji { transform: rotate(-18deg) scale(1.12); }
</style>
