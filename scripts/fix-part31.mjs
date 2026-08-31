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
  5805: { pitch: '⓪' },
  5806: { pitch: '③/④' },
  5808: { kana: 'やわらか' },
  5809: { kanji: '誘拐' },
  5810: { exReplace: { '与 恋気を出す。': { jp: '勇気を出す。', zh: '拿出勇气。' } } },
  5812: { meaning: '有效' },
  5814: { meaning: '冠军;优胜' },
  5817: { meaning: '邮政,邮件', exAppend: [{ jp: '郵便を出す。', zh: '寄信。' }] },
  5818: { pitch: '③' },
  5819: { kana: 'ゆうめいじん', pitch: '③/⓪' },
  5820: { meaning: '收费' },
  5822: { pitch: '①' },
  5824: { pitch: '③' },
  5825: { meaning: '做梦', pitch: '④/③' },
  5826: { pitch: '⓪' },
  5827: { exReplace: { 'ズポンが緩い。': { jp: 'ズボンが緩い。', zh: '裤子肥大。' } } },
  5828: { pitch: '③' },
  5831: { meaning: '要求;需要' },
  5836: { kana: 'よくねん' },
  5837: { meaning: '贪婪,贪得无厌', exReplace: { '上< 14欲張 りな人。': { jp: '欲張りな人。', zh: '贪得无厌的人。' } } },
  5838: { exReplace: { '欲望を满たす(抑える)。': { jp: '欲望を満たす(抑える)。', zh: '满足(抑制)欲望。' } } },
  5839: { meaning: '横穿', exReplace: { '横 断 歩 道 を 横 切 る。': { jp: '横断歩道を横切る。', zh: '横穿马路。' }, '川 を 横 切 る。': { jp: '川を横切る。', zh: '过河。' } } },
  5841: { exReplace: { '\\ iangle 旅行の予算を立てる。': { jp: '旅行の予算を立てる。', zh: '做旅游的预算。' } } },
  5842: { meaning: '(自)靠近;(他)使靠近;聚集;寄身,寄居' },
  5844: { meaning: '出乎预料', exReplace: { '予 想 外 の 大 成 功。': { jp: '予想外の大成功。', zh: '出乎意料的巨大成功。' } } },
  5845: { exReplace: { '\\ iangle 経済の動向を予測する。': { jp: '経済の動向を予測する。', zh: '预测经济的动向。' } } },
  5846: { kana: 'よぞら' },
  5847: { meaning: '口水' },
  5849: { pitch: '⓪' },
  5850: { meaning: '叫法,称呼的方法' },
  5851: { meaning: '读物', exReplace: { '高 校 生 向 き の 読 み 物。': { jp: '高校生向きの読み物。', zh: '适合于高中生的读物。' } } },
  5852: { pitch: '⓪' },
  5853: { meaning: '令人高兴,可喜', exReplace: { '喜 ばLい二一 ス。': { jp: '喜ばしいニュース。', zh: '令人高兴的消息。' } } },
  5855: { meaning: '弱点,短处' },
  5856: { kana: 'りかい' },
  5858: { pitch: '⓪' },
  5861: { meaning: '……率', exReplace: { '出 勤 率。': { jp: '出勤率。', zh: '出勤率。' }, '合こうく率り合格率。': { jp: '合格率。', zh: '合格率。' } } },
  5862: { pitch: '③' },
  5863: { kana: 'リボン' },
  5866: { kanji: '両~', exReplace: { '商国。': { jp: '両国。', zh: '两国。' } } },
  5868: { kanji: '両足' },
  5869: { kanji: '両者' },
  5871: { kanji: '両手' },
  5872: { meaning: '日式旅馆' },
  5873: { meaning: '绿茶' },
  5874: { kana: 'りれきしょ' },
  5877: { exRemove: ['れいかいひと。'] },
  5878: { exRemove: ['れいぎただひと。'] },
  5880: { pitch: '⓪' },
  5881: { pitch: '⓪' },
  5886: { kana: 'レベル' },
  5890: { meaning: '(量词)只,羽', exReplace: { '月の輪。': { jp: '兎が三羽いる。', zh: '有三只兔子。' } } },
  5892: { pitch: '③/⓪' },
  5895: { meaning: '分离;告别', exReplace: { 'わか別れを告げる。': { jp: '別れを告げる。', zh: '告别。' } } },
  5899: { pitch: '③' },
  5900: { pitch: '⓪' },
  5902: { pitch: '③' },
  5904: { meaning: '折扣,减价', exReplace: { '2割引で壳る。': { jp: '2割引で売る。', zh: '打八折出售。' } } },
  5905: { meaning: '坏话,说人坏话', exReplace: { 'とわのる 悪くち口を言いう。': { jp: '悪口を言う。', zh: '说别人的坏话。' } } },
  5906: { exRemove: ['悪 者 小 說。'] },
  5911: { kana: 'あいさつ', meaning: '寒暄语;致辞' },
  5916: { exReplace: { 'わいい赤ちん。': { jp: '可愛い赤ちゃん。', zh: '可爱的婴儿。' } } },
  5918: { kana: 'あかんぼう' },
  5920: { kanji: '挙げる', pitch: '⓪', meaning: '举例,列举;举行(仪式)', exReplace: { 'し挙あげる。': { jp: '例を挙げる。', zh: '举例。' }, 'そ卒つ 業きょ式うし挙げる。': { jp: '卒業式を挙げる。', zh: '举行毕业典礼。' } } },
  5921: { meaning: '憧憬,向往', exReplace: { 'の 人輩はい。': { jp: '憧れを抱く。', zh: '抱有憧憬。' } } },
  5922: { exRemove: ['あき浅い い色浅色。'] },
  5923: { meaning: '味道' },
  5925: { kana: 'あす/あした', meaning: '明天;将来' },
  5926: { meaning: '玩耍,游玩' },
  5927: { meaning: '弄热,温热;弄暖,使暖和' },
  5928: { meaning: '附近,周围;每……', exReplace: { '世ん文千円んあ辺たり。': { jp: '1000円あたり。', zh: '一千日元左右。' } } },
  5930: { kana: 'あちらこちら', pitch: '④' },
  5931: { exReplace: { 'あ厚つい1本5人。': { jp: '厚い本。', zh: '厚的书。' } } },
  5932: { meaning: '热', exReplace: { '今 年 の 夏 は 特 に 暑。': { jp: '今年の夏は特に暑い。', zh: '今年的夏天尤其的热。' } } },
  5933: { kana: 'あっちこっち', pitch: '③/④' },
  5936: { meaning: '撞,碰;使紧贴;猜;晒', exReplace: { '公式に当て嵌める。': { jp: '答えを当てる。', zh: '猜中答案。' } } },
  5938: { kanji: '', kana: 'アニメ' },
  5940: { pitch: '③' },
  5943: { meaning: '编织;编辑', exReplace: { '\\ iangle 毛糸でセーターを編む。': { jp: '毛糸でセーターを編む。', zh: '用毛线织毛衣。' } } },
  5951: { kana: 'あれえ' },
  5952: { kana: 'あれっ' },
  5956: { meaning: '向导,陪同参观;指南;邀请', pitch: '③' },
  5959: { kana: 'いかが' },
  5961: { kana: 'いきさき', meaning: '目的地,去处' },
  5964: { meaning: '多少钱,多少' },
  5966: { pitch: '①' },
  5967: { exReplace: { '文化遣産。': { jp: '文化遺産。', zh: '文化遗产。' } } },
  5968: { meaning: '上述,以上;更,再' },
  5971: { meaning: '至,到,到达', exReplace: { '霊長類動物の 一 種。': { jp: '至る所。', zh: '到处。' } } },
  5972: { pitch: '③' },
  5976: { exReplace: { 'け健んこ康う をのる。': { jp: '健康を祈る。', zh: '祝愿健康。' } } },
  5977: { kanji: '今すぐ', kana: 'いますぐ', meaning: '马上,立刻', exReplace: { 'いつでも音楽が楽しめる。': { jp: '今すぐ行く。', zh: '马上去。' } } },
  5978: { meaning: '至今,至今仍然', examples: [{ jp: '今でも忘れない。', zh: '至今仍忘不了。' }] },
  5983: { kana: 'いん' },
  5985: { kanji: '動く', meaning: '动;开动,运行;改变,变化;行动;感动', exReplace: { 'エンジンが動いてくる。': { jp: 'エンジンが動く。', zh: '发动机运转起来。' } } },
  5987: { kana: 'うそ' },
  5989: { exReplace: { '美 し い 花。': { jp: '美しい花。', zh: '漂亮的花儿。' } } },
  5990: { meaning: '拍照片,临摹' },
  5991: { exReplace: { '話题を移す。': { jp: '話題を移す。', zh: '转移话题。' } } },
  5995: { kana: 'うで' },
  5998: { kanji: '裏', pitch: '⓪' },
  6000: { pitch: '④', meaning: '高兴的,喜悦的' },
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
  5805: { rel: [['交換', 'こうかん']] },
  5808: { ant: [['硬い', 'かたい']] },
  5809: { rel: [['誘拐犯', 'ゆうかいはん']] },
  5810: { syn: [['勇ましい', 'いさましい']] },
  5812: { ant: [['無効', 'むこう']] },
  5813: { ant: [['劣等', 'れっとう']] },
  5816: { rel: [['にわか雨']] },
  5817: { rel: [['切手', 'きって']] },
  5819: { rel: [['有名', 'ゆうめい']] },
  5820: { ant: [['無料', 'むりょう']] },
  5823: { ant: [['貧しい', 'まずしい']] },
  5824: { rel: [['指', 'ゆび']] },
  5825: { rel: [['夢', 'ゆめ']] },
  5826: { syn: [['起源', 'きげん']] },
  5827: { ant: [['きつい']] },
  5828: { ant: [['夕暮れ', 'ゆうぐれ']] },
  5829: { rel: [['酔っ払い', 'よっぱらい']] },
  5831: { syn: [['需要', 'じゅよう']] },
  5832: { rel: [['子供', 'こども']] },
  5835: { syn: [['やっと']] },
  5836: { ant: [['前年', 'ぜんねん']] },
  5837: { rel: [['欲', 'よく']] },
  5838: { syn: [['欲求', 'よっきゅう']] },
  5839: { syn: [['横断', 'おうだん']] },
  5840: { ant: [['綺麗にする', 'きれいにする']] },
  5842: { ant: [['離す', 'はなす']] },
  5843: { syn: [['予測', 'よそく']] },
  5845: { syn: [['予想', 'よそう']] },
  5846: { rel: [['空', 'そら']] },
  5848: { rel: [['酔う', 'よう']] },
  5849: { rel: [['予定表', 'よていひょう']] },
  5850: { syn: [['呼び名', 'よびな']] },
  5852: { rel: [['婿', 'むこ']] },
  5853: { syn: [['嬉しい', 'うれしい']] },
  5854: { syn: [['快く', 'こころよく']] },
  5855: { ant: [['強み', 'つよみ']] },
  5856: { syn: [['了解', 'りょうかい']] },
  5857: { syn: [['賢い', 'かしこい']] },
  5858: { ant: [['結婚', 'けっこん']] },
  5859: { rel: [['来店者', 'らいてんしゃ']] },
  5860: { syn: [['一覧', 'いちらん']] },
  5863: { rel: [['ヘアピン']] },
  5865: { syn: [['はやる']] },
  5867: { syn: [['分量', 'ぶんりょう']] },
  5870: { rel: [['レシート']] },
  5872: { rel: [['ホテル']] },
  5873: { rel: [['紅茶', 'こうちゃ']] },
  5874: { rel: [['職歴', 'しょくれき']] },
  5876: { rel: [['留守', 'るす']] },
  5878: { syn: [['作法', 'さほう']] },
  5879: { rel: [['点数', 'てんすう']] },
  5880: { rel: [['温度', 'おんど']] },
  5881: { ant: [['解凍', 'かいとう']] },
  5882: { syn: [['領収書', 'りょうしゅうしょ']] },
  5884: { rel: [['電車', 'でんしゃ']] },
  5885: { rel: [['島', 'しま']] },
  5886: { syn: [['水準', 'すいじゅん']] },
  5887: { rel: [['恋', 'こい']] },
  5888: { syn: [['毎日', 'まいにち']] },
  5892: { rel: [['菓子', 'かし']] },
  5893: { syn: [['自分勝手', 'じぶんかって']] },
  5894: { rel: [['若い', 'わかい']] },
  5895: { ant: [['出会い', 'であい']] },
  5896: { syn: [['故意', 'こい']] },
  5897: { ant: [['洋室', 'ようしつ']] },
  5898: { ant: [['洋食', 'ようしょく']] },
  5900: { rel: [['話', 'はなし']] },
  5901: { rel: [['笑う', 'わらう']] },
  5902: { rel: [['割る', 'わる']] },
  5903: { syn: [['割と', 'わりと']] },
  5904: { rel: [['値引き', 'ねびき']] },
  5905: { syn: [['陰口', 'かげぐち']] },
  5906: { ant: [['善人', 'ぜんにん']] },
  5907: { syn: [['私たち', 'わたしたち']] },
  5909: { syn: [['愛情', 'あいじょう']] },
  5910: { rel: [['犬', 'いぬ']] },
  5911: { rel: [['会釈', 'えしゃく']] },
  5912: { rel: [['間隔', 'かんかく']] },
  5914: { rel: [['出会う', 'であう']] },
  5915: { rel: [['空', 'そら']] },
  5916: { rel: [['赤ん坊', 'あかんぼう']] },
  5917: { ant: [['下がる', 'さがる']] },
  5918: { rel: [['赤ちゃん', 'あかちゃん']] },
  5919: { rel: [['装飾品', 'そうしょくひん']] },
  5920: { rel: [['例', 'れい']] },
  5921: { syn: [['あこがれる']] },
  5922: { ant: [['深い', 'ふかい']] },
  5923: { rel: [['味覚', 'みかく']] },
  5924: { rel: [['大陸', 'たいりく']] },
  5925: { ant: [['昨日', 'きのう']] },
  5926: { rel: [['遊ぶ', 'あそぶ']] },
  5927: { ant: [['冷ます', 'さます']] },
  5928: { rel: [['周り', 'まわり']] },
  5929: { syn: [['方々', 'かたがた']] },
  5930: { syn: [['あちこち']] },
  5931: { ant: [['薄い', 'うすい']] },
  5932: { ant: [['寒い', 'さむい']] },
  5933: { syn: [['あちこち']] },
  5934: { ant: [['散らばる', 'ちらばる']] },
  5935: { ant: [['散らす', 'ちらす']] },
  5936: { rel: [['当たる', 'あたる']] },
  5937: { rel: [['放送', 'ほうそう']] },
  5938: { rel: [['アニメーション']] },
  5940: { syn: [['あのような']] },
  5941: { rel: [['大陸', 'たいりく']] },
  5942: { rel: [['編む', 'あむ']] },
  5943: { rel: [['編み物', 'あみもの']] },
  5944: { rel: [['米国', 'べいこく']] },
  5945: { syn: [['謝罪する', 'しゃざいする']] },
  5947: { syn: [['警報', 'けいほう']] },
  5949: { syn: [['バイト']] },
  5953: { ant: [['不安', 'ふあん']] },
  5954: { syn: [['シートベルト']] },
  5956: { rel: [['案内状', 'あんないじょう']] },
  5957: { ant: [['こんなに']] },
  5958: { ant: [['以内', 'いない']] },
  5959: { syn: [['どう']] },
  5960: { rel: [['医療', 'いりょう']] },
  5961: { syn: [['目的地', 'もくてきち']] },
  5962: { ant: [['死ぬ', 'しぬ']] },
  5964: { rel: [['いくらか']] },
  5966: { syn: [['考え', 'かんがえ']] },
  5967: { rel: [['文化遺産', 'ぶんかいさん']] },
  5968: { ant: [['以下', 'いか']] },
  5969: { rel: [['いたします']] },
  5970: { rel: [['もらう']] },
  5971: { syn: [['達する', 'たっする']] },
  5976: { syn: [['願う', 'ねがう']] },
  5977: { syn: [['すぐ']] },
  5979: { syn: [['意義', 'いぎ']] },
  5981: { syn: [['必要', 'ひつよう']] },
  5982: { ant: [['出す', 'だす']] },
  5984: { rel: [['受付', 'うけつけ']] },
  5985: { ant: [['止まる', 'とまる']] },
  5986: { rel: [['ウサギ']] },
  5987: { ant: [['本当', 'ほんとう']] },
  5988: { ant: [['外側', 'そとがわ']] },
  5989: { syn: [['綺麗', 'きれい']] },
  5990: { rel: [['写真', 'しゃしん']] },
  5991: { rel: [['移動', 'いどう']] },
  5992: { syn: [['見とれる', 'みとれる']] },
  5993: { rel: [['映る', 'うつる']] },
  5994: { rel: [['移動', 'いどう']] },
  5995: { rel: [['腕前', 'うでまえ']] },
  5996: { rel: [['馬車', 'ばしゃ']] },
  5997: { syn: [['美味しい', 'おいしい']] },
  5998: { ant: [['表', 'おもて']] },
  5999: { rel: [['売る', 'うる']] },
  6000: { syn: [['喜ばしい', 'よろこばしい']] },
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
