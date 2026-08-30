// 修复重复选项：从解析提取汉字词读音，生成4个不同选项
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qPath = path.join(__dirname, '../src/data/questions.js')
const { questions } = await import('file:///' + qPath.replace(/\\/g, '/'))
let content = fs.readFileSync(qPath, 'utf-8')

// 从解析提取所有"汉字(读音)"或"漢・漢字(读音)"条目
function extractReadings(explanation) {
  const readings = []
  // 格式1: 汉字(读音)
  const re1 = /([\u4e00-\u9faf]{1,6}(?:する|なる|ある|いる|える|くる|ずる|よい|ない|しい|かった)?)\(([\u3040-\u309f]{1,10})\)/g
  let m
  while ((m = re1.exec(explanation)) !== null) {
    if (m[2].length >= 2) readings.push(m[2])
  }
  // 格式2: 漢・漢字 / 释义 (读音需要从furigana获取，这里跳过)
  return [...new Set(readings)]
}

// 常见的易混淆读音生成器（用于选项不足时）
function generateDistractors(correct, count) {
  const distractors = []
  // 替换第一个假名
  const firstKana = correct[0]
  const similarKana = {
    'あ': 'いうえお', 'い': 'あうえお', 'う': 'あいえお', 'え': 'あいうお', 'お': 'あいうえ',
    'か': 'きくけこが', 'き': 'かくけこぎ', 'く': 'かきけこぐ', 'け': 'かきくこげ', 'こ': 'かきくけご',
    'さ': 'しすせそざ', 'し': 'さすせそじ', 'す': 'さしせそず', 'せ': 'さしすそぜ', 'そ': 'さしすせぞ',
    'た': 'ちつてとだ', 'ち': 'たつてとぢ', 'つ': 'たちてとづ', 'て': 'たちつとで', 'と': 'たちつてど',
    'な': 'にぬねの', 'に': 'なぬねの', 'ぬ': 'なにねの', 'ね': 'なにぬの', 'の': 'なにぬね',
    'は': 'ひふへほばぱ', 'ひ': 'はふへほびぴ', 'ふ': 'はひへほぶぷ', 'へ': 'はひふほべぺ', 'ほ': 'はひふへぼぽ',
    'ま': 'みむめも', 'み': 'まむめも', 'む': 'まみめも', 'め': 'まみむも', 'も': 'まみむめ',
    'や': 'ゆよ', 'ゆ': 'やよ', 'よ': 'やゆ',
    'ら': 'りるれろ', 'り': 'らるれろ', 'る': 'らりれろ', 'れ': 'らりるろ', 'ろ': 'らりるれ',
    'わ': 'をん', 'を': 'わん', 'ん': 'わを',
    'が': 'ぎぐげごか', 'ぎ': 'がぐげごき', 'ぐ': 'がぎげごく', 'げ': 'がぎぐごけ', 'ご': 'がぎぐげこ',
    'ざ': 'じずぜぞさ', 'じ': 'ざずぜぞし', 'ず': 'ざじぜぞす', 'ぜ': 'ざじずぞせ', 'ぞ': 'ざじずぜそ',
    'だ': 'ぢづでどた', 'ぢ': 'だづでどち', 'づ': 'だぢでどつ', 'で': 'だぢづどて', 'ど': 'だぢづでと',
    'ば': 'びぶべぼはぱ', 'び': 'ばぶべぼひぴ', 'ぶ': 'ばびべぼふぷ', 'べ': 'ばびぶぼへぺ', 'ぼ': 'ばびぶべほぽ',
    'ぱ': 'ぴぷぺぽはば', 'ぴ': 'ぱぷぺぽひび', 'ぷ': 'ぱぴぺぽふぶ', 'ぺ': 'ぱぴぷぽへべ', 'ぽ': 'ぱぴぷぺほぼ',
  }
  const similar = similarKana[firstKana] || 'あいうえおかきくけこ'
  for (const ch of similar) {
    if (distractors.length >= count) break
    const d = ch + correct.slice(1)
    if (d !== correct && d.length === correct.length) distractors.push(d)
  }
  // 替换最后一个假名
  if (distractors.length < count && correct.length > 1) {
    const lastKana = correct[correct.length - 1]
    const similarLast = similarKana[lastKana] || 'あいうえお'
    for (const ch of similarLast) {
      if (distractors.length >= count) break
      const d = correct.slice(0, -1) + ch
      if (d !== correct && !distractors.includes(d)) distractors.push(d)
    }
  }
  return distractors.slice(0, count)
}

let fixedCount = 0
const fixedDetails = []

for (const q of questions) {
  const opts = q.options
  const unique = new Set(opts)
  if (unique.size === 4) continue // 没有重复
  
  const correctOption = opts[q.answer - 1]
  
  // 从解析提取读音
  const readings = extractReadings(q.explanation)
  // 过滤掉正确答案和太短的
  const candidates = readings.filter(r => r !== correctOption && r.length >= 2)
  
  // 构建新选项数组
  const newOpts = [...opts]
  const usedValues = new Set([correctOption])
  
  for (let i = 0; i < 4; i++) {
    if (i === q.answer - 1) continue // 正确答案位置保持不变
    if (unique.has(newOpts[i]) && newOpts[i] !== correctOption) {
      // 这个选项是唯一的，保留
      usedValues.add(newOpts[i])
    } else {
      // 重复选项，需要替换
      let replacement = null
      // 优先从解析中找
      for (const r of candidates) {
        if (!usedValues.has(r)) { replacement = r; break }
      }
      // 解析中不够，生成干扰项
      if (!replacement) {
        const distractors = generateDistractors(correctOption, 5)
        for (const d of distractors) {
          if (!usedValues.has(d)) { replacement = d; break }
        }
      }
      // 最后手段：加数字后缀
      if (!replacement) {
        replacement = correctOption + '_' + (i + 1)
      }
      newOpts[i] = replacement
      usedValues.add(replacement)
    }
  }
  
  // 检查是否还有重复
  const newUnique = new Set(newOpts)
  if (newUnique.size < 4) {
    console.log(`题${q.id}: 仍有重复，跳过`)
    continue
  }
  
  // 应用修改
  const oldOptsStr = '"options": ' + JSON.stringify(opts, null, 2).replace(/\n/g, '\n    ')
  // 简化：直接替换数组内容
  const oldArray = JSON.stringify(opts)
  const newArray = JSON.stringify(newOpts)
  
  // 在content中找到这个题目的options并替换
  const idPattern = '"id": ' + q.id + ','
  const idIdx = content.indexOf(idPattern)
  if (idIdx < 0) continue
  
  // 找到options字段
  const optsStart = content.indexOf('"options":', idIdx)
  if (optsStart < 0) continue
  const arrStart = content.indexOf('[', optsStart)
  const arrEnd = content.indexOf(']', arrStart) + 1
  
  const oldArrStr = content.substring(arrStart, arrEnd)
  const newArrStr = JSON.stringify(newOpts, null, 2)
    .replace(/\n/g, '\n    ')
    .replace(/^\[/, '[\n      ')
    .replace(/\]$/, '\n    ]')
  
  content = content.substring(0, arrStart) + newArrStr + content.substring(arrEnd)
  fixedCount++
  fixedDetails.push({ id: q.id, old: opts, new: newOpts })
}

fs.writeFileSync(qPath, content, 'utf-8')
console.log(`\n共修复 ${fixedCount} 题的重复选项`)
console.log('--- 前20题修复详情 ---')
fixedDetails.slice(0, 20).forEach(d => {
  console.log(`题${d.id}: ${JSON.stringify(d.old)} -> ${JSON.stringify(d.new)}`)
})
