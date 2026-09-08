// 为听解 Unit5 数据生成振假名（ruby）与读音（kana）
// 用法：node scripts/gen_furi_unit5.mjs
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const Kuroshiro = require('kuroshiro').default
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji')

const kuroshiro = new Kuroshiro()
await kuroshiro.init(new KuromojiAnalyzer())

const DIR = 'D:/日语自学网站/src/data/listening/unit5'

// 个别词注音修正（生成后覆盖）
const MANUAL_FIX = {
}

function hasKanji(s) {
  return /[\u4e00-\u9fff]/.test(s)
}
// 中文文本（跳过注音）：汉字为主且假名稀少（如说明文字中夹杂"ない""が"等）
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
function manualW(item, w) {
  const m = MANUAL_FIX[w]
  if (m) { item.furi = m.furi; item.kana = m.kana; return true }
  return false
}

// ===== words =====
const wordsMod = await import('file:///' + DIR + '/words.js')
const words = wordsMod.default
for (const g of words.groups) {
  for (const item of g.list) {
    if (manualW(item, item.w)) continue
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
    if (item.text && hasKanji(item.text)) item.textFuri = await furiOf(item.text)
    if (item.script && hasKanji(item.script)) item.scriptFuri = await furiOf(item.script)
    if (item.answer && hasKanji(item.answer)) item.answerFuri = await furiOf(item.answer)
    if (item.kanji && hasKanji(item.kanji)) item.kanjiFuri = await furiOf(item.kanji)
    for (const a of item.answers || []) {
      if (a.answer && hasKanji(a.answer)) a.answerFuri = await furiOf(a.answer)
      if (a.plain && hasKanji(a.plain)) a.plainFuri = await furiOf(a.plain)
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

// ===== knowledge =====
const kMod = await import('file:///' + DIR + '/knowledge.js')
const knowledge = kMod.default
for (const part of knowledge.parts) {
  for (const p of part.pairs || []) {
    p.lFuri = ''; p.rFuri = ''; p.leFuri = ''; p.reFuri = ''
  }
}
for (const part of knowledge.parts) {
  const head = part.head || ['', '', '', '']
  // 表头含"説明/说明/译文/中文"的列为中文内容列，不做振假名（head 顺序: l, le, r, re）
  const isCnCol = (i) => /説明|说明|译文|中文/.test(head[i] || '')
  for (const p of part.pairs || []) {
    if (p.l && hasKanji(p.l) && !isCnCol(0)) p.lFuri = await furiOf(p.l)
    if (p.le && hasKanji(p.le) && !isCnCol(1)) p.leFuri = await furiOf(p.le)
    if (p.r && hasKanji(p.r) && !isCnCol(2)) p.rFuri = await furiOf(p.r)
    if (p.re && hasKanji(p.re) && !isCnCol(3)) p.reFuri = await furiOf(p.re)
  }
}

// ===== write back =====
async function writeJs(mod, file) {
  const header = fs.readFileSync(path.join(DIR, file), 'utf-8').split('export default')[0]
  fs.writeFileSync(path.join(DIR, file), header + 'export default ' + JSON.stringify(mod, null, 2) + '\n')
  console.log('written', file)
}
await writeJs(words, 'words.js')
await writeJs(questions, 'questions.js')
await writeJs(knowledge, 'knowledge.js')
console.log('Unit5 振假名生成完成')
console.log('词汇示例:', words.groups[0].list[0].w, '→', words.groups[0].list[0].furi || '(无)')
console.log('conv 236 answer:', questions.sections[4].convs[0].answers[0])
