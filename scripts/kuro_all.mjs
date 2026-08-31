// 批量 kuroshiro 读音核验：拗音大小写修复
import fs from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const Kuroshiro = require('kuroshiro').default
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji')
const kuroshiro = new Kuroshiro()
await kuroshiro.init(new KuromojiAnalyzer())

const LEVELS = ['N1', 'N2', 'N3', 'N4', 'N5']

function norm(s) {
  return s
    .replace(/ゃ/g, 'や').replace(/ゅ/g, 'ゆ').replace(/ょ/g, 'よ')
    .replace(/ぁ/g, 'あ').replace(/ぃ/g, 'い').replace(/ぅ/g, 'う').replace(/ぇ/g, 'え').replace(/ぉ/g, 'お')
    .replace(/っ/g, 'つ')
}
function hasKanji(s) { return /[\u4e00-\u9fff]/.test(s) }

const allDiffs = {}
for (const lv of LEVELS) {
  const data = JSON.parse(fs.readFileSync(`D:/日语自学网站/${lv}_clean.json`, 'utf-8'))
  let fixed = 0, same = 0, diff = 0
  const diffs = []
  for (const e of data) {
    if (!e.kanji || !hasKanji(e.kanji)) continue
    let std = ''
    try { std = await kuroshiro.convert(e.kanji, { to: 'hiragana' }) } catch { continue }
    const a = norm(e.kana), b = norm(std)
    if (a === b) {
      if (std !== e.kana) { e.kana = std; fixed++ } else same++
    } else {
      diff++
      diffs.push({ kanji: e.kanji, ocr: e.kana, std, meaning: e.meaning.slice(0, 18) })
    }
  }
  fs.writeFileSync(`D:/日语自学网站/${lv}_kuro.json`, JSON.stringify(data, null, 1), 'utf-8')
  fs.writeFileSync(`D:/日语自学网站/${lv}_diffs.json`, JSON.stringify(diffs, null, 1), 'utf-8')
  allDiffs[lv] = diffs
  console.log(`${lv}: 拗音修复 ${fixed} / 一致 ${same} / 不一致 ${diff}`)
}

// 打印各等级不一致前30
for (const lv of LEVELS) {
  const ds = allDiffs[lv]
  console.log(`\n=== ${lv} 不一致前30 ===`)
  for (const d of ds.slice(0, 30)) {
    console.log(`  ${d.kanji} | OCR:${d.ocr} | std:${d.std} | ${d.meaning}`)
  }
}
