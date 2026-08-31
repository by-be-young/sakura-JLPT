import fs from 'fs'
const p = 'D:/日语自学网站/src/views/WordLearn.vue'
let c = fs.readFileSync(p, 'utf-8')
const NL = '\n'

const old = '        <WordQuiz :type="quizQuestions[quizIndex].type" :question="quizQuestions[quizIndex]"' + NL + '          @answer="handleQuizAnswer" />'
const newStr = '        <WordQuiz :key="quizIndex" :type="quizQuestions[quizIndex].type" :question="quizQuestions[quizIndex]"' + NL + '          @answer="handleQuizAnswer" />'
if (!c.includes(old)) { console.log('ERROR: not found'); process.exit(1) }
c = c.replace(old, newStr)
fs.writeFileSync(p, c, 'utf-8')
console.log('Done: WordQuiz key added')
