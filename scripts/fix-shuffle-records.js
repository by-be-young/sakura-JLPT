import fs from 'fs'
const p = 'D:/日语自学网站/src/views/Quiz.vue'
let c = fs.readFileSync(p, 'utf-8')
const NL = '\r\n'

// 1. shuffleQuestion 添加 _optionOrder 映射
const old1 = '  return {' + NL + '    ...q,' + NL + '    options: indices.map(i => q.options[i]),' + NL + '    answer: indices.indexOf(q.answer - 1) + 1,' + NL + '  }'
const new1 = '  return {' + NL + '    ...q,' + NL + '    options: indices.map(i => q.options[i]),' + NL + '    answer: indices.indexOf(q.answer - 1) + 1,' + NL + '    _optionOrder: indices,' + NL + '  }'
if (!c.includes(old1)) { console.log('ERROR: old1 not found'); process.exit(1) }
c = c.replace(old1, new1)

// 2. submitAnswer: 存原始选项索引而非显示索引
const old2 = 'function submitAnswer() {' + NL + '  if (!selected.value) return' + NL + '  const correct = selected.value === currentQuestion.value.answer' + NL + '  store.recordAnswer(currentQuestion.value.id, selected.value, correct)'
const new2 = 'function submitAnswer() {' + NL + '  if (!selected.value) return' + NL + '  const correct = selected.value === currentQuestion.value.answer' + NL + '  const origSelected = currentQuestion.value._optionOrder[selected.value - 1] + 1' + NL + '  store.recordAnswer(currentQuestion.value.id, origSelected, correct)'
if (!c.includes(old2)) { console.log('ERROR: old2 not found'); process.exit(1) }
c = c.replace(old2, new2)

// 3. resetState: 读取时将原始索引映射回显示位置
const old3 = '  if (prev) {' + NL + '    selected.value = prev.selected' + NL + '    showResult.value = true'
const new3 = '  if (prev) {' + NL + '    selected.value = q._optionOrder ? q._optionOrder.indexOf(prev.selected - 1) + 1 : prev.selected' + NL + '    showResult.value = true'
if (!c.includes(old3)) { console.log('ERROR: old3 not found'); process.exit(1) }
c = c.replace(old3, new3)

fs.writeFileSync(p, c, 'utf-8')
console.log('Done: 3 replacements applied')
