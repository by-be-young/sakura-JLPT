// 将合并后的词表写入 words.js
import fs from 'fs'

const all = JSON.parse(fs.readFileSync('D:/日语自学网站/all_merged.json', 'utf-8'))
const src = fs.readFileSync('D:/日语自学网站/src/data/words.js', 'utf-8')
const marker = 'export const words = ['
const startIdx = src.indexOf(marker)
const endIdx = src.indexOf('\n]\n', startIdx)
if (startIdx < 0 || endIdx < 0) { console.error('定位失败'); process.exit(1) }

const header = src.slice(0, startIdx + marker.length)
const tail = src.slice(endIdx + 2)

function fmt(w) {
  const parts = [`id: ${w.id}`, `level: '${w.level}'`, `kanji: ${JSON.stringify(w.kanji)}`, `kana: ${JSON.stringify(w.kana)}`, `pitch: ${JSON.stringify(w.pitch)}`, `pos: ${JSON.stringify(w.pos)}`, `meaning: ${JSON.stringify(w.meaning)}`]
  if (w.examples && w.examples.length) {
    const exs = w.examples.map(ex => `{ jp: ${JSON.stringify(ex.jp)}, zh: ${JSON.stringify(ex.zh)}, jpFurigana: ${JSON.stringify(ex.jpFurigana || '')}${ex.blankFurigana ? `, blankFurigana: ${JSON.stringify(ex.blankFurigana)}` : ''} }`).join(', ')
    parts.push(`examples: [${exs}]`)
  }
  if (w.kanjiFurigana) parts.push(`kanjiFurigana: ${JSON.stringify(w.kanjiFurigana)}`)
  return `  { ${parts.join(', ')}, },`
}

const arrText = all.map(fmt).join('\n')
const out = header + '\n' + arrText + '\n]' + tail
fs.writeFileSync('D:/日语自学网站/src/data/words.js', out, 'utf-8')
console.log('已写入 words.js，总词数', all.length)
