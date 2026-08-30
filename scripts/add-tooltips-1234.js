import fs from 'fs'

// === 1. App.vue: 振假名按钮 title 加快捷键 L ===
const appPath = 'D:/日语自学网站/src/App.vue'
let appC = fs.readFileSync(appPath, 'utf-8')
const oldApp = ':title="furigana.isLocked.value ? \'提交答案后可开启振假名\' : (furigana.isEnabled.value ? \'关闭振假名\' : \'开启振假名（汉字上方标注平假名）\')"'
const newApp = ':title="furigana.isLocked.value ? \'提交答案后可开启振假名\' : (furigana.isEnabled.value ? \'关闭振假名 (L)\' : \'开启振假名（汉字上方标注平假名）(L)\')"'
if (!appC.includes(oldApp)) { console.log('ERROR: App.vue old not found'); process.exit(1) }
appC = appC.replace(oldApp, newApp)
fs.writeFileSync(appPath, appC, 'utf-8')
console.log('1. App.vue: 振假名按钮 title 已加 (L)')

// === 2. Quiz.vue: 左右箭头 title 加快捷键，handleKeydown 加 1234 ===
const quizPath = 'D:/日语自学网站/src/views/Quiz.vue'
let quizC = fs.readFileSync(quizPath, 'utf-8')
const NL = '\r\n'

// 左箭头 title
const oldLeft = 'title="上一题"'
const newLeft = 'title="上一题 (A)"'
if (!quizC.includes(oldLeft)) { console.log('ERROR: left arrow title not found'); process.exit(1) }
quizC = quizC.replace(oldLeft, newLeft)

// 右箭头 title
const oldRight = 'title="下一题"'
const newRight = 'title="下一题 (D)"'
if (!quizC.includes(oldRight)) { console.log('ERROR: right arrow title not found'); process.exit(1) }
quizC = quizC.replace(oldRight, newRight)

// handleKeydown 加 1234
const oldKeydown = "function handleKeydown(e) {" + NL + '  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return' + NL + "  if (e.key === 'l' || e.key === 'L') furigana.toggle()" + NL + "  else if (e.key === 'a' || e.key === 'A') prevQuestion()" + NL + "  else if (e.key === 'd' || e.key === 'D') nextQuestion()" + NL + "}"
const newKeydown = "function handleKeydown(e) {" + NL + '  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return' + NL + "  if (e.key === 'l' || e.key === 'L') furigana.toggle()" + NL + "  else if (e.key === 'a' || e.key === 'A') prevQuestion()" + NL + "  else if (e.key === 'd' || e.key === 'D') nextQuestion()" + NL + "  else if (['1','2','3','4'].includes(e.key)) {" + NL + "    if (!showResult.value && !flash.value) handleSelect(Number(e.key))" + NL + "  }" + NL + "}"
if (!quizC.includes(oldKeydown)) { console.log('ERROR: handleKeydown old not found'); process.exit(1) }
quizC = quizC.replace(oldKeydown, newKeydown)

fs.writeFileSync(quizPath, quizC, 'utf-8')
console.log('2. Quiz.vue: 箭头 title 已加 (A)(D)，1234 快捷键已添加')
console.log('Done')
