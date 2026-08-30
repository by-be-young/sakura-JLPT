// 综合修复剩余格式问题：
// 文字题：从解析找汉字词，在句子中加<u>
// 語彙/文法题：从解析找汉字词，在句子中替换为( )
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qPath = path.join(__dirname, '../src/data/questions.js')
let content = fs.readFileSync(qPath, 'utf-8')

// 从解析提取所有"漢字(読み)"条目
function extractAllKanji(explanation) {
  const results = []
  // 匹配各种格式："漢字(読み)"、"漢・漢字(読み)"、"漢字(読み) 释义"
  const regex = /([\u4e00-\u9faf]{1,6}(?:する|なる|ある|いる|える|くる|ずる|よい|ない|しい|かった)?)\(([\u3040-\u309f]{1,8})\)/g
  let m
  while ((m = regex.exec(explanation)) !== null) {
    results.push({ kanji: m[1], reading: m[2] })
  }
  return results
}

// 找到与目标读音匹配的汉字词（支持动词活用）
function findMatchingKanji(kanjiList, targetReading, sentence) {
  // 先精确匹配
  for (const item of kanjiList) {
    if (item.reading === targetReading && sentence.includes(item.kanji)) {
      return item.kanji
    }
  }
  
  // 尝试动词活用：字典形 -> 连用形/て形/た形
  const verbEndings = {
    'く': ['き', 'いて', 'いた'], 'ぐ': ['ぎ', 'いで', 'いだ'],
    'す': ['し', 'して', 'した'], 'つ': ['ち', 'って', 'った'],
    'ぬ': ['に', 'んで', 'んだ'], 'ぶ': ['び', 'んで', 'んだ'],
    'む': ['み', 'んで', 'んだ'], 'る': ['り', 'って', 'った'],
  }
  const ichidanEndings = {
    'える': ['え', 'えて', 'えた'], 'きる': ['き', 'きて', 'きた'],
    'ぎる': ['ぎ', 'ぎて', 'ぎた'], 'じる': ['じ', 'じて', 'じた'],
    'びる': ['び', 'びて', 'びた'], 'みる': ['み', 'みて', 'みた'],
    'ける': ['け', 'けて', 'けた'], 'げる': ['げ', 'げて', 'げた'],
    'せる': ['せ', 'せて', 'せた'], 'ぜる': ['ぜ', 'ぜて', 'ぜた'],
    'てる': ['て', 'てて', 'てた'], 'でる': ['で', 'でて', 'でた'],
    'ねる': ['ね', 'ねて', 'ねた'], 'へる': ['へ', 'へて', 'へた'],
    'める': ['め', 'めて', 'めた'], 'れる': ['れ', 'れて', 'れた'],
  }
  const specialEndings = {
    'する': ['し', 'して', 'した', 'さ'], 'くる': ['き', 'きて', 'きた'],
    'ある': ['あり', 'あって', 'あった'], 'ない': ['なく', 'なかった'],
    'よい': ['よく', 'よかった'], 'いい': ['よく', 'よかった'],
  }
  
  function tryConjugation(item, endingMap) {
    for (const [dictEnding, forms] of Object.entries(endingMap)) {
      if (item.kanji.endsWith(dictEnding) && item.reading.endsWith(dictEnding)) {
        const stemK = item.kanji.slice(0, -dictEnding.length)
        const stemR = item.reading.slice(0, -dictEnding.length)
        for (const form of forms) {
          if (stemR + form === targetReading) {
            const candidate = stemK + form
            if (sentence.includes(candidate)) return candidate
          }
        }
      }
    }
    return null
  }
  
  for (const item of kanjiList) {
    let result = tryConjugation(item, verbEndings)
    if (result) return result
    result = tryConjugation(item, ichidanEndings)
    if (result) return result
    result = tryConjugation(item, specialEndings)
    if (result) return result
    
    // 形容词/形容动词
    if (targetReading === item.reading + 'に' && sentence.includes(item.kanji + 'に')) return item.kanji + 'に'
    if (targetReading === item.reading + 'な' && sentence.includes(item.kanji + 'な')) return item.kanji + 'な'
    if (targetReading === item.reading + 'く' && sentence.includes(item.kanji + 'く')) return item.kanji + 'く'
    if (targetReading === item.reading + 'かった' && sentence.includes(item.kanji + 'かった')) return item.kanji + 'かった'
  }
  
  // 最后：尝试在句子中找包含目标读音汉字的词
  // 用振假名数据反查
  return null
}

// 解析所有题目
const qRegex = /"id":\s*(\d+),\s*"type":\s*"([^"]*)",[\s\S]*?"sentence":\s*"((?:[^"\\]|\\.)*)",\s*"options":\s*\[([\s\S]*?)\],\s*"answer":\s*(\d+),[\s\S]*?"explanation":\s*"((?:[^"\\]|\\.)*)"/g

let m
const allQuestions = []
while ((m = qRegex.exec(content)) !== null) {
  allQuestions.push({
    id: Number(m[1]),
    type: m[2],
    sentence: m[3].replace(/\\"/g, '"'),
    options: JSON.parse('[' + m[4] + ']'),
    answer: Number(m[5]),
    explanation: m[6].replace(/\\"/g, '"'),
  })
}

let fixedCount = 0
const unfixed = []

for (const q of allQuestions) {
  if (q.mock || q.id > 730) continue
  
  const hasU = /<u>/.test(q.sentence)
  const hasBlank = /\(\s*\)|（\s*）/.test(q.sentence)
  const correctOption = q.options[q.answer - 1]
  
  let needFix = false
  if (q.type === '文字' && !hasU) needFix = true
  if ((q.type === '語彙' || q.type === '文法') && !hasBlank) needFix = true
  if (!needFix) continue
  
  // 从解析提取汉字词
  const kanjiList = extractAllKanji(q.explanation)
  if (kanjiList.length === 0) {
    unfixed.push({ id: q.id, type: q.type, reason: '解析无汉字条目', sentence: q.sentence })
    continue
  }
  
  // 找到匹配的汉字形式
  const targetKanji = findMatchingKanji(kanjiList, correctOption, q.sentence)
  
  if (!targetKanji) {
    unfixed.push({ id: q.id, type: q.type, reason: '未找到匹配汉字', correctOption, sentence: q.sentence, kanjiList: kanjiList.slice(0,3) })
    continue
  }
  
  // 应用修复
  let newSentence
  if (q.type === '文字') {
    newSentence = q.sentence.replace(targetKanji, '<u>' + targetKanji + '</u>')
  } else {
    newSentence = q.sentence.replace(targetKanji, '( )')
  }
  
  const oldStr = '"sentence": "' + q.sentence.replace(/"/g, '\\"') + '"'
  const newStr = '"sentence": "' + newSentence.replace(/"/g, '\\"') + '"'
  content = content.replace(oldStr, newStr)
  fixedCount++
  console.log(`题${q.id} [${q.type}] ${targetKanji}(${correctOption}) -> ${q.type === '文字' ? '<u>'+targetKanji+'</u>' : '( )'}`)
}

fs.writeFileSync(qPath, content, 'utf-8')
console.log(`\n共修复 ${fixedCount} 题`)
console.log(`未修复 ${unfixed.length} 题`)
if (unfixed.length > 0) {
  console.log('\n--- 未修复 ---')
  unfixed.forEach(u => console.log(`题${u.id} [${u.type}] ${u.reason}: 答案=${u.correctOption} | ${u.sentence.substring(0,40)}`))
}
