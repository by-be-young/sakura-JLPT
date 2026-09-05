// 为听解 Unit1 数据生成振假名（ruby）与读音（kana）
// 用法：node scripts/gen_listening_unit1.mjs
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const Kuroshiro = require('kuroshiro').default
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji')

const kuroshiro = new Kuroshiro()
await kuroshiro.init(new KuromojiAnalyzer())

const DIR = 'D:/日语自学网站/src/data/listening/unit1'

async function convert(s) {
  if (!s) return ''
  try {
    return await kuroshiro.convert(s, { to: 'hiragana', mode: 'furigana' })
  } catch {
    return ''
  }
}

// 纯假名（不带 ruby）
async function convertKana(s) {
  if (!s) return ''
  try {
    return await kuroshiro.convert(s, { to: 'hiragana' })
  } catch {
    return ''
  }
}

// 只有含汉字的文本才需要振假名
function hasKanji(s) {
  return /[\u4e00-\u9fff]/.test(s)
}

// 人工修正表（kuroshiro 误读的词）
const MANUAL_FIX = {
  '当て嵌まる': { kana: 'あてはまる', furi: '<ruby>当<rp>(</rp><rt>あ</rt><rp>)</rp></ruby>て<ruby>嵌<rp>(</rp><rt>は</rt><rp>)</rp></ruby>まる' },
}

async function kanaOf(s) {
  if (!s) return ''
  if (MANUAL_FIX[s]) return MANUAL_FIX[s].kana
  try {
    return await kuroshiro.convert(s, { to: 'hiragana' })
  } catch { return '' }
}
async function furiOf(s) {
  if (!s) return ''
  if (MANUAL_FIX[s]) return MANUAL_FIX[s].furi
  try {
    return await kuroshiro.convert(s, { to: 'hiragana', mode: 'furigana' })
  } catch { return '' }
}

// ===== words =====
const wordsMod = await import('file:///' + DIR + '/words.js')
const words = wordsMod.default
for (const g of words.groups) {
  for (const item of g.list) {
    if (hasKanji(item.w)) {
      item.furi = await furiOf(item.w)
      item.kana = await kanaOf(item.w)
    } else {
      item.furi = ''
      item.kana = ''
    }
  }
}

// ===== questions =====
const qMod = await import('file:///' + DIR + '/questions.js')
const questions = qMod.default
for (const sec of questions.sections) {
  for (const item of sec.items || []) {
    if (hasKanji(item.text)) item.textFuri = await furiOf(item.text)
    if (item.script && hasKanji(item.script)) item.scriptFuri = await furiOf(item.script)
    if (item.answer && hasKanji(item.answer)) item.answerFuri = await furiOf(item.answer)
  }
  for (const part of sec.parts || []) {
    for (const item of part.items || []) {
      if (hasKanji(item.text)) item.textFuri = await furiOf(item.text)
      if (item.answer && hasKanji(item.answer)) item.answerFuri = await furiOf(item.answer)
    }
  }
  for (const conv of sec.convs || []) {
    for (const line of conv.lines || []) {
      if (hasKanji(line.text)) line.textFuri = await furiOf(line.text)
    }
    for (const a of conv.answers || []) {
      if (a.answer && hasKanji(a.answer)) a.answerFuri = await furiOf(a.answer)
    }
  }
}

// ===== knowledge =====
const kMod = await import('file:///' + DIR + '/knowledge.js')
const knowledge = kMod.default
for (const part of knowledge.parts) {
  for (const p of part.pairs || []) {
    if (p.le && hasKanji(p.le)) p.leFuri = await convert(p.le)
    if (p.re && hasKanji(p.re)) p.reFuri = await convert(p.re)
  }
}

function writeModule(file, data, header) {
  const lines = [header, 'export default ' + JSON.stringify(data, null, 2), '']
  fs.writeFileSync(file, lines.join('\n'), 'utf-8')
}

writeModule(path.join(DIR, 'words.js'), words,
  '// 听解 Unit1 学校生活 · 词汇板块（聴いてみよう＜学校生活に関する語彙＞）\n' +
  '// 来源：绿宝书《新日本语能力考试N2听解（详解+练习）》Part1 基础编 Unit1 书页2-6\n' +
  '// - group: 词汇组（语彙のまとめ1-8 / 表现のまとめ）\n' +
  '// - w: 词/短语, m: 中文释义, kana: 读音, furi: ruby 振假名（由脚本生成，请勿手改）')

writeModule(path.join(DIR, 'questions.js'), questions,
  '// 听解 Unit1 学校生活 · 题目板块（問題1-50）\n' +
  '// 来源：绿宝书《新日本语能力考试N2听解（详解+练习）》Part1 基础编 Unit1 书页7-9，答案见书页274\n' +
  '// - section: 大题；title: 题型说明；audio: 音频编号；type: select(选择) / kana(补假名) / phrase(补短语) / word(填词) / conv(会话)\n' +
  '// - *Furi 字段为 ruby 振假名（由脚本生成，请勿手改）')

writeModule(path.join(DIR, 'knowledge.js'), knowledge,
  '// 听解 Unit1 学校生活 · 补充知识板块（聴解の基礎知識1＜音声の特徴＞）\n' +
  '// 来源：绿宝书《新日本语能力考试N2听解（详解+练习）》书页10-11\n' +
  '// - pairs: 左右对比词；leFuri/reFuri 为例句 ruby 振假名（由脚本生成，请勿手改）')

console.log('Unit1 振假名生成完成')
console.log('词汇示例:', words.groups[0].list.slice(0, 3).map(i => i.w + '→' + (i.furi || '(无)')).join(' | '))
