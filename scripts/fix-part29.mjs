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
  5401: { meaning: '不管怎么说,总之' },
  5402: { exReplace: { '何とか間に合った。': { jp: '何とか間に合った。', zh: '勉强凑合。' } } },
  5405: { meaning: '入国,入境' },
  5406: { exReplace: { 'せんしゃにゅうじょう。': { jp: '選手入場。', zh: '运动员入场。' } } },
  5407: { kana: 'にらむ' },
  5409: { kana: 'にんじん' },
  5411: { kanji: '縫う' },
  5412: { kanji: '抜ける', exReplace: { '2ページが拔けている。': { jp: '2ページが抜けている。', zh: '缺少两页。' } } },
  5413: { kana: 'ぬの' },
  5418: { kanji: '眠たい', meaning: '困倦的,昏昏欲睡' },
  5419: { meaning: '能睡着,睡得着' },
  5420: { exRemove: ['年賀状(ねんがじょう) [ 名]贺年片, 明信片。'] },
  5421: { meaning: '一年;年间' },
  5422: { meaning: '全年,整年' },
  5423: { exReplace: { '年代の差を感じる。': { jp: '年代の差を感じる。', zh: '感到不同年代间的差异。' } } },
  5426: { meaning: '装上,装载;哄骗', exReplace: { 'う ま い 話 に 乗 せ ら れ た。': { jp: 'うまい話に乗せられた。', zh: '被甜言蜜语骗了。' } } },
  5427: { kana: 'のせる', exRemove: ['だいわん しんょう。', '大連を経由して藩陽に行く。'] },
  5434: { exReplace: { '意見を述る。': { jp: '意見を述べる。', zh: '陈述意见。' } } },
  5435: { kana: 'のぼる' },
  5438: { kanji: '乗り過ごす', kana: 'のりすごす' },
  5440: { meaning: '安闲,悠然自得;慢性子;漫不经心' },
  5441: { meaning: '悠闲自在,无拘无束,悠然自得' },
  5443: { meaning: '野外烤肉,烧烤' },
  5445: { exRemove: ['富士山を背景に写真を撮った。'] },
  5446: { exReplace: { '贈モう答とうひ品ん の配はい送モう。': { jp: '贈答品の配送。', zh: '发送礼品。' } } },
  5447: { meaning: '演员' },
  5450: { meaning: '愚蠢,无聊', exReplace: { '馬鹿らしいことを言うな。': { jp: '馬鹿らしいことを言うな。', zh: '不要说无聊的话。' }, 'コーヒー一杯に800円も払うなんて馬鹿ら。': { jp: 'コーヒー一杯に800円も払うなんて馬鹿らしい。', zh: '为了一杯咖啡付800日元太愚蠢了。' } } },
  5453: { meaning: '恶心,想要呕吐' },
  5455: { kanji: '掃く' },
  5456: { meaning: '……宿' },
  5457: { kana: 'はくさい', meaning: '白菜' },
  5458: { meaning: '拍手,鼓掌', exRemove: ['は く し ょ 拍 く。'] },
  5459: { pos: 'イ形', exReplace: { '雨が激L<なった。': { jp: '雨が激しくなった。', zh: '雨下得越发大了。' } } },
  5462: { meaning: '刚开始,首先', exRemove: ['はだ。', '肌が荒れる。', '坂の肌。'], exReplace: { '始めは自己紹介します。': { jp: '始めは自己紹介します。', zh: '首先自我介绍一下。' } } },
  5464: { meaning: '到处跑,到处奔走', exReplace: { '子どもが家の中を走り回る。': { jp: '子どもが家の中を走り回る。', zh: '孩子在家里到处跑。' } } },
  5465: { meaning: '摘下,解开;去掉', exReplace: { '眼鏡を外寸。': { jp: '眼鏡を外す。', zh: '摘下眼镜。' } } },
  5466: { meaning: '……颗,……发' },
  5467: { meaning: '罚款' },
  5468: { kanji: 'パック', kana: 'パック' },
  5469: { meaning: '发现' },
  5470: { meaning: '发车,开车' },
  5473: { meaning: '(身心)发达;发展' },
  5475: { pos: '名·他動3' },
  5476: { meaning: '发明' },
  5477: { meaning: '新年后首次去寺庙或神社参拜' },
  5478: { meaning: '羽毛球' },
  5479: { meaning: '谈话,对话;商量' },
  5480: { meaning: '搭话,打招呼;刚要说', exReplace: { '知らない人に話しかけられた。': { jp: '知らない人に話しかけられた。', zh: '被不认识的人搭话。' } } },
  5481: { meaning: '正在谈话中' },
  5482: { meaning: '说话者' },
  5483: { exReplace: { 'う代を なす。': { jp: '風船を放す。', zh: '放飞气球。' } } },
  5487: { exReplace: { '値扫上办げは幅 い。': { jp: '値上げの幅が大きい。', zh: '涨价的幅度很大。' } } },
  5488: { meaning: '省略;精简' },
  5489: { exReplace: { '菌プラシで菌を磨く。': { jp: '歯ブラシで歯を磨く。', zh: '用牙刷刷牙。' } } },
  5490: { meaning: '刷牙;牙刷' },
  5494: { meaning: '提前' },
  5495: { meaning: '加快' },
  5496: { meaning: '流行,时髦' },
  5497: { exReplace: { '腹を壊す。': { jp: '腹を壊す。', zh: '泻肚,(吃)坏肚子。' } } },
  5498: { kanji: '払い戻す', meaning: '退还,退款', exReplace: { '運賃を払い層す。': { jp: '運賃を払い戻す。', zh: '退还运费。' } } },
  5499: { meaning: '针,针状物;刺' },
  5502: { meaning: '半价,半数' },
  5505: { pos: '嘆·名·自動3', meaning: '万岁;可喜可贺;没辙', exReplace: { 'うまくいけば万識だ。': { jp: 'うまくいけば万歳だ。', zh: '如果进展顺利的话真是可喜可贺。' } } },
  5509: { meaning: '判断;推量,推测' },
  5510: { exReplace: { '半はんきが経つ。': { jp: '半月が経つ。', zh: '经过半个月。' } } },
  5511: { kana: 'はんとし' },
  5514: { exReplace: { '半日をかけてレポ 一 卜を書いた。': { jp: '半日をかけてレポートを書いた。', zh: '花了半天时间写好了小论文。' } } },
  5517: { meaning: '青椒,圆辣椒' },
  5522: { meaning: '东侧,东面' },
  5523: { kanji: 'ぴかぴか', kana: 'ぴかぴか' },
  5526: { meaning: '引起,引发' },
  5527: { kana: 'ひざ' },
  5532: { kana: 'ひしょ' },
  5535: { exRemove: ['た広ひ ろい人ひ 额头宽的人。'] },
  5538: { kanji: '左側' },
  5539: { meaning: '笔者,作者' },
  5540: { kanji: 'ぴったり', kana: 'ぴったり' },
  5543: { meaning: '一句话,三言两语', exReplace: { '一 言も言わない。': { jp: '一言も言わない。', zh: '一言不发。' }, '最後に 一 言。': { jp: '最後に一言。', zh: '最后讲几句话。' } } },
  5544: { meaning: '旁人;帮手;人手,人员', exReplace: { '2.2.人手1 が足りない。': { jp: '人手が足りない。', zh: '人手不够。' } } },
  5546: { kanji: '一晩', meaning: '一晚,一夜,一晚上', exReplace: { '一 晚 を 泊 ま る。': { jp: '一晩を泊まる。', zh: '投宿一晚。' } } },
  5547: { meaning: '休息片刻,歇一会' },
  5548: { exReplace: { '一 人 一 人の名前を呼。': { jp: '一人一人の名前を呼ぶ。', zh: '一个一个地叫名字。' } } },
  5550: { meaning: '皮肤' },
  5551: { exReplace: { '靴の粗を結ぶ。': { jp: '靴の紐を結ぶ。', zh: '系鞋带。' } } },
  5552: { meaning: '冰镇,弄凉;使……冷静' },
  5553: { meaning: '百货商店', exRemove: ['表を作る。'] },
  5555: { kanji: '費用', exReplace: { '费用を負担する。': { jp: '費用を負担する。', zh: '负担费用。' } } },
  5556: { meaning: '美容' },
  5557: { meaning: '美发厅;美容院', exReplace: { '美容院で髪を 力 ッ卜する。': { jp: '美容院で髪をカットする。', zh: '在发廊剪头发。' } } },
  5558: { meaning: '表现,表达' },
  5562: { meaning: '表面;外表,外观' },
  5564: { exReplace: { 'きいふ財布を ひろ拾う。': { jp: '財布を拾う。', zh: '捡钱包。' } } },
  5565: { exReplace: { '事業がまます広がる。': { jp: '事業がますます広がる。', zh: '事业规模越来越大。' } } },
  5569: { meaning: '推广;传播' },
  5571: { meaning: '质量' },
  5574: { meaning: '风扇;粉丝' },
  5576: { meaning: '不稳定', exReplace: { '不安定な生活。': { jp: '不安定な生活。', zh: '不稳定的生活。' } } },
  5577: { meaning: '风景,景色' },
  5579: { meaning: '渡船' },
  5580: { exReplace: { '体重が增える。': { jp: '体重が増える。', zh: '体重增加。' } } },
  5581: { exRemove: ['しんらい。'] },
  5583: { meaning: '不可能,做不到' },
  5584: { meaning: '加深,加强' },
  5585: { exReplace: { '窓から風が吹き込む。': { jp: '窓から風が吹き込む。', zh: '从窗户刮进来风。' } } },
  5586: { meaning: '(自)刮起来;(他)笑出来', exReplace: { '笛を吹く出 た。': { jp: '笛を吹き出した。', zh: '吹起笛子来了。' } } },
  5588: { exReplace: { '公 の付上近。': { jp: '公園の付近。', zh: '公园附近。' } } },
  5589: { kanji: '拭く', kana: 'ふく', exReplace: { '雜巾で机を拭く。': { jp: '雑巾で机を拭く。', zh: '用抹布擦桌子。' } } },
  5590: { exReplace: { '複雑な問题。': { jp: '複雑な問題。', zh: '复杂的问题。' } } },
  5591: { meaning: '服装,穿着' },
  5592: { meaning: '包含,包括' },
  5593: { meaning: '袋子,口袋' },
  5594: { meaning: '不幸,倒霉' },
  5595: { meaning: '不合格' },
  5599: { meaning: '不充足,不完全' },
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
  5402: { syn: [['どうにか']] },
  5403: { rel: [['ぼんやり']] },
  5404: { rel: [['生活用品', 'せいかつようひん']] },
  5405: { ant: [['出国', 'しゅっこく']] },
  5406: { ant: [['退場', 'たいじょう']] },
  5407: { syn: [['見詰める', 'みつめる']] },
  5408: { rel: [['料理', 'りょうり']] },
  5409: { rel: [['野菜', 'やさい']] },
  5410: { rel: [['数', 'かず']] },
  5411: { rel: [['糸', 'いと']] },
  5412: { syn: [['脱落', 'だつらく']] },
  5413: { syn: [['生地', 'きじ']] },
  5414: { rel: [['動物', 'どうぶつ']] },
  5416: { rel: [['網', 'あみ']] },
  5417: { rel: [['眠い', 'ねむい']] },
  5418: { syn: [['眠い', 'ねむい']] },
  5419: { rel: [['眠る', 'ねむる']] },
  5420: { rel: [['挨拶状', 'あいさつじょう']] },
  5421: { rel: [['一年', 'いちねん']] },
  5422: { syn: [['一年中', 'いちねんじゅう']] },
  5423: { syn: [['時代', 'じだい']] },
  5424: { ant: [['年末', 'ねんまつ']] },
  5425: { syn: [['毎年', 'まいとし']] },
  5426: { syn: [['搭載', 'とうさい']] },
  5427: { syn: [['乗せる', 'のせる']] },
  5428: { syn: [['願う', 'ねがう']] },
  5429: { rel: [['叩く', 'たたく']] },
  5430: { syn: [['延ばす', 'のばす']] },
  5431: { syn: [['伸ばす', 'のばす']] },
  5432: { ant: [['縮む', 'ちぢむ']] },
  5433: { syn: [['延期', 'えんき']] },
  5434: { syn: [['陳述', 'ちんじゅつ']] },
  5435: { syn: [['上る', 'のぼる']] },
  5436: { ant: [['間に合う', 'まにあう']] },
  5437: { syn: [['乗り過ごす', 'のりすごす']] },
  5438: { syn: [['乗り越す', 'のりこす']] },
  5439: { rel: [['掲載', 'けいさい']] },
  5440: { syn: [['気楽', 'きらく']] },
  5441: { syn: [['ゆったり']] },
  5442: { rel: [['百分率', 'ひゃくぶんりつ']] },
  5443: { rel: [['焼肉', 'やきにく']] },
  5444: { rel: [['楽器', 'がっき']] },
  5446: { syn: [['配達', 'はいたつ']] },
  5447: { syn: [['役者', 'やくしゃ']] },
  5448: { syn: [['侵入', 'しんにゅう']] },
  5449: { rel: [['虫', 'むし']] },
  5450: { syn: [['馬鹿馬鹿しい', 'ばかばかしい']] },
  5452: { syn: [['計る', 'はかる']] },
  5453: { rel: [['吐く', 'はく']] },
  5454: { rel: [['靴', 'くつ']] },
  5455: { rel: [['掃除', 'そうじ']] },
  5457: { rel: [['野菜', 'やさい']] },
  5459: { syn: [['猛烈', 'もうれつ']] },
  5460: { syn: [['恥辱', 'ちじょく']] },
  5463: { rel: [['家', 'いえ']] },
  5464: { syn: [['駆け回る', 'かけまわる']] },
  5465: { ant: [['付ける', 'つける']] },
  5466: { rel: [['弾丸', 'だんがん']] },
  5467: { rel: [['罰', 'ばつ']] },
  5469: { syn: [['見つける', 'みつける']] },
  5470: { ant: [['到着', 'とうちゃく']] },
  5471: { syn: [['処罰', 'しょばつ']] },
  5472: { syn: [['着想', 'ちゃくそう']] },
  5473: { syn: [['発展', 'はってん']] },
  5474: { ant: [['購入', 'こうにゅう']] },
  5475: { syn: [['公開', 'こうかい']] },
  5476: { rel: [['発明家', 'はつめいか']] },
  5477: { rel: [['神社', 'じんじゃ']] },
  5479: { syn: [['相談する', 'そうだんする']] },
  5480: { rel: [['会話', 'かいわ']] },
  5481: { rel: [['会話', 'かいわ']] },
  5482: { ant: [['聞き手', 'ききて']] },
  5483: { syn: [['放つ', 'はなつ']] },
  5484: { syn: [['放す', 'はなす']] },
  5485: { rel: [['花', 'はな']] },
  5486: { rel: [['鼻', 'はな']] },
  5487: { syn: [['広さ', 'ひろさ']] },
  5488: { syn: [['省略', 'しょうりゃく']] },
  5489: { rel: [['歯', 'は']] },
  5490: { rel: [['歯', 'は']] },
  5491: { syn: [['はめ込む', 'はめこむ']] },
  5492: { syn: [['シーン']] },
  5493: { ant: [['遅め', 'おそめ']] },
  5494: { ant: [['遅らせる', 'おくらせる']] },
  5495: { ant: [['遅くする', 'おそくする']] },
  5496: { syn: [['ファッション']] },
  5497: { rel: [['胃', 'い']] },
  5498: { syn: [['返金', 'へんきん']] },
  5499: { rel: [['糸', 'いと']] },
  5501: { syn: [['領域', 'りょういき']] },
  5502: { rel: [['割引', 'わりびき']] },
  5503: { syn: [['反逆', 'はんぎゃく']] },
  5504: { syn: [['犯行', 'はんこう']] },
  5505: { rel: [['喜び', 'よろこび']] },
  5506: { syn: [['美男子', 'びだんし']] },
  5507: { rel: [['全数', 'ぜんすう']] },
  5508: { ant: [['長袖', 'ながそで']] },
  5509: { syn: [['判定', 'はんてい']] },
  5510: { rel: [['月', 'つき']] },
  5511: { rel: [['一年', 'いちねん']] },
  5512: { syn: [['手引書', 'てびきしょ']] },
  5513: { rel: [['運転', 'うんてん']] },
  5514: { rel: [['一日', 'いちにち']] },
  5515: { syn: [['小冊子', 'しょうさっし']] },
  5518: { ant: [['加害者', 'かがいしゃ']] },
  5519: { rel: [['一泊', 'いっぱく']] },
  5520: { syn: [['比べる', 'くらべる']] },
  5521: { syn: [['割に', 'わりに']] },
  5522: { ant: [['西側', 'にしがわ']] },
  5524: { syn: [['惹かれる', 'ひかれる']] },
  5525: { syn: [['承諾', 'しょうだく']] },
  5526: { syn: [['誘発', 'ゆうはつ']] },
  5527: { rel: [['足', 'あし']] },
  5529: { rel: [['パスポート']] },
  5530: { syn: [['商売', 'しょうばい']] },
  5531: { rel: [['芸術', 'げいじゅつ']] },
  5532: { rel: [['社長', 'しゃちょう']] },
  5533: { syn: [['異常', 'いじょう']] },
  5535: { rel: [['顔', 'かお']] },
  5536: { rel: [['栄養', 'えいよう']] },
  5537: { ant: [['右足', 'みぎあし']] },
  5538: { ant: [['右側', 'みぎがわ']] },
  5539: { syn: [['著者', 'ちょしゃ']] },
  5541: { syn: [['必要', 'ひつよう']] },
  5542: { syn: [['残酷', 'ざんこく']] },
  5543: { rel: [['言葉', 'ことば']] },
  5544: { rel: [['人員', 'じんいん']] },
  5545: { rel: [['人', 'ひと']] },
  5546: { rel: [['一泊', 'いっぱく']] },
  5547: { syn: [['休息', 'きゅうそく']] },
  5548: { syn: [['各自', 'かくじ']] },
  5549: { syn: [['批評', 'ひひょう']] },
  5550: { rel: [['肌', 'はだ']] },
  5551: { rel: [['靴', 'くつ']] },
  5552: { ant: [['温める', 'あたためる']] },
  5553: { syn: [['デパート']] },
  5554: { syn: [['図表', 'ずひょう']] },
  5555: { syn: [['経費', 'けいひ']] },
  5556: { rel: [['美', 'び']] },
  5557: { rel: [['髪', 'かみ']] },
  5558: { syn: [['表す', 'あらわす']] },
  5559: { rel: [['病院', 'びょういん']] },
  5560: { rel: [['顔', 'かお']] },
  5561: { syn: [['対等', 'たいとう']] },
  5562: { ant: [['裏面', 'うらめん']] },
  5563: { rel: [['睡眠', 'すいみん']] },
  5564: { syn: [['拾い上げる', 'ひろいあげる']] },
  5565: { ant: [['縮む', 'ちぢむ']] },
  5566: { ant: [['畳む', 'たたむ']] },
  5567: { rel: [['場所', 'ばしょ']] },
  5568: { syn: [['普及', 'ふきゅう']] },
  5569: { syn: [['普及させる', 'ふきゅうさせる']] },
  5570: { ant: [['鈍感', 'どんかん']] },
  5571: { rel: [['質', 'しつ']] },
  5572: { rel: [['卓球', 'たっきゅう']] },
  5574: { syn: [['愛好者', 'あいこうしゃ']] },
  5575: { ant: [['安心', 'あんしん']] },
  5576: { ant: [['安定', 'あんてい']] },
  5577: { syn: [['景色', 'けしき']] },
  5578: { rel: [['夫', 'おっと']] },
  5580: { ant: [['減る', 'へる']] },
  5581: { ant: [['上司', 'じょうし']] },
  5582: { rel: [['クラブ']] },
  5583: { ant: [['可能', 'かのう']] },
  5584: { ant: [['浅くする', 'あさくする']] },
  5585: { rel: [['吹く', 'ふく']] },
  5586: { rel: [['吹く', 'ふく']] },
  5587: { syn: [['広まる', 'ひろまる']] },
  5588: { syn: [['近所', 'きんじょ']] },
  5589: { syn: [['拭う', 'ぬぐう']] },
  5590: { ant: [['簡単', 'かんたん']] },
  5591: { syn: [['衣類', 'いるい']] },
  5592: { syn: [['含む', 'ふくむ']] },
  5593: { rel: [['中身', 'なかみ']] },
  5594: { ant: [['幸福', 'こうふく']] },
  5595: { ant: [['合格', 'ごうかく']] },
  5596: { ant: [['公平', 'こうへい']] },
  5597: { syn: [['無難', 'ぶなん']] },
  5598: { syn: [['奇妙', 'きみょう']] },
  5599: { ant: [['十分', 'じゅうぶん']] },
  5600: { syn: [['女性', 'じょせい']] },
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
