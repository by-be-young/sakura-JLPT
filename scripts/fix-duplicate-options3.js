// 简单粗暴修复剩余重复选项：直接生成4个不同选项
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qPath = path.join(__dirname, '../src/data/questions.js')
const { questions } = await import('file:///' + qPath.replace(/\\/g, '/'))
let content = fs.readFileSync(qPath, 'utf-8')

const allKana = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ'

function genDistinct(correct, count, existing) {
  const results = []
  const used = new Set(existing)
  // 策略1：改首字母
  for (const ch of allKana) {
    if (results.length >= count) break
    if (ch === correct[0]) continue
    const cand = ch + correct.slice(1)
    if (!used.has(cand) && cand.length === correct.length) { results.push(cand); used.add(cand) }
  }
  // 策略2：改尾字母
  if (results.length < count && correct.length > 1) {
    for (const ch of allKana) {
      if (results.length >= count) break
      if (ch === correct[correct.length - 1]) continue
      const cand = correct.slice(0, -1) + ch
      if (!used.has(cand)) { results.push(cand); used.add(cand) }
    }
  }
  // 策略3：改中间字母
  if (results.length < count && correct.length > 2) {
    for (let pos = 1; pos < correct.length - 1; pos++) {
      for (const ch of allKana) {
        if (results.length >= count) break
        if (ch === correct[pos]) continue
        const cand = correct.slice(0, pos) + ch + correct.slice(pos + 1)
        if (!used.has(cand)) { results.push(cand); used.add(cand) }
      }
    }
  }
  // 策略4：加长/缩短
  if (results.length < count) {
    for (const ch of allKana) {
      if (results.length >= count) break
      const cand = correct + ch
      if (!used.has(cand)) { results.push(cand); used.add(cand) }
    }
  }
  return results.slice(0, count)
}

let fixedCount = 0

for (const q of questions) {
  if (new Set(q.options).size === 4) continue
  
  const correct = q.options[q.answer - 1]
  const newOpts = [null, null, null, null]
  newOpts[q.answer - 1] = correct
  const used = new Set([correct])
  
  // 先保留原选项中不重复的
  for (let i = 0; i < 4; i++) {
    if (i === q.answer - 1) continue
    if (!used.has(q.options[i])) {
      newOpts[i] = q.options[i]
      used.add(q.options[i])
    }
  }
  
  // 为剩余空位生成不同选项
  const needCount = newOpts.filter(x => x === null).length
  if (needCount > 0) {
    const replacements = genDistinct(correct, needCount, used)
    let idx = 0
    for (let i = 0; i < 4; i++) {
      if (newOpts[i] === null) {
        newOpts[i] = replacements[idx++]
        used.add(newOpts[i])
      }
    }
  }
  
  // 验证
  if (new Set(newOpts).size < 4) {
    console.log(`题${q.id}: 失败 ${JSON.stringify(newOpts)}`)
    continue
  }
  
  // 应用
  const idPattern = '"id": ' + q.id + ','
  const idIdx = content.indexOf(idPattern)
  if (idIdx < 0) continue
  const optsStart = content.indexOf('"options":', idIdx)
  if (optsStart < 0) continue
  const arrStart = content.indexOf('[', optsStart)
  const arrEnd = content.indexOf(']', arrStart) + 1
  
  const newArrStr = JSON.stringify(newOpts, null, 2)
    .replace(/\n/g, '\n    ')
    .replace(/^\[/, '[\n      ')
    .replace(/\]$/, '\n    ]')
  
  content = content.substring(0, arrStart) + newArrStr + content.substring(arrEnd)
  fixedCount++
  console.log(`题${q.id}: ${JSON.stringify(q.options)} -> ${JSON.stringify(newOpts)}`)
}

fs.writeFileSync(qPath, content, 'utf-8')
console.log(`\n共修复 ${fixedCount} 题`)
