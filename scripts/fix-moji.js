// 修复文字题：有( )但无<u>的，替换( )为<u>正确答案</u>
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qPath = path.join(__dirname, '../src/data/questions.js')
let content = fs.readFileSync(qPath, 'utf-8')

const qRegex = /"id":\s*(\d+),\s*"type":\s*"文字",[\s\S]*?"sentence":\s*"((?:[^"\\]|\\.)*)",\s*"options":\s*\[([\s\S]*?)\],\s*"answer":\s*(\d+)/g

let m
const fixes = []
while ((m = qRegex.exec(content)) !== null) {
  const id = Number(m[1])
  const sentence = m[2].replace(/\\"/g, '"')
  const options = JSON.parse('[' + m[3] + ']')
  const answer = Number(m[4])
  const correctOption = options[answer - 1]
  
  if (/\(\s*\)/.test(sentence) && !/<u>/.test(sentence)) {
    const newSentence = sentence.replace(/\(\s*\)/, '<u>' + correctOption + '</u>')
    fixes.push({ id, old: sentence, new: newSentence })
  }
}

console.log('需要修复的文字题(填空->下划线): ' + fixes.length)
fixes.forEach(f => console.log(`题${f.id}: ${f.old.substring(0,35)} -> ${f.new.substring(0,45)}`))

for (const f of fixes) {
  const oldStr = '"sentence": "' + f.old.replace(/"/g, '\\"') + '"'
  const newStr = '"sentence": "' + f.new.replace(/"/g, '\\"') + '"'
  content = content.replace(oldStr, newStr)
}
fs.writeFileSync(qPath, content, 'utf-8')
console.log('\n已修复 ' + fixes.length + ' 题')
