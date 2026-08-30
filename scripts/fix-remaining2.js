// 直接import题库，修复剩余格式问题
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qPath = path.join(__dirname, '../src/data/questions.js')

// 动态导入题库
const { questions } = await import('file:///' + qPath.replace(/\\/g, '/'))
let content = fs.readFileSync(qPath, 'utf-8')

// 从解析提取汉字词（支持多种格式）
function extractKanjiFromExplanation(explanation) {
  const results = []
  // 格式1: "漢字(読み) 释义"
  const re1 = /([\u4e00-\u9faf]{1,6}(?:する|なる|ある|いる|える|くる|ずる|よい|ない|しい)?)\(([\u3040-\u309f]{1,8})\)/g
  let m
  while ((m = re1.exec(explanation)) !== null) {
    results.push({ kanji: m[1], reading: m[2] })
  }
  // 格式2: "漢・漢字 / 释义" 或 "漢字 / 释义"（读音在振假名中）
  const re2 = /([\u4e00-\u9faf]・)?([\u4e00-\u9faf]{1,6}(?:する|なる|ある|いる|える|くる|ずる|よい|ない|しい)?)\s*\//g
  while ((m = re2.exec(explanation)) !== null) {
    const kanji = m[2]
    // 从振假名字段获取读音
    results.push({ kanji, reading: null }) // 标记为需要从furigana获取
  }
  return results
}

// 从sentenceFurigana获取汉字的读音
function getReadingFromFurigana(kanji, furigana) {
  const escaped = kanji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp('<ruby>' + escaped + '<rp>[^<]*</rp><rt>([^<]+)</rt>')
  const m = furigana.match(re)
  return m ? m[1] : null
}

// 动词活用形查找
function findConjugatedForm(baseKanji, baseReading, targetReading, sentence) {
  const allEndings = {
    'く': ['き','いて','いた'], 'ぐ': ['ぎ','いで','いだ'],
    'す': ['し','して','した'], 'つ': ['ち','って','った'],
    'ぬ': ['に','んで','んだ'], 'ぶ': ['び','んで','んだ'],
    'む': ['み','んで','んだ'], 'る': ['り','って','った'],
    'える': ['え','えて','えた'], 'きる': ['き','きて','きた'],
    'ぎる': ['ぎ','ぎて','ぎた'], 'じる': ['じ','じて','じた'],
    'ける': ['け','けて','けた'], 'げる': ['げ','げて','げた'],
    'せる': ['せ','せて','せた'], 'てる': ['て','てて','てた'],
    'でる': ['で','でて','でた'], 'ねる': ['ね','ねて','ねた'],
    'める': ['め','めて','めた'], 'れる': ['れ','れて','れた'],
    'する': ['し','して','した','さ'], 'くる': ['き','きて','きた'],
    'ある': ['あり','あって','あった'],
  }
  
  for (const [end, forms] of Object.entries(allEndings)) {
    if (baseKanji.endsWith(end) && baseReading && baseReading.endsWith(end)) {
      const sk = baseKanji.slice(0, -end.length)
      const sr = baseReading.slice(0, -end.length)
      for (const f of forms) {
        if (sr + f === targetReading) {
          const cand = sk + f
          if (sentence.includes(cand)) return cand
        }
      }
    }
  }
  // 形容词
  if (baseReading) {
    if (targetReading === baseReading + 'に' && sentence.includes(baseKanji + 'に')) return baseKanji + 'に'
    if (targetReading === baseReading + 'な' && sentence.includes(baseKanji + 'な')) return baseKanji + 'な'
    if (targetReading === baseReading + 'く' && sentence.includes(baseKanji + 'く')) return baseKanji + 'く'
    if (targetReading === baseReading + 'かった' && sentence.includes(baseKanji + 'かった')) return baseKanji + 'かった'
  }
  return null
}

let fixedCount = 0
const unfixed = []

for (const q of questions) {
  if (q.mock || q.id > 730) continue
  if (!q.type) continue
  
  const hasU = /<u>/.test(q.sentence)
  const hasBlank = /\(\s*\)|（\s*）/.test(q.sentence)
  const correctOption = q.options[q.answer - 1]
  
  let needFix = false
  if (q.type === '文字' && !hasU) needFix = true
  if ((q.type === '語彙' || q.type === '文法') && !hasBlank) needFix = true
  if (!needFix) continue
  
  // 从解析提取汉字词
  const kanjiList = extractKanjiFromExplanation(q.explanation)
  
  // 为没有读音的条目从furigana获取
  for (const item of kanjiList) {
    if (!item.reading && q.sentenceFurigana) {
      item.reading = getReadingFromFurigana(item.kanji, q.sentenceFurigana)
    }
  }
  
  // 找到匹配的汉字形式
  let targetKanji = null
  
  // 1. 精确匹配
  for (const item of kanjiList) {
    if (item.reading === correctOption && q.sentence.includes(item.kanji)) {
      targetKanji = item.kanji
      break
    }
  }
  
  // 2. 动词活用
  if (!targetKanji) {
    for (const item of kanjiList) {
      if (!item.reading) continue
      const result = findConjugatedForm(item.kanji, item.reading, correctOption, q.sentence)
      if (result) { targetKanji = result; break }
    }
  }
  
  // 3. 直接在句子中找答案（如果答案是汉字词）
  if (!targetKanji && /[\u4e00-\u9faf]/.test(correctOption) && q.sentence.includes(correctOption)) {
    targetKanji = correctOption
  }
  
  // 4. 从furigana反查：找句子中汉字的读音等于correctOption
  if (!targetKanji && q.sentenceFurigana) {
    const rubyRe = /<ruby>([^<]+)<rp>[^<]*<\/rp><rt>([^<]+)<\/rt>/g
    let rm
    while ((rm = rubyRe.exec(q.sentenceFurigana)) !== null) {
      if (rm[2] === correctOption && q.sentence.includes(rm[1])) {
        targetKanji = rm[1]
        break
      }
    }
  }
  
  if (!targetKanji) {
    unfixed.push({ id: q.id, type: q.type, correctOption, sentence: q.sentence })
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
  if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr)
    fixedCount++
    console.log(`题${q.id} [${q.type}] ${targetKanji}(${correctOption}) -> ${q.type === '文字' ? '<u>'+targetKanji+'</u>' : '( )'}`)
  } else {
    unfixed.push({ id: q.id, type: q.type, reason: '原句未找到', correctOption, sentence: q.sentence })
  }
}

fs.writeFileSync(qPath, content, 'utf-8')
console.log(`\n共修复 ${fixedCount} 题`)
console.log(`未修复 ${unfixed.length} 题`)
if (unfixed.length > 0) {
  console.log('\n--- 未修复 ---')
  unfixed.forEach(u => console.log(`题${u.id} [${u.type}] 答案=${u.correctOption} | ${u.sentence.substring(0,45)}`))
}
