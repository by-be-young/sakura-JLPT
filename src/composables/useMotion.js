// 樱花日语 - 动效原语
// 统一提供：滚动入场指令 v-reveal / 数字滚动 useCountUp / 指针微倾斜 useTilt
// 所有动效都尊重系统「减少动态效果」设置。
import { ref, onMounted, onUnmounted, watch } from 'vue'

export function prefersReducedMotion() {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function normalizeReveal(value) {
  if (value == null || value === true) return { dir: '', delay: 0 }
  if (typeof value === 'string') return { dir: value === 'up' ? '' : value, delay: 0 }
  if (typeof value === 'number') return { dir: '', delay: value }
  if (typeof value === 'object') {
    const dir = value.dir === 'up' || !value.dir ? '' : value.dir
    return { dir, delay: Number(value.delay) || 0 }
  }
  return { dir: '', delay: 0 }
}

/**
 * 标记入场完成。
 * 注意：必须用**属性**而不是 class —— Vue 重渲染时会把 class 整体重写，
 * 指令加上的 .is-in 会被抹掉，元素又回到 opacity:0（历史 bug：读解文章滚动后消失）。
 */
function markRevealed(el) {
  el.setAttribute('data-reveal-in', '')
  el.classList.add('is-in') // 保留给可能出现的外部样式/测试用
}

/**
 * v-reveal —— 元素进入视口时上浮淡入（只触发一次）
 *   <div v-reveal />                    默认上浮
 *   <div v-reveal="'left'" />           从左进入
 *   <div v-reveal="'zoom'" />           缩放进入
 *   <div v-reveal="{ delay: 120 }" />   延迟 120ms
 */
export const vReveal = {
  mounted(el, binding) {
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      markRevealed(el)
      return
    }
    const { dir, delay } = normalizeReveal(binding.value)
    el.setAttribute('data-reveal', dir)
    if (delay) el.style.setProperty('--d', delay + 'ms')

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          markRevealed(el)
          io.disconnect()
          break
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.06 }
    )
    io.observe(el)
    el.__revealIO = io
  },
  unmounted(el) {
    if (el.__revealIO) {
      el.__revealIO.disconnect()
      delete el.__revealIO
    }
  }
}

const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))

/**
 * useCountUp —— 数字从 0 滚动到目标值
 *   const { display } = useCountUp(computed(() => 73))
 *   <span>{{ display }}</span>
 * 目标变化时会从当前值平滑过渡到新值。
 */
export function useCountUp(source, options = {}) {
  const duration = options.duration ?? 900
  const delay = options.delay ?? 120
  const decimals = options.decimals ?? 0
  const display = ref(0)
  let raf = 0
  let timer = 0

  const round = (v) => {
    const p = Math.pow(10, decimals)
    return Math.round(v * p) / p
  }

  function run(to) {
    cancelAnimationFrame(raf)
    clearTimeout(timer)
    const from = Number(display.value) || 0
    const target = Number(to) || 0
    if (prefersReducedMotion()) {
      display.value = round(target)
      return
    }
    const startAt = performance.now()
    const step = (now) => {
      const t = Math.min(1, (now - startAt) / duration)
      display.value = round(from + (target - from) * easeOutExpo(t))
      if (t < 1) raf = requestAnimationFrame(step)
      else display.value = round(target)
    }
    timer = setTimeout(() => { raf = requestAnimationFrame(step) }, delay)
  }

  watch(source, (v) => run(v), { immediate: false })

  onMounted(() => {
    const v = typeof source === 'function' ? source() : source.value
    run(v)
  })

  onUnmounted(() => {
    cancelAnimationFrame(raf)
    clearTimeout(timer)
  })

  return { display }
}

/**
 * useTilt —— 指针在卡片上移动时写入 --rx / --ry，配合 .tilt 使用
 *   const { onPointerMove, onPointerLeave } = useTilt(el)
 * 触屏 / 减少动效时自动失效。
 */
export function useTilt(elRef, strength = 6) {
  const enabled = typeof window !== 'undefined' &&
    !prefersReducedMotion() &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches

  function onPointerMove(e) {
    const el = elRef.value
    if (!el || !enabled) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    el.style.setProperty('--ry', (px * strength).toFixed(2) + 'deg')
    el.style.setProperty('--rx', (-py * strength).toFixed(2) + 'deg')
  }

  function onPointerLeave() {
    const el = elRef.value
    if (!el) return
    el.style.setProperty('--ry', '0deg')
    el.style.setProperty('--rx', '0deg')
  }

  return { onPointerMove, onPointerLeave, enabled }
}
