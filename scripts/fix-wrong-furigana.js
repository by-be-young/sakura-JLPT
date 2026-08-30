import fs from 'fs'
const p = 'D:/日语自学网站/src/views/Quiz.vue'
let c = fs.readFileSync(p, 'utf-8')
const NL = '\r\n'

const old = '  } else {' + NL + '    // 答错：停留当前题，展开解析，自动开启振假名' + NL + '    showResult.value = true' + NL + '    furigana.enable()' + NL + '  }'
const newStr = '  } else {' + NL + '    // 答错：停留当前题，展开解析，自动开启振假名' + NL + '    showResult.value = true' + NL + '    furigana.setLocked(false)' + NL + '    furigana.enable()' + NL + '  }'
if (!c.includes(old)) { console.log('ERROR: old not found'); process.exit(1) }
c = c.replace(old, newStr)
fs.writeFileSync(p, c, 'utf-8')
console.log('Done: wrong answer now auto-enables furigana')
