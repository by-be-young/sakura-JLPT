import fs from 'fs'
const p = 'D:/日语自学网站/src/views/Quiz.vue'
let c = fs.readFileSync(p, 'utf-8')
const NL = '\r\n'

const old = '  questionList.value = list' + NL + '  currentIndex.value = 0' + NL + '  resetState()'
const newStr = '  questionList.value = list' + NL + '  currentIndex.value = 0' + NL + '  if (mode.value === \'sequential\' && !route.query.start) {' + NL + '    const firstUnanswered = list.findIndex(q => !store.getAnswer(q.id))' + NL + '    if (firstUnanswered > 0) currentIndex.value = firstUnanswered' + NL + '  }' + NL + '  resetState()'
if (!c.includes(old)) { console.log('ERROR: old not found'); process.exit(1) }
c = c.replace(old, newStr)
fs.writeFileSync(p, c, 'utf-8')
console.log('Done: sequential mode starts from first unanswered question')
