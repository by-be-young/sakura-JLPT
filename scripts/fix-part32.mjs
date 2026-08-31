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
  6001: { pitch: '②', exReplace: { '壳れる商品。': { jp: '売れる商品。', zh: '畅销的商品。' } } },
  6006: { meaning: '自动扶梯' },
  6008: { kanji: '', kana: 'エネルギー', pitch: '②/③' },
  6010: { exReplace: { '議 員を選ぶ。': { jp: '議員を選ぶ。', zh: '选举议员。' } } },
  6013: { exRemove: ['予算を才一一する。', '才 一 一 な表情。'] },
  6014: { meaning: '保佑,帮助;多亏,幸亏' },
  6016: { meaning: '粥', exReplace: { 'お粥を煮る。': { jp: 'お粥を煮る。', zh: '煮粥。' } } },
  6017: { meaning: '起来,起床;发生' },
  6019: { meaning: '房顶,屋顶' },
  6020: { meaning: '礼物' },
  6021: { meaning: '寄,送;送行;度过(日子)', exReplace: { '友だちを空港まで送る。': { jp: '友だちを空港まで送る。', zh: '把朋友送到机场。' } } },
  6023: { meaning: '迟到,耽误;落后,过慢', exReplace: { '授業に遅れる。': { jp: '授業に遅れる。', zh: '上课迟到。' } } },
  6024: { meaning: '您孩子,令郎(令爱)' },
  6025: { meaning: '扶起;叫醒;引起,发生', exReplace: { '\\ iangle 倒れた子どもを起こす。': { jp: '倒れた子どもを起こす。', zh: '把倒下的孩子扶起来。' }, '大きな事件を起二す。': { jp: '大きな事件を起こす。', zh: '引发大事件。' } } },
  6026: { meaning: '举行,进行;实施' },
  6027: { meaning: '发生,引起' },
  6028: { pitch: '⓪', exRemove: ['おしい。'] },
  6030: { pitch: '⓪', meaning: '您的家,贵府,贵公司' },
  6031: { exReplace: { 'ンキが落ちる。': { jp: 'ペンキが落ちる。', zh: '油漆脱落。' } } },
  6032: { kana: 'おっしゃる' },
  6033: { meaning: '丈夫' },
  6035: { meaning: '(人和动物以外的)声音' },
  6036: { meaning: '使落下;除去;丢落;降低' },
  6037: { exReplace: { '大人みたいなしやベり方。': { jp: '大人みたいな喋り方。', zh: '像个大人一样的说话方式。' } } },
  6039: { meaning: '跳舞' },
  6040: { kanji: '驚く', meaning: '吃惊,惊讶', exReplace: { '大声で驚く。': { jp: '大きな声に驚く。', zh: '因大声而吓一跳。' } } },
  6041: { meaning: '记住,记忆;学会;感觉', exReplace: { 'どうしても覚えられない。': { jp: 'どうしても覚えられない。', zh: '无论如何也记不住。' } } },
  6042: { meaning: '你(男性对同辈或晚辈的称呼)' },
  6043: { meaning: '祭祀,庙会,节日', exReplace: { '夏の书祭り。': { jp: '夏のお祭り。', zh: '夏季的庙会。' } } },
  6044: { meaning: '看望,问候' },
  6045: { meaning: '土特产,礼物' },
  6047: { meaning: '想,思考;认为;思念' },
  6048: { examples: [{ jp: '子供が玩具で遊ぶ。', zh: '孩子玩玩具。' }] },
  6050: { kanji: '泳ぎ', kana: 'およぎ', pitch: '②' },
  6051: { pitch: '②' },
  6054: { meaning: '折,折断;折叠', exReplace: { '物語を織る。': { jp: '紙を折る。', zh: '折纸。' } } },
  6059: { exReplace: { '\\ iangle 温度が上がる(下がる)。': { jp: '温度が上がる(下がる)。', zh: '温度上升(下降)。' } } },
  6061: { meaning: '卡片;卡' },
  6062: { kana: 'かいぎ', meaning: '会议' },
  6064: { kanji: '開始' },
  6067: { kana: 'がいらいご' },
  6068: { pitch: '⓪', exReplace: { 'あい会いお話くん文。': { jp: '日本語で会話する。', zh: '用日语对话。' } } },
  6069: { kanji: '変える' },
  6070: { kana: 'かがく', meaning: '科学', exReplace: { '科学家。': { jp: '科学者。', zh: '科学家。' } } },
  6071: { exReplace: { '母に電話を掛ける。': { jp: '母に電話を掛ける。', zh: '打电话给母亲。' } } },
  6072: { meaning: '装饰,装点' },
  6073: { meaning: '火灾' },
  6075: { pitch: '⓪', meaning: '出借,出租', exReplace: { '加貸した出 しよう と し用図書よ。': { jp: '貸出し用の図書。', zh: '出借用的图书。' } } },
  6076: { exReplace: { 'にん ぢ う人数加をえ数てえる。': { jp: '人数を数える。', zh: '数人数。' } } },
  6078: { meaning: '肩膀', exReplace: { '肩で担く。': { jp: '肩で担ぐ。', zh: '用肩膀扛。' } } },
  6079: { meaning: '坚硬的;紧紧的;顽固的', exReplace: { 'ドアがわ こく 閉じている。': { jp: 'ドアが固く閉じている。', zh: '门紧紧地关着。' } } },
  6080: { meaning: '牢固的;坚定的;可靠的', exReplace: { '堅く抱き縝める。': { jp: '堅く抱き締める。', zh: '牢牢地抱住。' }, 'うちのチームの優勝は坚い。': { jp: 'うちのチームの優勝は堅い。', zh: '我们队肯定赢。' } } },
  6081: { meaning: '坚硬的;生硬的;紧张的', exReplace: { 'たい 二 と言葉一。': { jp: '硬い言葉。', zh: '生硬的语言。' }, '\\ iangle 硬い顔。': { jp: '硬い顔。', zh: '紧张的表情。' } } },
  6082: { exReplace: { '部屋が片付いている。': { jp: '部屋が片付いている。', zh: '房间收拾整齐。' } } },
  6083: { pitch: '④', meaning: '收拾,整理;处理' },
  6085: { meaning: '赢,胜' },
  6088: { meaning: '悲伤的,伤心的' },
  6089: { meaning: '感到悲伤,伤心' },
  6091: { meaning: '她;女朋友' },
  6092: { exReplace: { '壁に絵を描く。': { jp: '壁に絵を描く。', zh: '在墙上画画。' }, '親子の間に壁が出来た。': { jp: '親子の間に壁が出来た。', zh: '父母与孩子之间产生了隔阂。' } } },
  6094: { meaning: '头发', exReplace: { '爱を切る。': { jp: '髪を切る。', zh: '剪头发。' } } },
  6095: { exReplace: { '髪1 の毛を洗う。': { jp: '髪の毛を洗う。', zh: '洗头发。' } } },
  6097: { meaning: '来往,往返;相通' },
  6098: { meaning: '玻璃' },
  6102: { kana: 'かわいそう' },
  6103: { kanji: '考え出す' },
  6109: { exRemove: ['看護婦(かんごふ) [ 名]女护士。'] },
  6110: { kanji: '考え方', pitch: '④' },
  6114: { kanji: '簡単' },
  6116: { meaning: '气;心情,情绪;心,精神', exReplace: { 'コーラの気が拔ける。': { jp: 'コーラの気が抜ける。', zh: '可乐漏气了。' } } },
  6117: { kana: 'きかい', pitch: '②', exReplace: { '気合を込める。': { jp: '機会を逃す。', zh: '错过机会。' }, '気合を入れる。': { jp: '機会を利用する。', zh: '利用机会。' } } },
  6118: { pitch: '②', meaning: '机械,机器', exReplace: { '故 障 し た 機 械 を 直 寸。': { jp: '故障した機械を直す。', zh: '修理出故障的机器。' } } },
  6121: { pitch: '⓪' },
  6122: { kanji: '聞こえる', pitch: '③' },
  6125: { exReplace: { 'し技っつ術を上げる。': { jp: '技術を上げる。', zh: '提升技术。' } } },
  6126: { pitch: '⓪', meaning: '伤,伤疤,伤痕' },
  6127: { meaning: '季节' },
  6131: { meaning: '休息日,假日' },
  6132: { meaning: '突然,紧急' },
  6134: { meaning: '工资,薪水' },
  6136: { meaning: '教会;教堂' },
  6137: { meaning: '教科书,教材' },
  6138: { meaning: '竞争,比赛', exReplace: { '競争が激しい。': { jp: '競争が激しい。', zh: '竞争激烈。' } } },
  6139: { exReplace: { '上興 2味3を持つ。': { jp: '興味を持つ。', zh: '感兴趣。' } } },
  6140: { pitch: '④', exReplace: { 'き九いな着る物。': { jp: '綺麗な着る物。', zh: '干净的衣服。' } } },
  6142: { meaning: '(机械运转等的)情况,状态;身体状况', exRemove: ['具合(ぐあい) [ 名](机械运转的)情。'] },
  6144: { exReplace: { '草が枯九る。': { jp: '草が枯れる。', zh: '草枯萎。' } } },
  6147: { kanji: '口げんか' },
  6149: { kana: 'ぐっと', pitch: '①' },
  6150: { exReplace: { '学生に本を配る。': { jp: '学生に本を配る。', zh: '给学生分发书本。' } } },
  6158: { pitch: '⓪' },
  6160: { kana: 'けいざい', exReplace: { '<12国の経済。': { jp: '国の経済。', zh: '国家的经济。' } } },
  6163: { meaning: '伤,受伤' },
  6165: { meaning: '寄宿,住宿' },
  6170: { meaning: '原因' },
  6178: { exRemove: ['かいじょう けんぶつにん。'] },
  6180: { kanji: '語彙', kana: 'ごい', meaning: '词汇' },
  6183: { kanji: '交換', exReplace: { '名刺交换。': { jp: '名刺交換。', zh: '交换名片。' } } },
  6186: { meaning: '礼堂,大讲堂' },
  6189: { exReplace: { 'ひ百か く人二 人を 超える。': { jp: '百人を超える。', zh: '超过一百人。' } } },
  6192: { meaning: '事情,事' },
  6193: { meaning: '用语,措辞' },
  6195: { exReplace: { 'この間、海外旅行に行ってきた。': { jp: 'この間、海外旅行に行ってきた。', zh: '前不久去了趟国外旅行。' } } },
  6196: { kana: 'このごろ', meaning: '近来,最近' },
  6198: { exReplace: { '\\ iangle細かい説明。': { jp: '細かい説明。', zh: '详细的说明。' } } },
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
  6001: { rel: [['売る', 'うる']] },
  6002: { rel: [['植える', 'うえる']] },
  6003: { rel: [['運転手', 'うんてんしゅ']] },
  6004: { rel: [['運転', 'うんてん']] },
  6006: { rel: [['階段', 'かいだん']] },
  6007: { rel: [['木', 'き']] },
  6008: { rel: [['エネルギー源']] },
  6010: { syn: [['選択', 'せんたく']] },
  6011: { rel: [['発動機', 'はつどうき']] },
  6012: { rel: [['音楽', 'おんがく']] },
  6013: { rel: [['遠慮がち']] },
  6014: { rel: [['おかげで']] },
  6015: { syn: [['変', 'へん']] },
  6016: { rel: [['粥', 'かゆ']] },
  6017: { ant: [['寝る', 'ねる']] },
  6018: { rel: [['兆', 'ちょう']] },
  6019: { rel: [['屋根', 'やね']] },
  6020: { syn: [['プレゼント']] },
  6021: { rel: [['送り', 'おくり']] },
  6022: { syn: [['贈呈', 'ぞうてい']] },
  6023: { ant: [['早まる', 'はやまる']] },
  6024: { rel: [['子供', 'こども']] },
  6025: { rel: [['起きる', 'おきる']] },
  6026: { syn: [['実施', 'じっし']] },
  6027: { syn: [['発生', 'はっせい']] },
  6028: { rel: [['押入れ', 'おしいれ']] },
  6029: { rel: [['娘', 'むすめ']] },
  6030: { rel: [['家', 'いえ']] },
  6031: { ant: [['上がる', 'あがる']] },
  6032: { rel: [['言う', 'いう']] },
  6033: { ant: [['妻', 'つま']] },
  6034: { rel: [['釣り銭', 'つりせん']] },
  6035: { rel: [['音声', 'おんせい']] },
  6036: { ant: [['上げる', 'あげる']] },
  6037: { ant: [['子供', 'こども']] },
  6038: { rel: [['ダンス']] },
  6039: { rel: [['ダンス']] },
  6040: { syn: [['びっくりする']] },
  6041: { ant: [['忘れる', 'わすれる']] },
  6043: { rel: [['祭り', 'まつり']] },
  6044: { rel: [['見舞い', 'みまい']] },
  6045: { rel: [['土産', 'みやげ']] },
  6046: { rel: [['思い出', 'おもいで']] },
  6047: { syn: [['考える', 'かんがえる']] },
  6049: { rel: [['おやおや']] },
  6050: { rel: [['泳ぐ', 'およぐ']] },
  6051: { ant: [['上る', 'のぼる']] },
  6052: { rel: [['五輪', 'ごりん']] },
  6054: { rel: [['折れる', 'おれる']] },
  6055: { syn: [['感謝', 'かんしゃ']] },
  6056: { rel: [['折る', 'おる']] },
  6057: { rel: [['蜜柑', 'みかん']] },
  6058: { ant: [['始まり', 'はじまり']] },
  6059: { rel: [['気温', 'きおん']] },
  6060: { rel: [['窓', 'まど']] },
  6061: { rel: [['葉書', 'はがき']] },
  6062: { rel: [['打ち合わせ', 'うちあわせ']] },
  6063: { rel: [['会議', 'かいぎ']] },
  6064: { ant: [['終了', 'しゅうりょう']] },
  6065: { rel: [['場所', 'ばしょ']] },
  6066: { rel: [['段', 'だん']] },
  6067: { rel: [['カタカナ']] },
  6068: { rel: [['話す', 'はなす']] },
  6069: { ant: [['変わる', 'かわる']] },
  6070: { rel: [['科学者', 'かがくしゃ']] },
  6071: { rel: [['電話', 'でんわ']] },
  6072: { syn: [['装飾', 'そうしょく']] },
  6073: { rel: [['火', 'ひ']] },
  6074: { rel: [['家', 'いえ']] },
  6075: { rel: [['貸す', 'かす']] },
  6076: { rel: [['数', 'かず']] },
  6077: { rel: [['ガソリン']] },
  6078: { rel: [['肩車', 'かたぐるま']] },
  6079: { syn: [['硬い', 'かたい']] },
  6080: { syn: [['固い', 'かたい']] },
  6081: { syn: [['固い', 'かたい']] },
  6082: { rel: [['片付ける', 'かたづける']] },
  6083: { ant: [['散らかす', 'ちらかす']] },
  6084: { rel: [['部長', 'ぶちょう']] },
  6085: { ant: [['負ける', 'まける']] },
  6086: { syn: [['恋人', 'こいびと']] },
  6087: { syn: [['妻', 'つま']] },
  6088: { ant: [['嬉しい', 'うれしい']] },
  6089: { rel: [['悲しい', 'かなしい']] },
  6090: { ant: [['貧乏', 'びんぼう']] },
  6091: { ant: [['彼氏', 'かれし']] },
  6092: { rel: [['壁紙', 'かべがみ']] },
  6093: { rel: [['南瓜', 'かぼちゃ']] },
  6094: { rel: [['髪型', 'かみがた']] },
  6095: { rel: [['髪', 'かみ']] },
  6096: { rel: [['チューインガム']] },
  6097: { rel: [['通学', 'つうがく']] },
  6098: { rel: [['窓', 'まど']] },
  6099: { ant: [['彼女', 'かのじょ']] },
  6100: { rel: [['カレー']] },
  6101: { rel: [['彼', 'かれ']] },
  6102: { syn: [['哀れ', 'あわれ']] },
  6103: { rel: [['考える', 'かんがえる']] },
  6104: { syn: [['思案', 'しあん']] },
  6105: { rel: [['関連', 'かんれん']] },
  6106: { rel: [['韓国', 'かんこく']] },
  6107: { rel: [['看護婦', 'かんごふ']] },
  6108: { rel: [['看護婦', 'かんごふ']] },
  6109: { rel: [['看護師', 'かんごし']] },
  6110: { rel: [['考え', 'かんがえ']] },
  6111: { syn: [['感覚', 'かんかく']] },
  6112: { rel: [['平仮名', 'ひらがな']] },
  6113: { rel: [['病気', 'びょうき']] },
  6114: { ant: [['複雑', 'ふくざつ']] },
  6115: { rel: [['努力', 'どりょく']] },
  6116: { rel: [['気分', 'きぶん']] },
  6117: { syn: [['チャンス']] },
  6118: { rel: [['器械', 'きかい']] },
  6119: { rel: [['聞く', 'きく']] },
  6120: { ant: [['安全', 'あんぜん']] },
  6121: { rel: [['天気', 'てんき']] },
  6122: { rel: [['聞く', 'きく']] },
  6123: { rel: [['帰る', 'かえる']] },
  6124: { rel: [['川岸', 'かわぎし']] },
  6125: { rel: [['技術者', 'ぎじゅつしゃ']] },
  6126: { rel: [['怪我', 'けが']] },
  6127: { rel: [['四季', 'しき']] },
  6128: { rel: [['着る', 'きる']] },
  6129: { rel: [['楽器', 'がっき']] },
  6130: { ant: [['禁煙', 'きんえん']] },
  6131: { ant: [['平日', 'へいじつ']] },
  6132: { syn: [['突然', 'とつぜん']] },
  6133: { rel: [['野菜', 'やさい']] },
  6134: { rel: [['賃金', 'ちんぎん']] },
  6135: { rel: [['教育者', 'きょういくしゃ']] },
  6136: { rel: [['協会', 'きょうかい']] },
  6137: { rel: [['テキスト']] },
  6138: { rel: [['競う', 'きそう']] },
  6139: { syn: [['関心', 'かんしん']] },
  6140: { rel: [['着る', 'きる']] },
  6141: { rel: [['曜日', 'ようび']] },
  6142: { syn: [['調子', 'ちょうし']] },
  6143: { rel: [['空気清浄機', 'くうきせいじょうき']] },
  6144: { rel: [['草花', 'くさばな']] },
  6145: { ant: [['香ばしい', 'こうばしい']] },
  6146: { rel: [['くれる']] },
  6147: { rel: [['喧嘩', 'けんか']] },
  6148: { rel: [['ビスケット']] },
  6149: { syn: [['ぐいっと']] },
  6150: { syn: [['分配', 'ぶんぱい']] },
  6151: { rel: [['天気', 'てんき']] },
  6152: { syn: [['生活', 'せいかつ']] },
  6153: { rel: [['コップ']] },
  6154: { rel: [['同級生', 'どうきゅうせい']] },
  6155: { syn: [['サークル']] },
  6156: { syn: [['比較', 'ひかく']] },
  6157: { rel: [['もらう']] },
  6158: { rel: [['会社', 'かいしゃ']] },
  6159: { syn: [['プラン']] },
  6160: { rel: [['経済学', 'けいざいがく']] },
  6161: { rel: [['携帯', 'けいたい']] },
  6162: { rel: [['遊び', 'あそび']] },
  6163: { rel: [['傷', 'きず']] },
  6164: { rel: [['消す', 'けす']] },
  6165: { rel: [['下宿屋', 'げしゅくや']] },
  6166: { ant: [['原因', 'げんいん']] },
  6167: { rel: [['決して~ない']] },
  6168: { rel: [['県庁', 'けんちょう']] },
  6169: { rel: [['家', 'いえ']] },
  6170: { ant: [['結果', 'けっか']] },
  6171: { syn: [['口論', 'こうろん']] },
  6172: { rel: [['見る', 'みる']] },
  6173: { rel: [['研究者', 'けんきゅうしゃ']] },
  6174: { rel: [['研究', 'けんきゅう']] },
  6175: { rel: [['研究', 'けんきゅう']] },
  6176: { syn: [['言葉', 'ことば']] },
  6177: { rel: [['観光', 'かんこう']] },
  6178: { rel: [['見物', 'けんぶつ']] },
  6179: { rel: [['ご']] },
  6180: { rel: [['言葉', 'ことば']] },
  6181: { rel: [['このように']] },
  6182: { rel: [['技術', 'ぎじゅつ']] },
  6183: { rel: [['交換する']] },
  6184: { rel: [['バス']] },
  6185: { rel: [['学校', 'がっこう']] },
  6186: { rel: [['講演', 'こうえん']] },
  6187: { ant: [['先輩', 'せんぱい']] },
  6188: { rel: [['役所', 'やくしょ']] },
  6189: { syn: [['越える', 'こえる']] },
  6190: { ant: [['国内', 'こくない']] },
  6191: { rel: [['国際化', 'こくさいか']] },
  6193: { rel: [['言葉', 'ことば']] },
  6194: { rel: [['鳥', 'とり']] },
  6195: { rel: [['先日', 'せんじつ']] },
  6196: { syn: [['最近', 'さいきん']] },
  6197: { rel: [['葉', 'は']] },
  6198: { ant: [['粗い', 'あらい']] },
  6199: { rel: [['ごみ箱', 'ごみばこ']] },
  6200: { rel: [['ごみ']] },
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
