import fs from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const Kuroshiro = require('kuroshiro').default
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji')

const kuroshiro = new Kuroshiro()
await kuroshiro.init(new KuromojiAnalyzer())

// 读取当前 words.js
const src = fs.readFileSync('D:/日语自学网站/src/data/words.js', 'utf-8')
const startMarker = 'export const words = ['
const startIdx = src.indexOf(startMarker)
const endIdx = src.indexOf('\n]\n', startIdx)
if (startIdx < 0 || endIdx < 0) { console.error('无法定位'); process.exit(1) }
const header = src.slice(0, startIdx) + startMarker
const tail = src.slice(endIdx + 2)

// 动态导入 words
const tmpFile = 'D:/日语自学网站/scripts/_words_tmp.mjs'
fs.writeFileSync(tmpFile, 'import { words } from "file:///D:/日语自学网站/src/data/words.js"\nexport { words }\n')
const mod = await import('file:///D:/日语自学网站/scripts/_words_tmp.mjs?t=' + Date.now())
const words = mod.words

async function convert(s) {
  try {
    return await kuroshiro.convert(s, { to: 'hiragana', mode: 'furigana' })
  } catch (e) {
    console.error('转换失败:', s, e.message)
    return s
  }
}

// 为每个例句生成 blankFurigana（目标词替换为 ____ 后的furigana）
for (const w of words) {
  const targetStr = w.kanji || w.kana
  if (w.examples) {
    for (const ex of w.examples) {
      if (ex.jp && !ex.blankFurigana) {
        const masked = ex.jp.replace(targetStr, '____')
        ex.blankFurigana = masked === ex.jp ? '' : await convert(masked)
      }
    }
  }
  process.stdout.write('.')
}
console.log('\n完成')

// 重新序列化
const newArr = words.map(w => {
  const parts = [`id: ${w.id}`, `level: '${w.level}'`, `kanji: ${JSON.stringify(w.kanji)}`, `kana: ${JSON.stringify(w.kana)}`, `pitch: ${JSON.stringify(w.pitch)}`, `pos: ${JSON.stringify(w.pos)}`, `meaning: ${JSON.stringify(w.meaning)}`]
  if (w.examples) {
    const exs = w.examples.map(ex => {
      const p = [`jp: ${JSON.stringify(ex.jp)}`, `zh: ${JSON.stringify(ex.zh)}`]
      if (ex.jpFurigana) p.push(`jpFurigana: ${JSON.stringify(ex.jpFurigana)}`)
      if (ex.blankFurigana) p.push(`blankFurigana: ${JSON.stringify(ex.blankFurigana)}`)
      return `{ ${p.join(', ')} }`
    }).join(', ')
    parts.push(`examples: [${exs}]`)
  }
  if (w.kanjiFurigana) parts.push(`kanjiFurigana: ${JSON.stringify(w.kanjiFurigana)}`)
  return `  { ${parts.join(', ')} },`
}).join('\n')

const out = header + '\n' + newArr + '\n]' + tail
fs.writeFileSync('D:/日语自学网站/src/data/words.js', out, 'utf-8')
fs.unlinkSync(tmpFile)
console.log('已写入 words.js')
