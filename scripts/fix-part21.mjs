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
const relStartIdx = src.indexOf('export const wordRelations = {')
const relEndIdx = src.indexOf('\n}', relStartIdx)
if ([startIdx, endIdx, relStartIdx, relEndIdx].some(i => i < 0)) { console.error('定位失败'); process.exit(1) }
const header = src.slice(0, startIdx) + startMarker
const mid = src.slice(endIdx + 2, relStartIdx + 'export const wordRelations = {'.length)
const tail2 = src.slice(relEndIdx + 2)

const tmpFile = 'D:/日语自学网站/scripts/_words_tmp.mjs'
fs.writeFileSync(tmpFile, 'import { words, wordRelations } from "file:///D:/日语自学网站/src/data/words.js"\nexport { words, wordRelations }\n')
const mod = await import('file:///D:/日语自学网站/scripts/_words_tmp.mjs?t=' + Date.now())
const words = mod.words
const wordRelations = mod.wordRelations

async function convert(s) {
  try { return await kuroshiro.convert(s, { to: 'hiragana', mode: 'furigana' }) } catch (e) { return s }
}

const fixes = {
  3806: { kanji: '鉢' },
  3811: { kana: 'はっしゃ' },
  3814: { meaning: '发电' },
  3815: { kana: 'ばなし', exReplace: { '世け間ん話。': { jp: '世間話。', zh: '闲聊,闲谈,家常。' } } },
  3816: { kana: 'はなはだしい' },
  3825: { meaning: '找回,退还' },
  3849: { exRemove: ['降低;使......后退;撤回ねだん。', '值段を引き下げる。', '提案を引き下げる。', '悲劇に終わる。'] },
  3851: { meaning: '继续;紧接着,连续', exReplace: { '婴前儿方回心に引き続き とうろ討論んする。': { jp: '前回に引き続き討論する。', zh: '紧接着上一次继续讨论。' } } },
  3852: { meaning: '劝阻,挽留', exRemove: ['日頃の積み重ねが大事だ。'] },
  3858: { kanji: '引っ掛かる', meaning: '勾住;受骗', exRemove: ['電話線を引張る。', 'けい警きつ察に引っ張られる。'], exReplace: { '詐欺に引掛かる。': { jp: '詐欺に引っ掛かる。', zh: '遭受诈骗。' } } },
  3859: { kanji: '引っ掛ける', exReplace: { 'ハンカーにコートを引っ掛ける。': { jp: 'ハンガーにコートを引っ掛ける。', zh: '把外套挂在衣架上。' } } },
  3870: { meaning: '讽刺,挖苦' },
  3876: { meaning: '微妙的,难以表达的' },
  3882: { kana: 'ひょうばん' },
  3887: { meaning: '宽敞,辽阔' },
  3898: { kana: 'ふく', exReplace: { '副。': { jp: '副社長。', zh: '副社长。' } } },
  3903: { kana: 'ふくらむ' },
  3909: { kanji: '塞ぐ', kana: 'ふさぐ' },
  3912: { meaning: '武士,有武艺,从事军事的人', exRemove: ['惯用。'] },
  3919: { exReplace: { '緣が切れる。': { jp: '縁が切れる。', zh: '缘分已尽。' } } },
  3921: { exReplace: { 'おんしん音信不通。': { jp: '音信不通。', zh: '杳无音信。' } } },
  3922: { meaning: '物质' },
  3923: { meaning: '不太平,(社会)不安定' },
  3925: { meaning: '意外,偶然;无意中' },
  3926: { meaning: '不动产' },
  3929: { exReplace: { '不平不满。': { jp: '不平不満。', zh: '忿忿不平。' } } },
  3930: { exReplace: { '普逼的な真理。': { jp: '普遍的な真理。', zh: '普遍真理。' } } },
  3932: { exReplace: { '正体不明。': { jp: '正体不明。', zh: '真实身份不详。' } } },
  3936: { exReplace: { 'かばんを ら下げる。': { jp: 'かばんをぶら下げる。', zh: '拎包。' } } },
  3941: { meaning: '注音假名' },
  3943: { meaning: '不好;品行不佳', exReplace: { '不良し少よ うん。': { jp: '不良少年。', zh: '不良少年。' } } },
  3944: { kanji: '振るう', meaning: '(他)挥动;充分发挥', exReplace: { '暴力を振う。': { jp: '暴力を振るう。', zh: '使用暴力。' }, '商壳が振う。': { jp: '商売が振るう。', zh: '生意兴隆。' } } },
  3947: { kanji: 'ブローチ', kana: 'ブローチ' },
  3950: { kana: 'ぶんかい', meaning: '拆开,拆卸' },
  3951: { kana: 'ぶんげい', exReplace: { '文 芸 雑。': { jp: '文芸雑誌。', zh: '文艺杂志。' } } },
  3952: { exReplace: { '財布を粉失する。': { jp: '財布を紛失する。', zh: '遗失钱包。' } } },
  3954: { kanji: '噴水', exReplace: { '噴水が。': { jp: '噴水が出る。', zh: '喷泉在喷水。' } } },
  3974: { exReplace: { '酒を飲むと别人になる。': { jp: '酒を飲むと別人になる。', zh: '(他)一喝酒就感觉是变了个人。' } } },
  3979: { kana: 'へんかく' },
  3982: { kana: 'へんどう', exReplace: { '社会が変動す る。': { jp: '社会が変動する。', zh: '社会动荡。' } } },
  3983: { meaning: '辩论,争辩' },
  3990: { exReplace: { '防 炎 訓 練。': { jp: '防災訓練。', zh: '防灾演习。' } } },
  3993: { exReplace: { '一 定 の 方 式 従 う。': { jp: '一定の方式に従う。', zh: '遵循一定的方式。' } } },
  3995: { meaning: '法则,规范;定律' },
  3998: { meaning: '放着不管,搁置' },
  4000: { exReplace: { '防犯カメラ。': { jp: '防犯カメラ。', zh: '监控探头。' } } },
}

const modifyIds = Object.keys(fixes).map(Number)
let applied = 0
for (const w of words) {
  if (!modifyIds.includes(w.id)) continue
  const f = fixes[w.id]
  if (f.kanji) w.kanji = f.kanji
  if (f.kana) w.kana = f.kana
  if (f.meaning) w.meaning = f.meaning
  if (w.examples && Array.isArray(w.examples)) {
    if (f.exRemove) w.examples = w.examples.filter(ex => !f.exRemove.includes(ex.jp))
    if (f.exReplace) w.examples = w.examples.map(ex => { const r = f.exReplace[ex.jp]; return r ? { ...ex, ...r } : ex })
  }
  if (f.kanji || f.kana || f.exReplace || f.exRemove) {
    if (w.kanji) w.kanjiFurigana = await convert(w.kanji)
    if (w.examples) for (const ex of w.examples) if (ex.jp) ex.jpFurigana = await convert(ex.jp)
  }
  applied++
}
console.log('已修正词条：', applied)

const relAdd = {
  3804: { syn: [['成し遂げる', 'なしとげる']] },
  3809: { syn: [['述べる', 'のべる']] },
  3812: { syn: [['起こる', 'おこる']] },
  3817: { syn: [['離れる', 'はなれる']] },
  3818: { syn: [['跳ぶ', 'とぶ']] },
  3823: { syn: [['流行', 'はやり']] },
  3824: { syn: [['納める', 'おさめる']] },
  3825: { syn: [['返す', 'かえす']] },
  3828: { syn: [['意気込む', 'いきごむ']] },
  3831: { syn: [['映す', 'うつす']] },
  3832: { ant: [['衰退', 'すいたい']] },
  3837: { syn: [['違反する', 'いはんする']] },
  3838: { syn: [['内省', 'ないせい']], rel: [['内省', 'ないせい']] },
  3839: { syn: [['判断', 'はんだん']] },
  3841: { rel: [['全能', 'ぜんのう']] },
  3842: { syn: [['売る', 'うる']] },
  3845: { syn: [['損害', 'そんがい']] },
  3846: { ant: [['引き下げる', 'ひきさげる']] },
  3848: { ant: [['引き上げる', 'ひきあげる']] },
  3849: { ant: [['喜劇', 'きげき']] },
  3853: { ant: [['勇敢', 'ゆうかん']] },
  3854: { rel: [['試合', 'しあい']] },
  3860: { rel: [['メモ']] },
  3862: { rel: [['通行人', 'つうこうにん']] },
  3869: { syn: [['嫌味', 'いやみ']] },
  3871: { syn: [['捻る', 'ねじる']] },
  3874: { syn: [['余韻', 'よいん']] },
  3878: { syn: [['評定', 'ひょうてい']] },
  3881: { syn: [['基準', 'きじゅん']] },
  3882: { syn: [['名声', 'めいせい']] },
  3884: { syn: [['批評', 'ひひょう']] },
  3885: { syn: [['割合', 'わりあい']] },
  3886: { syn: [['発表', 'はっぴょう']] },
  3889: { ant: [['富裕', 'ふゆう']] },
  3892: { syn: [['必須', 'ひっす']] },
  3897: { ant: [['好況', 'こうきょう']] },
  3899: { rel: [['社会福祉', 'しゃかいふくし']] },
  3900: { syn: [['コピー']] },
  3901: { ant: [['単数', 'たんすう']] },
  3906: { syn: [['不況', 'ふきょう']] },
  3907: { ant: [['清潔', 'せいけつ']] },
  3913: { syn: [['怪我', 'けが']] },
  3914: { syn: [['違法', 'いほう']] },
  3917: { syn: [['再度', 'さいど']] },
  3918: { syn: [['重荷', 'おもに']] },
  3924: { rel: [['沸く', 'わく']] },
  3929: { syn: [['不満', 'ふまん']] },
  3932: { ant: [['明確', 'めいかく']] },
  3945: { syn: [['失礼', 'しつれい']] },
  3949: { rel: [['火山', 'かざん']] },
  3955: { syn: [['争い', 'あらそい']] },
  3961: { ant: [['結合', 'けつごう']] },
  3963: { syn: [['区分', 'くぶん']] },
  3966: { syn: [['並行', 'へいこう']] },
  3969: { rel: [['軍隊', 'ぐんたい']] },
  3970: { ant: [['非凡', 'ひぼん']] },
  3971: { ant: [['戦争', 'せんそう']] },
  3986: { rel: [['輸入', 'ゆにゅう']] },
  3989: { rel: [['標準語', 'ひょうじゅんご']] },
  3994: { rel: [['指輪', 'ゆびわ']] },
  3995: { syn: [['規則', 'きそく']] },
  3997: { syn: [['莫大', 'ばくだい']] },
}
for (const [id, r] of Object.entries(relAdd)) {
  const cur = wordRelations[id] || {}
  wordRelations[id] = { syn: cur.syn || r.syn || [], ant: cur.ant || r.ant || [], rel: cur.rel || r.rel || [] }
}
console.log('追加关系：', Object.keys(relAdd).length, '，现有关系总数：', Object.keys(wordRelations).length)

function serObj(o) { const p = []; for (const [k, v] of Object.entries(o)) { if (v === undefined) continue; p.push(`${k}: ${JSON.stringify(v)}`) } return `{ ${p.join(', ')} }` }
const newArr = words.map(w => { const p = []; for (const [k, v] of Object.entries(w)) { if (v === undefined) continue; p.push(k === 'examples' ? `examples: [${v.map(serObj).join(', ')}]` : `${k}: ${JSON.stringify(v)}`) } return `  { ${p.join(', ')} },` }).join('\n')
const relArr = Object.keys(wordRelations).map(id => { const r = wordRelations[id]; const p = []; if (r.syn && r.syn.length) p.push(`syn: ${JSON.stringify(r.syn)}`); if (r.ant && r.ant.length) p.push(`ant: ${JSON.stringify(r.ant)}`); if (r.rel && r.rel.length) p.push(`rel: ${JSON.stringify(r.rel)}`); return `  ${id}: { ${p.join(', ')} },` }).join('\n')
const out = header + '\n' + newArr + '\n]' + mid + '\n' + relArr + '\n}' + tail2

import { execFileSync } from 'node:child_process'
const checkFile = 'D:/日语自学网站/scripts/_check_out.mjs'
fs.writeFileSync(checkFile, out)
try { execFileSync(process.execPath, ['--check', checkFile], { encoding: 'utf-8' }); console.log('语法自检通过') }
catch (e) { console.error('语法自检失败：', (e.stderr || e.message).toString().split('\n').slice(0, 8).join('\n')); fs.unlinkSync(checkFile); process.exit(1) }
fs.unlinkSync(checkFile)
fs.writeFileSync(FILE, out, 'utf-8')
fs.unlinkSync(tmpFile)
console.log('已写入 words.js')
