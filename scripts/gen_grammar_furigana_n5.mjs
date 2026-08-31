// 为更新后的 N5 文法数据重新生成振假名（标签上下文感知），保留 N4~N1 的 furi 不变。
// 规则：
//   说明 / 注意 / 补充 / *变形规则 标签下的行：中文解释，不注音
//   例文 / 例词 / 接续 / 对应关系 / 读法 标签下的行（及单元10寒暄语）：注音日文部分
//   注音时先剥离行首 △；按 / 、。、（ 找日文段；【...】真题标记不注音。
// 用法：node scripts/gen_grammar_furigana_n5.mjs
import fs from 'fs'
import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'
const require = createRequire(import.meta.url)
const Kuroshiro = require('kuroshiro').default
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji')

const FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'grammar.js')

function hasKana(s) { return /[\u3040-\u30ff]/.test(s) }

// 标签基名：去掉尾部数字与圈号
function baseLabel(l) { return String(l || '').replace(/[0-9①-⑩]+$/, '') }

const SKIP = new Set(['说明', '注意', '补充'])

// 提取需注音的日文段
function jpSegment(t) {
  // 1) 第一个 / 之后无假名 -> / 前为日文，/ 后为中文译文
  const slash = t.indexOf('/')
  if (slash >= 0 && !hasKana(t.slice(slash + 1))) return t.slice(0, slash)
  // 2) 第一个 。之后无假名 -> 寒暄/短句，。前为日文
  const dot = t.indexOf('。')
  if (dot >= 0 && !hasKana(t.slice(dot + 1))) return t.slice(0, dot + 1)
  // 3) 第一个（之后无假名 -> （ 内为中文
  const p = t.indexOf('（')
  if (p >= 0 && !hasKana(t.slice(p))) return t.slice(0, p)
  return t
}

const kuroshiro = new Kuroshiro()
await kuroshiro.init(new KuromojiAnalyzer())

// 注音一段文本，但保留其中的 【...】 标记不注音
async function convertKeepTags(s) {
  const parts = s.split(/(【[^】]*】)/g)
  const out = []
  for (const part of parts) {
    if (/^【[^】]*】$/.test(part)) { out.push(part); continue }
    if (!hasKana(part)) { out.push(part); continue }
    try {
      const r = await kuroshiro.convert(part, { to: 'hiragana', mode: 'furigana' })
      out.push(r.includes('<ruby>') ? r : part)
    } catch { out.push(part) }
  }
  const joined = out.join('')
  return joined.includes('<ruby>') ? joined : ''
}

let raw = fs.readFileSync(FILE, 'utf-8')
const payload = raw.split('export const grammarLevels = ')[1].trim().replace(/;\s*$/, '')
const levels = JSON.parse(payload)

let total = 0, withRuby = 0
const TARGETS = new Set(['N1', 'N2', 'N3', 'N4', 'N5'])
for (const lv of levels) {
  if (!TARGETS.has(lv.id)) continue
  for (const u of lv.units) {
    for (const p of u.points) {
      let cur = null // 当前标签基名（不含圈号数字）
      const pointHasLabel = p.blocks.some(b => b.t === 'label')
      for (const b of p.blocks) {
        if (b.t === 'label') {
          cur = baseLabel(b.label)
          delete b.furi
          continue
        }
        if (b.t === 'table' || b.t === 'sub') { delete b.furi; continue }
        const t = (b.text || '').replace(/^△/, '')
        // 无标签上下文时，仅「整点无标签」的纯日文点（如 N5 寒暄语）默认注音，其余跳过
        const noContext = cur === null && pointHasLabel
        if (!t || !hasKana(t) || noContext || (cur && (SKIP.has(cur) || cur.includes('变形规则')))) {
          delete b.furi
          continue
        }
        total++
        const seg = jpSegment(t)
        const furi = await convertKeepTags(seg)
        if (furi) {
          b.furi = furi + t.slice(seg.length)
          withRuby++
        } else {
          delete b.furi
        }
      }
    }
  }
}

const out = "// 自动生成：N5/N4 由 scripts/gen_grammar_n5.py 与 gen_grammar_n4.py 从《蓝宝书文法详解.docx》《蓝宝书n4.docx》解析，N3~N1 由旧脚本生成，请勿手改。\n"
  + "// 结构：levels[] -> units[] -> points[] -> blocks[]（furi 为开启振假名时的 ruby 版本）\n"
  + "export const grammarLevels = " + JSON.stringify(levels, null, 1) + ";\n"
fs.writeFileSync(FILE, out, 'utf-8')
console.log(`N1~N5 有假名且需注音的行: ${total}，注音后含 ruby 的: ${withRuby}`)
console.log('文件大小', fs.statSync(FILE).size, 'bytes')
