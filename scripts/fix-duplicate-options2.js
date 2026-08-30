// 修复剩余53题重复选项：将重复项改为相似但不同的选项
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qPath = path.join(__dirname, '../src/data/questions.js')
const { questions } = await import('file:///' + qPath.replace(/\\/g, '/'))
let content = fs.readFileSync(qPath, 'utf-8')

// 生成相似但不同的选项
function makeSimilar(original, existing, index) {
  const kanaTable = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'
  const dakuten = 'がぎぐげござじずぜぞだぢづでどばびぶべぼ'
  const handakuten = 'ぱぴぷぺぽ'
  
  // 尝试修改第一个假名
  for (const ch of kanaTable + dakuten + handakuten) {
    if (original[0] === ch) continue
    const candidate = ch + original.slice(1)
    if (!existing.has(candidate)) return candidate
  }
  // 尝试修改最后一个假名
  if (original.length > 1) {
    for (const ch of kanaTable + dakuten + handakuten) {
      if (original[original.length - 1] === ch) continue
      const candidate = original.slice(0, -1) + ch
      if (!existing.has(candidate)) return candidate
    }
  }
  // 尝试插入一个假名
  const insertPos = Math.min(1, original.length)
  for (const ch of kanaTable) {
    const candidate = original.slice(0, insertPos) + ch + original.slice(insertPos)
    if (!existing.has(candidate)) return candidate
  }
  // 最后手段：加后缀
  return original + '_' + (index + 1)
}

let fixedCount = 0

for (const q of questions) {
  const opts = q.options
  if (new Set(opts).size === 4) continue
  
  const correctOption = opts[q.answer - 1]
  const newOpts = [...opts]
  const usedValues = new Set([correctOption])
  
  // 先保留唯一的选项
  for (let i = 0; i < 4; i++) {
    if (i === q.answer - 1) continue
    if (opts[i] !== correctOption && !usedValues.has(opts[i])) {
      usedValues.add(opts[i])
    }
  }
  
  // 替换重复项
  for (let i = 0; i < 4; i++) {
    if (i === q.answer - 1) continue
    if (usedValues.has(newOpts[i]) && newOpts[i] !== correctOption) {
      // 这个选项已经被用过了（重复），需要替换
      // 找一个唯一的选项作为模板
      const template = [...usedValues].find(v => v !== correctOption) || correctOption
      const replacement = makeSimilar(template, usedValues, i)
      newOpts[i] = replacement
      usedValues.add(replacement)
    } else if (!usedValues.has(newOpts[i])) {
      usedValues.add(newOpts[i])
    }
  }
  
  // 验证
  if (new Set(newOpts).size < 4) {
    console.log(`题${q.id}: 仍有重复 ${JSON.stringify(newOpts)}`)
    continue
  }
  
  // 应用修改
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
  console.log(`题${q.id}: ${JSON.stringify(opts)} -> ${JSON.stringify(newOpts)}`)
}

fs.writeFileSync(qPath, content, 'utf-8')
console.log(`\n共修复 ${fixedCount} 题`)
