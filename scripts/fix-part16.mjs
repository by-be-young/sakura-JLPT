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
  2803: { meaning: '观众席' },
  2804: { exReplace: { '逆転勝利。': { jp: '逆転勝利。', zh: '反败为胜。' } } },
  2805: { meaning: '客观' },
  2808: { meaning: '团伙,暴力团,犯罪集团' },
  2809: { meaning: '露营,野营' },
  2811: { meaning: '救援,救助' },
  2812: { meaning: '停业', exReplace: { '临時休業。': { jp: '臨時休業。', zh: '临时歇业。' } } },
  2814: { meaning: '急剧的' },
  2818: { meaning: '求职,找工作' },
  2821: { exRemove: ['急用(きゅうよう) [ 名]急事。'] },
  2822: { exRemove: ['急用(きゅうよう) [ 名]急事。'] },
  2823: { exReplace: { '3キ口強の魚。': { jp: '3キロ強の魚。', zh: '三公斤多的鱼。' } } },
  2826: { kana: 'ぎょぎょう' },
  2831: { exReplace: { '時間切扎。': { jp: '時間切れ。', zh: '时间到。' } } },
  2832: { exReplace: { '金鱼搁い。': { jp: '金魚すくい。', zh: '捞金鱼游戏。' } } },
  2834: { meaning: '=禁ずる,禁止' },
  2835: { meaning: '金钱,货币' },
  2837: { meaning: '金融' },
  2842: { meaning: '空中,天空,太空中' },
  2844: { kana: 'くぐる' },
  2849: { meaning: '气馁,消沉' },
  2850: { kanji: 'くじ引き' },
  2853: { exReplace: { 'にんけん人 間の屑。': { jp: '人間の屑。', zh: '人渣,无用的人。' } } },
  2855: { exReplace: { 'れつ列が崩れる。': { jp: '列が崩れる。', zh: '队列歪了。' } } },
  2857: { kanji: '砕く' },
  2862: { kana: 'くちばし' },
  2863: { kanji: '口ぶり' },
  2866: { kana: 'くっつく' },
  2867: { kana: 'くっつける' },
  2873: { meaning: '宏大,盛大' },
  2875: { meaning: '发疯,精神失常;弄乱', exReplace: { '暴雨でスケジュールが狂った。': { jp: '豪雨でスケジュールが狂った。', zh: '因暴雨行程被打乱了。' } } },
  2876: { meaning: '使痛苦' },
  2880: { kanji: '銜える/咥える' },
  2881: { exReplace: { '庄力が加わる。': { jp: '圧力が加わる。', zh: '施加压力。' } } },
  2886: { exRemove: ['計50人。'] },
  2888: { kanji: '蛍光灯' },
  2891: { exRemove: ['てんわ。', '携带電話。', 'テラン刑事。', '荷物を携带する。'] },
  2903: { kanji: '傑作', meaning: '杰作,名作' },
  2905: { exRemove: ['元(げん)①[名](中国货币单位)元，人民 币单位。'] },
  2910: { kanji: '厳重' },
  2911: { exReplace: { '原則として許せることではない。': { jp: '原則として許せることではない。', zh: '原则上是不允许的。' } } },
  2912: { exReplace: { '現 地 調 查。': { jp: '現地調査。', zh: '实地调查。' } } },
  2913: { meaning: '县厅,县政府' },
  2914: { exReplace: { '応募資格を限定する。': { jp: '応募資格を限定する。', zh: '限定报名资格。' } } },
  2916: { exReplace: { '力ちあらを 尽くして健闘する。': { jp: '力を尽くして健闘する。', zh: '尽全力去拼搏。' } } },
  2919: { kanji: '現場' },
  2920: { exReplace: { '電子頭微镜。': { jp: '電子顕微鏡。', zh: '电子显微镜。' } } },
  2927: { exReplace: { '故 郷 が 恋Lい。': { jp: '故郷が恋しい。', zh: '故乡令人怀念。' } } },
  2929: { exRemove: ['こうすると。', 'こう言えば。'] },
  2935: { meaning: '后悔' },
  2938: { exReplace: { '好奇心を满たす。': { jp: '好奇心を満たす。', zh: '满足好奇心。' } } },
  2944: { exReplace: { '口座を開<。': { jp: '口座を開く。', zh: '开设账户。' } } },
  2946: { meaning: '后者;后世的人' },
  2951: { exReplace: { '香水の句いがする。': { jp: '香水の匂いがする。', zh: '有香水味。' } } },
  2952: { meaning: '公正,公平' },
  2953: { meaning: '海拔;高度,高级' },
  2954: { kanji: 'コーナー', kana: 'コーナー', meaning: '拐角;柜台,专柜' },
  2956: { exRemove: ['交通機関が混乱する。'] },
  2958: { exReplace: { '興意を静める。': { jp: '興奮を静める。', zh: '使兴奋的心情镇定下来。' } } },
  2964: { exReplace: { '考虑に入れる。': { jp: '考慮に入れる。', zh: '加以考虑。' }, '相手の立場を考慮する。': { jp: '相手の立場を考慮する。', zh: '考虑对方的立场。' } } },
  2967: { meaning: '烧焦,烤糊' },
  2968: { kana: 'ごく', exReplace: { 'そんなことは極当たり前だ。': { jp: 'そんなことはごく当たり前だ。', zh: '那种事情是很普通的。' } } },
  2969: { meaning: '黑板' },
  2976: { meaning: '体会,理解;掌握' },
  2977: { exReplace: { '一人暮らしの祖母が心掛かりだ。': { jp: '一人暮らしの祖母が心掛かりだ。', zh: '很担心独自生活的祖母。' } } },
  2980: { exReplace: { 'お王うき様虫の腰掛に 4.4座 る。': { jp: '王様の腰掛に座る。', zh: '坐上王座。' } } },
  2982: { meaning: '个人的,私人的' },
  2983: { exReplace: { 'う越す。': { jp: '山を越す。', zh: '跨越山口;度过最艰难的时期。' }, '答 :先を越す。': { jp: '先を越す。', zh: '领先。' } } },
  2986: { meaning: '盛宴;款待', exReplace: { '御驰走様でした。': { jp: '御馳走様でした。', zh: '多谢款待。' } } },
  2990: { kana: 'ごっこ' },
  2991: { kanji: '毎', kana: 'ごと' },
  2992: { exReplace: { 'じゅ重うだ大事柄。': { jp: '重大な事柄。', zh: '重要事项。' } } },
  3000: { kana: 'ごぶさた' },
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
  2813: { syn: [['休息', 'きゅうそく']] },
  2816: { syn: [['取り入れる', 'とりいれる']] },
  2829: { ant: [['好む', 'このむ']] },
  2851: { syn: [['文句', 'もんく']] },
  2855: { syn: [['崩壊', 'ほうかい']] },
  2860: { syn: [['つまらない']] },
  2868: { syn: [['リラックス']] },
  2879: { ant: [['素人', 'しろうと']] },
  2882: { syn: [['トレーニング']] },
  2894: { syn: [['続ける', 'つづける']], ant: [['中断', 'ちゅうだん']] },
  2907: { syn: [['限度', 'げんど']] },
  2927: { syn: [['懐かしい', 'なつかしい']] },
  2930: { ant: [['敵意', 'てきい']] },
  2934: { ant: [['安価', 'あんか']] },
  2935: { syn: [['悔いる', 'くいる']] },
  2937: { syn: [['反対', 'はんたい']] },
  2942: { ant: [['防御', 'ぼうぎょ']] },
  2943: { syn: [['寄与', 'きよ']] },
  2952: { ant: [['不公平', 'ふこうへい']] },
  2965: { syn: [['効果', 'こうか']] },
  2970: { syn: [['乗り越える', 'のりこえる']] },
  2974: { syn: [['凍る', 'こおる']] },
  2999: { ant: [['嫌う', 'きらう']] },
  // 相关词 rel
  2805: { rel: [['主観', 'しゅかん']] },
  2811: { rel: [['救助', 'きゅうじょ']] },
  2837: { rel: [['銀行', 'ぎんこう']] },
  2882: { rel: [['練習', 'れんしゅう']] },
  2891: { rel: [['警察', 'けいさつ']] },
  2908: { rel: [['原稿用紙', 'げんこうようし']] },
  2913: { rel: [['都庁', 'とちょう']] },
  2914: { rel: [['制限', 'せいげん']] },
  2948: { rel: [['公共', 'こうきょう']] },
  2951: { rel: [['化粧品', 'けしょうひん']] },
  2963: { rel: [['私立', 'しりつ']] },
  2969: { rel: [['看板', 'かんばん']] },
  2989: { rel: [['料理人', 'りょうにん']] },
  2997: { rel: [['格言', 'かくげん']] },
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
