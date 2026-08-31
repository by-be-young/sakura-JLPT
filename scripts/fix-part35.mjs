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
  6604: { meaning: '早饭' },
  6607: { meaning: '玩耍,游玩' },
  6609: { meaning: '暖和的;温暖的,热情的' },
  6610: { exReplace: { 'あた頭まがいい痛たい。': { jp: '頭が痛い。', zh: '头疼。' }, '扬た頭主が い。': { jp: '頭がいい。', zh: '聪明。' }, '慎用 あたま頭が下がる。': { jp: '頭が下がる。', zh: '佩服,钦佩。' } } },
  6611: { pitch: '③/④' },
  6612: { meaning: '那里,那边;那位' },
  6613: { meaning: '烫的,热的', exRemove: ['熱が冷める。', '勉強に熱心だ。'], exAppend: [{ jp: '熱いお茶。', zh: '热茶。' }] },
  6615: { meaning: '后面;之后;剩余' },
  6619: { kana: 'あのう' },
  6620: { kanji: '', kana: 'アパート', meaning: '公寓' },
  6621: { kanji: '危ない', pos: 'イ形' },
  6624: { kanji: '飴' },
  6627: { pitch: '⑤' },
  6630: { kana: 'いちにち' },
  6632: { meaning: '什么时候' },
  6634: { meaning: '一起;相同' },
  6635: { exReplace: { '妹と 一 緒に公園へ行く。': { jp: '妹と一緒に公園へ行く。', zh: '和妹妹一起去公园。' } } },
  6636: { kana: 'いっぱい' },
  6638: { exReplace: { 'まにをしているの。': { jp: '今何をしているの。', zh: '你在干吗呢?' } } },
  6639: { exReplace: { '今では、あなたと結婚できない。': { jp: '今では、あなたと結婚できない。', zh: '现在我已不能和你结婚了。' } } },
  6640: { exReplace: { '今まで勉強を頑張っていた。': { jp: '今まで勉強を頑張っていた。', zh: '至今为止一直努力学习。' } } },
  6641: { kana: 'いもうと', meaning: '(自己的)妹妹', exRemove: ['猛反対。', '猛反発。', '猛勉强。'], exAppend: [{ jp: '妹が二人います。', zh: '有两个妹妹。' }] },
  6643: { meaning: '入口' },
  6652: { pitch: '⓪' },
  6656: { exReplace: { 'かわいい赤ちゃんが生まれた。': { jp: 'かわいい赤ちゃんが生まれた。', zh: '出生了可爱的宝宝。' }, '新しい作り方が生まれた。': { jp: '新しい作り方が生まれた。', zh: '产生了新的做法。' } } },
  6661: { exReplace: { '新 Lい運動場ができた。': { jp: '新しい運動場ができた。', zh: '建好了新的运动场。' } } },
  6662: { kana: 'え', meaning: '绘画', exReplace: { '月の輪。': { jp: '絵を描く。', zh: '画画。' } } },
  6667: { pitch: '⓪' },
  6673: { kanji: '園長', meaning: '(幼儿园、动物园等的)园长' },
  6675: { pitch: '①' },
  6676: { exReplace: { 'お客さんにいいサービスを提供します。': { jp: 'お客さんにいいサービスを提供します。', zh: '向顾客提供优质服务。' } } },
  6677: { kanji: '置く', exReplace: { '卵を冷蔵庫の中に置く。': { jp: '卵を冷蔵庫の中に置く。', zh: '把鸡蛋放进冰箱。' } } },
  6678: { pitch: '①', meaning: '您妻子,夫人' },
  6679: { meaning: '叔叔,伯父,舅舅' },
  6680: { pitch: '②' },
  6681: { pitch: '⓪', meaning: '教,传授;告诉' },
  6684: { meaning: '茶;茶叶' },
  6685: { exReplace: { '一 番下の弟は小学生です。': { jp: '一番下の弟は小学生です。', zh: '最小的弟弟是小学生。' } } },
  6687: { kana: 'おととい' },
  6688: { kana: 'おととし' },
  6690: { pitch: '①', exReplace: { 'わたし達は興味が同じだ。': { jp: 'わたし達は興味が同じだ。', zh: '我们的兴趣爱好相同。' }, 'なじ 人ひと。': { jp: '同じ人。', zh: '同一个人。' } } },
  6692: { meaning: '阿姨,姑妈,舅妈' },
  6697: { kana: 'おや', meaning: '父母,双亲' },
  6700: { kana: 'かいがい', exReplace: { '海外旅行。': { jp: '海外旅行。', zh: '海外旅行;出国。' } } },
  6703: { exReplace: { 'あい外こ国くじ人ん に会5。': { jp: '外国人に会う。', zh: '见外国人。' } } },
  6705: { meaning: '公司职员' },
  6706: { kana: 'がいしゅつ', exReplace: { 'あ外いしつ先き。': { jp: '外出先。', zh: '外出要去的地方。' } } },
  6708: { meaning: '买东西;要买的东西' },
  6709: { kana: 'かいわ', meaning: '会话,交流', exRemove: ['あい会いお話くん文。'] },
  6713: { exRemove: ['(电话、招呼等);挂；花费；坐；上锁め が 扫 か。', '眼镜を掛ける。', '声を掛ける。', '眼镜を掛ける。', '声を掛ける。'] },
  6714: { meaning: '花费;悬挂;上锁', exReplace: { '絵が掛かっている。': { jp: '絵が掛かっている。', zh: '挂着画。' } } },
  6715: { kanji: '鍵', meaning: '钥匙;锁' },
  6717: { kanji: '書く', meaning: '写,画', exRemove: ['\\ iangle 常識を欠く。'], exAppend: [{ jp: '字を書く。', zh: '写字。' }] },
  6722: { pitch: '③', meaning: '片假名' },
  6724: { exRemove: ['せんもんあつこう。'] },
  6725: { exReplace: { '团体活动。': { jp: '団体活動。', zh: '集体活动。' } } },
  6726: { pitch: '⓪' },
  6728: { kana: 'かな', meaning: '假名' },
  6730: { pitch: '①' },
  6731: { meaning: '戴(帽子);蒙受,承担', exRemove: ['理想を追う。'] },
  6733: { pitch: '①' },
  6734: { meaning: '油炸;油炸食品', exReplace: { 'か唐らあ揚げの作り方。': { jp: '唐揚げの作り方。', zh: '油炸物的做法。' } } },
  6735: { meaning: '辣的;咸的;烈性的', exReplace: { '6いお 酒。': { jp: '辛いお酒。', zh: '烈酒。' } } },
  6738: { meaning: '轻的,轻巧的', exReplace: { '为25軽 い グ。': { jp: '軽い鞄。', zh: '轻巧的包。' } } },
  6739: { meaning: '咖喱' },
  6741: { exReplace: { '\\ iangle 皮要剥<。': { jp: '皮を剥く。', zh: '剥皮,削皮。' } } },
  6742: { kanji: '聞く' },
  6743: { meaning: '脏的;凌乱的;卑鄙的', exReplace: { '污い部屋。': { jp: '汚い部屋。', zh: '房间很脏。' }, '污い考之方。': { jp: '汚い考え方。', zh: '卑鄙的想法。' } } },
  6745: { meaning: '纪念品' },
  6746: { pitch: '②', meaning: '昨天' },
  6750: { meaning: '兄弟姐妹' },
  6753: { exReplace: { '髪加を切る。': { jp: '髪を切る。', zh: '剪发。' }, 'んんを切る。': { jp: '電源を切る。', zh: '关闭电源。' } } },
  6755: { pitch: '③' },
  6756: { pitch: '③' },
  6757: { meaning: '银行', exReplace: { 'んこう銀行 で り上両うが式替する。': { jp: '銀行で両替する。', zh: '在银行兑换。' } } },
  6761: { pitch: '②', meaning: '水果' },
  6762: { pitch: '⓪', meaning: '嘴;说话;口,出入口' },
  6766: { kanji: '曇り', pitch: '⓪', meaning: '阴天' },
  6767: { exReplace: { '雨で窓のガラスが曇る。': { jp: '雨で窓のガラスが曇る。', zh: '由于下雨窗户玻璃模糊了。' } } },
  6768: { meaning: '暗的,昏暗的;阴郁的' },
  6773: { meaning: '非常;很好,漂亮;满意,足够', exReplace: { 'けっこ結構うゆうめ有名。': { jp: '結構有名。', zh: '非常有名。' } } },
  6774: { kanji: '結婚' },
  6775: { exReplace: { '玄閱で靴を脱いでください。': { jp: '玄関で靴を脱いでください。', zh: '请在门口脱鞋。' } } },
  6777: { kana: 'こうくうびん', meaning: '空运;航空信' },
  6778: { pitch: '⓪' },
  6780: { kanji: '紅茶', kana: 'こうちゃ' },
  6781: { pitch: '⑤', meaning: '高中' },
  6784: { kana: 'ゴールデンウィーク', meaning: '黄金周' },
  6785: { kana: 'ごご', meaning: '下午,午后' },
  6786: { pitch: '④', exReplace: { '9くつ こか。': { jp: '九月九日。', zh: '九月九号。' } } },
  6787: { exRemove: ['ギョーザを九つ食べた。   →  吃了九个饺子。 二二の おい しおょいう ょっう二あうつんね世んい', '九 つ の 甥 は 小 学 校 3 年 生になった。   →  九 岁的侄子上小学三年级。 二二の おい しおょいう ょっう二あうつんね世んい'] },
  6796: { meaning: '感到困难,为难' },
  6798: { kana: 'ゴルフ' },
}
// 6787: 修正例1/2 的 jp（含全角空格），但用 exReplace 按包含匹配更稳
fixes[6787] = { exRemove: ['二二の おい しおょいう ょっう二あうつんね世んい'] }

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
  6601: { ant: [['閉める', 'しめる']] },
  6602: { ant: [['下げる', 'さげる']] },
  6603: { rel: [['朝ご飯', 'あさごはん']] },
  6604: { rel: [['朝食', 'ちょうしょく']] },
  6605: { rel: [['明日', 'あした']] },
  6606: { rel: [['あちら']] },
  6607: { rel: [['遊び', 'あそび']] },
  6608: { rel: [['わたし']] },
  6609: { ant: [['寒い', 'さむい']] },
  6610: { rel: [['頭痛', 'ずつう']] },
  6611: { ant: [['古い', 'ふるい']] },
  6612: { rel: [['こちら']] },
  6613: { ant: [['冷たい', 'つめたい']] },
  6614: { rel: [['あちら']] },
  6615: { ant: [['前', 'まえ']] },
  6616: { rel: [['君', 'きみ']] },
  6617: { ant: [['弟', 'おとうと']] },
  6618: { ant: [['妹', 'いもうと']] },
  6619: { rel: [['あの']] },
  6620: { rel: [['マンション']] },
  6621: { syn: [['危険', 'きけん']] },
  6622: { ant: [['辛い', 'からい']] },
  6623: { rel: [['雨具', 'あまぐ']] },
  6624: { rel: [['キャンディー']] },
  6625: { rel: [['散歩', 'さんぽ']] },
  6626: { rel: [['写真', 'しゃしん']] },
  6627: { rel: [['郵便', 'ゆうびん']] },
  6628: { rel: [['病院', 'びょういん']] },
  6629: { rel: [['机', 'つくえ']] },
  6630: { rel: [['二日', 'ふつか']] },
  6631: { rel: [['一番目', 'いちばんめ']] },
  6632: { rel: [['時', 'とき']] },
  6634: { syn: [['同じ', 'おなじ']] },
  6635: { rel: [['一緒', 'いっしょ']] },
  6636: { ant: [['空', 'から']] },
  6637: { syn: [['常に', 'つねに']] },
  6638: { rel: [['現在', 'げんざい']] },
  6639: { rel: [['今', 'いま']] },
  6640: { rel: [['今', 'いま']] },
  6641: { ant: [['姉', 'あね']] },
  6642: { rel: [['いいえ']] },
  6643: { ant: [['出口', 'でぐち']] },
  6645: { rel: [['色々', 'いろいろ']] },
  6646: { syn: [['様々', 'さまざま']] },
  6647: { rel: [['ネット']] },
  6648: { rel: [['酒', 'さけ']] },
  6649: { rel: [['お茶', 'おちゃ']] },
  6650: { rel: [['いいえ']] },
  6651: { ant: [['下', 'した']] },
  6652: { ant: [['前', 'まえ']] },
  6653: { rel: [['歌手', 'かしゅ']] },
  6654: { syn: [['家庭', 'かてい']] },
  6655: { rel: [['麺', 'めん']] },
  6656: { rel: [['誕生', 'たんじょう']] },
  6657: { ant: [['買う', 'かう']] },
  6658: { syn: [['喧しい', 'やかましい']] },
  6659: { rel: [['はい']] },
  6660: { rel: [['運動', 'うんどう']] },
  6661: { rel: [['運動', 'うんどう']] },
  6662: { rel: [['絵画', 'かいが']] },
  6663: { rel: [['空調', 'くうちょう']] },
  6664: { rel: [['映画館', 'えいがかん']] },
  6665: { rel: [['映画', 'えいが']] },
  6666: { rel: [['営業', 'えいぎょう']] },
  6667: { rel: [['外国語', 'がいこくご']] },
  6668: { rel: [['駅前', 'えきまえ']] },
  6669: { rel: [['筆箱', 'ふでばこ']] },
  6670: { rel: [['葉書', 'はがき']] },
  6671: { ant: [['階段', 'かいだん']] },
  6672: { rel: [['お金', 'おかね']] },
  6673: { rel: [['幼稚園', 'ようちえん']] },
  6674: { rel: [['多数', 'たすう']] },
  6675: { rel: [['菓子', 'かし']] },
  6676: { rel: [['客', 'きゃく']] },
  6677: { rel: [['置き場', 'おきば']] },
  6678: { rel: [['妻', 'つま']] },
  6679: { rel: [['叔母', 'おば']] },
  6680: { ant: [['おばあさん']] },
  6681: { syn: [['伝える', 'つたえる']] },
  6682: { rel: [['押しボタン']] },
  6683: { ant: [['早い', 'はやい']] },
  6684: { rel: [['茶', 'ちゃ']] },
  6685: { ant: [['兄', 'あに']] },
  6686: { ant: [['女', 'おんな']] },
  6687: { rel: [['昨日', 'きのう']] },
  6688: { rel: [['去年', 'きょねん']] },
  6689: { rel: [['腹', 'はら']] },
  6690: { syn: [['同一', 'どういつ']] },
  6691: { rel: [['ご飯', 'ごはん']] },
  6692: { rel: [['叔父', 'おじ']] },
  6693: { ant: [['おじいさん']] },
  6694: { rel: [['警察', 'けいさつ']] },
  6695: { ant: [['軽い', 'かるい']] },
  6696: { syn: [['楽しい', 'たのしい']] },
  6697: { rel: [['親子', 'おやこ']] },
  6698: { rel: [['回', 'かい']] },
  6699: { rel: [['階', 'かい']] },
  6700: { ant: [['国内', 'こくない']] },
  6701: { rel: [['海外', 'かいがい']] },
  6702: { rel: [['外国', 'がいこく']] },
  6703: { rel: [['外国', 'がいこく']] },
  6704: { rel: [['会社員', 'かいしゃいん']] },
  6705: { rel: [['職員', 'しょくいん']] },
  6706: { rel: [['出かける', 'でかける']] },
  6707: { rel: [['階', 'かい']] },
  6708: { rel: [['買う', 'かう']] },
  6709: { rel: [['談話', 'だんわ']] },
  6710: { ant: [['売る', 'うる']] },
  6711: { ant: [['借りる', 'かりる']] },
  6712: { rel: [['帰宅', 'きたく']] },
  6713: { rel: [['顔色', 'かおいろ']] },
  6714: { rel: [['掛ける', 'かける']] },
  6715: { rel: [['鍵穴', 'かぎあな']] },
  6716: { rel: [['郵便', 'ゆうびん']] },
  6717: { rel: [['書き方', 'かきかた']] },
  6718: { rel: [['家財', 'かざい']] },
  6719: { rel: [['学校', 'がっこう']] },
  6720: { rel: [['月', 'つき']] },
  6721: { rel: [['方法', 'ほうほう']] },
  6722: { ant: [['平仮名', 'ひらがな']] },
  6723: { rel: [['月', 'つき']] },
  6724: { rel: [['学生', 'がくせい']] },
  6725: { rel: [['運動', 'うんどう']] },
  6726: { rel: [['家族', 'かぞく']] },
  6727: { rel: [['生け花', 'いけばな']] },
  6728: { rel: [['平仮名', 'ひらがな']] },
  6729: { rel: [['鞄', 'かばん']] },
  6730: { rel: [['芝居', 'しばい']] },
  6731: { rel: [['帽子', 'ぼうし']] },
  6732: { rel: [['紙屑', 'かみくず']] },
  6733: { rel: [['写真', 'しゃしん']] },
  6734: { rel: [['揚げ物', 'あげもの']] },
  6735: { ant: [['甘い', 'あまい']] },
  6736: { rel: [['歌', 'うた']] },
  6737: { ant: [['返す', 'かえす']] },
  6738: { ant: [['重い', 'おもい']] },
  6739: { rel: [['カレーライス']] },
  6740: { rel: [['暦', 'こよみ']] },
  6741: { rel: [['皮を剥く', 'かわをむく']] },
  6742: { rel: [['聞こえる', 'きこえる']] },
  6743: { ant: [['綺麗', 'きれい']] },
  6744: { rel: [['郵便', 'ゆうびん']] },
  6745: { rel: [['記念', 'きねん']] },
  6746: { rel: [['今日', 'きょう']] },
  6747: { rel: [['肉', 'にく']] },
  6748: { rel: [['乳', 'ちち']] },
  6749: { rel: [['昨日', 'きのう']] },
  6750: { rel: [['姉妹', 'しまい']] },
  6751: { rel: [['今年', 'ことし']] },
  6752: { ant: [['好き', 'すき']] },
  6753: { rel: [['切手', 'きって']] },
  6754: { rel: [['着物', 'きもの']] },
  6755: { rel: [['グラム']] },
  6756: { rel: [['メートル']] },
  6757: { rel: [['お金', 'おかね']] },
  6758: { rel: [['銀行', 'ぎんこう']] },
  6759: { rel: [['曜日', 'ようび']] },
  6760: { rel: [['薬局', 'やっきょく']] },
  6761: { rel: [['果実', 'かじつ']] },
  6762: { rel: [['口笛', 'くちぶえ']] },
  6763: { rel: [['靴下', 'くつした']] },
  6764: { rel: [['靴', 'くつ']] },
  6765: { rel: [['動物', 'どうぶつ']] },
  6766: { rel: [['曇る', 'くもる']] },
  6767: { rel: [['曇り', 'くもり']] },
  6768: { ant: [['明るい', 'あかるい']] },
  6769: { syn: [['学級', 'がっきゅう']] },
  6770: { rel: [['キログラム']] },
  6771: { rel: [['祝日', 'しゅくじつ']] },
  6772: { rel: [['来月', 'らいげつ']] },
  6774: { rel: [['婚礼', 'こんれい']] },
  6775: { rel: [['入口', 'いりぐち']] },
  6776: { rel: [['健康診断', 'けんこうしんだん']] },
  6777: { rel: [['船便', 'ふなびん']] },
  6778: { rel: [['宣伝', 'せんでん']] },
  6779: { rel: [['信号', 'しんごう']] },
  6780: { rel: [['お茶', 'おちゃ']] },
  6781: { rel: [['高校', 'こうこう']] },
  6782: { rel: [['飲み物', 'のみもの']] },
  6783: { rel: [['清涼飲料水', 'せいりょういんりょうすい']] },
  6784: { rel: [['連休', 'れんきゅう']] },
  6785: { ant: [['午前', 'ごぜん']] },
  6786: { rel: [['日', 'にち']] },
  6787: { rel: [['数', 'かず']] },
  6788: { ant: [['午後', 'ごご']] },
  6789: { rel: [['答え', 'こたえ']] },
  6790: { rel: [['こっち']] },
  6791: { rel: [['こちら']] },
  6792: { rel: [['単語', 'たんご']] },
  6793: { rel: [['これ']] },
  6794: { rel: [['この']] },
  6795: { rel: [['朝ご飯', 'あさごはん']] },
  6796: { rel: [['困難', 'こんなん']] },
  6797: { rel: [['混む', 'こむ']] },
  6798: { rel: [['スポーツ']] },
  6799: { rel: [['その頃', 'そのころ']] },
  6800: { rel: [['頃', 'ころ']] },
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
