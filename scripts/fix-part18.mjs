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
  3202: { exReplace: { '功労章。': { jp: '功労章。', zh: '功勋章。' }, '第一章。': { jp: '第一章。', zh: '第一章节。' } } },
  3204: { exReplace: { '2勝1敗。': { jp: '2勝1敗。', zh: '二胜一负。' } } },
  3206: { meaning: '消化,吸收' },
  3207: { exReplace: { '障害を乘り越える。': { jp: '障害を乗り越える。', zh: '跨越障碍。' } } },
  3208: { exReplace: { '将棋倒L。': { jp: '将棋倒し。', zh: '一个压一个地倒下;多米诺骨牌。' } } },
  3213: { meaning: '日式拉门' },
  3214: { meaning: '少子化' },
  3216: { meaning: '上升' },
  3219: { exReplace: { '鳩は平和を象徵する。': { jp: '鳩は平和を象徴する。', zh: '鸽子象征着和平。' } } },
  3224: { meaning: '商人,从事买卖的人' },
  3228: { meaning: '蒸发;失踪' },
  3229: { meaning: '奖品,奖赏的物品' },
  3231: { exRemove: ['正味8時間働いた。'] },
  3235: { meaning: '省略,从简' },
  3239: { kanji: '職' },
  3242: { meaning: '寄予厚望' },
  3243: { exReplace: { '職務權限。': { jp: '職務権限。', zh: '职务权限,职权范围。' } } },
  3244: { exReplace: { '友ちとして助言する。': { jp: '友として助言する。', zh: '作为朋友提建议。' } } },
  3246: { kana: 'じょしゅ' },
  3247: { exReplace: { '10月如 の初旬。': { jp: '10月の初旬。', zh: '十月上旬。' } } },
  3249: { meaning: '书籍,图书' },
  3254: { exReplace: { 'しば契しい約か書く に署名する。': { jp: '契約書に署名する。', zh: '在合同上署名。' } } },
  3257: { exReplace: { 'えんじ鉛筆つの芯。': { jp: '鉛筆の芯。', zh: '铅笔芯。' } } },
  3258: { meaning: '...人;...人种;专业人士', exRemove: ['恥 知らず。', '怖いもの知らず。'] },
  3260: { exReplace: { 'プライバシーの侵害。': { jp: 'プライバシーの侵害。', zh: '侵犯隐私。' } } },
  3261: { kanji: '新規', meaning: '新规则;新来的', exReplace: { '新 規 採 用。': { jp: '新規採用。', zh: '雇用新人。' }, '口 座 を 新 規 に 開 く。': { jp: '口座を新規に開く。', zh: '新开账户。' } } },
  3264: { meaning: '(做事)认真' },
  3265: { exReplace: { '工事の進行が予定より遅い。': { jp: '工事の進行が予定より遅い。', zh: '工程进度比预定慢。' } } },
  3267: { exReplace: { '論文を審查する。': { jp: '論文を審査する。', zh: '审核论文。' } } },
  3269: { exReplace: { '人種差别。': { jp: '人種差別。', zh: '种族歧视。' } } },
  3270: { meaning: '人身事故' },
  3273: { meaning: '亲戚' },
  3275: { meaning: '寂静,静悄悄' },
  3283: { exReplace: { '人命に閱わる問題。': { jp: '人命に関わる問題。', zh: '关乎人命的问题。' } } },
  3285: { meaning: '侵略' },
  3288: { meaning: '前进的方向,道路;前途', exRemove: ['針路を東にとる。'] },
  3291: { kanji: '神話' },
  3295: { kanji: '推測' },
  3296: { meaning: '垂直' },
  3297: { meaning: '推断;设想,假定', exReplace: { '费用を推定する。': { jp: '費用を推定する。', zh: '推算费用,预估费用。' } } },
  3301: { exReplace: { '透き通った声。': { jp: '透き通った声。', zh: '清脆的声音。' } } },
  3304: { exRemove: ['いし医 者したがの 勧 め に 従 う。', '学問の勧め。'], exReplace: { '優 扎 成 績。': { jp: '優れた成績。', zh: '优秀的成绩。' } } },
  3306: { exReplace: { 'あいあょ会長うに薦める。': { jp: '会長に薦める。', zh: '推荐为会长。' } } },
  3307: { exReplace: { '枣山の裾。': { jp: '山の裾。', zh: '山麓,山脚下。' } } },
  3312: { meaning: '行动轻快地;细长地;舒畅的' },
  3315: { meaning: '长筒袜' },
  3317: { meaning: '头脑,智力;人才', exReplace: { '頭腦明晰。': { jp: '頭脳明晰。', zh: '头脑清晰。' }, '頭 腦 流 出。': { jp: '頭脳流出。', zh: '人才流失,优秀人才移居国外。' } } },
  3322: { exRemove: ['惯用。'] },
  3326: { exReplace: { '澄志ん だ鈴の音。': { jp: '澄んだ鈴の音。', zh: '清脆的铃声。' } } },
  3332: { kanji: '鋭い' },
  3334: { exRemove: ['擦れ違う(すれちがう) [自動1]擦肩 而过；分歧。'] },
  3337: { exReplace: { '精。': { jp: '精いっぱい走る。', zh: '拼命奔跑。' } } },
  3341: { kanji: '生計', meaning: '生计,维持生活的手段' },
  3343: { meaning: '誊写清楚' },
  3348: { exReplace: { '町を清掃す る。': { jp: '町を清掃する。', zh: '清扫街道。' } } },
  3349: { meaning: '制造,生产' },
  3352: { exRemove: ['栄養成分。'] },
  3354: { meaning: '配音演员' },
  3358: { exReplace: { '咳 止 め シ 口 ッ。': { jp: '咳止めシロップ。', zh: '止咳糖浆。' } } },
  3361: { exReplace: { '说得力に欠ける。': { jp: '説得力に欠ける。', zh: '缺乏说服力。' } } },
  3362: { meaning: '灭绝;消灭,使......灭绝' },
  3363: { meaning: '是非,正误;评论' },
  3367: { kanji: '責める', exReplace: { 'り良ょうし心んに責められる。': { jp: '良心に責められる。', zh: '受到良心的谴责。' } } },
  3368: { exReplace: { 'どこかで聞いたような台詞だ。': { jp: 'どこかで聞いたような台詞だ。', zh: '这种说法好像在哪儿听过。' } } },
  3369: { exReplace: { '的栏の線。': { jp: '体の線。', zh: '体形。' } } },
  3371: { meaning: '好,善良;和睦,友好;擅长' },
  3373: { meaning: '宣告,宣布' },
  3377: { meaning: '前进,前行', exReplace: { '\\ iangle 前進が見られる。': { jp: '前進が見られる。', zh: '能看到进步。' } } },
  3380: { exReplace: { '\\ iangle 社長に専属する通訳。': { jp: '社長に専属する通訳。', zh: '专属社长的翻译。' } } },
  3382: { meaning: '选定' },
  3389: { kana: 'ぞう', exRemove: ['\\ iangle 退屈な会議にうとうとする。'] },
  3391: { kanji: '艘' },
  3393: { meaning: '汇款' },
  3394: { kana: 'ぞうげん', meaning: '增减' },
  3395: { exRemove: ['倉庫に入れる。'] },
  3397: { exReplace: { '\\ iangle 最悪の状況を想定する。': { jp: '最悪の状況を想定する。', zh: '设想最糟糕的情况。' } } },
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
  3212: { syn: [['根拠', 'こんきょ']] },
  3215: { rel: [['病状', 'びょうじょう']] },
  3217: { syn: [['昇格', 'しょうかく']] },
  3218: { syn: [['招く', 'まねく']] },
  3219: { rel: [['シンボル']] },
  3220: { rel: [['中心', 'ちゅうしん']] },
  3226: { syn: [['熱意', 'ねつい']] },
  3230: { rel: [['火事', 'かじ']] },
  3234: { ant: [['敗北', 'はいぼく']] },
  3235: { syn: [['割愛', 'かつあい']] },
  3250: { rel: [['家族', 'かぞく']] },
  3252: { syn: [['収入', 'しゅうにゅう']] },
  3253: { syn: [['処理', 'しょり']] },
  3256: { ant: [['玄人', 'くろうと']] },
  3259: { ant: [['退化', 'たいか']] },
  3260: { syn: [['侵犯', 'しんぱん']] },
  3262: { rel: [['空気', 'くうき']] },
  3268: { rel: [['地震', 'じしん']] },
  3278: { rel: [['侵略', 'しんりゃく']] },
  3284: { ant: [['早朝', 'そうちょう']] },
  3285: { syn: [['侵攻', 'しんこう']] },
  3286: { rel: [['治療', 'ちりょう']] },
  3287: { rel: [['人間', 'にんげん']] },
  3294: { syn: [['推挙', 'すいきょ']] },
  3299: { rel: [['エッセイ']] },
  3302: { syn: [['助ける', 'たすける']] },
  3304: { ant: [['劣る', 'おとる']] },
  3306: { rel: [['推薦', 'すいせん']] },
  3317: { syn: [['知能', 'ちのう']] },
  3321: { syn: [['終える', 'おえる']] },
  3342: { ant: [['不潔', 'ふけつ']] },
  3345: { rel: [['心', 'こころ']] },
  3349: { syn: [['生産', 'せいさん']] },
  3357: { rel: [['地球', 'ちきゅう']] },
  3362: { syn: [['消滅', 'しょうめつ']] },
  3364: { syn: [['近づく', 'ちかづく']] },
  3379: { ant: [['子孫', 'しそん']] },
  3384: { rel: [['風呂', 'ふろ']] },
  3392: { syn: [['違い', 'ちがい']] },
  3396: { syn: [['設備', 'せつび']] },
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
