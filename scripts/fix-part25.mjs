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
  4601: { meaning: '干燥;枯燥' },
  4607: { kana: 'かんばん', exReplace: { '看板を揭げる。': { jp: '看板を掲げる。', zh: '挂招牌。' } } },
  4610: { exReplace: { '準備が完了Lた。': { jp: '準備が完了した。', zh: '准备完成了。' } } },
  4616: { exReplace: { 'ジャマに着替える。': { jp: 'パジャマに着替える。', zh: '换上睡衣。' } } },
  4625: { exReplace: { '企業を起二す。': { jp: '企業を起こす。', zh: '创办企业。' } } },
  4627: { exReplace: { 'き菊くみ見。': { jp: '菊見。', zh: '赏菊。' } } },
  4628: { meaning: '期限' },
  4634: { exReplace: { '傷y^2のついたりんごは安い。': { jp: '傷のついたりんごは安い。', zh: '碰伤的苹果价格便宜。' } } },
  4639: { meaning: '捐赠,捐款' },
  4640: { meaning: '转换心情' },
  4643: { kanji: '気づく', meaning: '注意到,发觉', exRemove: ['決まりを守る。'] },
  4644: { meaning: '咖啡馆' },
  4646: { meaning: '记上,写上', exReplace: { '名前を記人する。': { jp: '名前を記入する。', zh: '填写姓名。' } } },
  4647: { meaning: '(感到)可怜;过意不去' },
  4648: { exRemove: ['急速な進歩を遂げる。'] },
  4656: { meaning: '(教师因故)停课', exRemove: ['大学の教授になる。', '日本語を教授する。'], exReplace: { '午 後 の 講 義 は 休 講 だ。': { jp: '午後の講義は休講だ。', zh: '下午停课。' } } },
  4658: { exReplace: { '共きょう通つうん。': { jp: '共通点。', zh: '共通点。' } } },
  4659: { kana: 'きょうどう' },
  4660: { meaning: '协力,合作' },
  4662: { kana: 'きょか', meaning: '许可,允许' },
  4663: { kana: 'きょく' },
  4665: { kana: 'きょり', meaning: '距离,间隔;差距' },
  4672: { meaning: '禁止吸烟' },
  4674: { meaning: '金额', exReplace: { '莫大な金額に上る。': { jp: '莫大な金額に上る。', zh: '金额巨大。' } } },
  4675: { meaning: '紧急;急迫' },
  4676: { kana: 'きんし' },
  4679: { kanji: '緊張' },
  4691: { kana: 'くちびる' },
  4692: { kanji: '口紅' },
  4693: { kana: 'ぐっすり' },
  4695: { kana: 'くべつ' },
  4696: { exReplace: { '記念品3粗。': { jp: '記念品3組。', zh: '三套纪念品。' } } },
  4701: { meaning: '把……交叉起来;合作', exRemove: ['水を汲む。', 'お茶を汲む。'] },
  4703: { kanji: '悔しがる' },
  4704: { exRemove: ['いまさらく。'] },
  4716: { kanji: '暮れ', kana: 'くれ' },
  4721: { exReplace: { '詳し<報告する。': { jp: '詳しく報告する。', zh: '详细报告。' } } },
  4722: { kana: 'けいい' },
  4725: { kana: 'けいご', exRemove: ['計50人。'] },
  4727: { meaning: '下车', exRemove: ['時間を経济的に使う。'] },
  4728: { exRemove: ['運賃は距離で計算する。', '計算された行動。'] },
  4729: { exReplace: { 'お 化 粧 を す る。': { jp: 'お化粧をする。', zh: '化妆。' } } },
  4730: { exReplace: { '下水在川汇流。': { jp: '下水を川に流す。', zh: '把脏水排到河里。' } } },
  4731: { exRemove: ['経費削減。'] },
  4732: { meaning: '木屐', exReplace: { '下駄を履く(脱<°)。': { jp: '下駄を履く(脱ぐ)。', zh: '穿(脱)木屐。' } } },
  4734: { meaning: '月薪' },
  4735: { meaning: '结局,结果', exReplace: { '結局はお金の問題だ。': { jp: '結局はお金の問題だ。', zh: '归根到底还是钱的问题。' } } },
  4739: { meaning: '事情' },
  4741: { kanji: '謙虚', meaning: '谦和,谦虚' },
  4742: { exReplace: { 'ん金きんの持ち合わせがない。': { jp: '現金の持ち合わせがない。', zh: '手里没有现金。' } } },
  4743: { exReplace: { '学 力 検 查。': { jp: '学力検査。', zh: '学习能力测试。' } } },
  4744: { meaning: '现在,目前', exRemove: ['過去(かこ) [名]以前,过去 未来(みらい) [ 名]未来,将来。'] },
  4748: { kanji: '謙遜', meaning: '谦逊,谦虚' },
  4750: { exReplace: { '校舍を建築する。': { jp: '校舎を建築する。', zh: '建筑校舍。' } } },
  4752: { meaning: '讨论,探讨' },
  4757: { kanji: 'こういう', kana: 'こういう' },
  4759: { meaning: '硬币,金属货币' },
  4760: { kana: 'ごうか' },
  4762: { exReplace: { 'こ公うお害きいを减らす。': { jp: '公害を減らす。', zh: '减少公害。' } } },
  4764: { meaning: '高级,高档' },
  4765: { meaning: '公共' },
  4775: { exReplace: { '机を購人する。': { jp: '机を購入する。', zh: '购买书桌。' } } },
  4776: { meaning: '幸福' },
  4778: { meaning: '项目;条目' },
  4779: { meaning: '效率' },
  4780: { meaning: '交流,往来', exRemove: ['故 郷 を 離 れ る。'] },
  4784: { kanji: 'コーチ', kana: 'コーチ' },
  4789: { meaning: '误解,误会' },
  4795: { kana: 'こづかい' },
  4796: { exReplace: { '骨折して歩けない。': { jp: '骨折して歩けない。', zh: '骨折了,不能走路。' } } },
  4797: { kanji: 'こっそり', kana: 'こっそり' },
  4798: { kana: 'こづつみ' },
  4799: { meaning: '预先通知;谢绝', exReplace: { 'ち ゅ う注文も二 と断わる。': { jp: '注文を断わる。', zh: '谢绝订货。' } } },
  4800: { meaning: '粉,粉末' },
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
  4601: { ant: [['湿潤', 'しつじゅん']] },
  4602: { rel: [['意見', 'いけん']] },
  4605: { rel: [['指導', 'しどう']] },
  4606: { rel: [['祝杯', 'しゅくはい']] },
  4608: { syn: [['看護', 'かんご']] },
  4609: { syn: [['管轄', 'かんかつ']] },
  4610: { syn: [['終了', 'しゅうりょう']] },
  4614: { rel: [['思い出', 'おもいで']] },
  4615: { rel: [['温度', 'おんど']] },
  4618: { syn: [['計画', 'けいかく']] },
  4619: { syn: [['期限', 'きげん']] },
  4621: { syn: [['尋ね直す', 'たずねなおす']] },
  4623: { syn: [['聞き分ける', 'ききわける']] },
  4625: { rel: [['会社', 'かいしゃ']] },
  4626: { rel: [['利く', 'きく']] },
  4629: { syn: [['気分', 'きぶん']] },
  4630: { syn: [['彫る', 'ほる']] },
  4631: { rel: [['布', 'ぬの']] },
  4634: { syn: [['傷跡', 'きずあと']] },
  4635: { syn: [['基盤', 'きばん']] },
  4636: { syn: [['予想', 'よそう']] },
  4639: { syn: [['寄贈', 'きぞう']] },
  4643: { syn: [['察知する', 'さっちする']] },
  4646: { syn: [['記載', 'きさい']] },
  4647: { syn: [['かわいそう']] },
  4654: { syn: [['休み', 'やすみ']] },
  4656: { ant: [['開講', 'かいこう']] },
  4657: { syn: [['力説', 'りきせつ']] },
  4658: { ant: [['相違', 'そうい']] },
  4659: { syn: [['協同', 'きょうどう']] },
  4660: { syn: [['協同', 'きょうどう']] },
  4661: { rel: [['列', 'れつ']] },
  4662: { syn: [['承認', 'しょうにん']], ant: [['禁止', 'きんし']] },
  4664: { ant: [['微小', 'びしょう']] },
  4665: { rel: [['間隔', 'かんかく']] },
  4668: { rel: [['雲', 'くも']] },
  4670: { syn: [['記述', 'きじゅつ']] },
  4671: { syn: [['討論', 'とうろん']] },
  4672: { ant: [['喫煙', 'きつえん']] },
  4675: { syn: [['差し迫る', 'さしせまる']] },
  4676: { ant: [['許可', 'きょか']] },
  4677: { rel: [['鉄', 'てつ']] },
  4678: { ant: [['古代', 'こだい']] },
  4679: { rel: [['リラックス']] },
  4681: { ant: [['怠惰', 'たいだ']] },
  4682: { syn: [['勤め', 'つとめ']] },
  4684: { syn: [['朽ちる', 'くちる']] },
  4686: { syn: [['壊す', 'こわす']] },
  4689: { syn: [['割れる', 'われる']] },
  4690: { ant: [['上る', 'のぼる']] },
  4694: { syn: [['しつこい']] },
  4695: { syn: [['分別', 'ふんべつ']] },
  4698: { syn: [['結合', 'けつごう']] },
  4699: { syn: [['組み上げる', 'くみあげる']] },
  4700: { syn: [['掬う', 'すくう']] },
  4702: { syn: [['無念', 'むねん']] },
  4704: { syn: [['後悔', 'こうかい']] },
  4712: { syn: [['反復', 'はんぷく']] },
  4714: { ant: [['楽', 'らく']] },
  4715: { ant: [['楽しむ', 'たのしむ']] },
  4717: { ant: [['明ける', 'あける']] },
  4718: { syn: [['辛労', 'しんろう']] },
  4719: { ant: [['赤字', 'あかじ']] },
  4720: { syn: [['足す', 'たす']] },
  4721: { syn: [['精通する', 'せいつうする']] },
  4723: { rel: [['経済', 'けいざい']] },
  4724: { syn: [['練習', 'れんしゅう']] },
  4729: { rel: [['メイク']] },
  4731: { syn: [['削減する', 'さくげんする']] },
  4733: { rel: [['血', 'ち']] },
  4734: { rel: [['給料', 'きゅうりょう']] },
  4735: { syn: [['要するに', 'ようするに']] },
  4736: { syn: [['決意', 'けつい']] },
  4738: { rel: [['足', 'あし']] },
  4740: { rel: [['チケット']] },
  4742: { rel: [['お金', 'おかね']] },
  4743: { syn: [['点検', 'てんけん']] },
  4744: { ant: [['過去', 'かこ']] },
  4745: { ant: [['理想', 'りそう']] },
  4747: { syn: [['現況', 'げんきょう']] },
  4749: { rel: [['近代', 'きんだい']] },
  4750: { syn: [['建設', 'けんせつ']] },
  4752: { syn: [['考究', 'こうきゅう']] },
  4754: { ant: [['薄い', 'うすい']] },
  4755: { rel: [['恋愛', 'れんあい']] },
  4758: { syn: [['効き目', 'ききめ']] },
  4761: { ant: [['非公開', 'ひこうかい']] },
  4764: { ant: [['低級', 'ていきゅう']] },
  4768: { syn: [['総計', 'そうけい']] },
  4770: { syn: [['構造', 'こうぞう']] },
  4773: { syn: [['行為', 'こうい']] },
  4774: { rel: [['犯罪', 'はんざい']] },
  4775: { syn: [['購買', 'こうばい']] },
  4776: { syn: [['幸せ', 'しあわせ']] },
  4777: { syn: [['公正', 'こうせい']] },
  4779: { rel: [['能率', 'のうりつ']] },
  4780: { syn: [['往来', 'おうらい']] },
  4782: { syn: [['超える', 'こえる']] },
  4787: { syn: [['凍結', 'とうけつ']] },
  4789: { syn: [['思い違い', 'おもいちがい']] },
  4791: { ant: [['集団', 'しゅうだん']] },
  4792: { syn: [['摩擦する', 'まさつする']] },
  4793: { rel: [['性格', 'せいかく']] },
  4794: { ant: [['液体', 'えきたい']] },
  4795: { rel: [['お金', 'おかね']] },
  4796: { rel: [['怪我', 'けが']] },
  4799: { syn: [['拒否する', 'きょひする']] },
  4800: { rel: [['粉末', 'ふんまつ']] },
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
