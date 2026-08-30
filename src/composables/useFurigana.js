import { ref, computed } from 'vue'

const FURI_KEY = 'sakura_furigana_enabled'
const enabled = ref(localStorage.getItem(FURI_KEY) === '1')
const locked = ref(false)

export function useFurigana() {
  const isEnabled = computed(() => enabled.value)
  const isLocked = computed(() => locked.value)

  function toggle() {
    if (locked.value) return
    enabled.value = !enabled.value
    localStorage.setItem(FURI_KEY, enabled.value ? '1' : '0')
  }

  function setLocked(val) {
    locked.value = val
  }

  function enable() {
    if (locked.value) return
    enabled.value = true
    localStorage.setItem(FURI_KEY, '1')
  }

  function disable() {
    enabled.value = false
    localStorage.setItem(FURI_KEY, '0')
  }

  return { isEnabled, isLocked, toggle, setLocked, enable, disable }
}
