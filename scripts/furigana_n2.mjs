// 为 N2 词生成 kanjiFurigana（含汉字词），并输出合并脚本所需 JSON
import fs from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const Kuroshiro = require('kuroshiro').default
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji')
const kuroshiro = new Kuroshiro()
await kuroshiro.init(new KuromojiAnalyzer())

const data = JSON.parse(fs.readFileSync('D:/日语自学网站/n2_final2.json', 'utf-8'))

function hasKanji(s) {
  return /[\u4e00-\u9fff]/.test(s)
}
async function convert(s) {
  try {
    return await kuroshiro.convert(s, { to: 'hiragana', mode: 'furigana' })
  } catch { return s }
}

let n = 0
for (const e of data) {
  if (e.kanji && hasKanji(e.kanji)) {
    e.kanjiFurigana = await convert(e.kanji)
    n++
  } else {
    e.kanjiFurigana = ''
  }
  process.stdout.write('.')
}
console.log('\n生成furigana词数:', n)

fs.writeFileSync('D:/日语自学网站/n2_final3.json', JSON.stringify(data, null, 1), 'utf-8')
console.log('已写 n2_final3.json')
