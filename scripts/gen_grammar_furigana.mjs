// 为文法数据生成振假名：只对日文片段做 ruby 注音，中文译文不做
// 规则：
//   1) 文本无假名 -> 不生成（furi 为空）
//   2) 有假名：取第一个全角括号（；若其后无假名，则括号内是中文译文，只注音括号前部分；
//      否则整行都是日文内容，整行注音
// 用法：node scripts/gen_grammar_furigana.mjs
import fs from 'fs'
import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'
const require = createRequire(import.meta.url)
const Kuroshiro = require('kuroshiro').default
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji')

const FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'grammar.js')

function hasKana(s) { return /[\u3040-\u30ff]/.test(s) }

function jpSegment(t) {
  const i = t.indexOf('（')
  if (i >= 0) {
    // 括号后无假名 -> 括号内为中文译文
    if (!hasKana(t.slice(i))) return t.slice(0, i)
    return t
  }
  return t
}

const kuroshiro = new Kuroshiro()
await kuroshiro.init(new KuromojiAnalyzer())

async function convert(s) {
  try {
    const r = await kuroshiro.convert(s, { to: 'hiragana', mode: 'furigana' })
    return r.includes('<ruby>') ? r : ''
  } catch { return '' }
}

let raw = fs.readFileSync(FILE, 'utf-8')
const payload = raw.split('export const grammarLevels = ')[1].trim().replace(/;\s*$/, '')
const levels = JSON.parse(payload)

let total = 0, annotated = 0, withRuby = 0
for (const lv of levels) {
  for (const u of lv.units) {
    for (const p of u.points) {
      for (const b of p.blocks) {
        const t = b.text || ''
        if (!t || !hasKana(t)) { b.furi = ''; continue }
        total++
        const seg = jpSegment(t)
        const furi = await convert(seg)
        annotated++
        if (furi) {
          b.furi = furi + t.slice(seg.length)
          withRuby++
        } else {
          b.furi = ''
        }
      }
    }
  }
}

const out = "// 自动生成：由 scripts/gen_grammar.py 从《蓝宝书文法详解.docx》解析而来，请勿手改。\n"
  + "// 结构：levels[] -> units[] -> points[] -> blocks[]（furi 为开启振假名时的 ruby 版本）\n"
  + "export const grammarLevels = " + JSON.stringify(levels, null, 1) + ";\n"
fs.writeFileSync(FILE, out, 'utf-8')
console.log(`有假名的文本块: ${total}，注音后含 ruby 的: ${withRuby}`)
console.log('完成，文件大小', fs.statSync(FILE).size)
