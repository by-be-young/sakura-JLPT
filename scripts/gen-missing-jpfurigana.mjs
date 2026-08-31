import fs from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const Kuroshiro = require('kuroshiro').default
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji')

const kuroshiro = new Kuroshiro()
await kuroshiro.init(new KuromojiAnalyzer())

const FILE = 'D:/日语自学网站/src/data/words.js'
const src = fs.readFileSync(FILE, 'utf-8')

const startMarker = 'export const words = ['
const startIdx = src.indexOf(startMarker)
const endIdx = src.indexOf('\n]', startIdx)
if (startIdx < 0 || endIdx < 0) { console.error('无法定位 words 数组'); process.exit(1) }
const header = src.slice(0, startIdx) + startMarker
const tail = src.slice(endIdx + 2)

// 动态导入当前 words
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

// 只为缺失 jpFurigana 的例句生成（保留既有字段与已有 jpFurigana/blankFurigana）
let added = 0, skipped = 0
for (const w of words) {
  if (w.examples && Array.isArray(w.examples)) {
    for (const ex of w.examples) {
      if (ex.jp && !ex.jpFurigana) {
        ex.jpFurigana = await convert(ex.jp)
        added++
      } else {
        skipped++
      }
    }
  }
  process.stdout.write('.')
}
console.log('\n完成：新增 jpFurigana', added, '条，已有跳过', skipped, '条')

// 完整保留每个词/例句的所有字段，序列化重写数组
function serObj(o) {
  const parts = []
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined) continue
    parts.push(`${k}: ${JSON.stringify(v)}`)
  }
  return `{ ${parts.join(', ')} }`
}

const newArr = words.map(w => {
  const parts = []
  for (const [k, v] of Object.entries(w)) {
    if (v === undefined) continue
    if (k === 'examples') {
      const exs = v.map(serObj).join(', ')
      parts.push(`examples: [${exs}]`)
    } else {
      parts.push(`${k}: ${JSON.stringify(v)}`)
    }
  }
  return `  { ${parts.join(', ')} },`
}).join('\n')

const out = header + '\n' + newArr + '\n]' + tail

// 写回前自检：node --check 校验语法，失败则不写
import { execFileSync } from 'node:child_process'
const checkFile = 'D:/日语自学网站/scripts/_check_out.mjs'
fs.writeFileSync(checkFile, out)
try {
  execFileSync(process.execPath, ['--check', checkFile], { encoding: 'utf-8' })
  console.log('语法自检通过')
} catch (e) {
  console.error('语法自检失败，放弃写回：', (e.stderr || e.message).toString().split('\n').slice(0, 6).join('\n'))
  fs.unlinkSync(checkFile)
  process.exit(1)
}
fs.unlinkSync(checkFile)

fs.writeFileSync(FILE, out, 'utf-8')
fs.unlinkSync(tmpFile)
console.log('已写入 words.js')
