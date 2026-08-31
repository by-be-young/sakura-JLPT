// 批量生成振假名
import fs from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const Kuroshiro = require('kuroshiro').default
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji')
const kuroshiro = new Kuroshiro()
await kuroshiro.init(new KuromojiAnalyzer())

const LEVELS = ['N1', 'N2', 'N3', 'N4', 'N5']
function hasKanji(s) { return /[\u4e00-\u9fff]/.test(s) }
async function convert(s) {
  try { return await kuroshiro.convert(s, { to: 'hiragana', mode: 'furigana' }) } catch { return s }
}

for (const lv of LEVELS) {
  const data = JSON.parse(fs.readFileSync(`D:/日语自学网站/${lv}_fix.json`, 'utf-8'))
  let n = 0
  for (const e of data) {
    if (e.kanji && hasKanji(e.kanji)) {
      e.kanjiFurigana = await convert(e.kanji)
      n++
    } else {
      e.kanjiFurigana = ''
    }
  }
  fs.writeFileSync(`D:/日语自学网站/${lv}_final.json`, JSON.stringify(data, null, 1), 'utf-8')
  console.log(`${lv}: furigana ${n} / 总数 ${data.length}`)
}
console.log('全部完成')
