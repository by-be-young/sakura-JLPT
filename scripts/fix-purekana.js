import fs from 'fs'
const p = 'D:/日语自学网站/src/composables/wordQuiz.js'
let c = fs.readFileSync(p, 'utf-8')

// 1. 添加 hasRealKanji 辅助函数
const old = '// 某词的可用题型（按词条属性判定）\nexport function availableTypes(word) {'
const neu = '// 判断单词是否真的含汉字（排除kanji字段为纯假名的情况）\nfunction hasRealKanji(word) {\n  return !!word.kanji && /[\\u4e00-\\u9fff]/.test(word.kanji)\n}\n\n// 某词的可用题型（按词条属性判定）\nexport function availableTypes(word) {'
if (!c.includes(old)) { console.log('ERROR: header not found'); process.exit(1) }
c = c.replace(old, neu)

// 2. availableTypes 判断
const old2 = "  if (word.kanji) {\n    types.push('kana2kanji', 'kanji2kana')\n  }"
const neu2 = "  if (hasRealKanji(word)) {\n    types.push('kana2kanji', 'kanji2kana')\n  }"
if (!c.includes(old2)) { console.log('ERROR: avail types not found'); process.exit(1) }
c = c.replace(old2, neu2)

// 3. kana2kanji
const old3 = "    case 'kana2kanji': {\n      if (!target.kanji) return null"
const neu3 = "    case 'kana2kanji': {\n      if (!hasRealKanji(target)) return null"
if (!c.includes(old3)) { console.log('ERROR: kana2kanji not found'); process.exit(1) }
c = c.replace(old3, neu3)

// 4. kanji2kana
const old4 = "    case 'kanji2kana': {\n      if (!target.kanji) return null"
const neu4 = "    case 'kanji2kana': {\n      if (!hasRealKanji(target)) return null"
if (!c.includes(old4)) { console.log('ERROR: kanji2kana not found'); process.exit(1) }
c = c.replace(old4, neu4)

fs.writeFileSync(p, c, 'utf-8')
console.log('Done')
