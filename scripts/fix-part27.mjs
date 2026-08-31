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
  5011: { meaning: '私立', exRemove: ['大学の基礎コース。'] },
  5027: { kanji: '診断' },
  5032: { kanji: '進歩', exReplace: { '進步が早い。': { jp: '進歩が早い。', zh: '进步快。' } } },
  5035: { meaning: '森林' },
  5041: { exReplace: { '\\ iangle 水分を吸收する。': { jp: '水分を吸収する。', zh: '吸收水分。' } } },
  5051: { meaning: '使……前进;开展;提升' },
  5052: { meaning: '劝,劝告;劝诱' },
  5054: { meaning: '自愿,主动地' },
  5056: { meaning: '出发点,起点;开始' },
  5062: { meaning: '极好,绝妙;(容貌等)漂亮' },
  5063: { exReplace: { 'すでに手遅れた。': { jp: 'すでに手遅れだ。', zh: '为时已晚。' } } },
  5067: { meaning: '天真,淳朴;老实' },
  5072: { meaning: '完了;解决;还清' },
  5077: { kanji: '請求書', kana: 'せいきゅうしょ' },
  5081: { exReplace: { 'テレビ番組を制作する。': { jp: 'テレビ番組を製作する。', zh: '制作电视节目。' } } },
  5084: { meaning: '成人,成年人;长大' },
  5086: { meaning: '整理,收拾;处理' },
  5090: { exReplace: { '性責意に任ん を負う。': { jp: '責任を負う。', zh: '负责任。' } } },
  5092: { meaning: '积极的' },
  5095: { kanji: '絶対', meaning: '绝对;决(不)', exReplace: { 'それは絶対の真理だと信じる。': { jp: 'それは絶対の真理だと信じる。', zh: '相信那是绝对的真理。' } } },
  5098: { meaning: '设备' },
  5099: { meaning: '专业,专门研究' },
  5100: { exReplace: { 'せんじつおく先日送った品物。': { jp: '先日送った品物。', zh: '前几天寄的东西。' } } },
  5102: { meaning: '全体;整体' },
  5108: { exReplace: { '全力を尽す。': { jp: '全力を尽くす。', zh: '竭尽全力。' } } },
  5111: { exReplace: { '人口が增加する。': { jp: '人口が増加する。', zh: '人口增长。' } } },
  5113: { exRemove: ['警察が家宅搜索に乗り出す。'] },
  5116: { exReplace: { '送别会を開<。': { jp: '送別会を開く。', zh: '举行送别会。' } } },
  5117: { meaning: '邮费,运费' },
  5119: { exReplace: { 'そ速くたつ達の 飞 加手紙承。': { jp: '速達の手紙。', zh: '快信。' } } },
  5121: { meaning: '祖先,老祖宗' },
  5122: { kanji: '注ぐ', kana: 'そそぐ', meaning: '流入,流;倒入;浇' },
  5124: { meaning: '全部;一模一样;原封不动' },
  5126: { meaning: '不久;过几天' },
  5127: { meaning: '但是,可是' },
  5129: { meaning: '当场,就地;当时' },
  5131: { meaning: '软件' },
  5139: { meaning: '大气' },
  5142: { meaning: '无聊,闷得慌;厌倦' },
  5144: { exRemove: ['体 育 大 会。'] },
  5145: { kana: 'たいざい', exReplace: { '日本に滞在している。': { jp: '日本に滞在している。', zh: '逗留在日本。' } } },
  5146: { meaning: '对策' },
  5147: { meaning: '非常,了不起;(下接否定)没有什么了不起' },
  5150: { kana: 'たいしょう', meaning: '对象' },
  5151: { meaning: '大与小' },
  5153: { meaning: '大臣' },
  5156: { meaning: '身体状况' },
  5158: { meaning: '总统' },
  5159: { meaning: '代表' },
  5163: { exRemove: ['い量りょうの品しも大量的物品。'] },
  5164: { meaning: '体力' },
  5165: { exReplace: { '絶えず熱心に勉強する。': { jp: '絶えず熱心に勉強する。', zh: '不断地努力学习。' } } },
  5167: { exReplace: { '気 分 が 高 ま る。': { jp: '気分が高まる。', zh: '情绪高涨。' } } },
  5168: { exReplace: { 'せ生いかつすいじ活水準んをた高かめ る。': { jp: '生活水準を高める。', zh: '提高生活水平。' } } },
  5169: { exRemove: ['お 宝がなくて 困 っ。'] },
  5171: { meaning: '家,住所;(「お宅」的形式)您的家' },
  5172: { kanji: '抱く', exRemove: ['抱く(だく) [ 他動1]抱。'] },
  5173: { exReplace: { 'くい便じんサービス。': { jp: '宅配便サービス。', zh: '送货上门服务。' } } },
  5174: { exReplace: { 'しんそ真相うを た確しかめる。': { jp: '真相を確かめる。', zh: '确认真相。' } } },
  5175: { exReplace: { 'てきたか 敵と戦う。': { jp: '敵と戦う。', zh: '和敌人作战。' } } },
  5176: { kanji: '叩く', exReplace: { '位 元蝿を叩く。': { jp: '蝿を叩く。', zh: '拍打苍蝇。' } } },
  5177: { kanji: '畳む', meaning: '叠,折;合上;关闭', exReplace: { '布団を置む。': { jp: '布団を畳む。', zh: '叠被褥。' }, '店を置む。': { jp: '店を畳む。', zh: '关张。' } } },
  5178: { exReplace: { '贫困から立ち上がる。': { jp: '貧困から立ち上がる。', zh: '从贫困中重新站起来。' } } },
  5179: { meaning: '靠近,顺路去' },
  5181: { meaning: '但是;……也,即便是……' },
  5183: { kanji: '例える', meaning: '比喻,比作' },
  5184: { meaning: '种子;原因;素材' },
  5185: { exReplace: { '頼たのみがある。': { jp: '頼みがある。', zh: '有事相求。' } } },
  5187: { exReplace: { '騙されやすい人。': { jp: '騙されやすい人。', zh: '容易受骗的人。' } }, exRemove: ['栄養が足りない。'] },
  5188: { meaning: '偶然,碰巧' },
  5190: { meaning: '积存;攒钱;(工作等)积压', exReplace: { 'お金がなかなか溜まらない。': { jp: 'お金がなかなか溜まらない。', zh: '存不下钱来。' } } },
  5191: { meaning: '叹气,长吁短叹' },
  5193: { meaning: '积,蓄;攒' },
  5195: { meaning: '依靠,依赖' },
  5196: { meaning: '……不足', exReplace: { '千円足らずの书金。': { jp: '千円足らずの金。', zh: '不足一千日币的钱。' } } },
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
  5001: { syn: [['各国', 'かっこく']], rel: [['諸外国', 'しょがいこく']] },
  5002: { ant: [['男子', 'だんし']], rel: [['女性', 'じょせい']] },
  5003: { ant: [['上級者', 'じょうきゅうしゃ']] },
  5004: { rel: [['挨拶', 'あいさつ']] },
  5008: { syn: [['処置', 'しょち']] },
  5009: { syn: [['知己', 'ちき']] },
  5011: { ant: [['公立', 'こうりつ']] },
  5012: { rel: [['絹', 'きぬ']] },
  5013: { rel: [['色', 'いろ']] },
  5014: { rel: [['しわ']] },
  5015: { ant: [['退学', 'たいがく']] },
  5016: { rel: [['列車', 'れっしゃ']] },
  5018: { rel: [['赤信号', 'あかしんごう']] },
  5019: { ant: [['天然', 'てんねん']] },
  5021: { syn: [['重大', 'じゅうだい']] },
  5022: { rel: [['作品', 'さくひん']] },
  5023: { rel: [['診断', 'しんだん']] },
  5024: { rel: [['異動', 'いどう']] },
  5025: { rel: [['居間', 'いま']] },
  5026: { syn: [['信用', 'しんよう']] },
  5027: { rel: [['診察', 'しんさつ']] },
  5028: { rel: [['体重', 'たいじゅう']] },
  5029: { ant: [['軽率', 'けいそつ']] },
  5030: { syn: [['進み具合', 'すすみぐあい']] },
  5032: { syn: [['発展', 'はってん']] },
  5033: { syn: [['信用', 'しんよう']] },
  5035: { rel: [['木', 'き']] },
  5036: { rel: [['調味料', 'ちょうみりょう']] },
  5038: { rel: [['蒸気', 'じょうき']] },
  5042: { rel: [['眠り', 'ねむり']] },
  5043: { rel: [['数ヶ月', 'すうかげつ']] },
  5044: { ant: [['長子', 'ちょうし']] },
  5045: { syn: [['隙間', 'すきま']] },
  5046: { rel: [['好み', 'このみ']] },
  5047: { rel: [['好み', 'このみ']] },
  5048: { syn: [['隙', 'すき']] },
  5050: { syn: [['送る', 'おくる']] },
  5051: { ant: [['止める', 'とめる']] },
  5052: { syn: [['薦める', 'すすめる']] },
  5053: { rel: [['飲む', 'のむ']] },
  5058: { rel: [['頭', 'あたま']] },
  5060: { syn: [['酸味', 'さんみ']] },
  5062: { syn: [['素晴らしい', 'すばらしい']] },
  5066: { rel: [['砂浜', 'すなはま']] },
  5067: { syn: [['従順', 'じゅうじゅん']] },
  5068: { syn: [['演説', 'えんぜつ']] },
  5069: { syn: [['速度', 'そくど']] },
  5070: { syn: [['すらり']] },
  5072: { syn: [['終わる', 'おわる']] },
  5073: { ant: [['ざわざわ']] },
  5076: { rel: [['気質', 'きしつ']] },
  5078: { rel: [['税', 'ぜい']] },
  5079: { syn: [['規制', 'きせい']] },
  5080: { syn: [['製作', 'せいさく']] },
  5081: { syn: [['制作', 'せいさく']] },
  5082: { ant: [['略式', 'りゃくしき']] },
  5083: { syn: [['性格', 'せいかく']] },
  5085: { syn: [['成果', 'せいか']] },
  5086: { syn: [['整頓', 'せいとん']] },
  5087: { rel: [['値引き', 'ねびき']] },
  5088: { syn: [['担う', 'になう']] },
  5089: { rel: [['風邪', 'かぜ']] },
  5090: { rel: [['責務', 'せきむ']] },
  5091: { syn: [['わざわざ']] },
  5093: { syn: [['計画', 'けいかく']] },
  5094: { syn: [['応対', 'おうたい']] },
  5095: { ant: [['相対', 'そうたい']] },
  5099: { syn: [['専修', 'せんしゅう']] },
  5102: { ant: [['部分', 'ぶぶん']] },
  5103: { syn: [['選抜', 'せんばつ']] },
  5104: { rel: [['洗濯', 'せんたく']] },
  5105: { syn: [['広告', 'こうこく']] },
  5106: { syn: [['将来', 'しょうらい']] },
  5107: { rel: [['専門', 'せんもん']] },
  5108: { syn: [['総力', 'そうりょく']] },
  5109: { syn: [['軌道', 'きどう']] },
  5110: { rel: [['音', 'おと']] },
  5111: { ant: [['減少', 'げんしょう']] },
  5112: { rel: [['保管', 'ほかん']] },
  5113: { syn: [['制作', 'せいさく']] },
  5114: { ant: [['受信', 'じゅしん']] },
  5115: { syn: [['空想', 'くうそう']] },
  5116: { rel: [['別れ', 'わかれ']] },
  5118: { rel: [['調味料', 'ちょうみりょう']] },
  5119: { rel: [['郵便', 'ゆうびん']] },
  5120: { syn: [['スピード']] },
  5122: { syn: [['注ぎ込む', 'そそぎこむ']] },
  5123: { syn: [['成長する', 'せいちょうする']] },
  5124: { rel: [['同じ', 'おなじ']] },
  5125: { ant: [['内側', 'うちがわ']] },
  5127: { syn: [['代わりに', 'かわりに']] },
  5130: { rel: [['椅子', 'いす']] },
  5132: { ant: [['丁寧', 'ていねい']] },
  5133: { syn: [['染色', 'せんしょく']] },
  5134: { rel: [['髭', 'ひげ']] },
  5135: { syn: [['外れる', 'はずれる']] },
  5136: { ant: [['欠ける', 'かける']] },
  5137: { syn: [['最初', 'さいしょ']] },
  5138: { rel: [['会議', 'かいぎ']] },
  5140: { ant: [['出勤', 'しゅっきん']] },
  5141: { syn: [['料金', 'りょうきん']] },
  5142: { syn: [['つまらない']] },
  5143: { syn: [['経験', 'けいけん']] },
  5144: { rel: [['野菜', 'やさい']] },
  5145: { syn: [['逗留', 'とうりゅう']] },
  5146: { syn: [['方策', 'ほうさく']] },
  5149: { rel: [['身長', 'しんちょう']] },
  5150: { rel: [['目的', 'もくてき']] },
  5152: { ant: [['就職', 'しゅうしょく']] },
  5154: { syn: [['向かう', 'むかう']] },
  5155: { rel: [['面積', 'めんせき']] },
  5156: { rel: [['健康', 'けんこう']] },
  5157: { syn: [['姿勢', 'しせい']] },
  5159: { syn: [['代弁', 'だいべん']] },
  5161: { syn: [['平坦', 'へいたん']] },
  5162: { ant: [['島', 'しま']] },
  5163: { ant: [['少量', 'しょうりょう']] },
  5164: { rel: [['力', 'ちから']] },
  5165: { syn: [['常に', 'つねに']] },
  5166: { syn: [['相互に', 'そうごに']] },
  5167: { ant: [['下がる', 'さがる']] },
  5168: { syn: [['上げる', 'あげる']] },
  5169: { rel: [['宝物', 'たからもの']] },
  5170: { syn: [['宝', 'たから']] },
  5171: { rel: [['家', 'いえ']] },
  5173: { rel: [['配達', 'はいたつ']] },
  5174: { syn: [['確認する', 'かくにんする']] },
  5175: { syn: [['戦争', 'せんそう']] },
  5176: { syn: [['打つ', 'うつ']] },
  5177: { ant: [['広げる', 'ひろげる']] },
  5178: { ant: [['座る', 'すわる']] },
  5180: { syn: [['僅か', 'わずか']] },
  5182: { rel: [['階', 'かい']] },
  5184: { syn: [['種子', 'しゅし']] },
  5185: { syn: [['依頼', 'いらい']] },
  5186: { rel: [['旅行', 'りょこう']] },
  5187: { syn: [['欺く', 'あざむく']] },
  5189: { rel: [['野菜', 'やさい']] },
  5190: { ant: [['減る', 'へる']] },
  5194: { syn: [['消息', 'しょうそく']] },
  5195: { syn: [['依存する', 'いぞんする']] },
  5197: { rel: [['責任', 'せきにん']] },
  5199: { rel: [['教師', 'きょうし']] },
  5200: { syn: [['区域', 'くいき']] },
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
