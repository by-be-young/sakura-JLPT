// 为练习题添加题型字段（文字/語彙/文法），保留注释和格式
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const questionsPath = path.join(__dirname, '../src/data/questions.js')

let content = fs.readFileSync(questionsPath, 'utf-8')

// 匹配每个题目对象，在 id 字段后插入 type
const questionRegex = /(\{\n\s+"id":\s*(\d+),)([\s\S]*?\n\s+\})(,?)/g

let count = 0
content = content.replace(questionRegex, (full, idPart, idStr, body, trailingComma) => {
  const id = Number(idStr)
  // 仅处理练习题（1-730），模拟题不加type
  if (id > 730) return full

  const pos = (id - 1) % 6
  let type
  if (pos === 0 || pos === 1) type = '文字'
  else if (pos === 2 || pos === 3) type = '語彙'
  else type = '文法'

  // 如果已有type字段，先移除
  let newBody = body.replace(/\n\s+"type":\s*"[^"]*",?/g, '')

  // 确定缩进
  const indentMatch = idPart.match(/\n(\s+)"id":/)
  const indent = indentMatch ? indentMatch[1] : '    '

  // 在 id 字段后插入 type
  const newIdPart = idPart + `\n${indent}"type": "${type}",`
  count++
  return newIdPart + newBody + trailingComma
})

fs.writeFileSync(questionsPath, content, 'utf-8')
console.log(`已为 ${count} 道练习题添加题型字段`)
console.log(`题型规则: 每6题一组 -> 1-2文字, 3-4語彙, 5-6文法`)
console.log(`模拟题(731+)未添加题型`)
