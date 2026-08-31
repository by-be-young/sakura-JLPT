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
  7001: { kanji: '泣く' },
  7004: { exReplace: { '学生時代、每年夏休みと冬休みがある。': { jp: '学生時代、毎年夏休みと冬休みがある。', zh: '学生时代，每年都有暑假和寒假。' } } },
  7010: { meaning: '名字' },
  7011: { kanji: '涙', exReplace: { '淚を拭く。': { jp: '涙を拭く。', zh: '擦泪。' } } },
  7014: { meaning: '排列,摆放' },
  7021: { exReplace: { '人学式に参加する。': { jp: '入学式に参加する。', zh: '参加开学典礼。' } } },
  7024: { exRemove: ['恥 知らず。', '怖いもの知らず。'] },
  7031: { exReplace: { '参加者は50人にも上る。': { jp: '参加者は50人にも上る。', zh: '参加人数多达50人。' } } },
  7032: { kana: 'はいざら' },
  7033: { meaning: '小卖店' },
  7039: { meaning: '箱子,匣子' },
  7040: { meaning: '摩托车' },
  7041: { meaning: '桥,桥梁' },
  7042: { meaning: '开始' },
  7043: { exReplace: { '上海は初めてです。': { jp: '上海は初めてです。', zh: '第一次来上海。' } } },
  7044: { meaning: '奔跑;行驶', exReplace: { 'しはま く。': { jp: '走り出す。', zh: '跑起来。' } } },
  7045: { kana: 'バス', meaning: '巴士,公交车' },
  7046: { pitch: '①' },
  7048: { pitch: '⓪', meaning: '工作,劳动' },
  7050: { exReplace: { '位花於が散る。': { jp: '花が散る。', zh: '花儿凋谢。' } } },
  7051: { pitch: '⓪', meaning: '鼻子' },
  7052: { exReplace: { 'は話なしが上手だ。': { jp: '話が上手だ。', zh: '会讲话。' }, 'はな話しを換える。': { jp: '話を変える。', zh: '换话题。' } } },
  7056: { pitch: '②', meaning: '早的,快的' },
  7060: { pitch: '③' },
  7063: { kanji: '晩', meaning: '夜晚,晚上', exRemove: ['昨日の夜。'] },
  7064: { exReplace: { '8 番 の ス。': { jp: '8番のバス。', zh: '八路公交。' } } },
  7065: { pitch: '③' },
  7066: { kanji: '晩ご飯', pitch: '③', exReplace: { '晚ご飯はいつも外で食べる。': { jp: '晩ご飯はいつも外で食べる。', zh: '晚饭一般在外面吃。' } } },
  7069: { kana: 'ビール', meaning: '啤酒', exRemove: ['高層ビル。'] },
  7070: { exReplace: { '東のほ。': { jp: '東の方。', zh: '去东边。' } } },
  7072: { kanji: '弾く' },
  7073: { pitch: '②' },
  7074: { pitch: '②', exReplace: { '飛行機に乘る。': { jp: '飛行機に乗る。', zh: '乘坐飞机。' } } },
  7075: { exReplace: { 'この 人2.1。': { jp: 'この人。', zh: '这个人。' } } },
  7076: { exReplace: { 'つになる。': { jp: '一つになる。', zh: '一岁了。' } } },
  7077: { meaning: '一个月' },
  7078: { exReplace: { 'り人で あ遊そぶ。': { jp: '一人で遊ぶ。', zh: '独自玩耍。' } } },
  7081: { meaning: '医院' },
  7082: { pitch: '⓪' },
  7083: { pitch: '③' },
  7085: { kanji: '昼ご飯' },
  7086: { pitch: '②' },
  7089: { meaning: '叉子' },
  7091: { pitch: '③' },
  7097: { kana: 'ベッド', meaning: '床' },
  7100: { kana: 'ペン', meaning: '钢笔' },
  7102: { exRemove: ['お返事をお待ちします。', 'まだ返事していない。'] },
  7105: { pitch: '⓪' },
  7106: { kana: 'ボート', meaning: '小船,小艇' },
  7107: { kana: 'ボールペン' },
  7109: { kana: 'ぼく', meaning: '(男子自称)我', exRemove: ['わたL① [ 代]我。'] },
  7110: { kana: 'ほしい', pos: 'イ形', meaning: '想要', exRemove: ['星が光る。'] },
  7112: { kana: 'ボタン', pitch: '①' },
  7119: { kana: 'マージャン', meaning: '麻将' },
  7120: { kanji: '毎朝', exReplace: { 'まいあきし每朝7ちじ時 に起きる。': { jp: '毎朝7時に起きる。', zh: '每天早上七点起床。' } } },
  7121: { kanji: '毎回', exReplace: { '每 回 出 席 す る。': { jp: '毎回出席する。', zh: '每回都出席。' } } },
  7122: { kana: 'まいげつ', exReplace: { 'メニューは每月変わる。': { jp: 'メニューは毎月変わる。', zh: '每个月更换菜单。' } } },
  7123: { kanji: '毎週', kana: 'まいしゅう', exReplace: { '每週の日曜日。': { jp: '毎週の日曜日。', zh: '每个周日。' } } },
  7124: { kanji: '毎年', kana: 'まいとし', exReplace: { '每年一回海外へ旅行する。': { jp: '毎年一回海外へ旅行する。', zh: '每年去国外旅游一次。' } } },
  7125: { kanji: '毎日' },
  7126: { kanji: '毎晩', exReplace: { '每晚ミルクを飲む。': { jp: '毎晩ミルクを飲む。', zh: '每天晚上都要喝牛奶。' } } },
  7127: { meaning: '......份(量)' },
  7128: { meaning: '弯曲;拐弯', exReplace: { '\\ iangle 次の角を右に曲がる。': { jp: '次の角を右に曲がる。', zh: '在下个拐角向右转。' } } },
  7129: { kana: 'まず' },
  7132: { meaning: '还,仍然' },
  7133: { exRemove: ['考 查。'] },
  7136: { kana: 'まっすぐ' },
  7139: { exReplace: { '目を円<する。': { jp: '目を丸くする。', zh: '眼睛睁得圆圆的。' } } },
  7142: { exReplace: { 'まみ道ち。': { jp: '山道。', zh: '山路。' }, 'ちをらく。': { jp: '道を歩く。', zh: '走路。' } } },
  7144: { exReplace: { '皆さん、こんぱんは。': { jp: '皆さん、こんばんは。', zh: '大家晚上好。' } } },
  7148: { exReplace: { '眼鏡を外寸。': { jp: '眼鏡を外す。', zh: '摘眼镜。' } } },
  7150: { exRemove: ['もしもし、王さんですか。'] },
  7155: { exReplace: { '問題を起二寸。': { jp: '問題を起こす。', zh: '制造麻烦。' } } },
  7156: { meaning: '烤鸡肉串' },
  7157: { exReplace: { '易し<説明する。': { jp: '易しく説明する。', zh: '解释得浅显易懂。' } } },
  7159: { exRemove: ['やっと間に合った。'] },
  7160: { meaning: '做;给' },
  7161: { kanji: '夕方' },
  7163: { pitch: '①' },
  7167: { exReplace: { 'うか日もお遅くれた。': { jp: '八日も遅れた。', zh: '晚了八天。' } } },
  7169: { pitch: '⓪', meaning: '西服,洋装', exRemove: ['和服(わふく) [ 名]和服。'] },
  7171: { pitch: '⓪' },
  7173: { kana: 'よむ' },
  7175: { meaning: '微弱的;脆弱的;不擅长的' },
  7183: { kanji: '両親' },
  7184: { exReplace: { '加ねを料り上う理りす る。': { jp: '魚を料理する。', zh: '烧鱼。' } } },
  7185: { meaning: '旅游' },
  7187: { pitch: '①' },
  7193: { pos: 'イ形' },
  7195: { meaning: '忘记,遗忘' },
  7198: { pitch: '①', meaning: '递给,交给' },
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
  7001: { ant: [['笑う', 'わらう']] },
  7002: { rel: [['失くす', 'なくす']] },
  7003: { syn: [['どうして']] },
  7004: { rel: [['冬休み', 'ふゆやすみ']] },
  7005: { rel: [['等', 'とう']] },
  7006: { rel: [['数', 'かず']] },
  7007: { rel: [['何か', 'なにか']] },
  7008: { rel: [['何', 'なに']] },
  7009: { rel: [['日', 'にち']] },
  7010: { rel: [['名', 'な']] },
  7011: { rel: [['涙', 'なみだ']] },
  7012: { syn: [['学ぶ', 'まなぶ']] },
  7013: { rel: [['並べる', 'ならべる']] },
  7014: { rel: [['並ぶ', 'ならぶ']] },
  7015: { rel: [['成る', 'なる']] },
  7016: { rel: [['何か', 'なにか']] },
  7017: { ant: [['静か', 'しずか']] },
  7018: { rel: [['日', 'にち']] },
  7019: { rel: [['日本語', 'にほんご']] },
  7020: { rel: [['荷', 'に']] },
  7021: { rel: [['入学', 'にゅうがく']] },
  7022: { rel: [['報道', 'ほうどう']] },
  7023: { rel: [['庭園', 'ていえん']] },
  7024: { rel: [['人', 'ひと']] },
  7025: { ant: [['起きる', 'おきる']] },
  7026: { rel: [['年月', 'ねんげつ']] },
  7027: { rel: [['年', 'ねん']] },
  7028: { rel: [['老後', 'ろうご']] },
  7029: { rel: [['手帳', 'てちょう']] },
  7030: { rel: [['喉', 'のど']] },
  7031: { rel: [['山登り', 'やまのぼり']] },
  7032: { rel: [['煙草', 'たばこ']] },
  7033: { rel: [['商店', 'しょうてん']] },
  7034: { ant: [['出る', 'でる']] },
  7035: { rel: [['郵便', 'ゆうびん']] },
  7036: { rel: [['履く', 'はく']] },
  7037: { rel: [['穿く', 'はく']] },
  7038: { rel: [['美術館', 'びじゅつかん']] },
  7039: { rel: [['箱', 'はこ']] },
  7040: { rel: [['自動二輪', 'じどうにりん']] },
  7041: { rel: [['橋', 'はし']] },
  7042: { ant: [['終わる', 'おわる']] },
  7043: { rel: [['初', 'はつ']] },
  7044: { rel: [['歩く', 'あるく']] },
  7045: { rel: [['乗り物', 'のりもの']] },
  7046: { rel: [['乳製品', 'にゅうせいひん']] },
  7047: { rel: [['年齢', 'ねんれい']] },
  7048: { rel: [['仕事', 'しごと']] },
  7049: { rel: [['日', 'にち']] },
  7050: { rel: [['花見', 'はなみ']] },
  7051: { rel: [['顔', 'かお']] },
  7052: { rel: [['話題', 'わだい']] },
  7053: { rel: [['話', 'はなし']] },
  7054: { rel: [['果物', 'くだもの']] },
  7055: { ant: [['父', 'ちち']] },
  7056: { ant: [['遅い', 'おそい']] },
  7057: { rel: [['夏', 'なつ']] },
  7058: { rel: [['張り詰める', 'はりつめる']] },
  7059: { rel: [['張る', 'はる']] },
  7060: { rel: [['休み', 'やすみ']] },
  7061: { ant: [['曇る', 'くもる']] },
  7062: { rel: [['半分', 'はんぶん']] },
  7063: { rel: [['朝', 'あさ']] },
  7064: { rel: [['番', 'ばん']] },
  7065: { rel: [['電話番号', 'でんわばんごう']] },
  7066: { rel: [['朝ご飯', 'あさごはん']] },
  7067: { rel: [['半', 'はん']] },
  7068: { rel: [['番', 'ばん']] },
  7069: { rel: [['酒', 'さけ']] },
  7070: { ant: [['西', 'にし']] },
  7071: { rel: [['匹', 'ひき']] },
  7072: { rel: [['ピアノ']] },
  7073: { ant: [['高い', 'たかい']] },
  7074: { rel: [['空港', 'くうこう']] },
  7075: { rel: [['人間', 'にんげん']] },
  7076: { rel: [['二つ', 'ふたつ']] },
  7077: { rel: [['月', 'つき']] },
  7078: { rel: [['二人', 'ふたり']] },
  7079: { rel: [['祭り', 'まつり']] },
  7080: { rel: [['千', 'せん']] },
  7081: { rel: [['医者', 'いしゃ']] },
  7082: { rel: [['病人', 'びょうにん']] },
  7083: { ant: [['片仮名', 'かたかな']] },
  7084: { ant: [['夜', 'よる']] },
  7085: { rel: [['朝ご飯', 'あさごはん']] },
  7086: { ant: [['狭い', 'せまい']] },
  7087: { rel: [['カメラ']] },
  7088: { rel: [['手紙', 'てがみ']] },
  7089: { rel: [['ナイフ']] },
  7090: { rel: [['肉', 'にく']] },
  7091: { rel: [['一人', 'ひとり']] },
  7092: { rel: [['夏休み', 'なつやすみ']] },
  7093: { ant: [['新しい', 'あたらしい']] },
  7094: { rel: [['郷里', 'きょうり']] },
  7095: { rel: [['お風呂', 'おふろ']] },
  7096: { rel: [['文', 'ぶん']] },
  7097: { rel: [['寝室', 'しんしつ']] },
  7098: { rel: [['動物', 'どうぶつ']] },
  7099: { rel: [['居間', 'いま']] },
  7100: { rel: [['鉛筆', 'えんぴつ']] },
  7101: { rel: [['学習', 'がくしゅう']] },
  7102: { rel: [['お弁当', 'おべんとう']] },
  7103: { ant: [['不便', 'ふべん']] },
  7104: { rel: [['方向', 'ほうこう']] },
  7105: { rel: [['帽子', 'ぼうし']] },
  7106: { rel: [['船', 'ふね']] },
  7107: { rel: [['ペン']] },
  7108: { rel: [['外', 'ほか']] },
  7109: { rel: [['私', 'わたし']] },
  7110: { rel: [['欲しがる', 'ほしがる']] },
  7111: { rel: [['郵便', 'ゆうびん']] },
  7112: { rel: [['ボタン']] },
  7113: { rel: [['宿', 'やど']] },
  7114: { rel: [['書籍', 'しょせき']] },
  7115: { rel: [['本', 'ほん']] },
  7116: { rel: [['本', 'ほん']] },
  7117: { syn: [['真実', 'しんじつ']] },
  7118: { rel: [['本当', 'ほんとう']] },
  7119: { rel: [['ゲーム']] },
  7120: { rel: [['朝', 'あさ']] },
  7121: { rel: [['毎', 'まい']] },
  7122: { rel: [['毎', 'まい']] },
  7123: { rel: [['毎', 'まい']] },
  7124: { rel: [['毎', 'まい']] },
  7125: { rel: [['毎', 'まい']] },
  7126: { rel: [['毎', 'まい']] },
  7127: { rel: [['前', 'まえ']] },
  7128: { rel: [['曲げる', 'まげる']] },
  7129: { rel: [['先ず', 'まず']] },
  7130: { ant: [['美味しい', 'おいしい']] },
  7131: { rel: [['又', 'また']] },
  7132: { rel: [['未だ', 'まだ']] },
  7133: { rel: [['村', 'むら']] },
  7134: { rel: [['町', 'まち']] },
  7135: { rel: [['待ち合わせ', 'まちあわせ']] },
  7136: { rel: [['真っ直ぐ', 'まっすぐ']] },
  7137: { rel: [['火', 'ひ']] },
  7138: { rel: [['窓口', 'まどぐち']] },
  7139: { ant: [['四角い', 'しかくい']] },
  7140: { rel: [['商店', 'しょうてん']] },
  7141: { rel: [['見る', 'みる']] },
  7142: { rel: [['道路', 'どうろ']] },
  7143: { rel: [['緑色', 'みどりいろ']] },
  7144: { rel: [['皆', 'みな']] },
  7145: { ant: [['北', 'きた']] },
  7146: { rel: [['目玉', 'めだま']] },
  7147: { rel: [['電子メール', 'でんしメール']] },
  7148: { rel: [['メガネ']] },
  7149: { rel: [['既に', 'すでに']] },
  7150: { rel: [['曜日', 'ようび']] },
  7151: { rel: [['持ち物', 'もちもの']] },
  7152: { rel: [['より']] },
  7153: { rel: [['人', 'ひと']] },
  7154: { rel: [['玄関', 'げんかん']] },
  7155: { rel: [['課題', 'かだい']] },
  7156: { rel: [['焼肉', 'やきにく']] },
  7157: { syn: [['簡単', 'かんたん']] },
  7158: { syn: [['簡単', 'かんたん']] },
  7159: { rel: [['数', 'かず']] },
  7160: { rel: [['する']] },
  7161: { rel: [['夕暮れ', 'ゆうぐれ']] },
  7162: { rel: [['郵便', 'ゆうびん']] },
  7163: { rel: [['着物', 'きもの']] },
  7164: { rel: [['雪国', 'ゆきぐに']] },
  7165: { syn: [['のんびり']] },
  7166: { ant: [['悪い', 'わるい']] },
  7167: { rel: [['日', 'にち']] },
  7168: { rel: [['保育園', 'ほいくえん']] },
  7169: { rel: [['和服', 'わふく']] },
  7170: { rel: [['欧州', 'おうしゅう']] },
  7171: { ant: [['縦', 'たて']] },
  7172: { rel: [['呼び名', 'よびな']] },
  7173: { rel: [['読み方', 'よみかた']] },
  7174: { ant: [['昼', 'ひる']] },
  7175: { ant: [['強い', 'つよい']] },
  7176: { rel: [['今月', 'こんげつ']] },
  7177: { rel: [['今週', 'こんしゅう']] },
  7178: { rel: [['タバコ']] },
  7179: { rel: [['今年', 'ことし']] },
  7180: { rel: [['ラジオ']] },
  7181: { rel: [['留学生', 'りゅうがくせい']] },
  7182: { rel: [['留学', 'りゅうがく']] },
  7183: { rel: [['親', 'おや']] },
  7184: { rel: [['料理人', 'りょうりにん']] },
  7185: { rel: [['旅行者', 'りょこうしゃ']] },
  7186: { rel: [['果物', 'くだもの']] },
  7187: { rel: [['ゼロ']] },
  7188: { rel: [['録音', 'ろくおん']] },
  7189: { rel: [['音楽', 'おんがく']] },
  7190: { rel: [['練習問題', 'れんしゅうもんだい']] },
  7191: { rel: [['通路', 'つうろ']] },
  7192: { rel: [['シャツ']] },
  7193: { ant: [['年寄り', 'としより']] },
  7194: { syn: [['理解する', 'りかいする']] },
  7195: { ant: [['覚える', 'おぼえる']] },
  7196: { rel: [['私', 'わたし']] },
  7197: { rel: [['僕', 'ぼく']] },
  7198: { rel: [['受け渡す', 'うけわたす']] },
  7199: { rel: [['横断', 'おうだん']] },
  7200: { ant: [['良い', 'よい']] },
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
