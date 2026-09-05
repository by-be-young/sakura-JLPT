// 为读解题库生成振假名：articleFurigana / 每题 stemFurigana / 难句 sentenceFurigana
// 用法：node scripts/gen_reading_furigana.mjs
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const Kuroshiro = require('kuroshiro').default
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji')

const kuroshiro = new Kuroshiro()
await kuroshiro.init(new KuromojiAnalyzer())

const target = 'D:/日语自学网站/src/data/reading-n2.js'
const fileUrl = 'file:///' + target.replace(/\\/g, '/')
const mod = await import(fileUrl)
const readings = mod.readingN2

async function convert(s) {
  if (!s) return s
  try {
    return await kuroshiro.convert(s, { to: 'hiragana', mode: 'furigana' })
  } catch {
    return s
  }
}

let n = 0
for (const r of readings) {
  r.articleFurigana = await convert(r.article)
  for (const q of r.questions) {
    q.stemFurigana = await convert(q.stem)
    q.optionFurigana = []
    for (const opt of q.options) {
      q.optionFurigana.push(await convert(opt))
    }
    n++
  }
  for (const a of r.analysis || []) {
    a.sentenceFurigana = await convert(a.sentence)
  }
}
console.log('已生成振假名：', readings.length, '篇 /', n, '题')

const lines = []
lines.push('// 读解题库（N2）：橙宝书《新日本语能力考试N2读解》· 基础编')
lines.push('// - 每篇文章：article（【n】为句号标记，渲染为上标）、translation（全文翻译/文章概要）、analysis（难句分析）')
lines.push('// - 判断题已转为两个选项的选择题（合っている / 合っていない）')
lines.push('// - 语汇/语法预习（読む前に）与改写题不收录')
lines.push('// - 振假名由 scripts/gen_reading_furigana.mjs 自动生成，请勿手改')
lines.push('export const readingN2 = [')
for (const r of readings) {
  lines.push('  ' + JSON.stringify(r) + ',')
}
lines.push(']')
fs.writeFileSync(target, lines.join('\n') + '\n', 'utf-8')
console.log('已写入:', target)
