// 用 kuroshiro 为 N2 词生成标准读音，与 OCR kana 对比，修复拗音大小写问题
import fs from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const Kuroshiro = require('kuroshiro').default
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji')
const kuroshiro = new Kuroshiro()
await kuroshiro.init(new KuromojiAnalyzer())

const data = JSON.parse(fs.readFileSync('D:/日语自学网站/n2_clean.json', 'utf-8'))

// 拗音大小写归一：小写 → 大写（用于对比）
function norm(s) {
  return s
    .replace(/ゃ/g, 'や').replace(/ゅ/g, 'ゆ').replace(/ょ/g, 'よ')
    .replace(/ぁ/g, 'あ').replace(/ぃ/g, 'い').replace(/ぅ/g, 'う').replace(/ぇ/g, 'え').replace(/ぉ/g, 'お')
    .replace(/っ/g, 'つ')
}

function hasKanji(s) {
  return /[\u4e00-\u9fff]/.test(s)
}

let fixed = 0, same = 0, diff = 0
const diffs = []
for (const e of data) {
  if (!e.kanji || !hasKanji(e.kanji)) continue
  let std = ''
  try {
    std = await kuroshiro.convert(e.kanji, { to: 'hiragana' })
  } catch { continue }
  const a = norm(e.kana)
  const b = norm(std)
  if (a === b) {
    // 仅拗音/大小写差异 → 采用标准读音
    if (std !== e.kana) { e.kana = std; fixed++ }
    else same++
  } else {
    diff++
    diffs.push({ kanji: e.kanji, ocr: e.kana, std, meaning: e.meaning.slice(0, 20) })
  }
  process.stdout.write('.')
}

console.log('\n=== 对比结果 ===')
console.log('一致(拗音修复):', fixed, ' 完全一致:', same, ' 不一致:', diff)
console.log('\n=== 不一致前80条 ===')
for (const d of diffs.slice(0, 80)) {
  console.log(`  ${d.kanji} | OCR:${d.ocr} | std:${d.std} | ${d.meaning}`)
}

fs.writeFileSync('D:/日语自学网站/n2_kuro.json', JSON.stringify(data, null, 1), 'utf-8')
fs.writeFileSync('D:/日语自学网站/n2_diffs.json', JSON.stringify(diffs, null, 1), 'utf-8')
console.log('\n已写 n2_kuro.json / n2_diffs.json')
