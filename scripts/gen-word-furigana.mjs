import fs from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const Kuroshiro = require('kuroshiro').default
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji')

const kuroshiro = new Kuroshiro()
await kuroshiro.init(new KuromojiAnalyzer())

// 读取原 words.js 源码，提取 words 数组
const src = fs.readFileSync('D:/日语自学网站/src/data/words.js', 'utf-8')

// 找到 export const words = [ ... ] 部分
const startMarker = 'export const words = ['
const startIdx = src.indexOf(startMarker)
const endIdx = src.indexOf('\n]\n', startIdx)
if (startIdx < 0 || endIdx < 0) { console.error('无法定位 words 数组'); process.exit(1) }
const arrText = src.slice(startIdx + startMarker.length, endIdx + 2) // 包含 ]\n

// 用 import 方式获取 words（通过动态导入一个临时模块）
const tmpFile = 'D:/日语自学网站/scripts/_words_tmp.mjs'
fs.writeFileSync(tmpFile, 'import { words } from "file:///D:/日语自学网站/src/data/words.js"\nexport { words }\n')

// 重新导入需要清理缓存，直接写临时文件再导入
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

// 为每个例句生成 jpFurigana
for (const w of words) {
  if (w.examples) {
    for (const ex of w.examples) {
      if (ex.jp && !ex.jpFurigana) {
        ex.jpFurigana = await convert(ex.jp)
      }
    }
  }
  // 也生成单词本身的 furigana（用于 WordCard 显示）
  if (w.kanji && !w.kanjiFurigana) {
    w.kanjiFurigana = await convert(w.kanji)
  }
  process.stdout.write('.')
}
console.log('\n完成，共', words.length, '词')

// 序列化并重写 words.js
// 保留文件头部注释 + 数组 + 尾部函数
const header = src.slice(0, startIdx) + startMarker
const tail = src.slice(endIdx + 2)

// 重新生成数组文本（紧凑格式，与原来一致）
const newArr = words.map(w => {
  const parts = [`id: ${w.id}`, `level: '${w.level}'`, `kanji: ${JSON.stringify(w.kanji)}`, `kana: ${JSON.stringify(w.kana)}`, `pitch: ${JSON.stringify(w.pitch)}`, `pos: ${JSON.stringify(w.pos)}`, `meaning: ${JSON.stringify(w.meaning)}`]
  if (w.examples) {
    const exs = w.examples.map(ex => `{ jp: ${JSON.stringify(ex.jp)}, zh: ${JSON.stringify(ex.zh)}, jpFurigana: ${JSON.stringify(ex.jpFurigana || '')} }`).join(', ')
    parts.push(`examples: [${exs}]`)
  }
  if (w.kanjiFurigana) parts.push(`kanjiFurigana: ${JSON.stringify(w.kanjiFurigana)}`)
  return `  { ${parts.join(', ')} },`
}).join('\n')

const out = header + '\n' + newArr + '\n]' + tail
fs.writeFileSync('D:/日语自学网站/src/data/words.js', out, 'utf-8')
fs.unlinkSync(tmpFile)
console.log('已写入 words.js')
