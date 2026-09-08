// 为听解 Unit9 数据生成振假名（ruby）与读音（kana）
// 用法：node scripts/gen_furi_unit9.mjs
import fs from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const Kuroshiro = require('kuroshiro').default
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji')

const kuroshiro = new Kuroshiro()
await kuroshiro.init(new KuromojiAnalyzer())

const DIR = 'D:/日语自学网站/src/data/listening/unit9'

function hasKanji(s) {
  return /[\u4e00-\u9fff]/.test(s)
}
// 中文文本（跳过注音）：汉字为主且假名稀少
function isChinese(s) {
  const han = (s.match(/[\u4e00-\u9fff]/g) || []).length
  const kana = (s.match(/[\u3040-\u30ff]/g) || []).length
  return han > kana
}
async function furiOf(s) {
  if (!s) return ''
  try { return await kuroshiro.convert(s, { to: 'hiragana', mode: 'furigana' }) } catch { return '' }
}

// ===== words（空，跳过） =====
const wMod = await import('file:///' + DIR + '/words.js')
const words = wMod.default
for (const g of words.groups) {
  for (const item of g.list) {
    item.kana = await furiOf(item.w)
    item.furi = await furiOf(item.w)
  }
}
fs.writeFileSync(DIR + '/words.js',
  '// 听解 Unit9 Part2 攻略編 Unit1 課題理解 · 词汇板块（本单元为攻略编，无独立词汇表）\n' +
  '// 来源：绿宝书《新日本语能力考试N2听解（详解+练习）》Part2 攻略編 Unit1 課題理解\n' +
  'export default ' + JSON.stringify(words, null, 2) + '\n', 'utf-8')

// ===== questions =====
const qMod = await import('file:///' + DIR + '/questions.js')
const questions = qMod.default
for (const sec of questions.sections) {
  for (const item of sec.items || []) {
    if (item.text && hasKanji(item.text)) item.textFuri = await furiOf(item.text)
    if (item.script && hasKanji(item.script)) item.scriptFuri = await furiOf(item.script)
    // 词汇 w 注音（vocab 的 m 为中文释义，不注音）
    for (const v of item.vocab || []) {
      v.wFuri = ''
      if (v.w && hasKanji(v.w) && !isChinese(v.w)) v.wFuri = await furiOf(v.w)
    }
    // 精讲段落：日文为主的段落注音（中文段落跳过）
    for (const a of item.analysis || []) {
      a.tFuri = ''
      if (a.t && hasKanji(a.t) && !isChinese(a.t)) a.tFuri = await furiOf(a.t)
    }
  }
}
fs.writeFileSync(DIR + '/questions.js',
  '// 听解 Unit9 Part2 攻略編 Unit1 課題理解 · 题目板块（問題401-420）\n' +
  '// 来源：绿宝书《新日本语能力考试N2听解（详解+练习）》Part2 攻略編 Unit1 課題理解 书页98-127\n' +
  '// - sections: 例題解説（401-405）＋実践練習 その1-3（406-420）；type select 四选一\n' +
  '// - 每题：text 场景+提问 / options 选项 / answer 答案 / script 听力原文 / vocab 词汇 / analysis 精讲\n' +
  'export default ' + JSON.stringify(questions, null, 2) + '\n', 'utf-8')

// ===== knowledge =====
const kMod = await import('file:///' + DIR + '/knowledge.js')
const knowledge = kMod.default
const FORCE_FURI = {
  '～前に': '<ruby>前<rp>(</rp><rt>まえ</rt><rp>)</rp></ruby>',
  '～次第': '<ruby>次第<rp>(</rp><rt>しだい</rt><rp>)</rp></ruby>',
}
for (const part of knowledge.parts) {
  if (part.kind === 'card') {
    for (const it of part.items || []) {
      it.patternFuri = ''
      if (it.pattern && hasKanji(it.pattern) && !isChinese(it.pattern) && !/^[名動いイナな]/.test(it.pattern)) {
        it.patternFuri = await furiOf(it.pattern)
      }
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
      if (FORCE_FURI[p.l]) p.lFuri = FORCE_FURI[p.l]
      else if (p.l && hasKanji(p.l) && !isCnCol(0) && !isChinese(p.l)) p.lFuri = await furiOf(p.l)
      if (FORCE_FURI[p.r]) p.rFuri = FORCE_FURI[p.r]
      else if (p.r && hasKanji(p.r) && !isCnCol(2) && !isChinese(p.r)) p.rFuri = await furiOf(p.r)
      if (p.le && hasKanji(p.le) && !isCnCol(1) && !isChinese(p.le)) p.leFuri = await furiOf(p.le)
      if (p.re && hasKanji(p.re) && !isCnCol(3) && !isChinese(p.re)) p.reFuri = await furiOf(p.re)
    }
  }
}
fs.writeFileSync(DIR + '/knowledge.js',
  '// 听解 Unit9 Part2 攻略編 Unit1 課題理解 · 补充知识（試験対策）\n' +
  '// 来源：绿宝书《新日本语能力考试N2听解（详解+练习）》Part2 攻略編 Unit1 課題理解 书页98-103\n' +
  '// - parts: 翻页部分；kind: card 表现卡片 / table 表格；qrPages: 音频二维码页\n' +
  'export default ' + JSON.stringify(knowledge, null, 2) + '\n', 'utf-8')

console.log('furi done')
