// 为 N3 题生成与 N2 一致的振假名（sentenceFurigana / explanationFurigana）
// 用法：node scripts/furigana_n3.mjs [目标文件路径]
// 目标文件默认 src/data/questions-n3.js；生成后覆盖写入
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const Kuroshiro = require('kuroshiro').default
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji')

const kuroshiro = new Kuroshiro()
await kuroshiro.init(new KuromojiAnalyzer())

const target = process.argv[2] || 'D:/日语自学网站/src/data/questions-n3.js'
const fileUrl = 'file:///' + target.replace(/\\/g, '/')
const mod = await import(fileUrl)
const questions = mod.questions
const mockInfo = mod.mockInfo || {}

async function convert(s) {
  try {
    return await kuroshiro.convert(s, { to: 'hiragana', mode: 'furigana' })
  } catch {
    return s
  }
}

let n = 0
for (const q of questions) {
  const plain = (q.sentence || '').replace(/<\/?u>/g, '')
  q.sentenceFurigana = await convert(plain)
  q.explanationFurigana = await convert(q.explanation || '')
  n++
  if (n % 100 === 0) process.stdout.write('.')
}
console.log('\n已生成振假名题数:', n)

const now = new Date().toISOString().slice(0, 10)
const lines = []
lines.push('// 本文件由 scripts/parse_n3.py + scripts/furigana_n3.mjs 自动生成，请勿手改。')
lines.push(`// 生成时间：${now}`)
lines.push('export const questions = [')
for (const q of questions) {
  lines.push('  ' + JSON.stringify(q) + ',')
}
lines.push(']')
lines.push('')
lines.push('// N3 模拟测试暂未开放，保留空结构，补充后在此填写')
lines.push('export const mockInfo = ' + (Object.keys(mockInfo).length ? JSON.stringify(mockInfo) : '{}'))
fs.writeFileSync(target, lines.join('\n') + '\n', 'utf-8')
console.log('已写入:', target)
