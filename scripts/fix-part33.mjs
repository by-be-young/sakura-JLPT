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
  6201: { exReplace: { '朝の電車はいつも迟んている。': { jp: '朝の電車はいつも混んでいる。', zh: '早上的电车总是很拥挤。' } } },
  6203: { meaning: '从现在起,今后' },
  6205: { exReplace: { '\\ iangle 怖い火灾。': { jp: '怖い火事。', zh: '可怕的火灾。' } } },
  6206: { exReplace: { '6暗. いところを怖がる。': { jp: '暗いところを怖がる。', zh: '害怕黑暗的地方。' } } },
  6209: { pitch: '①' },
  6215: { kana: 'さいしょ', exReplace: { '最期を遂げる。': { jp: '最初に自己紹介する。', zh: '首先做自我介绍。' } } },
  6218: { meaning: '(「上げる」「与える」的自谦语)敬献,呈送' },
  6219: { meaning: '生鱼片,生肉片' },
  6220: { meaning: '(用手等)指;朝着,指向', exReplace: { '黑板の字を指す。': { jp: '黒板の字を指す。', zh: '指着黑板上的字。' } } },
  6221: { kanji: 'さつま芋', kana: 'さつまいも' },
  6222: { exReplace: { '寂 い 颜。': { jp: '寂しい顔。', zh: '落寞的表情。' } } },
  6225: { kanji: '皿', meaning: '盘子,碟子' },
  6228: { meaning: '吵闹,骚动', exReplace: { '病 院 で 騒 い で は な い。': { jp: '病院で騒いではいけない。', zh: '在医院不可以吵闹。' } } },
  6229: { exReplace: { '機械を触らないでください。': { jp: '機械を触らないでください。', zh: '请勿碰触机器。' } } },
  6234: { pitch: '③' },
  6242: { pitch: '②', meaning: '考试;测验', exReplace: { '試験に参加する。': { jp: '試験に参加する。', zh: '参加考试。' }, '判断力を試験する。': { jp: '判断力を試験する。', zh: '测试判断力。' } } },
  6243: { pitch: '⓪' },
  6245: { exReplace: { '\\ iangle静加仁泣く。': { jp: '静かに泣く。', zh: '默默地流泪。' } } },
  6247: { meaning: '舌头', exRemove: ['惯 用。'] },
  6248: { meaning: '时代,时期' },
  6250: { kana: 'しっかり' },
  6256: { meaning: '自动铅笔' },
  6257: { meaning: '社会成员;走上社会的人' },
  6258: { pitch: '⓪' },
  6261: { pitch: '⓪', meaning: '堵车,拥堵' },
  6262: { pitch: '①' },
  6263: { kana: 'しゅうにゅう', meaning: '收入,所得' },
  6264: { kana: 'じゅうぶん' },
  6266: { pitch: '⓪', meaning: '出发,启程' },
  6270: { exReplace: { '万全な準備。': { jp: '万全な準備。', zh: '万全的准备。' } } },
  6271: { meaning: '介绍' },
  6272: { meaning: '小学生', exRemove: ['中学生(ちゅうがくせい) [名]中 学生。'] },
  6275: { exReplace: { 'ょうたん冗 談を言う。': { jp: '冗談を言う。', zh: '开玩笑。' } } },
  6276: { meaning: '知道;答应,同意' },
  6277: { exReplace: { 'じょう情報ほうをしゅ収うし集ゅうす る。': { jp: '情報を収集する。', zh: '收集情报。' } } },
  6279: { meaning: '神社' },
  6282: { pitch: '⑤' },
  6283: { kanji: '新入生', meaning: '新生,新入学的学生', exRemove: ['電 話 番 号 を 調 べ る。', '人数を調べる。'] },
  6284: { meaning: '担心,忧虑;挂念', exRemove: ['安全なところに避難する。'] },
  6287: { exReplace: { 'ずいい家随分人なたいいど態度。': { jp: '随分な態度。', zh: '过分的态度。' } } },
  6293: { exReplace: { 'そのことに対して、遠慮が過ぎる。': { jp: 'そのことに対して、遠慮が過ぎる。', zh: '对那件事过分客气了。' } } },
  6294: { meaning: '过度,过于', examples: [] },
  6299: { pitch: '⓪' },
  6302: { exReplace: { '全ての人。': { jp: '全ての人。', zh: '所有的人。' } } },
  6304: { kanji: '掏る', kana: 'する', meaning: '偷,扒窃', exRemove: ['試験のことをすっかり忘れる。'] },
  6305: { pitch: '⓪', meaning: '成功,功成名就', exRemove: ['体が締まる。'] },
  6306: { kana: 'せいぞう' },
  6309: { exReplace: { '\\ iangle 使い方を親切に説明する。': { jp: '使い方を親切に説明する。', zh: '热心地解释使用方法。' } } },
  6311: { kana: 'せわ', meaning: '照顾,帮忙;介绍,斡旋', exReplace: { '月の輪。': { jp: '世話をする。', zh: '照顾,照料。' } } },
  6313: { kanji: '選手', pitch: '①', meaning: '选手,运动员' },
  6316: { pitch: '①' },
  6317: { meaning: '商量,商谈,咨询' },
  6318: { pitch: '⓪', meaning: '底,底部;极限', exRemove: ['のう能りよ力くの底そ能力的极限。', '惯 用。'] },
  6319: { meaning: '养育,培育,教育' },
  6320: { pitch: '⓪', exReplace: { '高こう校こうをそぞ上すう る。': { jp: '高校を卒業する。', zh: '从高中毕业。' } } },
  6322: { meaning: '除此之外,另外' },
  6325: { kana: 'そぼ' },
  6328: { meaning: '台风' },
  6329: { meaning: '弄倒,推倒;推翻,打倒' },
  6330: { exReplace: { '倒扎了会社。': { jp: '倒れた会社。', zh: '破产了的公司。' } } },
  6332: { exReplace: { '\\ iangle スープに塩を足す。': { jp: 'スープに塩を足す。', zh: '往汤里加盐。' } } },
  6337: { meaning: '现在;刚刚,马上' },
  6339: { meaning: '鸭子' },
  6340: { meaning: '盖,修建,建造' },
  6342: { meaning: '享受;喜欢;期待' },
  6343: { meaning: '偶尔' },
  6345: { exRemove: ['せいかつひたはじ。'], exReplace: { '少ないと思ったが、用が足りる。': { jp: '少ないと思ったが、用が足りる。', zh: '本以为不够，但够用了。' } } },
  6351: { meaning: '差异,差别,不同', exReplace: { '性别の違い。': { jp: '性別の違い。', zh: '性别的差异。' } } },
  6353: { meaning: '力气;能力;作用;权力' },
  6355: { meaning: '茶色的,褐色的' },
  6356: { meaning: '注意,留神;警告', exReplace: { '階段がありますから、足元に注意して< ださい。': { jp: '階段がありますから、足元に注意してください。', zh: '这里有台阶，请注意脚下安全。' } } },
  6357: { kana: 'ちゅうごくご' },
  6358: { meaning: '停车场' },
  6359: { pitch: '⓪' },
  6361: { meaning: '第……条街,第……丁目', exRemove: ['明 日 は 都 合 が 悪 い。'] },
  6362: { pitch: '①' },
  6364: { pitch: '⓪', meaning: '意图,打算,计划' },
  6366: { meaning: '带着,领着' },
  6368: { meaning: '出入口', exRemove: ['出口(でぐち) [名]出口。'] },
  6377: { meaning: '寺庙,寺院' },
  6381: { exReplace: { '懷 中 電 灯。': { jp: '懐中電灯。', zh: '手电筒。' } } },
  6385: { meaning: '特别', exReplace: { '危ないですから、特に気をつけてください い。': { jp: '危ないですから、特に気をつけてください。', zh: '很危险，所以请特别小心。' } } },
  6387: { kana: 'どこ', meaning: '哪里,哪儿;总觉得,好像' },
  6388: { meaning: '途中;中途' },
  6389: { exReplace: { '特 急 の 乘 車 券。': { jp: '特急の乗車券。', zh: '特快列车的乘车券。' }, '特急の件ですから、早くやってください い。': { jp: '特急の件ですから、早くやってください。', zh: '因为是加快办理的事情，所以请快点办。' } } },
  6390: { meaning: '投递,递送;上报' },
  6391: { kana: 'どんな' },
  6393: { kanji: '取り替える', meaning: '更换,替换,兑换', exReplace: { 'チェクを現金に取り替える。': { jp: 'チェックを現金に取り替える。', zh: '把支票兑换成现金。' } } },
  6397: { pitch: '①' },
  6398: { exReplace: { '壊 札 た 時 計 を 直 寸。': { jp: '壊れた時計を直す。', zh: '修理坏了的钟表。' }, 'テキス卜を日本語に直す。': { jp: 'テキストを日本語に直す。', zh: '把原文翻译成日语。' } } },
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
  6201: { syn: [['混む', 'こむ']] },
  6202: { rel: [['ご飯', 'ごはん']] },
  6203: { rel: [['これまで']] },
  6204: { rel: [['これ']] },
  6205: { syn: [['恐ろしい', 'おそろしい']] },
  6206: { rel: [['怖い', 'こわい']] },
  6207: { ant: [['直す', 'なおす']] },
  6208: { ant: [['直る', 'なおる']] },
  6209: { syn: [['演奏会', 'えんそうかい']] },
  6210: { rel: [['今回', 'こんかい']] },
  6211: { ant: [['あんなに']] },
  6212: { ant: [['昨夜', 'さくや']] },
  6213: { ant: [['最新', 'さいしん']] },
  6214: { ant: [['最初', 'さいしょ']] },
  6215: { ant: [['最後', 'さいご']] },
  6216: { rel: [['大きさ', 'おおきさ']] },
  6217: { ant: [['上げる', 'あげる']] },
  6218: { rel: [['上げる', 'あげる']] },
  6219: { rel: [['寿司', 'すし']] },
  6220: { rel: [['指', 'ゆび']] },
  6221: { rel: [['芋', 'いも']] },
  6222: { syn: [['淋しい', 'さびしい']] },
  6224: { syn: [['いろいろ']] },
  6225: { rel: [['茶碗', 'ちゃわん']] },
  6226: { rel: [['野菜', 'やさい']] },
  6227: { rel: [['騒ぐ', 'さわぐ']] },
  6228: { rel: [['騒がしい', 'さわがしい']] },
  6229: { syn: [['触れる', 'ふれる']] },
  6230: { rel: [['三角形', 'さんかくけい']] },
  6231: { rel: [['工業', 'こうぎょう']] },
  6232: { rel: [['靴', 'くつ']] },
  6233: { rel: [['パン']] },
  6234: { syn: [['遺憾', 'いかん']] },
  6235: { rel: [['競技', 'きょうぎ']] },
  6236: { ant: [['不幸', 'ふこう']] },
  6237: { syn: [['方法', 'ほうほう']] },
  6238: { rel: [['仕方', 'しかた']] },
  6239: { syn: [['怒る', 'おこる']] },
  6240: { rel: [['時間', 'じかん']] },
  6241: { rel: [['季節', 'きせつ']] },
  6242: { rel: [['テスト']] },
  6243: { rel: [['項目', 'こうもく']] },
  6244: { rel: [['自信満々', 'じしんまんまん']] },
  6245: { ant: [['騒がしい', 'さわがしい']] },
  6246: { rel: [['自然', 'しぜん']] },
  6247: { rel: [['舌禍', 'ぜっか']] },
  6248: { rel: [['現代', 'げんだい']] },
  6249: { syn: [['仲が良い', 'なかがよい']] },
  6250: { ant: [['いい加減', 'いいかげん']] },
  6251: { rel: [['実際に', 'じっさいに']] },
  6252: { rel: [['実際', 'じっさい']] },
  6253: { ant: [['成功', 'せいこう']] },
  6254: { rel: [['市', 'し']] },
  6255: { rel: [['事務', 'じむ']] },
  6256: { rel: [['鉛筆', 'えんぴつ']] },
  6257: { rel: [['社会', 'しゃかい']] },
  6258: { syn: [['妨害', 'ぼうがい']] },
  6259: { syn: [['癖', 'くせ']] },
  6260: { rel: [['住所録', 'じゅうしょろく']] },
  6261: { rel: [['道路', 'どうろ']] },
  6262: { rel: [['武道', 'ぶどう']] },
  6263: { ant: [['支出', 'ししゅつ']] },
  6264: { syn: [['充分', 'じゅうぶん']] },
  6265: { ant: [['欠席', 'けっせき']] },
  6266: { ant: [['到着', 'とうちゃく']] },
  6267: { syn: [['嗜好', 'しこう']] },
  6268: { rel: [['電話', 'でんわ']] },
  6269: { rel: [['正月', 'しょうがつ']] },
  6270: { syn: [['用意', 'ようい']] },
  6271: { rel: [['自己紹介', 'じこしょうかい']] },
  6272: { rel: [['中学生', 'ちゅうがくせい']] },
  6273: { ant: [['部下', 'ぶか']] },
  6274: { rel: [['作家', 'さっか']] },
  6275: { syn: [['冗談', 'じょうだん']] },
  6276: { syn: [['了解', 'りょうかい']] },
  6277: { rel: [['情報収集', 'じょうほうしゅうしゅう']] },
  6278: { syn: [['知人', 'ちじん']] },
  6279: { rel: [['寺', 'てら']] },
  6280: { rel: [['親族', 'しんぞく']] },
  6281: { ant: [['不親切', 'ふしんせつ']] },
  6282: { rel: [['社員', 'しゃいん']] },
  6283: { rel: [['学生', 'がくせい']] },
  6284: { syn: [['懸念', 'けねん']] },
  6285: { rel: [['新聞', 'しんぶん']] },
  6286: { rel: [['元', 'げん']] },
  6287: { syn: [['大分', 'だいぶ']] },
  6288: { rel: [['算数', 'さんすう']] },
  6289: { rel: [['背広', 'せびろ']] },
  6290: { rel: [['荷物', 'にもつ']] },
  6291: { rel: [['スーパー']] },
  6292: { syn: [['様子', 'ようす']] },
  6293: { rel: [['過ぎ', 'すぎ']] },
  6294: { rel: [['過ぎる', 'すぎる']] },
  6295: { ant: [['多くとも', 'おおくとも']] },
  6296: { ant: [['退く', 'しりぞく']] },
  6297: { rel: [['一番', 'いちばん']] },
  6298: { rel: [['肉', 'にく']] },
  6299: { syn: [['棄てる', 'すてる']] },
  6300: { rel: [['音響', 'おんきょう']] },
  6301: { syn: [['素晴らしい', 'すばらしい']] },
  6302: { syn: [['全部', 'ぜんぶ']] },
  6303: { rel: [['泥棒', 'どろぼう']] },
  6304: { syn: [['盗む', 'ぬすむ']] },
  6305: { ant: [['失敗', 'しっぱい']] },
  6306: { rel: [['生産', 'せいさん']] },
  6307: { rel: [['発展', 'はってん']] },
  6308: { ant: [['東洋', 'とうよう']] },
  6309: { rel: [['説明書', 'せつめいしょ']] },
  6310: { rel: [['背', 'せ']] },
  6311: { rel: [['世話人', 'せわにん']] },
  6312: { rel: [['先週', 'せんしゅう']] },
  6313: { rel: [['競技者', 'きょうぎしゃ']] },
  6314: { rel: [['全く', 'まったく']] },
  6315: { rel: [['中心', 'ちゅうしん']] },
  6316: { rel: [['メートル']] },
  6317: { rel: [['相談する']] },
  6318: { rel: [['底面', 'ていめん']] },
  6319: { syn: [['育成', 'いくせい']] },
  6320: { rel: [['卒業式', 'そつぎょうしき']] },
  6321: { rel: [['あのころ']] },
  6322: { rel: [['その他', 'そのた']] },
  6323: { rel: [['その']] },
  6324: { ant: [['ハード']] },
  6325: { ant: [['祖父', 'そふ']] },
  6326: { syn: [['各々', 'おのおの']] },
  6327: { syn: [['種類', 'しゅるい']] },
  6328: { rel: [['暴風雨', 'ぼうふうう']] },
  6329: { ant: [['起こす', 'おこす']] },
  6330: { ant: [['立つ', 'たつ']] },
  6331: { rel: [['竹林', 'ちくりん']] },
  6332: { syn: [['加える', 'くわえる']] },
  6333: { rel: [['出る', 'でる']] },
  6334: { ant: [['助ける', 'たすける']] },
  6335: { ant: [['助かる', 'たすかる']] },
  6336: { syn: [['訪問', 'ほうもん']] },
  6337: { rel: [['今', 'いま']] },
  6338: { rel: [['建てる', 'たてる']] },
  6339: { rel: [['アヒル']] },
  6340: { rel: [['建つ', 'たつ']] },
  6341: { rel: [['本棚', 'ほんだな']] },
  6342: { rel: [['楽しい', 'たのしい']] },
  6343: { ant: [['いつも']] },
  6344: { syn: [['無理', 'むり']] },
  6345: { syn: [['足る', 'たる']] },
  6346: { rel: [['言葉', 'ことば']] },
  6347: { rel: [['男', 'おとこ']] },
  6348: { ant: [['女性', 'じょせい']] },
  6349: { ant: [['冷房', 'れいぼう']] },
  6350: { syn: [['点検', 'てんけん']] },
  6351: { syn: [['差', 'さ']] },
  6352: { syn: [['最近', 'さいきん']] },
  6353: { syn: [['力', 'ちから']] },
  6354: { rel: [['少しも', 'すこしも']] },
  6355: { rel: [['茶色', 'ちゃいろ']] },
  6356: { syn: [['留意', 'りゅうい']] },
  6357: { rel: [['中国', 'ちゅうごく']] },
  6358: { rel: [['駐車', 'ちゅうしゃ']] },
  6359: { rel: [['朝食', 'ちょうしょく']] },
  6360: { rel: [['町', 'まち']] },
  6361: { rel: [['町', 'まち']] },
  6362: { rel: [['地理学', 'ちりがく']] },
  6363: { ant: [['夫', 'おっと']] },
  6364: { rel: [['気持ち', 'きもち']] },
  6365: { rel: [['釣り', 'つり']] },
  6366: { rel: [['連れて行く', 'つれていく']] },
  6367: { rel: [['庭', 'にわ']] },
  6368: { rel: [['入口', 'いりぐち']] },
  6369: { rel: [['教科書', 'きょうかしょ']] },
  6370: { syn: [['適当に']] },
  6371: { rel: [['出来事', 'できごと']] },
  6372: { syn: [['なるべく']] },
  6373: { rel: [['手伝う', 'てつだう']] },
  6374: { rel: [['手伝い', 'てつだい']] },
  6375: { rel: [['テニス']] },
  6376: { rel: [['手', 'て']] },
  6377: { rel: [['神社', 'じんじゃ']] },
  6378: { rel: [['店', 'みせ']] },
  6379: { rel: [['天気', 'てんき']] },
  6380: { rel: [['辞書', 'じしょ']] },
  6381: { rel: [['灯り', 'あかり']] },
  6382: { rel: [['電話', 'でんわ']] },
  6383: { rel: [['展示', 'てんじ']] },
  6384: { syn: [['通過', 'つうか']] },
  6385: { syn: [['とりわけ']] },
  6386: { syn: [['特別な']] },
  6387: { rel: [['どこか']] },
  6388: { rel: [['途中で']] },
  6389: { rel: [['急行', 'きゅうこう']] },
  6390: { rel: [['届く', 'とどく']] },
  6391: { syn: [['どのような']] },
  6392: { syn: [['宿泊', 'しゅくはく']] },
  6393: { syn: [['交換', 'こうかん']] },
  6394: { rel: [['泥水', 'どろみず']] },
  6395: { rel: [['泥棒']] },
  6396: { rel: [['段々', 'だんだん']] },
  6397: { rel: [['どのように']] },
  6398: { ant: [['壊す', 'こわす']] },
  6399: { ant: [['悪化する', 'あっかする']] },
  6400: { rel: [['中々', 'なかなか']] },
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
