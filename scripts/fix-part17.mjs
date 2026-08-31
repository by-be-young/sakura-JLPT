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
  3001: { exReplace: { '涙が零れる。': { jp: '涙が零れる。', zh: '流泪,落泪。' } } },
  3003: { meaning: '雇用,雇佣' },
  3004: { meaning: '忍耐,忍住' },
  3005: { exReplace: { '娱楽施設。': { jp: '娯楽施設。', zh: '娱乐设施。' } } },
  3006: { meaning: '收藏,藏品;时装发布会' },
  3011: { kana: 'こんざつ', meaning: '混杂,拥挤' },
  3022: { kana: 'さいさん' },
  3025: { kanji: '採択', exReplace: { '満 場 一 致 で 探 択 す る。': { jp: '満場一致で採択する。', zh: '全场一致通过。' } } },
  3032: { exReplace: { 'むか昔しばな話しを小 しょ説うせのつ材 料とする。': { jp: '昔話を小説の材料とする。', zh: '以古老传说作为小说的素材。' } } },
  3034: { kana: 'さえずる', meaning: '(小鸟)婉转啼鸣' },
  3039: { kana: 'さかば' },
  3044: { meaning: '小的,细微的' },
  3045: { exReplace: { '\\ iangle 耳元で囇く。': { jp: '耳元で囁く。', zh: '咬耳朵,在耳边低声说话。' } } },
  3046: { kana: 'さじ' },
  3051: { exReplace: { '手 数 料 を 差 し 引 <。': { jp: '手数料を差し引く。', zh: '扣除手续费。' } } },
  3054: { meaning: '加入,注入' },
  3056: { kana: 'さぞ' },
  3057: { kanji: '誘う' },
  3059: { meaning: '杂音,噪声' },
  3060: { exReplace: { '錯覚に陷る。': { jp: '錯覚に陥る。', zh: '陷入错觉。' } } },
  3067: { exReplace: { 'サ八ラ砂漠。': { jp: 'サハラ砂漠。', zh: '撒哈拉大沙漠。' } } },
  3070: { exReplace: { '人種差别。': { jp: '人種差別。', zh: '种族歧视。' } } },
  3079: { kana: 'さんざん' },
  3080: { kana: 'ざんしょ' },
  3082: { exReplace: { '\\ iangle 山腹で一休みする。': { jp: '山腹で一休みする。', zh: '在山腰处休息一下。' } } },
  3084: { kana: 'じかに', exRemove: ['たの。'], exReplace: { '直に賴む。': { jp: '直に頼む。', zh: '当面请求。' } } },
  3087: { meaning: '火急,火速' },
  3089: { meaning: '试乘,试车' },
  3091: { exReplace: { '骚き音が静まる。': { jp: '騒音が静まる。', zh: '噪声消失,安静下来。' } } },
  3093: { exReplace: { '船を沈める。': { jp: '船を沈める。', zh: '使船下沉。' } } },
  3097: { exReplace: { '誤った思想。': { jp: '誤った思想。', zh: '错误的想法。' } } },
  3100: { exReplace: { '死体遗棄。': { jp: '死体遺棄。', zh: '尸体遗弃。' } } },
  3105: { exRemove: ['目的；功成名就。'], exReplace: { 'は晚んご は飯支した度くす る。': { jp: '晩ご飯の支度をする。', zh: '准备晚饭。' } } },
  3110: { meaning: '收看;瞩目' },
  3115: { kanji: '実施' },
  3117: { kana: 'じっせんてき', meaning: '实践性的' },
  3119: { exReplace: { '空気の湿度。': { jp: '空気の湿度。', zh: '空气的湿度。' } } },
  3121: { kana: 'しっぴつ', meaning: '执笔,写作' },
  3127: { meaning: '支配,统治;控制', exRemove: ['う人が萎む。', '夢が萎む。'] },
  3128: { exReplace: { '資本金。': { jp: '資本金。', zh: '资本,本金。' } } },
  3129: { kanji: '縞', exReplace: { '稿模様。': { jp: '縞模様。', zh: '条状花纹。' } } },
  3131: { kana: 'じめじめ' },
  3134: { exReplace: { 'はす数う を占める。': { jp: '半数を占める。', zh: '占半数以上。' } } },
  3137: { kana: 'じもと', exReplace: { '地 元 出 身。': { jp: '地元出身。', zh: '本地出生。' } } },
  3139: { exReplace: { '蛇 口 を ねる。': { jp: '蛇口を捻る。', zh: '拧水龙头。' } } },
  3144: { exRemove: ['14. はたら。'] },
  3146: { exReplace: { 'ぜ絶つめつきぐ滅危惧種。': { jp: '絶滅危惧種。', zh: '濒危物种。' }, '職 種。': { jp: '職種。', zh: '职业的种类,职别。' }, 'ぎ業上種3。': { jp: '業種。', zh: '行业。' } } },
  3147: { kana: 'しゅ' },
  3148: { exRemove: ['週に2回運動する。'] },
  3149: { meaning: '枪' },
  3150: { kana: 'じゅう' },
  3151: { kanji: '周囲', meaning: '周围,四周(环境)', exReplace: { '周围の影響を受ける。': { jp: '周囲の影響を受ける。', zh: '受周围人的影响。' } } },
  3154: { meaning: '就学,上学', exReplace: { '就学年龄。': { jp: '就学年齢。', zh: '上学年龄。' } } },
  3156: { meaning: '就业,开始工作' },
  3157: { exReplace: { '集金に回る。': { jp: '集金に回る。', zh: '到各处去收款。' } } },
  3159: { meaning: '集中,集合' },
  3161: { meaning: '自始至终' },
  3163: { exReplace: { '充実感。': { jp: '充実感。', zh: '充实感。' } } },
  3164: { meaning: '修饰' },
  3165: { meaning: '修正,改正错误' },
  3170: { exReplace: { '单位を修得する。': { jp: '単位を修得する。', zh: '修得学分。' } } },
  3171: { exReplace: { '会社の重役に<。': { jp: '会社の重役になる。', zh: '担任公司要职。' } } },
  3173: { meaning: '完成学业' },
  3179: { kanji: '縮小', meaning: '缩小' },
  3181: { meaning: '住宿' },
  3184: { kana: 'しゅさい' },
  3185: { kana: 'しゅざい', meaning: '取材,采访', exReplace: { '\\ iangle 事故現場を取材する。': { jp: '事故現場を取材する。', zh: '采访事故现场。' } } },
  3187: { kanji: '主題', meaning: '主题,大标题', exReplace: { '主题歌。': { jp: '主題歌。', zh: '主题曲。' } } },
  3188: { kanji: '出現', exReplace: { '新 型 器 械 の 出 現。': { jp: '新型器械の出現。', zh: '新型机器的出现。' } } },
  3191: { meaning: '出世,出生;(获得)成功,出人头地' },
  3192: { meaning: '展出产品' },
  3195: { meaning: '循环' },
  3197: { kanji: '純情', kana: 'じゅんじょう', meaning: '纯情,纯洁,天真', exRemove: ['せいねん。'] },
  3198: { exReplace: { '纯粋な若者。': { jp: '純粋な若者。', zh: '纯真无邪的年轻人。' } } },
  3199: { meaning: '诸......,各种各样,形形色色', exReplace: { '教育に関する諸問题。': { jp: '教育に関する諸問題。', zh: '与教育相关的各种问题。' } } },
}

const modifyIds = Object.keys(fixes).map(Number)
let applied = 0
for (const w of words) {
  if (!modifyIds.includes(w.id)) continue
  const f = fixes[w.id]
  if (f.kanji) w.kanji = f.kanji
  if (f.kana) w.kana = f.kana
  if (f.meaning) w.meaning = f.meaning
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
  3005: { syn: [['遊び', 'あそび']] },
  3010: { syn: [['混ぜる', 'まぜる']] },
  3013: { rel: [['虫', 'むし']] },
  3015: { rel: [['結婚', 'けっこん']] },
  3031: { ant: [['従う', 'したがう']] },
  3040: { rel: [['桜', 'さくら']] },
  3063: { syn: [['世間話', 'せけんばなし']] },
  3068: { rel: [['錆', 'さび']] },
  3070: { syn: [['区別', 'くべつ']] },
  3072: { syn: [['邪魔する', 'じゃまする']] },
  3073: { ant: [['眠る', 'ねむる']] },
  3076: { ant: [['留まる', 'とどまる']] },
  3092: { syn: [['鎮める', 'しずめる']], rel: [['静まる', 'しずまる']] },
  3095: { rel: [['目線', 'めせん']] },
  3099: { ant: [['祖先', 'そせん']] },
  3101: { syn: [['状況', 'じょうきょう']] },
  3111: { rel: [['故郷', 'こきょう']] },
  3116: { syn: [['実行', 'じっこう']] },
  3121: { rel: [['原稿', 'げんこう']] },
  3127: { syn: [['統治', 'とうち']] },
  3128: { rel: [['資金', 'しきん']] },
  3140: { ant: [['長所', 'ちょうしょ']] },
  3160: { rel: [['収入', 'しゅうにゅう']] },
  3172: { syn: [['これまで']] },
  3175: { ant: [['客観', 'きゃっかん']] },
  3177: { rel: [['信条', 'しんじょう']] },
  3178: { rel: [['四字熟語', 'よじじゅくご']] },
  3181: { rel: [['旅館', 'りょかん']] },
  3194: { syn: [['一瞬', 'いっしゅん']] },
  3198: { syn: [['純真', 'じゅんしん']] },
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
