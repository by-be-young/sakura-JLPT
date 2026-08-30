import fs from 'fs'
const p = 'D:/日语自学网站/src/views/Quiz.vue'
let c = fs.readFileSync(p, 'utf-8')
const NL = '\r\n'

// 1. onUnmounted 添加 removeEventListener
const old1 = 'onUnmounted(() => {' + NL + '  furigana.setLocked(false)' + NL + '  if (flashTimer) clearTimeout(flashTimer)' + NL + '})'
const new1 = 'onUnmounted(() => {' + NL + '  furigana.setLocked(false)' + NL + '  if (flashTimer) clearTimeout(flashTimer)' + NL + '  window.removeEventListener("keydown", handleKeydown)' + NL + '})'
if (!c.includes(old1)) { console.log('ERROR: old1 not found'); process.exit(1) }
c = c.replace(old1, new1)

// 2. onMounted (fullyRandom那个) 添加 addEventListener - 注意单引号
const old2 = "onMounted(() => {" + NL + "  fullyRandom.value = localStorage.getItem(RANDOM_KEY) === '1'" + NL + "})"
const new2 = "onMounted(() => {" + NL + "  fullyRandom.value = localStorage.getItem(RANDOM_KEY) === '1'" + NL + "  window.addEventListener('keydown', handleKeydown)" + NL + "})"
if (!c.includes(old2)) { console.log('ERROR: old2 not found'); process.exit(1) }
c = c.replace(old2, new2)

// 3. 在 saveRandomSetting 函数后添加 handleKeydown
const old3 = "function saveRandomSetting() {" + NL + "  localStorage.setItem(RANDOM_KEY, fullyRandom.value ? '1' : '0')" + NL + "}"
const new3 = "function saveRandomSetting() {" + NL + "  localStorage.setItem(RANDOM_KEY, fullyRandom.value ? '1' : '0')" + NL + "}" + NL + NL + "function handleKeydown(e) {" + NL + '  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return' + NL + "  if (e.key === 'l' || e.key === 'L') furigana.toggle()" + NL + "  else if (e.key === 'a' || e.key === 'A') prevQuestion()" + NL + "  else if (e.key === 'd' || e.key === 'D') nextQuestion()" + NL + "}"
if (!c.includes(old3)) { console.log('ERROR: old3 not found'); process.exit(1) }
c = c.replace(old3, new3)

fs.writeFileSync(p, c, 'utf-8')
console.log('Done: 3 replacements applied')
