import fs from 'fs'
const p = 'D:/日语自学网站/src/views/WordLearn.vue'
let c = fs.readFileSync(p, 'utf-8')
const NL = '\n'

// 1. 删除无用的 currentQuizWord
const old1 = `function currentQuizWord() {
  const q = quizQuestions.value[quizIndex.value]
  if (!q) return null
  return pool.value.find(x => (x.kanji || x.kana) === q.answerText)
}

`
if (!c.includes(old1)) { console.log('ERROR: old1 not found'); process.exit(1) }
c = c.replace(old1, '')

// 2. 修复 retryQuiz：基于 wordId 重新生成未完成题型
const old2 = `function retryQuiz() {
  quizQuestions.value = buildQuizRound(quizQuestions.value.map(q => pool.value.find(w => (w.kanji || w.kana) === q.answerText)).filter(Boolean), pool.value)
  quizIndex.value = 0
  quizAnswered.value = false
  quizCorrect.value = 0
  quizFinished.value = false
}`
const new2 = `function retryQuiz() {
  const wordIds = [...new Set(quizQuestions.value.map(q => q.wordId))]
  const words2 = wordIds.map(id => pool.value.find(w => w.id === id)).filter(Boolean)
  quizQuestions.value = buildQuizRound(words2, pool.value, (id) => store.doneTypes(id))
  quizIndex.value = 0
  quizAnswered.value = false
  quizCorrect.value = 0
  quizFinished.value = false
}`
if (!c.includes(old2)) { console.log('ERROR: old2 not found'); process.exit(1) }
c = c.replace(old2, new2)

fs.writeFileSync(p, c, 'utf-8')
console.log('Done')
