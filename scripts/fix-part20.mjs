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
  3617: { exReplace: { '典型的な例を举げる。': { jp: '典型的な例を挙げる。', zh: '举典型事例。' } } },
  3621: { exReplace: { 'ボールが転々と外野へ転かった。': { jp: 'ボールが転々と外野へ転がった。', zh: '球滚到外场去了。' } } },
  3629: { exReplace: { '二等寶を5之。': { jp: '一等賞を獲る。', zh: '荣获一等奖。' } } },
  3631: { exRemove: ['当時の流行。', '当時撮った写真。'] },
  3634: { exReplace: { '昨年の同期の壳上げを上回る。': { jp: '昨年の同期の売り上げを上回る。', zh: '超出去年同期的销售额。' } } },
  3635: { kana: 'どうき', exReplace: { 'はんこう 犯行の動機を探る。': { jp: '犯行の動機を探る。', zh: '寻找犯罪动机。' } } },
  3637: { meaning: '道德' },
  3639: { exReplace: { 'きいせんたんぎじゅつ\\ iangle 最先端技術を導入する。': { jp: '最先端技術を導入する。', zh: '引进最先进技术。' } } },
  3643: { exReplace: { '透明な力ラス。': { jp: '透明なガラス。', zh: '透明的玻璃。' } } },
  3646: { kanji: '童話', meaning: '童话' },
  3647: { meaning: '挪开,搬开' },
  3649: { exReplace: { '独自。': { jp: '独自に判断する。', zh: '独自做判断。' }, '独自の経験。': { jp: '独自の経験。', zh: '独特的体验。' } } },
  3650: { kana: 'とくしゅ', exReplace: { '特殊なケ一ス。': { jp: '特殊なケース。', zh: '个案,特殊案例。' } } },
  3652: { meaning: '特别指定,特别规定;特定,作出断定' },
  3653: { kana: 'とくばい', exReplace: { '夏物を特壳する。': { jp: '夏物を特売する。', zh: '抛售夏季用品。' } } },
  3654: { meaning: '特有,特别具有' },
  3656: { exReplace: { 'も目くて的きを遂げる。': { jp: '目的を遂げる。', zh: '达到目的。' } } },
  3664: { kana: 'どっと', meaning: '一齐,突然' },
  3666: { meaning: '整齐,调整好的' },
  3667: { meaning: '停顿,停止', exReplace: { 'さい幸わい あ外いし傷ように止まっていた。': { jp: '幸い外傷に止まっていた。', zh: '万幸只是受了一点外伤。' } } },
  3669: { exReplace: { '山を飛び越える。': { jp: '山を飛び越える。', zh: '飞越山峰。' } } },
  3670: { kana: 'とぶ', exReplace: { 'カエルがぴよんぴよんと跳んている。': { jp: 'カエルがぴょんぴょんと跳んでいる。', zh: '青蛙一蹦一跳地跳着。' } } },
  3671: { exReplace: { '\\ iangle 徒步10分着<。': { jp: '徒歩10分着く。', zh: '步行十分钟(即可)到达。' } } },
  3675: { meaning: '紧紧抓住;逮住' },
  3677: { kana: 'とりあえず' },
  3678: { exReplace: { 'ひん不法しょう し所持よひ品んを取り上げる。': { jp: '不法所持品を取り上げる。', zh: '没收非法携带品。' }, '次回の議题として取り上げる。': { jp: '次回の議題として取り上げる。', zh: '作为下次的议题来处理。' } } },
  3679: { exReplace: { '\\ iangle 最先端技術を取り入れる。': { jp: '最先端技術を取り入れる。', zh: '引进最前沿的技术。' } } },
  3682: { exReplace: { 'しょうす少数う意 い見け取り込む。': { jp: '少数意見を取り込む。', zh: '听取少数人的意见。' } } },
  3683: { meaning: '监管,监督,控制', exReplace: { 'こうつうい交通違はん反 の取り締まり。': { jp: '交通違反の取り締まり。', zh: '对违反交通法规行为的取缔。' } } },
  3684: { exReplace: { 'せんほう はいいやく\\ iangle 先方と契約を取り付ける。': { jp: '先方と契約を取り付ける。', zh: '与对方(客户)签订合同。' } } },
  3685: { kanji: '取り戻す', meaning: '取回,拿回' },
  3686: { meaning: '选择;录用;提取,取出' },
  3691: { exRemove: ['何もない。'] },
  3692: { exReplace: { '\\ iangle 内線に切り替える。': { jp: '内線に切り替える。', zh: '转接内线。' } } },
  3694: { exReplace: { '内部の人間が情報を漏らす。': { jp: '内部の人間が情報を漏らす。', zh: '内部的人泄露了情报。' } } },
  3699: { exReplace: { '小さいときに両親を亡くした。': { jp: '小さいときに両親を亡くした。', zh: '小时候失去了双亲。' } } },
  3702: { pos: '他動1', exReplace: { '大 业 成 寸。': { jp: '大業を成す。', zh: '成大业。' } } },
  3703: { kanji: '謎々' },
  3705: { exReplace: { '「エネルギー保存の法則」と名付ける。': { jp: '「エネルギー保存の法則」と名付ける。', zh: '命名为“能量守恒定律”。' } } },
  3706: { kanji: '斜め' },
  3710: { meaning: '使烦恼,使困扰' },
  3711: { kanji: '倣う' },
  3713: { meaning: '构成,形成' },
  3716: { kanji: '馴れる' },
  3719: { meaning: '...难,困难' },
  3721: { exReplace: { '軟弱な性格。': { jp: '軟弱な性格。', zh: '性格柔弱。' } } },
  3725: { meaning: '什么,什么样的;没什么' },
  3731: { exReplace: { 'ナイフが鮑い。': { jp: 'ナイフが鈍い。', zh: '小刀不锋利。' }, '感覚が純い。': { jp: '感覚が鈍い。', zh: '感觉迟钝。' } } },
  3732: { kana: 'ぬすみ' },
  3734: { exRemove: ['惯用。'] },
  3735: { exReplace: { '石油が值上がりする。': { jp: '石油が値上がりする。', zh: '石油价格上涨。' } } },
  3736: { exReplace: { '送料を值上げする。': { jp: '送料を値上げする。', zh: '提高运费。' } } },
  3738: { meaning: '=寝かせる,使睡觉;放平;积压' },
  3739: { kanji: '値下がり' },
  3741: { kanji: '捩る', exReplace: { 'ガス栓を捠る。': { jp: 'ガス栓を捩る。', zh: '拧煤气开关。' } } },
  3743: { meaning: '热衷,入迷' },
  3747: { exReplace: { 'ゆう優しょ勝うを狙う。': { jp: '優勝を狙う。', zh: '以获胜为目标。' } } },
  3751: { exReplace: { '年配の人。': { jp: '年配の人。', zh: '中年人,上了年纪的人。' } } },
  3754: { exReplace: { '野蔷薇。': { jp: '野薔薇。', zh: '野玫瑰。' } } },
  3757: { meaning: '农药' },
  3760: { kanji: '鋸' },
  3761: { kanji: '覗く', exReplace: { '穴から観く。': { jp: '穴から覗く。', zh: '从洞口窥视。' }, '本屋を覗<。': { jp: '本屋を覗く。', zh: '顺便到书店看看。' } } },
  3762: { exReplace: { '未成年者を除く。': { jp: '未成年者を除く。', zh: '未成年人除外。' } } },
  3764: { meaning: '...后,以后;将来,未来', exRemove: ['公共の場。'], exReplace: { '睛れ後曇り。': { jp: '晴れ後曇り。', zh: '晴转阴。' } } },
  3766: { exReplace: { '惯用 \\ iangle 厌になる。': { jp: '灰になる。', zh: '烧光,烧尽;成灰,(死后)' }, '厌になるまで。': { jp: '灰になるまで。', zh: '至死。' } } },
  3767: { exRemove: ['惯用 \\ iangle 厌になる。', '厌になるまで。'] },
  3770: { meaning: '废止,废除' },
  3771: { exReplace: { 'お知惠を拝借したいのですが。': { jp: 'お知恵を拝借したいのですが。', zh: '请指点;请给我出个主意。' } } },
  3773: { kana: 'ばいしょう', meaning: '赔偿,补偿', exReplace: { '損 害 を 赔 償 す る。': { jp: '損害を賠償する。', zh: '赔偿损失。' } } },
  3775: { exReplace: { '郵ほう便じぽんを 配達する。': { jp: '郵便を配達する。', zh: '送达邮件。' } } },
  3776: { kana: 'ばいばい', exReplace: { '品物を壳買する。': { jp: '品物を売買する。', zh: '买卖商品。' } } },
  3780: { kanji: '生える', kana: 'はえる', exReplace: { '歯は が生える。': { jp: '歯が生える。', zh: '长牙。' } } },
  3783: { meaning: '破坏' },
  3785: { kanji: '図る' },
  3789: { exReplace: { '爆弹を投げる。': { jp: '爆弾を投げる。', zh: '投放炸弹。' } } },
  3792: { meaning: '打动人心的力量' },
  3793: { exReplace: { '組織の中の 一 つの歯車に過ぎない。': { jp: '組織の中の一つの歯車に過ぎない。', zh: '只不过是组织中的一颗齿轮。' } } },
  3798: { exReplace: { '《书口》を挟む。': { jp: '口を挟む。', zh: '插嘴。' } } },
  3799: { meaning: '破产,倾家荡产', exReplace: { '事 業 に 失 敗 し て 破 産 する。': { jp: '事業に失敗して破産する。', zh: '事业失败,倾家荡产。' } } },
  3800: { meaning: '成套睡衣' },
}

const modifyIds = Object.keys(fixes).map(Number)
let applied = 0
for (const w of words) {
  if (!modifyIds.includes(w.id)) continue
  const f = fixes[w.id]
  if (f.kanji) w.kanji = f.kanji
  if (f.kana) w.kana = f.kana
  if (f.meaning) w.meaning = f.meaning
  if (f.pos) w.pos = f.pos
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
  3602: { rel: [['思想', 'しそう']] },
  3606: { rel: [['夜更かし', 'よふかし']] },
  3611: { syn: [['照りつける', 'てりつける']] },
  3614: { syn: [['広がる', 'ひろがる']] },
  3616: { rel: [['異動', 'いどう']] },
  3618: { syn: [['伝える', 'つたえる']] },
  3624: { rel: [['電気', 'でんき']] },
  3631: { syn: [['統合', 'とうごう']] },
  3632: { syn: [['同じ', 'おなじ']] },
  3636: { ant: [['別居', 'べっきょ']] },
  3637: { rel: [['倫理', 'りんり']] },
  3641: { syn: [['逃げる', 'にげる']] },
  3642: { rel: [['選挙', 'せんきょ']] },
  3643: { syn: [['透き通る', 'すきとおる']] },
  3649: { syn: [['独創的', 'どくそうてき']] },
  3651: { rel: [['本', 'ほん']] },
  3654: { ant: [['共通', 'きょうつう']] },
  3655: { syn: [['馴染む', 'なじむ']] },
  3657: { syn: [['どかす']] },
  3666: { syn: [['揃う', 'そろう']] },
  3671: { rel: [['歩く', 'あるく']] },
  3674: { syn: [['一緒に', 'いっしょに']] },
  3675: { syn: [['捕まえる', 'つかまえる']] },
  3679: { syn: [['導入する', 'どうにゅうする']] },
  3681: { syn: [['着手', 'ちゃくしゅ']] },
  3689: { syn: [['ありえない']] },
  3696: { syn: [['延びる', 'のびる']] },
  3697: { syn: [['景色', 'けしき']] },
  3698: { syn: [['励ます', 'はげます']] },
  3700: { syn: [['達成する', 'たっせいする']] },
  3713: { syn: [['成立する', 'せいりつする']] },
  3728: { ant: [['澄む', 'すむ']] },
  3731: { ant: [['鋭い', 'するどい']] },
  3742: { syn: [['温める', 'あたためる']] },
  3743: { syn: [['夢中', 'むちゅう']] },
  3745: { syn: [['割引', 'わりびき']] },
  3762: { syn: [['除去する', 'じょきょする']] },
  3769: { rel: [['短歌', 'たんか']] },
  3772: { syn: [['除去', 'じょきょ']] },
  3775: { syn: [['届ける', 'とどける']] },
  3783: { ant: [['建設', 'けんせつ']] },
  3788: { syn: [['膨大', 'ぼうだい']] },
  3794: { syn: [['元気づける', 'げんきづける']] },
  3799: { rel: [['倒産', 'とうさん']] },
  3800: { rel: [['寝巻き', 'ねまき']] },
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
