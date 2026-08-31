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
  5205: { kanji: '力いっぱい', exReplace: { '\\ iangle 力いつばい働く。': { jp: '力いっぱい働く。', zh: '尽力工作。' } } },
  5211: { kana: 'ちぢめる' },
  5212: { exReplace: { 'かと東う 地ち方ほう。': { jp: '関東地方。', zh: '关东地区。' } } },
  5215: { exReplace: { '与聴上解弦力44をテス卜する。': { jp: '聴解力をテストする。', zh: '测试听解能力。' } } },
  5216: { meaning: '长期' },
  5217: { meaning: '长途,长距离', exRemove: ['ちゃんと仕事をする。', '家賃は月々ちゃんと払っている。', 'それにはちゃんとした証拡がある。'] },
  5218: { exReplace: { 'ちょうこうせい。': { jp: '聴講生。', zh: '旁听生。' } } },
  5219: { exReplace: { '人口調查。': { jp: '人口調査。', zh: '人口调查。' } }, exRemove: ['\\ iangle無 料駐車場。'] },
  5220: { kanji: '調子', exRemove: ['\\ iangle無 料駐車場。'] },
  5221: { meaning: '长处,优点' },
  5222: { meaning: '顶峰,山顶;极点,顶点' },
  5223: { kanji: '調整' },
  5225: { meaning: '(「もらう」的自谦语)领,接受;(「食べる」「飲む」的自谦语)吃,喝;请给' },
  5227: { exRemove: ['毎まいつ月き2 まん万んず つ貯金する。'] },
  5230: { meaning: '存款;储蓄,存钱' },
  5234: { exReplace: { '每日 スで通勤する。': { jp: '毎日バスで通勤する。', zh: '每天乘坐公共汽车上下班。' } } },
  5235: { meaning: '行人', exReplace: { '運転する時、通行人に注意してください い。': { jp: '運転する時、通行人に注意してください。', zh: '驾驶时,请注意行人。' } } },
  5237: { meaning: '邮购' },
  5238: { meaning: '通知,告知' },
  5240: { meaning: '(口头)翻译,口译', exReplace: { '\\ iangle 英語を日本語に通訳する。': { jp: '英語を日本語に通訳する。', zh: '将英语翻译为日语。' } } },
  5246: { kanji: '漬かる', exReplace: { 'なすが潰かる。': { jp: 'なすが漬かる。', zh: '茄子腌好。' } } },
  5249: { exReplace: { 'と友也だちと付き合う。': { jp: '友達と付き合う。', zh: '和朋友交往。' } } },
  5251: { meaning: '连续不断,相继' },
  5252: { kanji: '注ぐ', kana: 'つぐ', meaning: '倒入,注入' },
  5253: { exReplace: { '力 ラ 作 9。': { jp: 'ガラス作り。', zh: '(用)玻璃作的。' }, '手作9。': { jp: '手作り。', zh: '手工制作的。' } } },
  5254: { meaning: '开始做,创造', exReplace: { '新 Lい 時 代を作り出す。': { jp: '新しい時代を作り出す。', zh: '创造新时代。' } } },
  5261: { exReplace: { '面目を潰寸。': { jp: '面目を潰す。', zh: '有损面子。' }, '時間を潰寸。': { jp: '時間を潰す。', zh: '打发时间。' } } },
  5263: { meaning: '犯罪,罪过' },
  5264: { meaning: '堆,堆积;积累' },
  5269: { meaning: '(偶然)遇见,碰见' },
  5272: { kanji: 'ティッシュペーパー', kana: 'ティッシュペーパー' },
  5273: { kana: 'ではいり', meaning: '出入,进出', exRemove: ['背の高さが凸凹だ。'] },
  5275: { meaning: '约会' },
  5276: { meaning: '主题;(论文等的)题目' },
  5277: { meaning: '关于,对于;……样的,好像;……上(的)' },
  5279: { exRemove: ['てゑく 2。'], exReplace: { '作品出来上がった。': { jp: '作品が出来上がった。', zh: '作品完成了。' } } },
  5281: { exRemove: ['鉄道が通じる。'] },
  5282: { meaning: '坑洼不平;凹凸不平' },
  5283: { kana: 'てまえ' },
  5286: { exReplace: { '電 压 計。': { jp: '電圧計。', zh: '电压计。' } } },
  5288: { exReplace: { 'んけんを切る。': { jp: '電源を切る。', zh: '切断电源。' } } },
  5291: { exReplace: { 'は箱このてんじょ天井う。': { jp: '箱の天井。', zh: '箱子盖。' } } },
  5293: { kana: 'でんしレンジ', meaning: '微波炉' },
  5294: { exReplace: { 'しよう商品ひんのてん点数すうをチェックする。': { jp: '商品の点数をチェックする。', zh: '核对商品的件数。' } } },
  5295: { meaning: '传染' },
  5297: { meaning: '转送,转递' },
  5300: { exReplace: { 'んで電ん ち池。': { jp: '乾電池。', zh: '干电池。' } } },
  5301: { exReplace: { 'んなほ放うそ送う。': { jp: '店内放送。', zh: '店内广播。' } } },
  5303: { exRemove: ['じかん けいさいてき つか。'] },
  5304: { meaning: '同行,一起走' },
  5306: { meaning: '……同伴,伙伴' },
  5309: { meaning: '同时,一……就……' },
  5310: { exRemove: ['飛行機に搭乗する。'] },
  5313: { meaning: '失窃,被盗' },
  5315: { exReplace: { 'お客さんを奥へ通す。': { jp: 'お客さんを奥へ通す。', zh: '把客人领进里面。' } } },
  5316: { meaning: '种类;……套,组' },
  5317: { meaning: '照……样;程度;' },
  5318: { meaning: '恰好路过' },
  5319: { meaning: '走过,通过' },
  5321: { meaning: '梳理' },
  5324: { kanji: '解く', exReplace: { '\\ iangle 数学の問題を解く。': { jp: '数学の問題を解く。', zh: '解答数学问题。' }, '誤 解 を 解 く。': { jp: '誤解を解く。', zh: '消除误会。' } } },
  5325: { kanji: '溶く', meaning: '溶解,化开' },
  5326: { meaning: '毒药;祸害' },
  5327: { meaning: '得意;擅长;拿手' },
  5329: { meaning: '单身' },
  5331: { meaning: '特征,特色', exReplace: { '特 徵 を 捉 え る。': { jp: '特徴を捉える。', zh: '抓住特征。' } } },
  5332: { exReplace: { 'て点くとをあげる。': { jp: '得点をあげる。', zh: '得分。' } } },
  5333: { exReplace: { 'き緊ん張ちょうが解けた。': { jp: '緊張が解けた。', zh: '紧张消失了。' } } },
  5336: { kanji: 'どこまでも', kana: 'どこまでも' },
  5337: { exReplace: { 'とぎん登 山か家。': { jp: '登山家。', zh: '登山家。' } } },
  5338: { meaning: '年长(的人)' },
  5339: { kana: 'としした' },
  5340: { meaning: '老人,上年纪的人' },
  5341: { exReplace: { '1 2本人を閉じる。': { jp: '本を閉じる。', zh: '合上书。' } } },
  5342: { exReplace: { 'くり解い 力りと。': { jp: '読解力。', zh: '阅读理解的能力。' } } },
  5344: { meaning: '够得着;买得起;(物品)送到' },
  5345: { meaning: '整理;备齐,准备好' },
  5347: { exReplace: { '子どもを怒鳴るのはよ〈ない。': { jp: '子どもを怒鳴るのはよくない。', zh: '大声训斥孩子是不好的。' } } },
  5349: { meaning: '飞向天空;跳起,跳跃' },
  5350: { meaning: '跳入,跳进去;突然闯入;投入' },
  5351: { meaning: '飞起来,起飞;跳出,跑出' },
  5352: { kanji: '扉' },
  5353: { meaning: '带,伴随;随着', exReplace: { '先生に伴ってい。': { jp: '先生に伴っていく。', zh: '陪同老师一起去。' } } },
  5358: { meaning: '交换;更换' },
  5359: { exReplace: { 'かぼんから書類を取り出す。': { jp: 'かばんから書類を取り出す。', zh: '从包中拿出文件。' } } },
  5360: { meaning: '努力', exReplace: { '努力家。': { jp: '努力家。', zh: '努力的人。' } } },
  5363: { meaning: '多少,若干;多么,如何' },
  5367: { meaning: '……重做,重新……' },
  5373: { pitch: [0] },
  5376: { exReplace: { '彼 女 と 仲 良L なった。': { jp: '彼女と仲良しになった。', zh: '和她成了好朋友。' } } },
  5379: { kana: 'なきごえ' },
  5380: { kana: 'なきごえ' },
  5381: { exReplace: { '目が赤くなって泣き出した。': { jp: '目が赤くなって泣き出した。', zh: '眼睛变红,然后哭了起来。' } } },
  5386: { exRemove: ['なつきおく。'] },
  5388: { meaning: '什么事情;怎么回事', exReplace: { 'これは 一体何事だ。': { jp: 'これは一体何事だ。', zh: '这到底是怎么回事?' } } },
  5389: { exRemove: ['记 忆。'] },
  5390: { exReplace: { 'まうモ送う。': { jp: '生放送。', zh: '现场直播。' } } },
  5391: { meaning: '傲慢,狂妄' },
  5392: { meaning: '懒汉' },
  5393: { meaning: '懒惰,怠惰' },
  5394: { meaning: '波浪;起伏;潮流' },
  5395: { exReplace: { '腹は らの力拉悩紧み。': { jp: '腹の悩み。', zh: '肚子的病痛。' } } },
  5400: { meaning: '不管什么;无论如何' },
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
  5202: { syn: [['近寄る', 'ちかよる']] },
  5203: { syn: [['寄せる', 'よせる']] },
  5204: { syn: [['近づく', 'ちかづく']] },
  5205: { rel: [['全力', 'ぜんりょく']] },
  5206: { syn: [['心強い', 'こころづよい']] },
  5207: { rel: [['切符', 'きっぷ']] },
  5208: { ant: [['早退', 'そうたい']] },
  5209: { rel: [['学問', 'がくもん']] },
  5210: { ant: [['伸びる', 'のびる']] },
  5211: { ant: [['伸ばす', 'のばす']] },
  5212: { ant: [['都会', 'とかい']] },
  5213: { rel: [['発注', 'はっちゅう']] },
  5215: { rel: [['聴力', 'ちょうりょく']] },
  5216: { ant: [['短期', 'たんき']] },
  5217: { ant: [['短距離', 'たんきょり']] },
  5219: { syn: [['調べる', 'しらべる']] },
  5221: { ant: [['短所', 'たんしょ']] },
  5222: { syn: [['頂点', 'ちょうてん']] },
  5224: { syn: [['調整', 'ちょうせい']] },
  5226: { syn: [['頂上', 'ちょうじょう']] },
  5227: { ant: [['長女', 'ちょうじょ']] },
  5228: { rel: [['正方形', 'せいほうけい']] },
  5229: { rel: [['調味', 'ちょうみ']] },
  5230: { syn: [['預金', 'よきん']] },
  5231: { syn: [['とうとう']] },
  5233: { rel: [['通勤', 'つうきん']] },
  5234: { rel: [['通学', 'つうがく']] },
  5236: { rel: [['連絡', 'れんらく']] },
  5238: { syn: [['知らせ', 'しらせ']] },
  5239: { rel: [['銀行', 'ぎんこう']] },
  5240: { rel: [['翻訳', 'ほんやく']] },
  5243: { ant: [['逃げる', 'にげる']] },
  5244: { syn: [['握る', 'にぎる']] },
  5245: { syn: [['漬かる', 'つかる']] },
  5246: { syn: [['浸かる', 'つかる']] },
  5249: { syn: [['交際する', 'こうさいする']] },
  5251: { syn: [['続々', 'ぞくぞく']] },
  5254: { syn: [['生み出す', 'うみだす']] },
  5255: { syn: [['連結', 'れんけつ']] },
  5256: { syn: [['結ぶ', 'むすぶ']] },
  5257: { rel: [['波', 'なみ']] },
  5258: { syn: [['いつも']] },
  5259: { rel: [['鳥', 'とり']] },
  5260: { rel: [['小粒', 'こつぶ']] },
  5261: { syn: [['壊す', 'こわす']] },
  5262: { syn: [['壊れる', 'こわれる']] },
  5263: { syn: [['犯罪', 'はんざい']] },
  5264: { ant: [['降ろす', 'おろす']] },
  5265: { rel: [['手', 'て']] },
  5267: { syn: [['吊る', 'つる']] },
  5268: { syn: [['遭遇', 'そうぐう']] },
  5269: { syn: [['会う', 'あう']] },
  5271: { rel: [['電気', 'でんき']] },
  5274: { rel: [['バス停', 'バスてい']] },
  5275: { syn: [['交際', 'こうさい']] },
  5276: { syn: [['主題', 'しゅだい']] },
  5278: { ant: [['味方', 'みかた']] },
  5279: { syn: [['完成する', 'かんせいする']] },
  5280: { syn: [['事件', 'じけん']] },
  5281: { syn: [['適当', 'てきとう']] },
  5284: { rel: [['見送り', 'みおくり']] },
  5285: { rel: [['手', 'て']] },
  5287: { rel: [['電気', 'でんき']] },
  5288: { rel: [['電気', 'でんき']] },
  5289: { syn: [['天気', 'てんき']] },
  5290: { rel: [['転校生', 'てんこうせい']] },
  5292: { rel: [['就職', 'しゅうしょく']] },
  5294: { rel: [['得点', 'とくてん']] },
  5295: { rel: [['感染', 'かんせん']] },
  5296: { rel: [['電気', 'でんき']] },
  5298: { rel: [['計算', 'けいさん']] },
  5299: { syn: [['伝える', 'つたえる']] },
  5300: { rel: [['電気', 'でんき']] },
  5302: { rel: [['データ']] },
  5303: { ant: [['下校', 'げこう']] },
  5304: { syn: [['同伴', 'どうはん']] },
  5305: { syn: [['行動', 'こうどう']] },
  5307: { ant: [['前日', 'ぜんじつ']] },
  5309: { syn: [['一斉に', 'いっせいに']] },
  5311: { syn: [['結局', 'けっきょく']] },
  5312: { ant: [['出発', 'しゅっぱつ']] },
  5313: { rel: [['泥棒', 'どろぼう']] },
  5314: { syn: [['道', 'みち']] },
  5315: { syn: [['貫く', 'つらぬく']] },
  5318: { syn: [['通りがかる', 'とおりがかる']] },
  5319: { syn: [['通過する', 'つうかする']] },
  5320: { rel: [['溶ける', 'とける']] },
  5322: { ant: [['落ち着く', 'おちつく']] },
  5323: { ant: [['損', 'そん']] },
  5326: { rel: [['毒素', 'どくそ']] },
  5327: { ant: [['苦手', 'にがて']] },
  5329: { ant: [['既婚', 'きこん']] },
  5330: { syn: [['長所', 'ちょうしょ']] },
  5331: { syn: [['特色', 'とくしょく']] },
  5332: { syn: [['点数', 'てんすう']] },
  5333: { syn: [['ほどける']] },
  5334: { syn: [['融ける', 'とける']] },
  5337: { rel: [['山', 'やま']] },
  5338: { ant: [['年下', 'としした']] },
  5339: { ant: [['年上', 'としうえ']] },
  5340: { rel: [['老人', 'ろうじん']] },
  5341: { ant: [['開く', 'ひらく']] },
  5342: { rel: [['読む', 'よむ']] },
  5343: { syn: [['いきなり']] },
  5344: { syn: [['到着する', 'とうちゃくする']] },
  5345: { syn: [['準備する', 'じゅんびする']] },
  5347: { syn: [['叫ぶ', 'さけぶ']] },
  5348: { syn: [['ともかく']] },
  5349: { syn: [['跳ねる', 'はねる']] },
  5350: { rel: [['飛ぶ', 'とぶ']] },
  5351: { rel: [['飛ぶ', 'とぶ']] },
  5352: { syn: [['門', 'もん']] },
  5353: { syn: [['付随', 'ふずい']] },
  5355: { rel: [['車', 'くるま']] },
  5356: { rel: [['映画', 'えいが']] },
  5358: { syn: [['交換する', 'こうかんする']] },
  5359: { syn: [['出す', 'だす']] },
  5360: { syn: [['尽力', 'じんりょく']] },
  5364: { ant: [['外科', 'げか']] },
  5365: { rel: [['素材', 'そざい']] },
  5368: { syn: [['治療する', 'ちりょうする']] },
  5369: { rel: [['関係', 'かんけい']] },
  5370: { rel: [['流れる', 'ながれる']] },
  5371: { ant: [['喧嘩', 'けんか']] },
  5372: { rel: [['長い間', 'ながいあいだ']] },
  5373: { syn: [['友達', 'ともだち']] },
  5374: { syn: [['内容', 'ないよう']] },
  5375: { syn: [['見渡す', 'みわたす']] },
  5376: { syn: [['親友', 'しんゆう']] },
  5377: { rel: [['水流', 'すいりゅう']] },
  5378: { rel: [['流す', 'ながす']] },
  5379: { rel: [['泣く', 'なく']] },
  5380: { rel: [['鳴く', 'なく']] },
  5381: { rel: [['泣く', 'なく']] },
  5382: { rel: [['果物', 'くだもの']] },
  5384: { rel: [['野菜', 'やさい']] },
  5385: { rel: [['謎解き', 'なぞとき']] },
  5386: { rel: [['思い出', 'おもいで']] },
  5387: { syn: [['触る', 'さわる']] },
  5388: { rel: [['事', 'こと']] },
  5390: { ant: [['煮る', 'にる']] },
  5391: { syn: [['傲慢', 'ごうまん']] },
  5392: { ant: [['働き者', 'はたらきもの']] },
  5393: { ant: [['勤勉', 'きんべん']] },
  5394: { rel: [['海', 'うみ']] },
  5395: { syn: [['苦悩', 'くのう']] },
  5396: { syn: [['苦しむ', 'くるしむ']] },
  5400: { syn: [['全て', 'すべて']] },
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
