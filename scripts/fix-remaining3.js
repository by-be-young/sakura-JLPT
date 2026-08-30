// 用振假名数据反查，修复剩余格式问题
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qPath = path.join(__dirname, '../src/data/questions.js')
const { questions } = await import('file:///' + qPath.replace(/\\/g, '/'))
let content = fs.readFileSync(qPath, 'utf-8')

// 从furigana提取所有ruby段（汉字+读音），按在furigana中的顺序
function parseFurigana(furigana) {
  const segments = []
  const re = /<ruby>([^<]+)<rp>[^<]*<\/rp><rt>([^<]+)<\/rt><rp>[^<]*<\/rp><\/ruby>/g
  let m
  while ((m = re.exec(furigana)) !== null) {
    segments.push({ kanji: m[1], reading: m[2], index: m.index })
  }
  return segments
}

// 在句子中找到目标汉字，返回其在句子中的位置和长度
function findKanjiInSentence(kanji, sentence, startFrom = 0) {
  const idx = sentence.indexOf(kanji, startFrom)
  return idx >= 0 ? { start: idx, end: idx + kanji.length, text: kanji } : null
}

let fixedCount = 0
const unfixed = []

for (const q of questions) {
  if (q.mock || q.id > 730 || !q.type) continue
  
  const hasU = /<u>/.test(q.sentence)
  const hasBlank = /\(\s*\)|（\s*）/.test(q.sentence)
  const correctOption = q.options[q.answer - 1]
  
  let needFix = false
  if (q.type === '文字' && !hasU) needFix = true
  if ((q.type === '語彙' || q.type === '文法') && !hasBlank) needFix = true
  if (!needFix) continue
  
  if (!q.sentenceFurigana) {
    unfixed.push({ id: q.id, type: q.type, reason: '无振假名数据', correctOption, sentence: q.sentence })
    continue
  }
  
  const segments = parseFurigana(q.sentenceFurigana)
  if (segments.length === 0) {
    unfixed.push({ id: q.id, type: q.type, reason: '振假名无ruby', correctOption, sentence: q.sentence })
    continue
  }
  
  // 方法1：单个ruby段的读音完全匹配答案
  let targetKanji = null
  for (const seg of segments) {
    if (seg.reading === correctOption && q.sentence.includes(seg.kanji)) {
      targetKanji = seg.kanji
      break
    }
  }
  
  // 方法2：连续多个ruby段的读音组合匹配答案
  if (!targetKanji) {
    for (let len = 2; len <= Math.min(5, segments.length); len++) {
      for (let i = 0; i <= segments.length - len; i++) {
        const combo = segments.slice(i, i + len)
        const comboReading = combo.map(s => s.reading).join('')
        const comboKanji = combo.map(s => s.kanji).join('')
        if (comboReading === correctOption && q.sentence.includes(comboKanji)) {
          targetKanji = comboKanji
          break
        }
      }
      if (targetKanji) break
    }
  }
  
  // 方法3：答案包含在某个ruby段读音中（如答案=ちかった, ruby=ちか, 后面的った是okurigana）
  if (!targetKanji) {
    for (const seg of segments) {
      if (correctOption.startsWith(seg.reading) && q.sentence.includes(seg.kanji)) {
        // 扩展：kanji后面跟着的假名也包含进去
        const idx = q.sentence.indexOf(seg.kanji)
        if (idx >= 0) {
          let end = idx + seg.kanji.length
          while (end < q.sentence.length && /[\u3040-\u309f]/.test(q.sentence[end])) {
            end++
          }
          const extended = q.sentence.substring(idx, end)
          // 检查extended的读音是否匹配答案（用furigana验证）
          targetKanji = extended
          break
        }
      }
    }
  }
  
  // 方法4：直接在句子中找答案（如果答案包含汉字）
  if (!targetKanji && /[\u4e00-\u9faf]/.test(correctOption) && q.sentence.includes(correctOption)) {
    targetKanji = correctOption
  }
  
  if (!targetKanji) {
    unfixed.push({ id: q.id, type: q.type, reason: '未找到匹配汉字', correctOption, sentence: q.sentence })
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
    console.log(`题${q.id} [${q.type}] "${targetKanji}"(${correctOption}) -> ${q.type === '文字' ? '<u>'+targetKanji+'</u>' : '( )'}`)
  } else {
    unfixed.push({ id: q.id, type: q.type, reason: '原句未找到', correctOption, sentence: q.sentence })
  }
}

fs.writeFileSync(qPath, content, 'utf-8')
console.log(`\n共修复 ${fixedCount} 题`)
console.log(`未修复 ${unfixed.length} 题`)
if (unfixed.length > 0) {
  console.log('\n--- 未修复 ---')
  unfixed.forEach(u => console.log(`题${u.id} [${u.type}] ${u.reason||''} 答案=${u.correctOption} | ${u.sentence.substring(0,50)}`))
}
