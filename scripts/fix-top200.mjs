import fs from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const Kuroshiro = require('kuroshiro').default
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji')

const kuroshiro = new Kuroshiro()
await kuroshiro.init(new KuromojiAnalyzer())

const FILE = 'D:/日语自学网站/src/data/words.js'
const src = fs.readFileSync(FILE, 'utf-8')
const startMarker = 'export const words = ['
const startIdx = src.indexOf(startMarker)
const endIdx = src.indexOf('\n]', startIdx)
if (startIdx < 0 || endIdx < 0) { console.error('无法定位 words 数组'); process.exit(1) }
const header = src.slice(0, startIdx) + startMarker
const tail = src.slice(endIdx + 2)

const tmpFile = 'D:/日语自学网站/scripts/_words_tmp.mjs'
fs.writeFileSync(tmpFile, 'import { words } from "file:///D:/日语自学网站/src/data/words.js"\nexport { words }\n')
const mod = await import('file:///D:/日语自学网站/scripts/_words_tmp.mjs?t=' + Date.now())
const words = mod.words

async function convert(s) {
  try {
    return await kuroshiro.convert(s, { to: 'hiragana', mode: 'furigana' })
  } catch (e) {
    console.error('转换失败:', s, e.message)
    return s
  }
}

// ========== 人工核对的修正规则 ==========
// kanji/kana: 直接替换字段
// exReplace: { 旧jp: 新jp 或 { jp, zh } }
// exRemove: 要删除的例句 jp 列表
const fixes = {
  66:  { exReplace: { 'ん才さ 相方。': '漫才 相方。' } },
  67:  { kana: 'あいきょう', exReplace: { '愛嬬を振りまく。': '愛嬌を振りまく。' } },
  69:  { kanji: '愛顧' },
  75:  { exReplace: { '乳 製 品 メ ー カ ー を 相 手 取 っ て 訴 訟 を 起 こ Lた。': '乳製品メーカーを相手取って訴訟を起こした。' } },
  77:  { kana: 'あいま', exReplace: { 'あまりに(も)静かなので、かえって 集L ちゆ中う できない。': 'あまりに(も)静かなので、かえって集中できない。' } },
  78:  { kanji: 'あえて' },
  79:  { exReplace: { '\\ iangle 指示を仰く。': '指示を仰ぐ。' } },
  87:  { kanji: '空き巣', exReplace: { '空き巢被害。': '空き巣被害。' } },
  102: { exRemove: ['財産目当てで結婚するなんて浅ましい。', '浅ましい世の中。'] },
  103: { exRemove: ['財産目当てで結婚するなんて浅ましい。', '浅ましい世の中。'] },
  111: { exReplace: { '值をつける。': '値をつける。' } },
  122: { exReplace: { '\\ iangle 声 相手の気合に圧倒される。': '相手の気合に圧倒される。' } },
  123: { exReplace: { '\\ iangle 压倒的な勝利。': '圧倒的な勝利。' } },
  125: { kana: 'あっぱく' },
  130: { kanji: '跡継ぎ', exReplace: { '店の跡继ぎがいない。': '店の跡継ぎがいない。' } },
  133: { kanji: '暴く', exReplace: { '不正を暴<。': '不正を暴く。' } },
  140: { kanji: '甘える', exRemove: ['承蒙。'] },
  142: { kanji: '歩む' },
  168: { exReplace: { '彼のプロポーズは案の定断られてしまっ\\ iangle。': { jp: '彼のプロポーズは案の定断られてしまった。', zh: '他的求婚果然被拒绝了。' } } },
  181: { kanji: '萎縮', exReplace: { '\\ iangle 寒くて手足が萎缩する。': '寒くて手足が萎縮する。' } },
  198: { exReplace: { '\\ iangle一切の責任を負う。': '一切の責任を負う。' } },
}

const modifyIds = Object.keys(fixes).map(Number)
let applied = 0
for (const w of words) {
  if (!modifyIds.includes(w.id)) continue
  const f = fixes[w.id]
  if (f.kanji) w.kanji = f.kanji
  if (f.kana) w.kana = f.kana
  if (w.examples && Array.isArray(w.examples)) {
    if (f.exRemove) {
      w.examples = w.examples.filter(ex => !f.exRemove.includes(ex.jp))
    }
    if (f.exReplace) {
      w.examples = w.examples.map(ex => {
        const r = f.exReplace[ex.jp]
        if (!r) return ex
        if (typeof r === 'string') return { ...ex, jp: r }
        return { ...ex, ...r }
      })
    }
    // 重新生成例句振假名
    for (const ex of w.examples) {
      if (ex.jp) ex.jpFurigana = await convert(ex.jp)
      if (ex.blankFurigana) {
        const target = w.kanji || w.kana
        const masked = ex.jp.replace(target, '____')
        ex.blankFurigana = masked === ex.jp ? '' : await convert(masked)
      }
    }
  }
  // kanji 变化时重新生成单词振假名
  if (f.kanji && w.kanji) w.kanjiFurigana = await convert(w.kanji)
  applied++
  process.stdout.write('.')
}
console.log('\n已修正词条：', applied)

// ========== 序列化（保留所有字段） ==========
function serObj(o) {
  const parts = []
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined) continue
    parts.push(`${k}: ${JSON.stringify(v)}`)
  }
  return `{ ${parts.join(', ')} }`
}
const newArr = words.map(w => {
  const parts = []
  for (const [k, v] of Object.entries(w)) {
    if (v === undefined) continue
    if (k === 'examples') {
      const exs = v.map(serObj).join(', ')
      parts.push(`examples: [${exs}]`)
    } else {
      parts.push(`${k}: ${JSON.stringify(v)}`)
    }
  }
  return `  { ${parts.join(', ')} },`
}).join('\n')
const out = header + '\n' + newArr + '\n]' + tail

// 语法自检
import { execFileSync } from 'node:child_process'
const checkFile = 'D:/日语自学网站/scripts/_check_out.mjs'
fs.writeFileSync(checkFile, out)
try {
  execFileSync(process.execPath, ['--check', checkFile], { encoding: 'utf-8' })
  console.log('语法自检通过')
} catch (e) {
  console.error('语法自检失败，放弃写回：', (e.stderr || e.message).toString().split('\n').slice(0, 6).join('\n'))
  fs.unlinkSync(checkFile)
  process.exit(1)
}
fs.unlinkSync(checkFile)

fs.writeFileSync(FILE, out, 'utf-8')
fs.unlinkSync(tmpFile)
console.log('已写入 words.js')
