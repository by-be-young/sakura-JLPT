// 从格式文本提取正确题干，与题库对比，输出需要修正的题目
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 读取4个格式文本
const fmtFiles = [
  { path: path.join(__dirname, 'fmt_红蓝宝书 1000题 N2 （超清版本）_1-100.txt'), start: 1, end: 100 },
  { path: path.join(__dirname, 'fmt_红蓝宝书 1000题 N2 （超清版本）_101-200.txt'), start: 101, end: 200 },
  { path: path.join(__dirname, 'fmt_红蓝宝书 1000题 N2 （超清版本）_201-300.txt'), start: 201, end: 300 },
  { path: path.join(__dirname, 'fmt_红蓝宝书 1000题 N2 （超清版本）_301-337.txt'), start: 301, end: 337 },
]

// 从格式文本提取问题区题干
function extractQuestions(fmtPath, start, end) {
  const content = fs.readFileSync(fmtPath, 'utf-8')
  const lines = content.split('\n')
  const result = {}
  
  // 找到问题区开始（"問題"标记后），答案区开始（"正解"标记后停止）
  let inQuestion = false
  let inAnswer = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // 检测区域标记
    if (/^問題\s*$/.test(line)) { inQuestion = true; inAnswer = false; continue }
    if (/正解/.test(line) && /^\d+\s*[-－]\s*\d+/.test(line)) { inQuestion = false; inAnswer = true; continue }
    if (/^\d+\s*[-－]\s*\d+\s*正解/.test(line)) { inQuestion = false; inAnswer = true; continue }
    
    if (!inQuestion) continue
    
    // 匹配题号行：格式如 "001", "00   3", "101" 等
    // 题号后是题干内容
    const qMatch = line.match(/^0*(\d{1,3})\s+(.+)$/)
    if (!qMatch) continue
    
    const id = Number(qMatch[1])
    if (id < start || id > end) continue
    if (result[id]) continue // 只取第一次出现（问题区）
    
    let sentence = qMatch[2].trim()
    
    // 清理：去掉行内XML残留
    sentence = sentence.replace(/<w:.*?>/g, '')
    // 规范化填空：(       ) -> ( )
    sentence = sentence.replace(/\(\s+\)/g, '( )')
    // 去掉多余空格
    sentence = sentence.replace(/\s+/g, ' ')
    
    // 跳过纯数字行（选项行）
    if (/^[\d\s]+$/.test(sentence)) continue
    // 跳过区域标签行
    if (/^(文字|語\s*彙|語\s*量|文法)\s*$/.test(sentence)) continue
    
    if (sentence.length > 5) {
      result[id] = sentence
    }
  }
  
  return result
}

// 提取所有格式文本中的题干
const allExtracted = {}
for (const f of fmtFiles) {
  const extracted = extractQuestions(f.path, f.start, f.end)
  Object.assign(allExtracted, extracted)
}

console.log(`从格式文本提取到 ${Object.keys(allExtracted).length} 道题干`)

// 读取当前题库
const questionsPath = path.join(__dirname, '../src/data/questions.js')
let content = fs.readFileSync(questionsPath, 'utf-8')

// 解析当前题库的题干
const currentSentences = {}
const qRegex = /"id":\s*(\d+),[\s\S]*?"sentence":\s*"((?:[^"\\]|\\.)*)"/g
let m
while ((m = qRegex.exec(content)) !== null) {
  const id = Number(m[1])
  if (id <= 337) {
    currentSentences[id] = m[2].replace(/\\"/g, '"')
  }
}

// 对比找出不一致的
const mismatches = []
for (const id of Object.keys(allExtracted).map(Number).sort((a,b) => a-b)) {
  const extracted = allExtracted[id]
  const current = currentSentences[id]
  if (!current) continue
  
  // 比较：去掉格式标记后比较纯文本
  const extPlain = extracted.replace(/<\/?u>/g, '').replace(/\(\s*\)/g, '___')
  const curPlain = current.replace(/<\/?u>/g, '').replace(/\(\s*\)/g, '___')
  
  if (extPlain !== curPlain || extracted !== current) {
    // 检查是否只是格式差异
    const onlyFormatDiff = extPlain === curPlain
    mismatches.push({ id, extracted, current, onlyFormatDiff })
  }
}

console.log(`\n发现 ${mismatches.length} 道题干不一致`)
console.log(`其中仅格式差异(下划线/填空): ${mismatches.filter(m => m.onlyFormatDiff).length}`)
console.log(`内容也有差异: ${mismatches.filter(m => !m.onlyFormatDiff).length}`)

// 输出前20个不一致的详情
console.log('\n--- 前20个不一致详情 ---')
for (const mm of mismatches.slice(0, 20)) {
  console.log(`\n题${mm.id} [${mm.onlyFormatDiff ? '仅格式' : '内容+格式'}]:`)
  console.log(`  原文: ${mm.extracted}`)
  console.log(`  当前: ${mm.current}`)
}

// 保存修正列表
const fixList = mismatches.map(mm => ({
  id: mm.id,
  oldSentence: mm.current,
  newSentence: mm.extracted
}))
fs.writeFileSync(path.join(__dirname, 'sentence-fixes.json'), JSON.stringify(fixList, null, 2), 'utf-8')
console.log(`\n修正列表已保存到 scripts/sentence-fixes.json`)
