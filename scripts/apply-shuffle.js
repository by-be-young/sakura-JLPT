import fs from 'fs'
const p = 'D:/日语自学网站/src/views/Quiz.vue'
let c = fs.readFileSync(p, 'utf-8')
const NL = '\r\n'

// 1. 添加 shuffleCache 和 shuffleQuestion 函数
const old1 = 'const fullyRandom = ref(false)' + NL + 'let flashTimer = null'
const new1 = 'const fullyRandom = ref(false)' + NL + 'let flashTimer = null' + NL + 'const shuffleCache = new Map()' + NL + NL + 'function shuffleQuestion(q) {' + NL + '  const indices = [0, 1, 2, 3]' + NL + '  for (let i = indices.length - 1; i > 0; i--) {' + NL + '    const j = Math.floor(Math.random() * (i + 1))' + NL + '    const tmp = indices[i]' + NL + '    indices[i] = indices[j]' + NL + '    indices[j] = tmp' + NL + '  }' + NL + '  return {' + NL + '    ...q,' + NL + '    options: indices.map(i => q.options[i]),' + NL + '    answer: indices.indexOf(q.answer - 1) + 1,' + NL + '  }' + NL + '}'
if (!c.includes(old1)) { console.log('ERROR: old1 not found'); process.exit(1) }
c = c.replace(old1, new1)

// 2. 修改 currentQuestion computed 使用缓存
const old2 = 'const currentQuestion = computed(() => questionList.value[currentIndex.value] || {})'
const new2 = 'const currentQuestion = computed(() => {' + NL + '  const q = questionList.value[currentIndex.value]' + NL + '  if (!q) return {}' + NL + '  if (!shuffleCache.has(q.id)) shuffleCache.set(q.id, shuffleQuestion(q))' + NL + '  return shuffleCache.get(q.id)' + NL + '})'
if (!c.includes(old2)) { console.log('ERROR: old2 not found'); process.exit(1) }
c = c.replace(old2, new2)

// 3. 在 buildList 开头清空缓存
const old3 = 'function buildList() {' + NL + '  let list = []'
const new3 = 'function buildList() {' + NL + '  shuffleCache.clear()' + NL + '  let list = []'
if (!c.includes(old3)) { console.log('ERROR: old3 not found'); process.exit(1) }
c = c.replace(old3, new3)

fs.writeFileSync(p, c, 'utf-8')
console.log('Done: 3 replacements applied')
