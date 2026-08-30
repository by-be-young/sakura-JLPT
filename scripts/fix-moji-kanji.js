// 从解析提取汉字，修复文字题的下划线（假名->汉字）
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qPath = path.join(__dirname, '../src/data/questions.js')
let content = fs.readFileSync(qPath, 'utf-8')

// 动词活用映射：字典形词尾 -> 连用形/て形/た形
const verbConjugations = {
  // 五段动词
  'く': { renyou: 'き', te: 'いて', ta: 'いた' },
  'ぐ': { renyou: 'ぎ', te: 'いで', ta: 'いだ' },
  'す': { renyou: 'し', te: 'して', ta: 'した' },
  'つ': { renyou: 'ち', te: 'って', ta: 'った' },
  'ぬ': { renyou: 'に', te: 'んで', ta: 'んだ' },
  'ぶ': { renyou: 'び', te: 'んで', ta: 'んだ' },
  'む': { renyou: 'み', te: 'んで', ta: 'んだ' },
  'る': { renyou: 'り', te: 'って', ta: 'った' },
  // 一段动词
  'える': { renyou: 'え', te: 'えて', ta: 'えた' },
  'きる': { renyou: 'き', te: 'きて', ta: 'きた' },
  'ぎる': { renyou: 'ぎ', te: 'ぎて', ta: 'ぎた' },
  'くる': { renyou: 'き', te: 'きて', ta: 'きた' },
  'する': { renyou: 'し', te: 'して', ta: 'した' },
}

// 从解析提取第一个"漢字(読み)"条目
function extractKanjiFromExplanation(explanation, correctReading) {
  // 匹配 "漢字(読み)" 或 "漢・漢字(読み)" 格式
  const patterns = [
    /([\u4e00-\u9faf]{1,6}(?:する|なる|ある|いる|える|くる|ずる)?)\(([\u3040-\u309f]+)\)/,
    /[\u4e00-\u9faf]・([\u4e00-\u9faf]{1,6}(?:する|なる|ある|いる|える|くる|ずる)?)\(([\u3040-\u309f]+)\)/,
  ]
  
  for (const pat of patterns) {
    const m = explanation.match(pat)
    if (m) {
      return { kanji: m[1], reading: m[2] }
    }
  }
  return null
}

// 根据正确选项的读音，找到对应的汉字形式
function findKanjiForm(baseKanji, baseReading, correctOption) {
  // 如果读音完全匹配，直接用baseKanji
  if (baseReading === correctOption) return baseKanji
  
  // 检查是否是动词活用
  // baseKanji可能以る/く/す/つ等结尾
  for (const [ending, forms] of Object.entries(verbConjugations)) {
    if (baseKanji.endsWith(ending) && baseReading.endsWith(ending)) {
      const stemKanji = baseKanji.slice(0, -ending.length)
      const stemReading = baseReading.slice(0, -ending.length)
      
      // 检查每种活用形是否匹配correctOption
      for (const [formName, formEnding] of Object.entries(forms)) {
        if (stemReading + formEnding === correctOption) {
          return stemKanji + formEnding.replace(/[てでただ]/g, ch => {
            // 汉字形式用汉字词尾
            return ch
          })
        }
      }
    }
  }
  
  // 特殊：形容词/形容动词
  // 安易(あんい) -> 安易に(あんいに)
  if (correctOption === baseReading + 'に') return baseKanji + 'に'
  if (correctOption === baseReading + 'な') return baseKanji + 'な'
  if (correctOption === baseReading + 'く') return baseKanji + 'く'
  if (correctOption === baseReading + 'かった') return baseKanji + 'かった'
  
  // 尝试：correctOption可能是baseReading的一部分
  // 例如 baseReading=はぶく, correctOption=はぶき -> 词尾く->き
  if (baseReading.length > 1 && correctOption.length > 1) {
    const commonPrefix = baseReading.split('').reduce((acc, ch, i) => 
      ch === correctOption[i] ? acc + ch : acc, '')
    if (commonPrefix.length >= 2) {
      const stemKanji = baseKanji.slice(0, commonPrefix.length)
      // 尝试直接替换词尾
      const kanjiSuffix = baseKanji.slice(commonPrefix.length)
      const readingSuffix = baseReading.slice(commonPrefix.length)
      const targetSuffix = correctOption.slice(commonPrefix.length)
      
      // 简单映射
      const simpleMap = {
        'く': 'き', 'ぐ': 'ぎ', 'す': 'し', 'つ': 'ち',
        'ぬ': 'に', 'ぶ': 'び', 'む': 'み', 'る': 'り',
        'える': 'え', 'きる': 'き', 'ぎる': 'ぎ',
      }
      if (simpleMap[readingSuffix] === targetSuffix) {
        return stemKanji + simpleMap[readingSuffix]
      }
      // て形/た形
      if (targetSuffix === 'て' || targetSuffix === 'で') {
        const teMap = { 'く': 'いて', 'ぐ': 'いで', 'す': 'して', 'つ': 'って', 'ぬ': 'んで', 'ぶ': 'んで', 'む': 'んで', 'る': 'って' }
        if (teMap[readingSuffix]) return stemKanji + teMap[readingSuffix]
      }
      if (targetSuffix === 'た' || targetSuffix === 'だ') {
        const taMap = { 'く': 'いた', 'ぐ': 'いだ', 'す': 'した', 'つ': 'った', 'ぬ': 'んだ', 'ぶ': 'んだ', 'む': 'んだ', 'る': 'った' }
        if (taMap[readingSuffix]) return stemKanji + taMap[readingSuffix]
      }
    }
  }
  
  return null
}

// 找到所有文字题中下划线内容是假名的
const qRegex = /"id":\s*(\d+),\s*"type":\s*"文字",[\s\S]*?"sentence":\s*"((?:[^"\\]|\\.)*)",\s*"options":\s*\[([\s\S]*?)\],\s*"answer":\s*(\d+),[\s\S]*?"explanation":\s*"((?:[^"\\]|\\.)*)"/g

let m
const fixes = []
while ((m = qRegex.exec(content)) !== null) {
  const id = Number(m[1])
  const sentence = m[2].replace(/\\"/g, '"')
  const options = JSON.parse('[' + m[3] + ']')
  const answer = Number(m[4])
  const explanation = m[5].replace(/\\"/g, '"')
  const correctOption = options[answer - 1]
  
  // 检查下划线内容是否是纯假名
  const uMatch = sentence.match(/<u>([\u3040-\u309f\u30a0-\u30ff]+)<\/u>/)
  if (!uMatch) continue
  
  // 从解析提取汉字
  const extracted = extractKanjiFromExplanation(explanation, correctOption)
  if (!extracted) {
    console.log(`题${id}: 无法从解析提取汉字`)
    continue
  }
  
  // 找到正确的汉字形式
  const kanjiForm = findKanjiForm(extracted.kanji, extracted.reading, correctOption)
  if (!kanjiForm) {
    console.log(`题${id}: 无法确定汉字形式 (base=${extracted.kanji}(${extracted.reading}), target=${correctOption})`)
    continue
  }
  
  const newSentence = sentence.replace(uMatch[0], '<u>' + kanjiForm + '</u>')
  fixes.push({ id, old: sentence, new: newSentence, kanjiForm, base: extracted.kanji, baseReading: extracted.reading, correctOption })
}

console.log(`\n需要修复 ${fixes.length} 题`)
fixes.forEach(f => console.log(`题${f.id}: ${f.base}(${f.baseReading}) -> <u>${f.kanjiForm}</u> (读音${f.correctOption})`))

// 应用修复
for (const f of fixes) {
  const oldStr = '"sentence": "' + f.old.replace(/"/g, '\\"') + '"'
  const newStr = '"sentence": "' + f.new.replace(/"/g, '\\"') + '"'
  content = content.replace(oldStr, newStr)
}
fs.writeFileSync(qPath, content, 'utf-8')
console.log(`\n已修复 ${fixes.length} 题`)
