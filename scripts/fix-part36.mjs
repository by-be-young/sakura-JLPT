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
  6801: { meaning: '最初,起先,第一' },
  6802: { pitch: '⓪' },
  6806: { meaning: '先,首先;之前' },
  6809: { exRemove: ['何歳。', '8 歳。'] },
  6810: { pos: 'イ形' },
  6811: { kanji: '皿', meaning: '盘子,碟子' },
  6812: { exRemove: ['\\ iangle 再来月までテニスを練習する。   →  练习网球'], exReplace: { '再きらい来ザ月つ のコンサート。': { jp: '再来月のコンサート。', zh: '下下个月的音乐会。' }, '\\ iangle 再来月までテニスを練習する。   →  练习网球きらいいずつ': { jp: '再来月までテニスを練習する。', zh: '练网球练到下下个月。' } } },
  6813: { exReplace: { 'きらいしゆう やくそく\\ iangle 再来週の約束。': { jp: '再来週の約束。', zh: '下下周的约定。' } } },
  6814: { exReplace: { '再来年の計画。': { jp: '再来年の計画。', zh: '后年的计划。' } } },
  6816: { exReplace: { '\\ iangle 夜遅くまで残業する。': { jp: '夜遅くまで残業する。', zh: '加班到深夜。' } } },
  6817: { kana: 'さんぽ', exReplace: { '晚ご飯を食べた後、散歩に行く。': { jp: '晩ご飯を食べた後、散歩に行く。', zh: '吃完晚饭后去散步。' } } },
  6818: { exRemove: ['字を書く。'] },
  6821: { meaning: '时间,时刻' },
  6822: { meaning: '......小时' },
  6829: { exRemove: ['自転車(じてんしゃ) [ 名]自行车。'] },
  6833: { exReplace: { '自分の宿题は自分でやる。': { jp: '自分の宿題は自分でやる。', zh: '自己的作业自己做。' } } },
  6834: { kana: 'しまる', exReplace: { '孙 世店が閉まった。': { jp: '店が閉まった。', zh: '店打烊了。' } } },
  6836: { meaning: '公司职员', exReplace: { 'は派けんしみいん遣社員。': { jp: '派遣社員。', zh: '派遣员工。' } } },
  6839: { exReplace: { '\\ iangle 週に2回運動する。': { jp: '週に2回運動する。', zh: '一周运动两次。' } } },
  6847: { kanji: '新鮮', pitch: '①', exReplace: { '新鲜な野菜。': { jp: '新鮮な野菜。', zh: '新鲜的蔬菜。' } } },
  6855: { pitch: '①' },
  6858: { kana: 'すぎ', pitch: '①', meaning: '过度......,太......' },
  6864: { exReplace: { '少しも悲し<な。': { jp: '少しも悲しくない。', zh: '一点也不难过。' } } },
  6865: { kanji: '涼しい', exReplace: { '雨が降って凉しくなかった。': { jp: '雨が降って涼しくなった。', zh: '下雨之后变凉了。' } } },
  6872: { pitch: '⓪' },
  6875: { pitch: '⓪' },
  6878: { exReplace: { 'せいいひ製品検查する。': { jp: '製品を検査する。', zh: '检查产品。' } } },
  6879: { meaning: '成立,达成' },
  6881: { kana: 'せき' },
  6882: { kana: 'せっけん', meaning: '肥皂' },
  6893: { kana: 'たいいくかん' },
  6898: { meaning: '非常喜欢,最喜欢' },
  6900: { meaning: '相当,颇,很' },
  6905: { exRemove: ['質の悪い冗談。', 'おとなしい質。'] },
  6906: { meaning: '乒乓球' },
  6907: { meaning: '竖,纵' },
  6908: { meaning: '竖起;扬起(灰尘等);制订(计划等)', exReplace: { '\\ iangle 倒れた旗を立てる。': { jp: '倒れた旗を立てる。', zh: '扶起倒下的旗子。' }, 'ほこりを立てなくて掃除する。': { jp: 'ほこりを立てなくて掃除する。', zh: '不扬起灰尘地打扫。' } } },
  6909: { exReplace: { 'たも物の を建てる。': { jp: '建物を建てる。', zh: '建房屋。' } } },
  6914: { meaning: '食物,食品' },
  6919: { pitch: '①' },
  6920: { kanji: '誕生日', pitch: '③' },
  6931: { kana: 'ちゅう' },
  6932: { kanji: '着く', kana: 'つく' },
  6936: { meaning: '通知,传达' },
  6938: { exReplace: { 'アイスが冷たい。': { jp: 'アイスが冷たい。', zh: '冰激凌很凉。' } } },
  6941: { pos: 'イ形' },
  6943: { kana: 'ディーブイディー' },
  6947: { pitch: '⓪' },
  6948: { pitch: '⓪' },
  6951: { exReplace: { '選举に出る。': { jp: '選挙に出る。', zh: '参加选举。' } } },
  6953: { exRemove: ['てん はい。', '点が入る。', 'その点についての説明。'] },
  6955: { meaning: '电;电灯' },
  6958: { meaning: '电话' },
  6965: { kana: 'どうぶつ', exRemove: ['犬はどこまでもついてくる。', 'どこまでも反対する。'] },
  6968: { kanji: '十' },
  6972: { pitch: '⓪', meaning: '有时,时常' },
  6973: { exReplace: { '時にはレストランで食事する。': { jp: '時にはレストランで食事する。', zh: '有时在餐厅吃饭。' } } },
  6975: { meaning: '地方,场所' },
  6976: { exReplace: { '休きゆ憩うけ所と二。': { jp: '休憩所。', zh: '休息的场所。' } } },
  6977: { exReplace: { '年と替方わる。': { jp: '年が替わる。', zh: '新年了。' } } },
  6987: { kana: 'とぶ', exReplace: { '教室に飛。': { jp: '教室に飛び込む。', zh: '飞奔进教室。' } } },
  6989: { kana: 'どようび' },
  6998: { kana: 'ないよう', exReplace: { 'ばんの内容。': { jp: '鞄の内容。', zh: '包里面的东西。' } } },
  6999: { meaning: '长的;久远的,悠长的' },
  7000: { kanji: 'ながら', kana: 'ながら', meaning: '一边......一边......' },
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
    if (w.kanji && w.kanji !== 'ながら') w.kanjiFurigana = await convert(w.kanji)
    if (w.examples) for (const ex of w.examples) if (ex.jp) ex.jpFurigana = await convert(ex.jp)
  }
  applied++
}
console.log('已修正词条：', applied)

const relAdd = {
  6801: { rel: [['最初', 'さいしょ']] },
  6802: { rel: [['お金', 'おかね']] },
  6803: { rel: [['探し物', 'さがしもの']] },
  6804: { rel: [['魚屋', 'さかなや']] },
  6805: { ant: [['後', 'あと']] },
  6806: { rel: [['先', 'さき']] },
  6807: { rel: [['花', 'はな']] },
  6808: { rel: [['歳', 'さい']] },
  6809: { rel: [['文章', 'ぶんしょう']] },
  6810: { ant: [['暑い', 'あつい']] },
  6811: { rel: [['食器', 'しょっき']] },
  6812: { rel: [['来月', 'らいげつ']] },
  6813: { rel: [['来週', 'らいしゅう']] },
  6814: { rel: [['来年', 'らいねん']] },
  6815: { rel: [['様', 'さま']] },
  6816: { rel: [['仕事', 'しごと']] },
  6817: { rel: [['歩く', 'あるく']] },
  6818: { rel: [['時', 'とき']] },
  6819: { rel: [['電車', 'でんしゃ']] },
  6820: { rel: [['塩味', 'しおあじ']] },
  6821: { rel: [['時刻', 'じこく']] },
  6822: { rel: [['時間', 'じかん']] },
  6823: { rel: [['紹介', 'しょうかい']] },
  6824: { rel: [['勤め', 'つとめ']] },
  6825: { rel: [['辞典', 'じてん']] },
  6826: { ant: [['上', 'うえ']] },
  6827: { rel: [['祝い', 'いわい']] },
  6828: { rel: [['問題', 'もんだい']] },
  6829: { rel: [['乗り物', 'のりもの']] },
  6830: { rel: [['車', 'くるま']] },
  6831: { ant: [['生まれる', 'うまれる']] },
  6832: { rel: [['辞書', 'じしょ']] },
  6833: { rel: [['自身', 'じしん']] },
  6834: { ant: [['開く', 'あく']] },
  6835: { ant: [['開ける', 'あける']] },
  6836: { rel: [['会社', 'かいしゃ']] },
  6837: { rel: [['写真機', 'しゃしんき']] },
  6838: { rel: [['服', 'ふく']] },
  6839: { rel: [['週間', 'しゅうかん']] },
  6840: { rel: [['中', 'なか']] },
  6841: { rel: [['週', 'しゅう']] },
  6842: { rel: [['飲み物', 'のみもの']] },
  6843: { rel: [['週', 'しゅう']] },
  6844: { rel: [['課', 'か']] },
  6845: { rel: [['課題', 'かだい']] },
  6846: { rel: [['奥さん', 'おくさん']] },
  6847: { rel: [['新鮮', 'しんせん']] },
  6848: { rel: [['正月', 'しょうがつ']] },
  6849: { rel: [['新聞社', 'しんぶんしゃ']] },
  6850: { ant: [['黒い', 'くろい']] },
  6851: { rel: [['曜日', 'ようび']] },
  6852: { rel: [['呼吸', 'こきゅう']] },
  6853: { rel: [['数', 'かず']] },
  6854: { rel: [['スーパーマーケット']] },
  6855: { rel: [['汁', 'しる']] },
  6856: { rel: [['服', 'ふく']] },
  6857: { ant: [['嫌い', 'きらい']] },
  6858: { rel: [['過ぎる', 'すぎる']] },
  6859: { rel: [['スポーツ']] },
  6860: { rel: [['鍋', 'なべ']] },
  6861: { rel: [['直ぐ', 'すぐ']] },
  6862: { ant: [['多い', 'おおい']] },
  6863: { rel: [['予定', 'よてい']] },
  6864: { rel: [['少し', 'すこし']] },
  6865: { ant: [['暑い', 'あつい']] },
  6866: { rel: [['少しずつ', 'すこしずつ']] },
  6867: { syn: [['酸っぱい', 'すっぱい']] },
  6868: { rel: [['暖房', 'だんぼう']] },
  6869: { rel: [['食器', 'しょっき']] },
  6870: { rel: [['服', 'ふく']] },
  6871: { rel: [['住所', 'じゅうしょ']] },
  6872: { rel: [['スポーツ']] },
  6873: { rel: [['履物', 'はきもの']] },
  6874: { rel: [['為す', 'なす']] },
  6875: { rel: [['椅子', 'いす']] },
  6876: { rel: [['身長', 'しんちょう']] },
  6877: { rel: [['人生', 'じんせい']] },
  6878: { rel: [['商品', 'しょうひん']] },
  6879: { rel: [['成り立つ', 'なりたつ']] },
  6880: { rel: [['服', 'ふく']] },
  6881: { rel: [['座席', 'ざせき']] },
  6882: { rel: [['洗濯', 'せんたく']] },
  6883: { rel: [['春', 'はる']] },
  6884: { rel: [['洋服', 'ようふく']] },
  6885: { ant: [['広い', 'ひろい']] },
  6886: { rel: [['零', 'れい']] },
  6887: { rel: [['動物', 'どうぶつ']] },
  6888: { rel: [['掃除機', 'そうじき']] },
  6889: { rel: [['そう']] },
  6890: { rel: [['あそこ']] },
  6891: { rel: [['こちら']] },
  6892: { rel: [['そちら']] },
  6893: { rel: [['体育', 'たいいく']] },
  6894: { rel: [['学生', 'がくせい']] },
  6895: { ant: [['大好き', 'だいすき']] },
  6896: { rel: [['大使', 'たいし']] },
  6897: { rel: [['大丈夫', 'だいじょうぶ']] },
  6898: { ant: [['大嫌い', 'だいきらい']] },
  6899: { rel: [['厨房', 'ちゅうぼう']] },
  6900: { rel: [['かなり']] },
  6901: { ant: [['安い', 'やすい']] },
  6902: { syn: [['沢山', 'たくさん']] },
  6903: { rel: [['のみ']] },
  6904: { ant: [['入れる', 'いれる']] },
  6905: { rel: [['たち']] },
  6906: { rel: [['球技', 'きゅうぎ']] },
  6907: { ant: [['横', 'よこ']] },
  6908: { rel: [['建てる', 'たてる']] },
  6909: { rel: [['建築', 'けんちく']] },
  6910: { rel: [['楽しみ', 'たのしみ']] },
  6911: { syn: [['依頼する', 'いらいする']] },
  6912: { rel: [['煙草', 'たばこ']] },
  6913: { rel: [['多分', 'たぶん']] },
  6914: { rel: [['飲み物', 'のみもの']] },
  6915: { ant: [['飲む', 'のむ']] },
  6916: { rel: [['卵焼き', 'たまごやき']] },
  6917: { rel: [['駄目', 'だめ']] },
  6918: { rel: [['だれか']] },
  6919: { rel: [['誰', 'だれ']] },
  6920: { rel: [['誕生', 'たんじょう']] },
  6921: { rel: [['踊り', 'おどり']] },
  6922: { syn: [['次第に', 'しだいに']] },
  6923: { ant: [['大きい', 'おおきい']] },
  6924: { ant: [['大きな', 'おおきな']] },
  6925: { ant: [['同じ', 'おなじ']] },
  6926: { rel: [['電車', 'でんしゃ']] },
  6927: { rel: [['世界地図', 'せかいちず']] },
  6928: { ant: [['母', 'はは']] },
  6929: { rel: [['茶', 'ちゃ']] },
  6930: { rel: [['さん']] },
  6931: { rel: [['中', 'なか']] },
  6932: { rel: [['到着', 'とうちゃく']] },
  6933: { rel: [['椅子', 'いす']] },
  6934: { rel: [['創作', 'そうさく']] },
  6935: { rel: [['付け加える', 'つけくわえる']] },
  6936: { rel: [['伝言', 'でんごん']] },
  6937: { syn: [['面白くない', 'おもしろくない']] },
  6938: { ant: [['熱い', 'あつい']] },
  6939: { rel: [['露', 'つゆ']] },
  6940: { ant: [['弱い', 'よわい']] },
  6941: { rel: [['苦しい', 'くるしい']] },
  6942: { rel: [['トイレ']] },
  6943: { rel: [['ビデオ']] },
  6944: { rel: [['遊園地', 'ゆうえんち']] },
  6945: { syn: [['親切', 'しんせつ']] },
  6946: { rel: [['テープ']] },
  6947: { rel: [['外出', 'がいしゅつ']] },
  6948: { rel: [['葉書', 'はがき']] },
  6949: { rel: [['試験', 'しけん']] },
  6950: { rel: [['店', 'みせ']] },
  6951: { ant: [['入る', 'はいる']] },
  6952: { rel: [['放送', 'ほうそう']] },
  6953: { rel: [['店', 'みせ']] },
  6954: { rel: [['気候', 'きこう']] },
  6955: { rel: [['電灯', 'でんとう']] },
  6956: { rel: [['汽車', 'きしゃ']] },
  6957: { rel: [['揚げ物', 'あげもの']] },
  6958: { rel: [['電話番号', 'でんわばんごう']] },
  6959: { rel: [['扉', 'とびら']] },
  6960: { rel: [['手洗い', 'てあらい']] },
  6961: { rel: [['どんな']] },
  6962: { rel: [['工具', 'こうぐ']] },
  6963: { rel: [['なぜ']] },
  6964: { rel: [['どう']] },
  6965: { rel: [['動物園', 'どうぶつえん']] },
  6966: { rel: [['ありがとう']] },
  6967: { rel: [['どう']] },
  6968: { rel: [['十', 'じゅう']] },
  6969: { rel: [['日', 'にち']] },
  6970: { rel: [['都市', 'とし']] },
  6971: { rel: [['時間', 'じかん']] },
  6972: { rel: [['時', 'とき']] },
  6973: { rel: [['時', 'とき']] },
  6974: { rel: [['時間', 'じかん']] },
  6975: { rel: [['所', 'ところ']] },
  6976: { rel: [['場所', 'ばしょ']] },
  6977: { rel: [['年齢', 'ねんれい']] },
  6978: { syn: [['都会', 'とかい']] },
  6979: { rel: [['本', 'ほん']] },
  6980: { rel: [['どこ']] },
  6981: { rel: [['どちら']] },
  6982: { syn: [['非常に', 'ひじょうに']] },
  6983: { rel: [['誰', 'だれ']] },
  6984: { rel: [['隣人', 'りんじん']] },
  6985: { rel: [['どれ']] },
  6986: { rel: [['どれぐらい']] },
  6987: { rel: [['飛行', 'ひこう']] },
  6988: { rel: [['友人', 'ゆうじん']] },
  6989: { rel: [['曜日', 'ようび']] },
  6990: { rel: [['小鳥', 'ことり']] },
  6991: { rel: [['肉', 'にく']] },
  6992: { rel: [['飲み物', 'のみもの']] },
  6993: { rel: [['写真', 'しゃしん']] },
  6994: { rel: [['どの']] },
  6995: { rel: [['どのぐらい']] },
  6996: { rel: [['どの']] },
  6997: { rel: [['包丁', 'ほうちょう']] },
  6998: { rel: [['中身', 'なかみ']] },
  6999: { ant: [['短い', 'みじかい']] },
  7000: { rel: [['同時', 'どうじ']] },
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
