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
  6401: { kanji: '長ネギ', kana: 'ながねぎ', meaning: '葱,大葱' },
  6402: { kanji: '鳴く', meaning: '鸣叫,叫', exReplace: { '電話が鳴いている。': { jp: '電話が鳴っている。', zh: '电话在响。' } } },
  6403: { kanji: '無くなる' },
  6408: { meaning: '(非生物)鸣,响;闻名' },
  6412: { kanji: '匂い' },
  6414: { kana: 'にげる' },
  6415: { kana: 'にちよう', meaning: '星期日' },
  6416: { meaning: '入学' },
  6417: { kana: 'にる' },
  6421: { exReplace: { '值段が高い。': { jp: '値段が高い。', zh: '价格高。' } } },
  6423: { pitch: '②', pos: 'イ形' },
  6424: { pitch: '③' },
  6426: { pitch: '③' },
  6428: { exReplace: { '喉が渴く。': { jp: '喉が渇く。', zh: '口渴。' } } },
  6430: { pitch: '⓪', exReplace: { '乘り換えの駅。': { jp: '乗り換えの駅。', zh: '换乘的车站。' } } },
  6432: { exReplace: { '便利な乘り物。': { jp: '便利な乗り物。', zh: '便利的交通工具。' } } },
  6434: { kana: 'はあ' },
  6435: { meaning: '场合,时候,情形', exReplace: { '非常の場合。': { jp: '非常の場合。', zh: '紧急的时候。' } } },
  6437: { pitch: '⓪' },
  6438: { kanji: '灰皿', meaning: '烟灰缸' },
  6440: { pitch: '①' },
  6444: { meaning: '剪刀', exRemove: ['网络。'], exReplace: { '缺で切る。': { jp: '鋏で切る。', zh: '用剪刀剪。' } } },
  6445: { meaning: '发音' },
  6447: { meaning: '包,手提包' },
  6452: { meaning: '快,迅速;早,早就', exReplace: { '草<会いたい。': { jp: '早く会いたい。', zh: '想快点见面。' } } },
  6453: { meaning: '树林,树丛', exRemove: ['森(もり) [名]树林,森林 森林(しんりん) [ 名]森林。'] },
  6454: { kanji: '薔薇', meaning: '玫瑰花' },
  6455: { meaning: '支付;拂去,掸去;驱赶' },
  6458: { meaning: '相反;反对' },
  6462: { exRemove: ['じ人んせ生い の か人生的希望。'] },
  6463: { kanji: '引越し', meaning: '搬家', exRemove: ['ひっこ。'] },
  6464: { meaning: '发光,发亮;出众', exRemove: ['引越しを手伝う。'] },
  6465: { meaning: '抽屉' },
  6468: { exReplace: { 'ひ久きしぶりに鋡木さんに会った。': { jp: '久しぶりに鈴木さんに会った。', zh: '和铃木久别重逢。' }, 'ひき久しぶりです。お元気ですか。': { jp: '久しぶりです。お元気ですか。', zh: '好久不见，您还好吗？' } } },
  6469: { meaning: '美术馆', exReplace: { '国 立 美 術 館。': { jp: '国立美術館。', zh: '国家公立美术馆。' } } },
  6474: { meaning: '午休', exRemove: ['テーブルを拭く。', '淚を拭く。'] },
  6475: { pitch: '①', meaning: '面积;宽度,幅度', exReplace: { '広さが違5。': { jp: '広さが違う。', zh: '面积不一样。' } } },
  6479: { pitch: '⓪' },
  6480: { pitch: '①' },
  6481: { kana: 'ふとる', meaning: '胖,发福' },
  6482: { kana: 'ふとん', meaning: '被子,褥子', exReplace: { '\\ iangle 布团を敷く。': { jp: '布団を敷く。', zh: '铺褥子。' } } },
  6483: { meaning: '不便;不方便' },
  6484: { exReplace: { 'あし足をふら踏まれる。': { jp: '足を踏まれる。', zh: '脚被踩了。' }, 'みるきと故郷の地を踏む。': { jp: '故郷の地を踏む。', zh: '踏上了家乡的土地。' } } },
  6488: { exReplace: { '\\ iangle 最近のことを報告する。': { jp: '最近のことを報告する。', zh: '汇报最近的事情。' } } },
  6489: { meaning: '广播,播报', exRemove: ['冗談を别とする。'] },
  6493: { pitch: '⓪' },
  6494: { kana: 'ぼく', meaning: '(男子自称)我', exRemove: ['わたL① [ 代]我。'] },
  6498: { pitch: '⓪' },
  6500: { exReplace: { '仕しご事と を 任まかせられる。': { jp: '仕事を任せられる。', zh: '被委任工作。' } } },
  6501: { meaning: '输,败;屈服,示弱' },
  6502: { meaning: '认真,踏实;老实' },
  6505: { meaning: '(自)错,出错;(他)弄错' },
  6506: { meaning: '弄错,搞错' },
  6507: { meaning: '赶得上,来得及;够用' },
  6508: { meaning: '保卫,保护;遵守;维持', exRemove: ['く に 、 直 も。'] },
  6513: { meaning: '满员,满座' },
  6521: { pitch: '⓪' },
  6522: { meaning: '看到,找到,发现' },
  6525: { meaning: '港,港口,码头' },
  6530: { pitch: '⓪', exReplace: { '一 人息子。': { jp: '一人息子。', zh: '独生子。' } } },
  6535: { pitch: '①' },
  6537: { exReplace: { '目薬を差寸。': { jp: '目薬を差す。', zh: '点眼药水。' } } },
  6539: { exReplace: { 'もう元に屎れない。': { jp: 'もう元に戻れない。', zh: '已经回不到从前了。' } } },
  6543: { exReplace: { '日光に烧ける。': { jp: '日光に焼ける。', zh: '被阳光晒黑。' } } },
  6544: { kanji: '優しい', meaning: '温柔的,亲切的;优雅的', exReplace: { '易し<説明する。': { jp: '優しく説明する。', zh: '温和地解释。' }, '易しい仕事。': { jp: '優しい人。', zh: '温柔的人。' } } },
  6545: { kanji: '痩せる', kana: 'やせる' },
  6546: { kanji: 'やって来る', kana: 'やってくる', meaning: '来,到来,走来' },
  6548: { pitch: '③' },
  6552: { pitch: '④' },
  6554: { meaning: '进出口', exReplace: { '輸 出 人 貿 易。': { jp: '輸出入貿易。', zh: '进出口贸易。' }, '輸 出 入 会 社。': { jp: '輸出入会社。', zh: '进出口公司。' } } },
  6557: { meaning: '纸张,格式纸' },
  6561: { meaning: '变脏,弄脏' },
  6567: { exReplace: { '喜 を 申L 上げる。': { jp: '喜びを申し上げる。', zh: '道喜，祝贺。' } } },
  6568: { exReplace: { '友だ ち の 幸 せ を 喜 ぶ。': { jp: '友だちの幸せを喜ぶ。', zh: '为朋友的幸福感到高兴。' } } },
  6571: { pitch: '⓪', meaning: '利用,使用', exReplace: { 'サ 一 ビスを利用する。': { jp: 'サービスを利用する。', zh: '使用服务。' } } },
  6573: { kanji: '両方', exReplace: { '两方も満足する。': { jp: '両方も満足する。', zh: '双方都满意。' } } },
  6581: { exReplace: { '老人亦一厶。': { jp: '老人ホーム。', zh: '老人院,敬老院。' } } },
  6582: { exReplace: { 'そ卒れ論う ち文ん加く。': { jp: '卒業論文を書く。', zh: '写毕业论文。' } } },
  6584: { meaning: '文字处理机' },
  6588: { exReplace: { 'ケ一キを分ける。': { jp: 'ケーキを分ける。', zh: '分蛋糕。' }, '\\ iangle 使い方によって分ける。': { jp: '使い方によって分ける。', zh: '依用法进行分类。' } }, exRemove: ['ケ一キを割る。'] },
  6589: { kana: 'わさび', meaning: '芥末' },
  6590: { meaning: '遗忘的东西,丢失物' },
  6595: { pitch: '②' },
  6598: { meaning: '明亮的;快活的,开朗的;精通的' },
  6600: { exReplace: { 'ド了が開いている。': { jp: 'ドアが開いている。', zh: '门开着。' }, 'み店せは あさく朝9時じに開く。': { jp: '店は朝9時に開く。', zh: '店在早上九点开门。' } } },
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
  if (f.examples) w.examples = f.examples
  if (w.examples && Array.isArray(w.examples)) {
    if (f.exRemove) w.examples = w.examples.filter(ex => !f.exRemove.some(r => ex.jp && ex.jp.includes(r)))
    if (f.exReplace) w.examples = w.examples.map(ex => {
      if (!ex.jp) return ex
      if (f.exReplace[ex.jp]) return { ...ex, ...f.exReplace[ex.jp] }
      const key = Object.keys(f.exReplace).find(k => ex.jp.includes(k))
      return key ? { ...ex, ...f.exReplace[key] } : ex
    })
    if (f.exAppend) w.examples = w.examples.concat(f.exAppend)
  }
  if (f.kanji !== undefined || f.kana || f.exReplace || f.exRemove || f.exAppend || f.examples) {
    if (w.kanji) w.kanjiFurigana = await convert(w.kanji)
    if (w.examples) for (const ex of w.examples) if (ex.jp) ex.jpFurigana = await convert(ex.jp)
  }
  applied++
}
console.log('已修正词条：', applied)

const relAdd = {
  6401: { rel: [['ネギ']] },
  6402: { rel: [['鳴る', 'なる']] },
  6403: { syn: [['消える', 'きえる']] },
  6404: { syn: [['打つ', 'うつ']] },
  6406: { rel: [['大豆', 'だいず']] },
  6407: { rel: [['鍋料理', 'なべりょうり']] },
  6408: { rel: [['鳴く', 'なく']] },
  6409: { syn: [['できるだけ']] },
  6412: { rel: [['香り', 'かおり']] },
  6413: { ant: [['甘い', 'あまい']] },
  6414: { rel: [['逃走', 'とうそう']] },
  6415: { rel: [['曜日', 'ようび']] },
  6416: { ant: [['卒業', 'そつぎょう']] },
  6417: { syn: [['似合う', 'にあう']] },
  6418: { rel: [['人形劇', 'にんぎょうげき']] },
  6419: { syn: [['盗む', 'ぬすむ']] },
  6420: { rel: [['濡らす', 'ぬらす']] },
  6421: { syn: [['価格', 'かかく']] },
  6422: { rel: [['寝る', 'ねる']] },
  6423: { rel: [['眠る', 'ねむる']] },
  6424: { ant: [['起きる', 'おきる']] },
  6426: { rel: [['残る', 'のこる']] },
  6427: { rel: [['残り', 'のこり']] },
  6428: { rel: [['喉が渇く', 'のどがかわく']] },
  6429: { rel: [['おにぎり']] },
  6430: { rel: [['乗り換える', 'のりかえる']] },
  6431: { rel: [['乗り換え', 'のりかえ']] },
  6432: { rel: [['乗る', 'のる']] },
  6433: { rel: [['葉っぱ', 'はっぱ']] },
  6434: { rel: [['はい']] },
  6435: { syn: [['時', 'とき']] },
  6436: { rel: [['三倍', 'さんばい']] },
  6437: { rel: [['見る', 'みる']] },
  6438: { rel: [['灰色', 'はいいろ']] },
  6439: { rel: [['歯', 'は']] },
  6440: { syn: [['アルバイト']] },
  6441: { ant: [['利口', 'りこう']] },
  6442: { rel: [['箱', 'はこ']] },
  6443: { rel: [['運送', 'うんそう']] },
  6444: { rel: [['はさみ']] },
  6445: { rel: [['発音する']] },
  6446: { syn: [['明確', 'めいかく']] },
  6447: { rel: [['かばん']] },
  6448: { syn: [['成長', 'せいちょう']] },
  6449: { syn: [['幸せ', 'しあわせ']] },
  6450: { rel: [['桜', 'さくら']] },
  6451: { ant: [['近づく', 'ちかづく']] },
  6452: { ant: [['遅く', 'おそく']] },
  6453: { rel: [['森', 'もり']] },
  6454: { rel: [['花', 'はな']] },
  6455: { rel: [['支払い', 'しはらい']] },
  6456: { rel: [['番線', 'ばんせん']] },
  6457: { rel: [['動物', 'どうぶつ']] },
  6458: { ant: [['賛成', 'さんせい']] },
  6459: { rel: [['罪人', 'ざいにん']] },
  6460: { rel: [['ハンバーグ']] },
  6461: { rel: [['楽器', 'がっき']] },
  6462: { syn: [['光', 'ひかり']] },
  6463: { rel: [['引っ越す', 'ひっこす']] },
  6464: { rel: [['光', 'ひかり']] },
  6465: { rel: [['押入れ', 'おしいれ']] },
  6466: { rel: [['ひげ']] },
  6467: { rel: [['空港', 'くうこう']] },
  6468: { rel: [['久しぶりに']] },
  6469: { rel: [['博物館', 'はくぶつかん']] },
  6470: { syn: [['大変', 'たいへん']] },
  6471: { syn: [['驚く', 'おどろく']] },
  6472: { rel: [['建物', 'たてもの']] },
  6473: { ant: [['夜中', 'よなか']] },
  6474: { rel: [['昼', 'ひる']] },
  6475: { rel: [['広い', 'ひろい']] },
  6476: { rel: [['色', 'いろ']] },
  6477: { ant: [['親切', 'しんせつ']] },
  6478: { rel: [['課長', 'かちょう']] },
  6479: { rel: [['一般', 'いっぱん']] },
  6480: { rel: [['果物', 'くだもの']] },
  6481: { ant: [['痩せる', 'やせる']] },
  6482: { rel: [['掛布団', 'かけぶとん']] },
  6483: { ant: [['便利', 'べんり']] },
  6484: { rel: [['踏切', 'ふみきり']] },
  6485: { syn: [['果物', 'くだもの']] },
  6486: { syn: [['贈り物', 'おくりもの']] },
  6487: { syn: [['文章', 'ぶんしょう']] },
  6488: { rel: [['報告書', 'ほうこくしょ']] },
  6489: { rel: [['放送局', 'ほうそうきょく']] },
  6490: { rel: [['放送', 'ほうそう']] },
  6491: { syn: [['やり方', 'やりかた']] },
  6492: { rel: [['法令', 'ほうれい']] },
  6493: { rel: [['野菜', 'やさい']] },
  6494: { rel: [['私', 'わたし']] },
  6495: { rel: [['大部分', 'だいぶぶん']] },
  6496: { ant: [['叱る', 'しかる']] },
  6497: { rel: [['見て']] },
  6498: { rel: [['通訳', 'つうやく']] },
  6499: { rel: [['前', 'まえ']] },
  6500: { rel: [['委任', 'いにん']] },
  6501: { ant: [['勝つ', 'かつ']] },
  6502: { ant: [['不真面目', 'ふまじめ']] },
  6505: { syn: [['誤る', 'あやまる']] },
  6506: { syn: [['誤る', 'あやまる']] },
  6507: { rel: [['間に合わない']] },
  6508: { syn: [['保護', 'ほご']] },
  6509: { rel: [['調味料', 'ちょうみりょう']] },
  6510: { rel: [['まるで~ようだ']] },
  6511: { rel: [['周囲', 'しゅうい']] },
  6512: { rel: [['回転', 'かいてん']] },
  6513: { rel: [['満席', 'まんせき']] },
  6514: { rel: [['アニメ']] },
  6515: { rel: [['果物', 'くだもの']] },
  6516: { syn: [['中央', 'ちゅうおう']] },
  6517: { syn: [['会議', 'かいぎ']] },
  6518: { ant: [['見えない']] },
  6519: { rel: [['果物', 'くだもの']] },
  6520: { rel: [['味噌汁', 'みそしる']] },
  6521: { rel: [['見つける', 'みつける']] },
  6522: { rel: [['見つかる', 'みつかる']] },
  6523: { syn: [['承認', 'しょうにん']] },
  6524: { syn: [['皆', 'みな']] },
  6525: { rel: [['空港', 'くうこう']] },
  6526: { rel: [['センチ']] },
  6527: { syn: [['向く', 'むく']] },
  6528: { ant: [['送る', 'おくる']] },
  6529: { ant: [['今', 'いま']] },
  6530: { ant: [['娘', 'むすめ']] },
  6531: { ant: [['息子', 'むすこ']] },
  6532: { syn: [['無駄使い', 'むだづかい']] },
  6533: { rel: [['胸騒ぎ', 'むなさわぎ']] },
  6534: { syn: [['面倒', 'めんどう']] },
  6535: { rel: [['センチ']] },
  6536: { rel: [['果物', 'くだもの']] },
  6537: { rel: [['目', 'め']] },
  6538: { rel: [['ご飯', 'ごはん']] },
  6539: { ant: [['進む', 'すすむ']] },
  6540: { rel: [['くれる']] },
  6541: { rel: [['こんにちは']] },
  6542: { rel: [['約束を守る', 'やくそくをまもる']] },
  6543: { rel: [['焼く', 'やく']] },
  6544: { syn: [['親切', 'しんせつ']] },
  6545: { ant: [['太る', 'ふとる']] },
  6546: { rel: [['来る', 'くる']] },
  6547: { syn: [['ようやく']] },
  6548: { syn: [['やはり']] },
  6549: { syn: [['やっぱり']] },
  6550: { rel: [['破る', 'やぶる']] },
  6551: { syn: [['方法', 'ほうほう']] },
  6552: { ant: [['硬い', 'かたい']] },
  6553: { rel: [['遊び', 'あそび']] },
  6554: { rel: [['輸出', 'ゆしゅつ']] },
  6555: { ant: [['輸出', 'ゆしゅつ']] },
  6556: { syn: [['準備', 'じゅんび']] },
  6557: { rel: [['紙', 'かみ']] },
  6558: { rel: [['用', 'よう']] },
  6559: { syn: [['状況', 'じょうきょう']] },
  6560: { rel: [['汚れる', 'よごれる']] },
  6561: { ant: [['綺麗になる', 'きれいになる']] },
  6562: { ant: [['復習', 'ふくしゅう']] },
  6563: { ant: [['昼間', 'ひるま']] },
  6564: { rel: [['世間', 'せけん']] },
  6565: { rel: [['予約する']] },
  6566: { rel: [['寄り道', 'よりみち']] },
  6567: { syn: [['歓喜', 'かんき']] },
  6568: { ant: [['悲しむ', 'かなしむ']] },
  6569: { syn: [['良い', 'よい']] },
  6570: { rel: [['学生寮', 'がくせいりょう']] },
  6571: { rel: [['利用者', 'りようしゃ']] },
  6572: { rel: [['利用', 'りよう']] },
  6574: { rel: [['留守番', 'るすばん']] },
  6575: { rel: [['敷金', 'しききん']] },
  6576: { rel: [['歴史家', 'れきしか']] },
  6577: { rel: [['行列', 'ぎょうれつ']] },
  6578: { rel: [['果物', 'くだもの']] },
  6579: { rel: [['連絡先', 'れんらくさき']] },
  6580: { rel: [['連絡', 'れんらく']] },
  6581: { rel: [['高齢者', 'こうれいしゃ']] },
  6582: { rel: [['卒業論文', 'そつぎょうろんぶん']] },
  6584: { rel: [['文書', 'ぶんしょ']] },
  6585: { rel: [['酒', 'さけ']] },
  6586: { rel: [['分ける', 'わける']] },
  6587: { syn: [['理由', 'りゆう']] },
  6588: { rel: [['分かれる', 'わかれる']] },
  6589: { rel: [['芥子', 'からし']] },
  6590: { rel: [['忘れる', 'わすれる']] },
  6591: { rel: [['着物', 'きもの']] },
  6592: { rel: [['氷', 'こおり']] },
  6593: { rel: [['会合', 'かいごう']] },
  6594: { rel: [['青い', 'あおい']] },
  6595: { rel: [['青', 'あお']] },
  6596: { rel: [['赤い', 'あかい']] },
  6597: { rel: [['赤', 'あか']] },
  6598: { ant: [['暗い', 'くらい']] },
  6599: { rel: [['季節', 'きせつ']] },
  6600: { ant: [['閉まる', 'しまる']] },
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
