// 自动修复题型格式：
// 文字题：从sentenceFurigana找到与正确选项读音匹配的ruby，对应汉字加<u>
// 語彙/文法题：在句子中找到正确选项文本，替换为( )
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const questionsPath = path.join(__dirname, '../src/data/questions.js')
let content = fs.readFileSync(questionsPath, 'utf-8')

// 解析所有题目
const qRegex = /"id":\s*(\d+),\s*"type":\s*"([^"]*)",[\s\S]*?"sentence":\s*"((?:[^"\\]|\\.)*)",\s*"options":\s*\[([\s\S]*?)\],\s*"answer":\s*(\d+),[\s\S]*?"sentenceFurigana":\s*"((?:[^"\\]|\\.)*)"/g

const questions = []
let m
while ((m = qRegex.exec(content)) !== null) {
  questions.push({
    id: Number(m[1]),
    type: m[2],
    sentence: m[3].replace(/\\"/g, '"'),
    options: JSON.parse('[' + m[4] + ']'),
    answer: Number(m[5]),
    sentenceFurigana: m[6].replace(/\\"/g, '"'),
    start: m.index,
    end: m.index + m[0].length
  })
}

console.log(`解析到 ${questions.length} 道题`)

let fixedCount = 0
const unfixed = []

// 从后往前替换，避免索引偏移
for (let i = questions.length - 1; i >= 0; i--) {
  const q = questions[i]
  if (q.mock || q.id > 730) continue
  
  const correctOption = q.options[q.answer - 1]
  let newSentence = q.sentence
  let fixed = false
  
  if (q.type === '文字') {
    // 文字题：需要<u>下划线
    if (/<u>/.test(q.sentence)) continue // 已有下划线
    
    // 从sentenceFurigana找到与正确选项匹配的ruby
    // ruby格式: <ruby>漢字<rp>(</rp><rt>かんじ</rt><rp>)</rp></ruby>
    const rubyRegex = /<ruby>([^<]+)<rp>[^<]*<\/rp><rt>([^<]+)<\/rt><rp>[^<]*<\/rp><\/ruby>/g
    let rm
    let targetKanji = null
    while ((rm = rubyRegex.exec(q.sentenceFurigana)) !== null) {
      const kanji = rm[1]
      const reading = rm[2]
      if (reading === correctOption) {
        targetKanji = kanji
        break
      }
    }
    
    if (targetKanji && q.sentence.includes(targetKanji)) {
      // 找到目标汉字，加下划线
      newSentence = q.sentence.replace(targetKanji, '<u>' + targetKanji + '</u>')
      fixed = true
    } else {
      // 尝试部分匹配：正确选项可能是多个ruby的组合
      // 找到连续的ruby段，其读音组合等于正确选项
      const allRubies = []
      rubyRegex.lastIndex = 0
      while ((rm = rubyRegex.exec(q.sentenceFurigana)) !== null) {
        allRubies.push({ kanji: rm[1], reading: rm[2], index: rm.index })
      }
      // 尝试连续2-3个ruby的组合
      for (let len = 2; len <= 3 && len <= allRubies.length; len++) {
        for (let j = 0; j <= allRubies.length - len; j++) {
          const combo = allRubies.slice(j, j + len)
          const comboReading = combo.map(r => r.reading).join('')
          const comboKanji = combo.map(r => r.kanji).join('')
          if (comboReading === correctOption && q.sentence.includes(comboKanji)) {
            newSentence = q.sentence.replace(comboKanji, '<u>' + comboKanji + '</u>')
            fixed = true
            break
          }
        }
        if (fixed) break
      }
    }
    
    if (!fixed) {
      // 最后尝试：直接在句子中找可能的汉字词（2-4个汉字）
      const kanjiWords = q.sentence.match(/[\u4e00-\u9faf]{2,4}/g) || []
      // 用振假名数据反查
      for (const kw of kanjiWords) {
        // 在furigana中找这个词的读音
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const furiMatch = q.sentenceFurigana.match(new RegExp('<ruby>' + escaped + '<rp>[^<]*</rp><rt>([^<]+)</rt>'))
        if (furiMatch && furiMatch[1] === correctOption) {
          newSentence = q.sentence.replace(kw, '<u>' + kw + '</u>')
          fixed = true
          break
        }
      }
    }
    
  } else if (q.type === '語彙' || q.type === '文法') {
    // 語彙/文法题：需要( )填空
    if (/\(\s*\)|（\s*）/.test(q.sentence)) continue // 已有填空
    
    // 在句子中找到正确选项并替换为( )
    // 先尝试精确匹配
    if (q.sentence.includes(correctOption)) {
      newSentence = q.sentence.replace(correctOption, '( )')
      fixed = true
    } else {
      // 尝试部分匹配：选项可能是词干，句子中是活用形
      // 取选项的前2-3个字符作为词根
      for (let len = Math.min(4, correctOption.length); len >= 2; len--) {
        const stem = correctOption.substring(0, len)
        if (stem.length < 2) continue
        const idx = q.sentence.indexOf(stem)
        if (idx >= 0) {
          // 找到词根，尝试扩展匹配到完整的活用形
          // 从词根位置向后取到标点或空格
          let endIdx = idx + stem.length
          while (endIdx < q.sentence.length && /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(q.sentence[endIdx])) {
            endIdx++
          }
          const matched = q.sentence.substring(idx, endIdx)
          if (matched.length >= stem.length) {
            newSentence = q.sentence.substring(0, idx) + '( )' + q.sentence.substring(endIdx)
            fixed = true
            break
          }
        }
      }
    }
    
    if (!fixed) {
      // 尝试反向：选项可能包含汉字，句子中是假名形式
      // 或者选项是短语，句子中顺序不同
      // 尝试选项中的每个词
      const words = correctOption.split(/[\s・]/).filter(w => w.length > 0)
      for (const w of words) {
        if (w.length >= 2 && q.sentence.includes(w)) {
          newSentence = q.sentence.replace(w, '( )')
          fixed = true
          break
        }
      }
    }
  }
  
  if (fixed) {
    // 替换content中的sentence
    const oldSentenceStr = '"sentence": "' + q.sentence.replace(/"/g, '\\"') + '"'
    const newSentenceStr = '"sentence": "' + newSentence.replace(/"/g, '\\"') + '"'
    content = content.replace(oldSentenceStr, newSentenceStr)
    fixedCount++
    console.log(`题${q.id} [${q.type}] 已修复: ${q.sentence.substring(0,30)}... -> ${newSentence.substring(0,30)}...`)
  } else {
    unfixed.push({ id: q.id, type: q.type, sentence: q.sentence, correctOption })
  }
}

fs.writeFileSync(questionsPath, content, 'utf-8')
console.log(`\n共修复 ${fixedCount} 道题`)
console.log(`未修复 ${unfixed.length} 道题`)
if (unfixed.length > 0) {
  console.log('\n--- 未修复题目 ---')
  unfixed.forEach(u => console.log(`题${u.id} [${u.type}] 答案:${u.correctOption} 题干:${u.sentence.substring(0,40)}`))
}
