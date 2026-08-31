import { words, wordsByLevel } from '../src/data/words.js'
const by = {}
for (const w of words) by[w.level] = (by[w.level] || 0) + 1
console.log('等级分布:', JSON.stringify(by))
console.log('总词数:', words.length)
for (const lv of ['N5', 'N4', 'N3', 'N2', 'N1']) {
  const pool = wordsByLevel(lv)
  const kanji = pool.filter(w => w.kanji)
  const fg = kanji.filter(w => w.kanjiFurigana).length
  console.log(`${lv}: 共${pool.length} 汉字词${kanji.length} 有furigana${fg}`)
}
// id 唯一性与字段完整性
const ids = new Set()
let bad = 0
for (const w of words) {
  if (ids.has(w.id)) bad++
  ids.add(w.id)
  if (!w.kana || !w.meaning || !w.pos || !Array.isArray(w.pitch)) bad++
}
console.log('id唯一/字段完整 异常:', bad, ' id数:', ids.size)
