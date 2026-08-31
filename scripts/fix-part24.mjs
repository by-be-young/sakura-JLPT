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
  4403: { kanji: 'いらいら', kana: 'いらいら' },
  4408: { exReplace: { 'いき刷つら物つ。': { jp: '印刷物。', zh: '印刷品。' } } },
  4410: { exRemove: ['飲食店。'], exReplace: { 'いんしよくてん。': { jp: '飲食店。', zh: '餐饮店。' } } },
  4414: { exReplace: { '手 洗 い と 嗽 を 徹 底 す る。': { jp: '手洗いとうがいを徹底する。', zh: '做好洗手漱口环节。' } } },
  4422: { exReplace: { '牛を餌う。': { jp: '牛を飼う。', zh: '养牛。' } } },
  4426: { kana: 'うたごえ' },
  4428: { kanji: '内側' },
  4432: { meaning: '鳗鱼' },
  4433: { kana: 'うばう', meaning: '夺,抢夺;剥夺;强行夺取' },
  4434: { exReplace: { 'しようわう昭和生 まれ。': { jp: '昭和生まれ。', zh: '昭和年代出生。' } } },
  4435: { exRemove: ['惯 用。'] },
  4439: { exReplace: { '3.19売上げを伸ばす。': { jp: '売上げを伸ばす。', zh: '扩大销售额。' } } },
  4440: { exReplace: { 'あっという間に壳り切れた。': { jp: 'あっという間に売り切れた。', zh: '一会儿工夫全部售完了。' } } },
  4442: { exReplace: { '壳り物に出す。': { jp: '売り物に出す。', zh: '作为商品出售。' } } },
  4445: { exReplace: { '壳れ行きがいい(悪い)。': { jp: '売れ行きがいい(悪い)。', zh: '销路好(不好)。' } } },
  4450: { exReplace: { 'えいき上営 業う ちゆ中う。': { jp: '営業中。', zh: '正在营业。' } } },
  4455: { kanji: '閲覧室' },
  4465: { exReplace: { 'わたしは食べ物に大いに興味がある。': { jp: 'わたしは食べ物に大いに興味がある。', zh: '我对食物很感兴趣。' } } },
  4466: { meaning: '蒙上,盖上;掩盖' },
  4467: { meaning: '大甩卖,大减价', exRemove: ['理想を追う。'] },
  4472: { meaning: '摁;捂,压住' },
  4474: { exReplace: { '丁寧に书辞儀をする。': { jp: '丁寧にお辞儀をする。', zh: '恭恭敬敬地鞠躬。' } } },
  4475: { meaning: '手巾,湿巾' },
  4476: { meaning: '喋喋不休(的人);爱聊天' },
  4477: { exRemove: ['しやれひと。'] },
  4479: { kanji: '汚染', meaning: '污染', exReplace: { '放射能污染。': { jp: '放射能汚染。', zh: '核污染。' } } },
  4483: { kanji: '落ち着く', kana: 'おちつく' },
  4484: { meaning: '新年礼物,压岁钱' },
  4485: { meaning: '老实,温顺' },
  4488: { exRemove: ['石。'] },
  4497: { kanji: 'およそ', kana: 'およそ' },
  4502: { kanji: '課' },
  4504: { meaning: '会馆' },
  4506: { meaning: '解决', exReplace: { '問题を解決する。': { jp: '問題を解決する。', zh: '解决问题。' } } },
  4512: { meaning: '改造', exReplace: { '中古車を改造する。': { jp: '中古車を改造する。', zh: '改造二手车。' } } },
  4514: { meaning: '(交通、桥等)开通,通行' },
  4515: { meaning: '解答' },
  4517: { exReplace: { '会费を集める。': { jp: '会費を集める。', zh: '收会费。' } } },
  4518: { meaning: '打开;(设施)开放', exReplace: { '博物館は 一般に開放されている。': { jp: '博物館は一般に開放されている。', zh: '博物馆对外开放。' } } },
  4520: { meaning: '饲养,喂', exRemove: ['本を買う。'] },
  4524: { exReplace: { '書き换える。': { jp: '書き換える。', zh: '重写。' } } },
  4525: { exReplace: { '顏色が悪い。': { jp: '顔色が悪い。', zh: '脸色不好。' }, '顏色を伺う。': { jp: '顔色を伺う。', zh: '察言观色。' } } },
  4529: { meaning: '缺,缺少' },
  4530: { meaning: '闪耀;充满,洋溢', exReplace: { '彼の目は喜びに辉いた。': { jp: '彼の目は喜びに輝いた。', zh: '他的目光充满了喜悦。' } } },
  4533: { meaning: '柿子' },
  4536: { kanji: '描く', exRemove: ['常識を欠く。'] },
  4538: { meaning: '各地,到处' },
  4541: { exReplace: { 'もくひょうがく 目標額に足りない。': { jp: '目標額に足りない。', zh: '未达到目标金额。' } } },
  4542: { exReplace: { 'あ安んぱ全んか確くに。': { jp: '安全を確認する。', zh: '确认安全。' } } },
  4544: { meaning: '重叠,重复;赶在一起' },
  4546: { exRemove: ['かつかきん。'] },
  4547: { meaning: '聪明,伶俐' },
  4548: { meaning: '画质' },
  4549: { kana: 'かしゅ' },
  4550: { kanji: '稼ぐ', kana: 'かせぐ' },
  4554: { meaning: '变硬,凝结;固定' },
  4555: { meaning: '单程' },
  4556: { exReplace: { 'たいけん体験をかた語る。': { jp: '体験を語る。', zh: '谈体会。' } } },
  4557: { meaning: '价值', exReplace: { '価值が高い。': { jp: '価値が高い。', zh: '价值高。' } } },
  4558: { kanji: 'がっかり', kana: 'がっかり' },
  4561: { meaning: '班级' },
  4564: { meaning: '任意,随便;方便', exReplace: { '自分の勝手のいいようにする。': { jp: '自分の勝手に振る舞う。', zh: '任性妄为。' } } },
  4565: { meaning: '悲伤,悲痛' },
  4566: { meaning: '(后接否定)不一定,未必' },
  4567: { meaning: '加热' },
  4570: { kanji: '黴', exReplace: { '徹が生える。': { jp: '黴が生える。', zh: '发霉。' } } },
  4571: { exReplace: { '株 手 を 出 す。': { jp: '株を出す。', zh: '炒股。' } } },
  4579: { exReplace: { 'よく噛まなければ、消化できない。': { jp: 'よく噛まなければ、消化できない。', zh: '不好好咀嚼就无法消化。' } } },
  4589: { exRemove: ['第1巻の内容を説明する。'], exReplace: { 'あた頭主を刈る。': { jp: '頭を刈る。', zh: '剪头发。' } } },
  4592: { exRemove: ['いちどあんぷ 轻 耘。', 'もう一度考えて直してください。'] },
  4593: { meaning: '喜爱,疼爱' },
  4594: { exReplace: { '勘定を済ませた。': { jp: '勘定を済ませた。', zh: '结完账。' } } },
  4595: { kana: 'かんじる' },
  4600: { meaning: '完全;完整;完美' },
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
  4401: { syn: [['ますます']], rel: [['ますます']] },
  4404: { rel: [['医学', 'いがく']] },
  4406: { syn: [['岩石', 'がんせき']] },
  4408: { rel: [['出版', 'しゅっぱん']] },
  4409: { syn: [['イメージ']] },
  4410: { rel: [['食べ物', 'たべもの']] },
  4415: { syn: [['浮かび上がる', 'うかびあがる']] },
  4417: { ant: [['落ちる', 'おちる']] },
  4419: { syn: [['受領する', 'じゅりょうする']] },
  4420: { syn: [['移動する', 'いどうする']] },
  4423: { ant: [['得る', 'える']] },
  4424: { ant: [['濃い', 'こい']] },
  4425: { ant: [['信じる', 'しんじる']] },
  4430: { syn: [['映写する', 'えいしゃする']] },
  4433: { syn: [['奪い取る', 'うばいとる']] },
  4436: { syn: [['埋め立てる', 'うめたてる']] },
  4438: { syn: [['怨む', 'うらむ']] },
  4443: { ant: [['失う', 'うしなう']] },
  4448: { syn: [['うわさ話', 'うわさばなし']] },
  4449: { syn: [['作用', 'さよう']] },
  4450: { syn: [['経営', 'けいえい']] },
  4451: { syn: [['滋養', 'じよう']] },
  4452: { syn: [['画く', 'えがく']], rel: [['絵', 'え']] },
  4454: { rel: [['飼料', 'しりょう']] },
  4459: { syn: [['立派', 'りっぱ']] },
  4460: { syn: [['横切る', 'よこぎる']] },
  4461: { syn: [['行き来', 'いきき']] },
  4463: { syn: [['参加', 'さんか']] },
  4464: { rel: [['実用', 'じつよう']] },
  4466: { syn: [['包む', 'つつむ']] },
  4472: { syn: [['押し付ける', 'おしつける']] },
  4480: { syn: [['怖がる', 'こわがる']] },
  4482: { ant: [['激しい', 'はげしい']] },
  4485: { ant: [['活発', 'かっぱつ']] },
  4486: { syn: [['驚かせる', 'おどろかせる']] },
  4490: { syn: [['断念', 'だんねん']] },
  4491: { syn: [['記憶', 'きおく']] },
  4492: { syn: [['感じられる', 'かんじられる']] },
  4498: { ant: [['上がる', 'あがる']] },
  4506: { syn: [['解消', 'かいしょう']] },
  4508: { rel: [['レストラン']] },
  4510: { syn: [['説明', 'せつめい']] },
  4511: { syn: [['改良', 'かいりょう']] },
  4512: { syn: [['改築', 'かいちく']] },
  4513: { syn: [['会合', 'かいごう']] },
  4516: { syn: [['開拓', 'かいたく']] },
  4519: { syn: [['開放', 'かいほう']] },
  4520: { rel: [['ペット']] },
  4521: { syn: [['逆に', 'ぎゃくに']] },
  4523: { syn: [['替える', 'かえる']] },
  4525: { syn: [['表情', 'ひょうじょう']] },
  4527: { syn: [['匂い', 'におい']] },
  4528: { syn: [['値段', 'ねだん']] },
  4529: { syn: [['省く', 'はぶく']] },
  4530: { syn: [['光る', 'ひかる']] },
  4534: { syn: [['書き改める', 'かきあらためる']] },
  4537: { ant: [['縮小', 'しゅくしょう']] },
  4539: { syn: [['拡大', 'かくだい']] },
  4542: { syn: [['確かめる', 'たしかめる']] },
  4543: { rel: [['研究', 'けんきゅう']] },
  4544: { syn: [['重複する', 'じゅうふくする']] },
  4547: { syn: [['利口', 'りこう']] },
  4554: { syn: [['凝固', 'ぎょうこ']] },
  4556: { syn: [['話す', 'はなす']] },
  4557: { syn: [['値打ち', 'ねうち']] },
  4560: { rel: [['音楽', 'おんがく']] },
  4565: { ant: [['喜ぶ', 'よろこぶ']] },
  4568: { ant: [['不可能', 'ふかのう']] },
  4569: { syn: [['見込み', 'みこみ']] },
  4573: { syn: [['覆う', 'おおう']] },
  4575: { syn: [['忍耐', 'にんたい']] },
  4576: { syn: [['辛抱強い', 'しんぼうづよい']] },
  4577: { rel: [['髪', 'かみ']] },
  4581: { rel: [['映像', 'えいぞう']] },
  4583: { rel: [['かゆみ']] },
  4586: { syn: [['乾燥', 'かんそう']] },
  4589: { syn: [['切る', 'きる']] },
  4590: { ant: [['茂る', 'しげる']] },
  4595: { syn: [['感ずる', 'かんずる']] },
  4596: { syn: [['興味', 'きょうみ']] },
  4597: { syn: [['関連する', 'かんれんする']] },
  4598: { syn: [['完了', 'かんりょう']] },
  4599: { ant: [['直接', 'ちょくせつ']] },
  4600: { syn: [['完璧', 'かんぺき']] },
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
