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
  4211: { meaning: '明……,次……', exRemove: ['よく考える。', 'よく宿題を忘れる。', 'よく食べる。'] },
  4215: { kana: 'さける', meaning: '躲避;防范;去除', exRemove: ['ボールを蹴る。'] },
  4218: { kana: 'よす', exReplace: { '冗 談 は 止 せ。': { jp: '冗談は止せ。', zh: '别开玩笑!' } } },
  4220: { exReplace: { '余所人逃げる。': { jp: '余所へ逃げる。', zh: '逃到别处去。' } } },
  4239: { kana: 'ラッシュ' },
  4240: { kana: 'ラベル' },
  4242: { kana: 'らんぼう' },
  4252: { kana: 'りゃくす', meaning: '=略する(りゃくする);省略,简略' },
  4256: { kanji: '~領', exReplace: { '鎧1頜。': { jp: '鎧一領。', zh: '一身铠甲。' } } },
  4259: { kanji: '両替' },
  4264: { kana: 'りょく', meaning: '力量,能力' },
  4279: { exReplace: { '蝉燭を点す。': { jp: '蝋燭を点す。', zh: '点亮蜡烛。' } } },
  4280: { meaning: '浪费,铺张' },
  4281: { kana: 'ろくおん' },
  4283: { kana: 'ろんそう' },
  4288: { meaning: '煮开,煮沸;激动,兴奋' },
  4289: { exReplace: { 'おか温世湧く。': { jp: '温泉が湧く。', zh: '温泉涌出。' } } },
  4290: { meaning: '比较地;意外地' },
  4291: { meaning: '灾难,灾祸', exReplace: { '災 い を 招 <。': { jp: '災いを招く。', zh: '招致灾难。' } } },
  4294: { exReplace: { '彼の言うことなら割り引いて聞いたほうが い。': { jp: '彼の言うことなら割り引いて聞いたほうがいい。', zh: '他说的话最好不要全信。' } } },
  4295: { exReplace: { '碗が割れる。': { jp: '碗が割れる。', zh: '碗破了。' }, 'ケ一キを割る。': { jp: 'ケーキを割る。', zh: '分蛋糕。' } } },
  4302: { exReplace: { '何度見ても饱きない。': { jp: '何度見ても飽きない。', zh: '百看不厌。' } } },
  4306: { meaning: '坏天气' },
  4307: { kana: 'あくび' },
  4310: { kanji: '朝晩', exReplace: { 'さいき最近ん、あ朝きば晚 す涼ずし くなかった。': { jp: '最近、朝晩涼しくなかった。', zh: '最近早晚变凉了。' } } },
  4313: { exReplace: { 'あ味じみ見をする。': { jp: '味見をする。', zh: '尝味道。' } } },
  4314: { exReplace: { 'あ足しも元と に気をつけてください。': { jp: '足元に気をつけてください。', zh: '小心脚下。' } } },
  4315: { exReplace: { '助教汗をかく。': { jp: '汗をかく。', zh: '出汗。' } } },
  4316: { meaning: '给予;使蒙受' },
  4317: { exReplace: { 'こころ あたた心が温まる。': { jp: '心が温まる。', zh: '内心感到温暖。' } } },
  4318: { meaning: '使……变暖' },
  4319: { meaning: '应该,理所当然' },
  4325: { meaning: '洞穴;漏洞;亏空' },
  4326: { meaning: '广播,通告' },
  4328: { meaning: '剩余;过于;(后接否定)' },
  4329: { meaning: '剩余,剩下;过分' },
  4331: { kanji: '編む' },
  4334: { exReplace: { 'あいま金ューラあ遣いいが あ6荒い。': { jp: '金遣いが荒い。', zh: '胡乱花钱;花钱如流水。' } } },
  4336: { exRemove: ['争う(あらそう)③[自他動1]争吵，争夺。'] },
  4337: { exReplace: { '5新6 たにできた店。': { jp: '新たにできた店。', zh: '新开的店铺。' } } },
  4338: { meaning: '表达,表示' },
  4339: { kanji: '現す', meaning: '出现;表露,显露', exReplace: { '彼 は 姿 を 現 Lた。': { jp: '彼は姿を現した。', zh: '他出现了。' } } },
  4341: { kanji: '現れる', meaning: '出现,出来' },
  4342: { exReplace: { 'それは有ありが難た いことだ。': { jp: 'それは有難いことだ。', zh: '那太值得感谢了。' } } },
  4343: { exReplace: { 'コーヒー或いはジュースを飲む。': { jp: 'コーヒー或いはジュースを飲む。', zh: '喝咖啡或者果汁。' } } },
  4344: { kanji: 'あれこれ' },
  4349: { exReplace: { '慌ただLい都市生活。': { jp: '慌ただしい都市生活。', zh: '繁忙的都市生活。' } } },
  4351: { meaning: '意外的,出乎意料' },
  4360: { kana: 'いいだす', exRemove: ['考虑了一下又开始说了起来。'], exReplace: { '彼はちょっと考えてまた言い出した。': { jp: '彼はちょっと考えてまた言い出した。', zh: '他想了一下又说了起来。' } } },
  4361: { kanji: '何でも', kana: 'なんでも' },
  4362: { kana: 'いけばな' },
  4365: { meaning: '生物,动物', exRemove: ['いい もの かわいい。'] },
  4366: { exRemove: ['生き物を可愛がる。'] },
  4367: { kana: 'いじめ', meaning: '(校园)暴力,欺负' },
  4371: { meaning: '伟大,出色' },
  4372: { exReplace: { '夢を抱<。': { jp: '夢を抱く。', zh: '怀有梦想。' } } },
  4373: { kanji: '悪戯', exReplace: { '運命の悪戯。': { jp: '運命の悪戯。', zh: '命运的捉弄。' }, 'いただ悪戯きな子ども。': { jp: '悪戯な子ども。', zh: '淘气的孩子。' } } },
  4374: { meaning: '(肉体上的)疼痛;(精神上的)痛苦' },
  4376: { exReplace: { 'に日従い。': { jp: '日本一。', zh: '日本第一。' } } },
  4379: { exRemove: ['一部の資料がなくなった。'], exReplace: { '一部の資料がなくなった。': { jp: '一部の資料がなくなった。', zh: '一部分的资料不见了。' } } },
  4380: { kana: 'いちぶぶん', meaning: '一部分' },
  4382: { kana: 'いっしゅん' },
  4387: { kanji: '一遍', meaning: '一遍,一回', exReplace: { '一逼読む。': { jp: '一遍読む。', zh: '念一遍。' }, '一逼に片付ける。': { jp: '一遍に片付ける。', zh: '一下子解决。' } } },
  4388: { kana: 'いっぽう', exReplace: { '方い世言通行。': { jp: '一方通行。', zh: '单向行驶。' } } },
  4390: { pitch: [0] },
  4393: { meaning: '违反' },
  4394: { meaning: '鼾声' },
  4397: { exReplace: { 'ま ろつう に着いただろう。': { jp: 'もう学校に着いただろう。', zh: '现在到学校了吧。' } } },
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
  if (f.pitch) w.pitch = f.pitch
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
  4204: { rel: [['栄養', 'えいよう']] },
  4205: { syn: [['希望', 'きぼう']] },
  4207: { syn: [['コツ']] },
  4208: { syn: [['暇', 'ひま']] },
  4209: { syn: [['予想', 'よそう']] },
  4210: { rel: [['貯金', 'ちょきん']] },
  4216: { syn: [['予報', 'よほう']] },
  4219: { rel: [['本選', 'ほんせん']] },
  4222: { syn: [['酔う', 'よう']] },
  4223: { syn: [['訴える', 'うったえる']] },
  4228: { syn: [['徹夜', 'てつや']] },
  4229: { syn: [['余計', 'よけい']] },
  4230: { rel: [['天気予報', 'てんきよほう']] },
  4231: { syn: [['防止', 'ぼうし']] },
  4232: { syn: [['読み解く', 'よみとく']] },
  4237: { syn: [['競争相手', 'きょうそうあいて']] },
  4238: { ant: [['合格', 'ごうかく']] },
  4241: { rel: [['ジョギング']] },
  4242: { syn: [['粗暴', 'そぼう']] },
  4243: { rel: [['得失', 'とくしつ']] },
  4247: { syn: [['危険', 'きけん']] },
  4250: { ant: [['現実', 'げんじつ']] },
  4251: { rel: [['金利', 'きんり']] },
  4254: { rel: [['川', 'かわ']] },
  4255: { syn: [['流失', 'りゅうしつ']] },
  4258: { syn: [['理解', 'りかい']] },
  4262: { ant: [['粗悪', 'そあく']] },
  4268: { ant: [['興奮', 'こうふん']] },
  4271: { syn: [['娯楽', 'ごらく']] },
  4273: { rel: [['休暇', 'きゅうか']] },
  4274: { syn: [['連盟', 'れんめい']] },
  4276: { syn: [['想起', 'そうき']] },
  4277: { syn: [['継続', 'けいぞく']] },
  4280: { ant: [['節約', 'せつやく']] },
  4282: { syn: [['論ずる', 'ろんずる']] },
  4285: { ant: [['冷ます', 'さます']] },
  4288: { ant: [['冷める', 'さめる']] },
  4294: { syn: [['値引く', 'ねびく']] },
  4296: { rel: [['愛', 'あい']] },
  4297: { rel: [['仲間', 'なかま']] },
  4300: { syn: [['明白', 'めいはく']] },
  4301: { syn: [['断念', 'だんねん']] },
  4302: { rel: [['退屈', 'たいくつ']] },
  4303: { rel: [['挨拶', 'あいさつ']] },
  4308: { ant: [['暮れる', 'くれる']] },
  4309: { rel: [['天ぷら', 'てんぷら']] },
  4316: { syn: [['授ける', 'さずける']] },
  4320: { syn: [['命中する', 'めいちゅうする']] },
  4325: { rel: [['欠点', 'けってん']] },
  4327: { rel: [['シャワー']] },
  4329: { syn: [['残る', 'のこる']] },
  4334: { ant: [['穏やか', 'おだやか']] },
  4335: { ant: [['細かい', 'こまかい']] },
  4336: { syn: [['競う', 'きそう']] },
  4338: { syn: [['表現する', 'ひょうげんする']] },
  4340: { syn: [['現れる', 'あらわれる']] },
  4341: { syn: [['出現する', 'しゅつげんする']] },
  4348: { syn: [['揃える', 'そろえる']] },
  4350: { syn: [['焦る', 'あせる']] },
  4352: { syn: [['記憶', 'きおく']] },
  4355: { ant: [['危険', 'きけん']] },
  4356: { ant: [['不安定', 'ふあんてい']] },
  4358: { rel: [['胃腸', 'いちょう']] },
  4363: { ant: [['以前', 'いぜん']] },
  4364: { syn: [['医者', 'いしゃ']] },
  4366: { rel: [['無意識', 'むいしき']] },
  4368: { ant: [['正常', 'せいじょう']] },
  4370: { rel: [['苦痛', 'くつう']] },
  4371: { syn: [['立派', 'りっぱ']] },
  4377: { syn: [['場所', 'ばしょ']] },
  4385: { syn: [['普通', 'ふつう']] },
  4386: { syn: [['普遍的', 'ふへんてき']] },
  4391: { rel: [['従姉妹', 'いとこ']] },
  4395: { rel: [['行事', 'ぎょうじ']] },
  4396: { rel: [['リビング']] },
  4398: { syn: [['印象', 'いんしょう']] },
  4399: { ant: [['好む', 'このむ']] },
  4400: { rel: [['アクセサリー']] },
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
