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
  4008: { exReplace: { '保険加人する。': { jp: '保険に加入する。', zh: '加入保险。' } } },
  4009: { kana: 'ほご' },
  4012: { meaning: '保守的,落后的', exReplace: { '保守的な考之方。': { jp: '保守的な考え方。', zh: '保守的思维方式。' } } },
  4015: { meaning: '(名)程度;限度;分寸,身份;时候;(助)大致的范围' },
  4019: { exReplace: { '钓堀。': { jp: '釣堀。', zh: '垂钓渠。' } } },
  4027: { exReplace: { '本来ならば許せないんだ。': { jp: '本来ならば許せないんだ。', zh: '按理来说是不允许的。' } } },
  4032: { meaning: '去,来("行く""来る"的自谦语);参拜;投降,服输;受不了', exReplace: { 'で電んし車やが間もなく参ります。': { jp: '電車が間もなく参ります。', zh: '电车马上就要进站了。' } } },
  4036: { kanji: '負け', kana: 'まけ', exReplace: { 'お負けがつく。': { jp: 'おまけがつく。', zh: '附带赠品。' } } },
  4041: { kanji: '混ざる/交ざる' },
  4042: { pos: '自他動1', meaning: '(自)增加;(他)使之增多', exRemove: ['まず、 米を洗う。'] },
  4050: { kanji: '招く', exReplace: { '炎いを招く。': { jp: '災いを招く。', zh: '招致灾祸。' } } },
  4053: { kanji: '丸ごと', kana: 'まるごと' },
  4062: { kanji: '', kana: 'ミシン' },
  4063: { meaning: '自己,自我;亲自', exRemove: ['はん 世い。'] },
  4065: { meaning: '抛弃' },
  4066: { meaning: '商店,店铺' },
  4067: { meaning: '标题,题目;目录' },
  4074: { meaning: '充满;满;到期' },
  4078: { meaning: '看惯', exReplace: { '見惯扎了風景。': { jp: '見慣れた風景。', zh: '经常看到的风景。' } } },
  4079: { kanji: '見抜く' },
  4085: { exReplace: { 'い警さい備いさい員ん がビルの中を見回る。': { jp: '警備員がビルの中を見回る。', zh: '保安人员巡视大楼。' } } },
  4086: { exReplace: { '花 の 都 リ。': { jp: '花の都パリ。', zh: '繁华都市巴黎。' } } },
  4089: { meaning: '无计划,没有明确计划', exRemove: ['見渡す限り砂漠が広がっている。'] },
  4094: { exReplace: { '前後矛盾した論点。': { jp: '前後の矛盾した論点。', zh: '前后矛盾的论点。' } } },
  4096: { meaning: '神经大条,麻木' },
  4098: { exReplace: { '原因と結果を結付ける。': { jp: '原因と結果を結び付ける。', zh: '将原因与结果结合起来。' } } },
  4103: { exReplace: { '惯用 芽が出る。': { jp: '芽が出る。', zh: '(草木)发芽;走运。' }, '芽を摘む。': { jp: '芽を摘む。', zh: '摘去草木的芽;扼杀在摇篮状态,防患于未然。' } } },
  4108: { kanji: '銘々', exReplace: { '銘銘の考之を聞く。': { jp: '銘々の考えを聞く。', zh: '听听每一个人的想法。' } } },
  4110: { meaning: '被赋予;得天独厚', exReplace: { 'チャンスに惠まれる。': { jp: 'チャンスに恵まれる。', zh: '恰逢时机。' } } },
  4113: { meaning: '指向,以……为目标', exReplace: { 'ゆう優しょ勝うを 目指して 加顽人張15る。': { jp: '優勝を目指して頑張る。', zh: '以取胜为目标而拼搏。' } } },
  4114: { exReplace: { '目觉まし時計。': { jp: '目覚まし時計。', zh: '闹钟。' } } },
  4115: { exReplace: { '現実に目觉める。': { jp: '現実に目覚める。', zh: '回到现实。' } } },
  4117: { exReplace: { '二 5珍いし い光景。': { jp: '珍しい光景。', zh: '难得一见的场面。' } } },
  4123: { exReplace: { '面子を潰寸。': { jp: '面子を潰す。', zh: '丢脸。' } } },
  4124: { exRemove: ['惯用。'] },
  4126: { meaning: '参拜(神社、寺庙)' },
  4128: { meaning: '目击,亲眼看到' },
  4133: { meaning: '倚靠,凭靠;不消化' },
  4137: { meaning: '带进,携带', exReplace: { '車内に危険物を持ち込む。': { jp: '車内に危険物を持ち込む。', zh: '将危险品带入车内。' } } },
  4143: { meaning: '尺子;标准', exReplace: { '自分の物差して人をはかる。': { jp: '自分の物差しで人をはかる。', zh: '以自己的尺子衡量别人。' } } },
  4145: { exReplace: { '物忘れひど<なる。': { jp: '物忘れがひどくなる。', zh: '越来越健忘。' } } },
  4146: { meaning: '被揉搓;受磨炼' },
  4151: { meaning: '不久,即将;结果,终于' },
  4154: { meaning: '麻烦,棘手;照顾,照料' },
  4161: { kanji: 'やむを得ず' },
  4165: { exReplace: { '唯一》芳法。': { jp: '唯一の方法。', zh: '唯一的方法。' } } },
  4172: { meaning: '悠闲;广阔,辽阔', exReplace: { '悠々たる天地。': { jp: '悠々たる天地。', zh: '悠悠天地。' } } },
  4177: { kana: 'ゆくさき' },
  4178: { exReplace: { '湯気が。': { jp: '湯気が立つ。', zh: '冒热气。' } } },
  4179: { exReplace: { '紧急に輸血する。': { jp: '緊急に輸血する。', zh: '紧急输血。' } } },
  4180: { kanji: '譲る', exReplace: { '友だちが車を讓ってくれる。': { jp: '友だちが車を譲ってくれる。', zh: '朋友把车转手给我。' } } },
  4181: { exReplace: { '海 上 输 送。': { jp: '海上輸送。', zh: '海上运输。' } } },
  4191: { exReplace: { '用件を济ます。': { jp: '用件を済ます。', zh: '办完事。' } } },
  4194: { meaning: '样式,风格' },
}

const modifyIds = Object.keys(fixes).map(Number)
let applied = 0
for (const w of words) {
  if (!modifyIds.includes(w.id)) continue
  const f = fixes[w.id]
  if (f.kanji !== undefined) w.kanji = f.kanji
  if (f.kana) w.kana = f.kana
  if (f.meaning) w.meaning = f.meaning
  if (f.pos) w.pos = f.pos
  if (w.examples && Array.isArray(w.examples)) {
    if (f.exRemove) w.examples = w.examples.filter(ex => !f.exRemove.includes(ex.jp))
    if (f.exReplace) w.examples = w.examples.map(ex => { const r = f.exReplace[ex.jp]; return r ? { ...ex, ...r } : ex })
  }
  if (f.kanji !== undefined || f.kana || f.exReplace || f.exRemove) {
    if (w.kanji) w.kanjiFurigana = await convert(w.kanji)
    if (w.examples) for (const ex of w.examples) if (ex.jp) ex.jpFurigana = await convert(ex.jp)
  }
  applied++
}
console.log('已修正词条：', applied)

const relAdd = {
  4003: { syn: [['投げ出す', 'なげだす']] },
  4004: { rel: [['暴行', 'ぼうこう']] },
  4006: { syn: [['保存', 'ほぞん']] },
  4008: { rel: [['保証', 'ほしょう']] },
  4010: { syn: [['プライド']] },
  4011: { syn: [['自慢する', 'じまんする']] },
  4013: { syn: [['保証', 'ほしょう']] },
  4017: { syn: [['火炎', 'かえん']] },
  4021: { rel: [['正式', 'せいしき']] },
  4023: { syn: [['核心', 'かくしん']] },
  4026: { syn: [['元々', 'もともと']] },
  4032: { rel: [['参拝', 'さんぱい']] },
  4033: { syn: [['打ち負かす', 'うちまかす']] },
  4039: { syn: [['衝突', 'しょうとつ']] },
  4042: { ant: [['減る', 'へる']] },
  4044: { syn: [['跨る', 'またがる']] },
  4045: { syn: [['目前', 'もくぜん']] },
  4047: { syn: [['待ち焦がれる', 'まちこがれる']] },
  4055: { rel: [['万が一', 'まんがいち']] },
  4068: { syn: [['充たす', 'みたす']] },
  4070: { ant: [['整う', 'ととのう']] },
  4074: { ant: [['欠ける', 'かける']] },
  4077: { rel: [['予算', 'よさん']] },
  4081: { syn: [['結実する', 'けつじつする']] },
  4082: { syn: [['サンプル']] },
  4083: { syn: [['注視する', 'ちゅうしする']] },
  4087: { syn: [['区別する', 'くべつする']] },
  4091: { ant: [['有限', 'ゆうげん']] },
  4093: { syn: [['天真爛漫', 'てんしんらんまん']] },
  4094: { syn: [['食い違い', 'くいちがい']] },
  4097: { ant: [['離れる', 'はなれる']] },
  4100: { syn: [['不要', 'ふよう']] },
  4104: { ant: [['曖昧', 'あいまい']] },
  4105: { rel: [['傑作', 'けっさく']] },
  4107: { rel: [['信仰', 'しんこう']] },
  4116: { syn: [['標識', 'ひょうしき']] },
  4117: { ant: [['ありふれた']] },
  4119: { rel: [['視線', 'しせん']] },
  4120: { syn: [['著しく', 'いちじるしく']] },
  4127: { rel: [['布団', 'ふとん']] },
  4128: { rel: [['証言', 'しょうげん']] },
  4130: { syn: [['容認', 'ようにん']] },
  4131: { syn: [['潜り込む', 'もぐりこむ']] },
  4136: { syn: [['使用する', 'しようする']] },
  4140: { syn: [['依拠する', 'いきょする']] },
  4142: { syn: [['語る', 'かたる']] },
  4147: { syn: [['イベント']] },
  4148: { syn: [['高まる', 'たかまる']] },
  4150: { syn: [['質疑', 'しつぎ']] },
  4152: { syn: [['騒がしい', 'さわがしい']] },
  4158: { syn: [['潜む', 'ひそむ']] },
  4160: { syn: [['負ける', 'まける']], ant: [['勝つ', 'かつ']] },
  4163: { syn: [['遂行する', 'すいこうする']] },
  4164: { syn: [['成し遂げる', 'なしとげる']] },
  4166: { ant: [['無意味', 'むいみ']] },
  4167: { syn: [['親善', 'しんぜん']] },
  4168: { rel: [['友達', 'ともだち']] },
  4170: { rel: [['郵便', 'ゆうびん']] },
  4171: { ant: [['無能', 'むのう']] },
  4173: { ant: [['不利', 'ふり']] },
  4174: { syn: [['優秀', 'ゆうしゅう']] },
  4179: { rel: [['血液', 'けつえき']] },
  4181: { syn: [['運搬', 'うんぱん']] },
  4184: { syn: [['独特', 'どくとく']] },
  4187: { ant: [['困難', 'こんなん']] },
  4189: { syn: [['入れ物', 'いれもの']] },
  4190: { ant: [['陰気', 'いんき']] },
  4193: { syn: [['要点', 'ようてん']] },
  4199: { syn: [['成分', 'せいぶん']] },
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
