import fs from 'fs'
const mod = await import('file:///D:/日语自学网站/src/data/words.js?t=' + Date.now())
const words = mod.words
const top = words.filter(w => w.id >= 4001 && w.id <= 4200)
const lines = []
for (const w of top) {
  const p = Array.isArray(w.pitch) ? w.pitch.join('/') : (w.pitch ?? '')
  lines.push(`[${w.id}] ${w.kanji || '∅'} | ${w.kana} | 音${p} | ${w.pos||''}`)
  lines.push(`  义: ${w.meaning || ''}`)
  if (w.examples && w.examples.length) w.examples.forEach((ex, i) => lines.push(`  例${i+1}: ${ex.jp}   →  ${ex.zh}`))
}
fs.writeFileSync('D:/日语自学网站/scripts/_c4200.txt', lines.join('\n'), 'utf-8')
console.log('written', top.length)
