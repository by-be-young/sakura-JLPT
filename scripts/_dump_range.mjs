import fs from 'fs'
const { words } = await import('file:///D:/日语自学网站/src/data/words.js?t=' + Date.now())
const lo = Number(process.argv[2]), hi = Number(process.argv[3])
const top = words.filter(w => w.id >= lo && w.id <= hi)
const lines = []
for (const w of top) {
  const p = Array.isArray(w.pitch) ? w.pitch.join('/') : (w.pitch ?? '')
  lines.push(`[${w.id}] ${w.kanji || '∅'} | ${w.kana} | 音${p} | ${w.pos||''}`)
  lines.push(`  义: ${w.meaning || ''}`)
  if (w.examples && w.examples.length) w.examples.forEach((ex, i) => lines.push(`  例${i+1}: ${ex.jp}   →  ${ex.zh}`))
}
fs.writeFileSync(`D:/日语自学网站/scripts/_c${hi}.txt`, lines.join('\n'), 'utf-8')
console.log('written', top.length)
