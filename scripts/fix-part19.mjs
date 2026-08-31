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
  3402: { exReplace: { '名残惜し<送别する。': { jp: '名残惜しく送別する。', zh: '依依不舍地送别。' } } },
  3406: { kana: 'ぞくする', meaning: '属于' },
  3414: { exReplace: { '\\ iangle 万が一の時に備える。': { jp: '万が一の時に備える。', zh: '以防万一。' } } },
  3417: { exReplace: { '橇に乘る。': { jp: '橇に乗る。', zh: '乘坐雪橇。' } } },
  3420: { exReplace: { '美 人 い。': { jp: '美人揃い。', zh: '都是美女。' }, '傑作揃い。': { jp: '傑作揃い。', zh: '清一色都是杰作。' } } },
  3422: { kana: 'そろばん' },
  3428: { exReplace: { '\\ iangle3 对1で勝つ。': { jp: '3対1で勝つ。', zh: '以三比一的比分获胜。' } } },
  3430: { exReplace: { 'し手ゆ しつ 台。': { jp: '手術台。', zh: '手术台。' } } },
  3431: { kana: 'たいしょ', exRemove: ['3台の車。'] },
  3432: { kana: 'たいしょう' },
  3434: { exRemove: ['中途退学する。'], exReplace: { '経けいえ営い の体制を立て直す。': { jp: '経営の体制を立て直す。', zh: '重整经营体制。' } } },
  3440: { exReplace: { '詩 集 の 题 名。': { jp: '詩集の題名。', zh: '诗集的名称。' } } },
  3441: { meaning: '轮胎,车胎' },
  3451: { exReplace: { '子ともを抱き締める。': { jp: '子供を抱き締める。', zh: '抱紧孩子。' } } },
  3452: { kanji: '炊く', exRemove: ['先生のお宅。'] },
  3454: { exReplace: { '金きんんの出し入れ。': { jp: '金の出し入れ。', zh: '存钱取钱。' } } },
  3455: { exReplace: { 'あれは確か5年前のことでした。': { jp: 'あれは確か5年前のことでした。', zh: '那大约是五年前的事了。' } } },
  3457: { meaning: '多数,多数人' },
  3459: { exReplace: { '言葉遣いが正しい。': { jp: '言葉遣いが正しい。', zh: '用语正确。' } } },
  3461: { kanji: '畳', meaning: '榻榻米,日式地板' },
  3464: { exReplace: { '諥かに呼ばれて立ち止まる。': { jp: '誰かに呼ばれて立ち止まる。', zh: '被人叫住而止步。' } } },
  3468: { meaning: '(幼儿语)抱' },
  3476: { exReplace: { '他人扱い。': { jp: '他人扱い。', zh: '当外人对待、看待。' } } },
  3479: { exReplace: { '容束。': { jp: '花束。', zh: '花束。' } } },
  3482: { meaning: '屡屡,多次' },
  3483: { exReplace: { '多忙な每日を送る。': { jp: '多忙な毎日を送る。', zh: '每天都过得非常忙碌。' } } },
  3486: { meaning: '叹气,长吁短叹' },
  3487: { meaning: '尝试,试验', exRemove: ['いのち 2 5。', '誰しも命は惜しい。', '誰しも愛する人と別れたくはない。'] },
  3490: { meaning: '依靠,倚仗' },
  3491: { exRemove: ['文章をいくつかの段に分ける。'] },
  3495: { exReplace: { '単純な考之。': { jp: '単純な考え。', zh: '天真的想法。' } } },
  3496: { exReplace: { '诞生日。': { jp: '誕生日。', zh: '生日。' } } },
  3498: { meaning: '淡水' },
  3500: { kanji: '単調', exReplace: { '单調な生活が続<。': { jp: '単調な生活が続く。', zh: '持续单调的生活。' } } },
  3501: { exReplace: { '单なるうわさに過ぎない。': { jp: '単なるうわさに過ぎない。', zh: '只不过是流言蜚语。' } } },
  3502: { kana: 'たんぺん' },
  3505: { meaning: '发誓,宣誓' },
  3509: { kanji: '力づく' },
  3510: { kanji: '力づける' },
  3517: { kanji: '縮まる', kana: 'ちぢまる' },
  3526: { exReplace: { '中間テス卜。': { jp: '中間テスト。', zh: '期中考试。' } } },
  3527: { meaning: '忠告,劝告', exRemove: ['防衞庁。'] },
  3530: { meaning: '长与短;长短处,优点缺点' },
  3531: { kana: 'ちょうふく' },
  3532: { meaning: '不久;紧接在......之后' },
  3534: { meaning: '直接接通' },
  3535: { meaning: '直流' },
  3536: { meaning: '储藏,储存' },
  3537: { exReplace: { '直角三きんか角くけ形い。': { jp: '直角三角形。', zh: '直角三角形。' } } },
  3543: { kanji: '賃', exReplace: { '家赁。': { jp: '家賃。', zh: '房租。' } } },
  3557: { exReplace: { '社 会に 尽く す。': { jp: '社会に尽くす。', zh: '为社会效力。' } } },
  3559: { exReplace: { '中着慧を着ける。': { jp: '水着を着ける。', zh: '穿上泳衣。' } } },
  3560: { exReplace: { 'ラジ才を点ける。': { jp: 'ラジオを点ける。', zh: '打开收音机。' } } },
  3561: { exReplace: { '綿棒をアルコールに浸ける。': { jp: '綿棒をアルコールに浸ける。', zh: '把棉棒浸入酒精中。' } } },
  3563: { meaning: '闯入;深入;扎入;追究;干预' },
  3564: { kana: 'つつみ' },
  3567: { exReplace: { 'ほうえ貿易きが会いい社しに勤める。': { jp: '貿易会社に勤める。', zh: '在贸易公司上班。' } } },
  3569: { exReplace: { 'けきうに努める。': { jp: '研究に努める。', zh: '致力于研究。' } } },
  3570: { exRemove: ['注:成为冠军。', '花を摘む。'] },
  3571: { exReplace: { 'すん寸ほ法う を詰める。': { jp: '寸法を詰める。', zh: '缩小尺寸。' }, 'せい生かい活つひ費を詰める。': { jp: '生活費を詰める。', zh: '节省生活费。' } } },
  3572: { exRemove: ['常 重要。'], exReplace: { '啼雪者 が積もる。': { jp: '雪が積もる。', zh: '积雪。' }, 'つ月き ひ日が積もる。': { jp: '月日が積もる。', zh: '日积月累。' } } },
  3573: { exReplace: { '孙いて艶を出す。': { jp: '磨いて艶を出す。', zh: '磨亮,磨出光泽。' } } },
  3578: { kanji: '釣り', meaning: '钓鱼;找零的钱' },
  3579: { kanji: '釣り合う', exReplace: { '収入と支出が釣り合う。': { jp: '収入と支出が釣り合う。', zh: '收入与支出保持平衡。' } } },
  3586: { exReplace: { '火曜を定休日にする。': { jp: '火曜を定休日にする。', zh: '将星期二定为定期休息日。' } } },
  3588: { exReplace: { 'パーに抵抗がある。': { jp: 'バーに抵抗がある。', zh: '对酒吧有些反感。' } } },
  3591: { exReplace: { '手怪な食事。': { jp: '手軽な食事。', zh: '便饭。' } } },
  3595: { meaning: '适用,应用' },
  3598: { exReplace: { '弟子人り。': { jp: '弟子入り。', zh: '当徒弟,拜师。' } } },
  3599: { meaning: '数码相机' },
  3600: { meaning: '戏法,魔术;鬼把戏' },
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
  3402: { syn: [['見送り', 'みおくり']] },
  3408: { syn: [['測量', 'そくりょう']] },
  3409: { syn: [['測定', 'そくてい']] },
  3411: { rel: [['団体', 'だんたい']] },
  3413: { syn: [['正直', 'しょうじき']] },
  3414: { syn: [['準備する', 'じゅんびする']] },
  3424: { syn: [['損傷', 'そんしょう']] },
  3425: { syn: [['損害', 'そんがい']] },
  3426: { ant: [['軽視', 'けいし']] },
  3427: { rel: [['利益', 'りえき']] },
  3434: { rel: [['制度', 'せいど']] },
  3439: { syn: [['捕まえる', 'つかまえる']] },
  3444: { syn: [['代わり', 'かわり']] },
  3445: { ant: [['協調', 'きょうちょう']] },
  3447: { ant: [['続く', 'つづく']] },
  3453: { syn: [['貯める', 'ためる']] },
  3457: { ant: [['少数', 'しょうすう']] },
  3471: { syn: [['果たす', 'はたす']] },
  3475: { syn: [['適切', 'てきせつ']] },
  3489: { syn: [['維持する', 'いじする']] },
  3493: { rel: [['鉱山', 'こうざん']] },
  3494: { ant: [['延長', 'えんちょう']] },
  3495: { ant: [['複雑', 'ふくざつ']] },
  3508: { rel: [['道', 'みち']] },
  3518: { syn: [['規律', 'きりつ']] },
  3527: { syn: [['助言', 'じょげん']] },
  3529: { ant: [['未満', 'みまん']] },
  3534: { rel: [['直行', 'ちょっこう']] },
  3536: { syn: [['保存', 'ほぞん']] },
  3544: { syn: [['付け加える', 'つけくわえる']] },
  3545: { syn: [['追及', 'ついきゅう']] },
  3548: { rel: [['交通', 'こうつう']] },
  3556: { rel: [['続く', 'つづく']] },
  3570: { rel: [['縄', 'なわ']] },
  3575: { ant: [['弱まる', 'よわまる']] },
  3577: { ant: [['弱める', 'よわめる']] },
  3584: { ant: [['上昇', 'じょうしょう']] },
  3587: { syn: [['供給', 'きょうきゅう']] },
  3595: { syn: [['応用', 'おうよう']] },
  3598: { rel: [['師匠', 'ししょう']] },
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
