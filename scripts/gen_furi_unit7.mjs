// 为听解 Unit7 数据生成振假名（ruby）与读音（kana）
// 用法：node scripts/gen_furi_unit7.mjs
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const Kuroshiro = require('kuroshiro').default
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji')

const kuroshiro = new Kuroshiro()
await kuroshiro.init(new KuromojiAnalyzer())

const DIR = 'D:/日语自学网站/src/data/listening/unit7'

// 个别词注音修正（生成后覆盖）
const MANUAL_FIX = {
}

function hasKanji(s) {
  return /[\u4e00-\u9fff]/.test(s)
}
// 中文文本（跳过注音）：汉字为主且假名稀少
function isChinese(s) {
  const han = (s.match(/[\u4e00-\u9fff]/g) || []).length
  const kana = (s.match(/[\u3040-\u30ff]/g) || []).length
  return han > kana
}
async function kanaOf(s) {
  if (!s) return ''
  try { return await kuroshiro.convert(s, { to: 'hiragana' }) } catch { return '' }
}
async function furiOf(s) {
  if (!s) return ''
  try { return await kuroshiro.convert(s, { to: 'hiragana', mode: 'furigana' }) } catch { return '' }
}

// ===== words =====
const wMod = await import('file:///' + DIR + '/words.js')
const words = wMod.default
for (const g of words.groups) {
  for (const item of g.list) {
    item.kana = await kanaOf(item.w)
    item.furi = await furiOf(item.w)
  }
}
fs.writeFileSync(DIR + '/words.js', '// 听解 Unit7 文化・教養 · 词汇板块（聴いてみよう＜文化・教養に関する語彙＞）\n' +
  '// 来源：绿宝书《新日本语能力考试N2听解（详解+练习）》Part1 基础编 Unit7 书页73-75\n' +
  '// - group: 词汇组（語彙のまとめ1-5 / 表現のまとめ）\n' +
  '// - w: 词/短语, m: 中文释义, kana: 读音, furi: ruby 振假名（由脚本生成，请勿手改）\n' +
  'export default ' + JSON.stringify(words, null, 2) + '\n', 'utf-8')

// ===== questions =====
const qMod = await import('file:///' + DIR + '/questions.js')
const questions = qMod.default
for (const sec of questions.sections) {
  for (const item of sec.items || []) {
    if (item.text && hasKanji(item.text)) item.textFuri = await furiOf(item.text)
    if (item.script && hasKanji(item.script)) item.scriptFuri = await furiOf(item.script)
    if (item.answer && hasKanji(item.answer)) item.answerFuri = await furiOf(item.answer)
    if (item.kanji && hasKanji(item.kanji)) item.kanjiFuri = await furiOf(item.kanji)
    for (const a of item.answers || []) {
      if (a.answer && hasKanji(a.answer)) a.answerFuri = await furiOf(a.answer)
      if (a.plain && hasKanji(a.plain)) a.plainFuri = await furiOf(a.plain)
    }
  }
  // word 类型：parts 分组
  for (const part of sec.parts || []) {
    for (const item of part.items || []) {
      if (item.text && hasKanji(item.text)) item.textFuri = await furiOf(item.text)
      if (item.answer && hasKanji(item.answer)) item.answerFuri = await furiOf(item.answer)
    }
  }
  for (const conv of sec.convs || []) {
    for (const line of conv.lines || []) {
      if (line.text && hasKanji(line.text)) line.textFuri = await furiOf(line.text)
    }
    for (const a of conv.answers || []) {
      if (a.answer && hasKanji(a.answer)) a.answerFuri = await furiOf(a.answer)
    }
  }
}
fs.writeFileSync(DIR + '/questions.js', '// 听解 Unit7 文化・教養 · 题目板块（問題301-350）\n' +
  '// 来源：绿宝书《新日本语能力考试N2听解（详解+练习）》Part1 基础编 Unit7 书页76-78\n' +
  '// - sections: 6 大题；第2题 word 类型（外来語/漢字詞分组），第6题 select 选择应答句\n' +
  'export default ' + JSON.stringify(questions, null, 2) + '\n', 'utf-8')

// ===== knowledge =====
const kMod = await import('file:///' + DIR + '/knowledge.js')
const knowledge = kMod.default
for (const part of knowledge.parts) {
  if (part.kind === 'card') {
    for (const it of part.items || []) {
      it.patternFuri = ''
      // 语法符号（名/動/い/イ/ナ 等开头）不注音
      if (it.pattern && hasKanji(it.pattern) && !isChinese(it.pattern) && !/^[名動いイナな]/.test(it.pattern)) it.patternFuri = await furiOf(it.pattern)
      for (const ln of it.lines || []) {
        ln.jpFuri = ''
        if (ln.jp && hasKanji(ln.jp) && !isChinese(ln.jp)) ln.jpFuri = await furiOf(ln.jp)
      }
    }
  } else {
    for (const p of part.pairs || []) {
      p.lFuri = ''; p.rFuri = ''; p.leFuri = ''; p.reFuri = ''
    }
    const head = part.head || []
    const isCnCol = (i) => /説明|说明|译文|中文/.test(head[i] || '')
    for (const p of part.pairs || []) {
      if (p.l && hasKanji(p.l) && !isCnCol(0) && !isChinese(p.l)) p.lFuri = await furiOf(p.l)
      if (p.le && hasKanji(p.le) && !isCnCol(1) && !isChinese(p.le)) p.leFuri = await furiOf(p.le)
      if (p.r && hasKanji(p.r) && !isCnCol(2) && !isChinese(p.r)) p.rFuri = await furiOf(p.r)
      if (p.re && hasKanji(p.re) && !isCnCol(3) && !isChinese(p.re)) p.reFuri = await furiOf(p.re)
    }
  }
}
fs.writeFileSync(DIR + '/knowledge.js', '// 听解 Unit7 文化・教養 · 补充知识板块（聴解の基礎知識7＜話者の気持ち＞）\n' +
  '// 来源：绿宝书《新日本语能力考试N2听解（详解+练习）》Part1 基础编 Unit7 书页79-83\n' +
  '// - parts: 翻页部分；kind: card 表现卡片（no/pattern/meaning/desc/lines）\n' +
  '// - 注：本单元知识页无二维码，audio 留空自动隐藏扫码横幅\n' +
  'export default ' + JSON.stringify(knowledge, null, 2) + '\n', 'utf-8')

console.log('furi done')
