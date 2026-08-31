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
  4801: { kanji: 'この間' },
  4803: { kanji: '零す', kana: 'こぼす', exRemove: ['惯 用。'], exReplace: { '愚痴を零寸。': { jp: '愚痴を零す。', zh: '发牢骚。' } } },
  4806: { kanji: 'ゴム', kana: 'ゴム' },
  4807: { kana: 'こむぎ', meaning: '小麦' },
  4814: { kanji: 'コンセント', kana: 'コンセント' },
  4816: { exRemove: ['财産を築く。'] },
  4825: { meaning: '幸运;幸亏' },
  4826: { meaning: '签名;信号,暗号' },
  4827: { exRemove: ['志力 b はくし咇。'] },
  4828: { meaning: '……地点,目的地' },
  4829: { exRemove: ['ვვ先ვვვვ々で 力2人194歓迎2された。'] },
  4830: { exRemove: ['作業を始める。'] },
  4832: { kana: 'さくじつ' },
  4834: { exReplace: { 'けいか計画くし書上をきくせ作成いする。': { jp: '計画書を作成する。', zh: '拟订计划书。' } } },
  4839: { kanji: '挿す', exReplace: { '花 瓶 に 花 を 挿 す。': { jp: '花瓶に花を挿す。', zh: '把花插在花瓶里面。' } } },
  4844: { meaning: '马上,立刻;迅速' },
  4845: { kana: 'さべつ' },
  4846: { kanji: 'サボる', kana: 'サボる' },
  4848: { meaning: '(身上)寒气,发冷' },
  4854: { kana: 'さんかくけい' },
  4858: { exReplace: { '算数が暗い。': { jp: '算数が苦手だ。', zh: '不擅长算术。' } } },
  4860: { kanji: '', kana: 'サンプル' },
  4861: { exReplace: { 'あの 仕事はもう仕上がっている。': { jp: 'あの仕事はもう仕上がっている。', zh: '那件工作已经做完了。' } } },
  4867: { meaning: '咸' },
  4870: { kana: 'じじつ', meaning: '事实,真相' },
  4872: { meaning: '时期,时候;季节', exRemove: ['支 出 が多い。'] },
  4874: { exRemove: ['事情を詳しく説明する。', '事情があって欠席する。'] },
  4879: { pitch: [0], exRemove: ['あらっこ もつ背上う じっしゃかい はい。'] },
  4882: { kana: 'しちゃく' },
  4883: { meaning: '质量;品质' },
  4884: { meaning: '真实感(到)' },
  4885: { exRemove: ['じっせいかつ やくだ。'] },
  4886: { kana: 'じっけん' },
  4887: { exRemove: ['慣 用。', '尻尾を出す。', '尻尾を掴む。'] },
  4888: { meaning: '失望', exReplace: { '颜に失望の色が見えた。': { jp: '顔に失望の色が見えた。', zh: '脸上露出失望的神色。' } } },
  4895: { exRemove: ['品(しな) [ 名]物品;商品,货物;质量 品物(しなもの) [ 名]东西,物品;商品, 货品。'] },
  4897: { meaning: '起点;头班车' },
  4898: { meaning: '草坪,矮草地' },
  4899: { meaning: '支付,付款' },
  4900: { kanji: '縛る' },
  4902: { meaning: '死亡' },
  4903: { exReplace: { 'き牛ゆう乳にゆをう絞しばる。': { jp: '牛乳を絞る。', zh: '挤牛奶。' }, 'あた頭まを絞しほる。': { jp: '頭を絞る。', zh: '绞尽脑汁。' } } },
  4904: { exReplace: { 'き休ゆ暇う主いになった。': { jp: '休暇も終いになった。', zh: '假期也过完了。' }, '元映小画都 を終L主いまで見る。': { jp: '映画を終いまで見る。', zh: '一直看到电影的末尾。' } } },
  4906: { pitch: [0], meaning: '收起来,放起来;做完,结束' },
  4909: { meaning: '素净;质朴;踏实' },
  4910: { meaning: '姓名' },
  4919: { meaning: '借钱,欠债' },
  4921: { meaning: '车内,车厢里' },
  4922: { meaning: '公司内部' },
  4926: { meaning: '修学,学习' },
  4927: { meaning: '周,星期;(举行某种活动以七天为一个周期的)周' },
  4929: { meaning: '住所,住宅' },
  4930: { meaning: '工作人员,职工' },
  4931: { meaning: '重视' },
  4932: { meaning: '就职' },
  4934: { exRemove: ['じ重ゅ大うだき任に重大的责任 じゅう だいけっか。'] },
  4936: { meaning: '集中' },
  4937: { exReplace: { 'じ人んいしゆの終うて。': { jp: '人生の終点。', zh: '人生的终点。' } } },
  4939: { meaning: '重点' },
  4942: { kana: 'じゅうみん', exReplace: { 'じゅうみ住民んの意いけ見聞く。': { jp: '住民の意見を聞く。', zh: '听取居民的意见。' } } },
  4947: { meaning: '补习班' },
  4952: { meaning: '接收;收听' },
  4953: { meaning: '手段' },
  4955: { exReplace: { '出国審查を受ける。': { jp: '出国審査を受ける。', zh: '接受出境检查。' } } },
  4956: { exReplace: { 'しっつしんこ出身 校う。': { jp: '出身校。', zh: '毕业院校。' } } },
  4957: { exReplace: { '自费で出版する。': { jp: '自費で出版する。', zh: '自费出版。' } } },
  4958: { kana: 'しゅと' },
  4959: { exReplace: { '主 任 に 算 格Lた。': { jp: '主任に昇格した。', zh: '升为主任。' } } },
  4964: { meaning: '顺序;程序', exReplace: { '顺序を乱す。': { jp: '順序を乱す。', zh: '打乱顺序。' } } },
  4965: { exReplace: { '工 事 が 顺 調 に 進 ん で い る。': { jp: '工事が順調に進んでいる。', zh: '工程进展顺利。' } } },
  4967: { meaning: '顺序,依次,轮流', exReplace: { '顺 番 に 答 え る。': { jp: '順番に答える。', zh: '依次回答。' } } },
  4968: { exReplace: { '事務所。': { jp: '事務所。', zh: '事务所。' } } },
  4969: { exReplace: { 'い き求ゆ う書し上。': { jp: '請求書。', zh: '账单,付款通知单。' } } },
  4970: { exReplace: { 'くい証しよ学生证 汪けんしょう。': { jp: '学生証。', zh: '学生证。' } } },
  4971: { meaning: '使用' },
  4973: { meaning: '奖学金' },
  4974: { kanji: 'しょうがない', kana: 'しょうがない' },
  4975: { exRemove: ['乘 車 券。'] },
  4976: { meaning: '乘客,旅客' },
  4977: { meaning: '上级;高年级', exRemove: ['交通事故が生じる。', 'ま摩きしをょう生じる。'] },
  4978: { meaning: '商业', exRemove: ['上達が早い。'] },
  4979: { kanji: '状況', meaning: '情况,状况' },
  4980: { meaning: '消极的' },
  4981: { kana: 'じょうけん' },
  4984: { meaning: '买卖' },
  4986: { kana: 'しょうひ', meaning: '消费;花费' },
  4988: { meaning: '文雅,典雅' },
  4989: { exReplace: { 'しようひんけ商品券んで物も買かう。': { jp: '商品券で物を買う。', zh: '用商品券买东西。' } } },
  4990: { exReplace: { 'しよう勝負おをあら争。': { jp: '勝負を争う。', zh: '争胜负。' } } },
  4991: { kanji: '証明' },
  4992: { kanji: '証明書' },
  4995: { meaning: '职业' },
  4996: { kana: 'しょくば', exReplace: { 'し上職場く はを離なれる。': { jp: '職場を離れる。', zh: '离开工作岗位。' } } },
  4997: { exReplace: { '食品壳り場。': { jp: '食品売り場。', zh: '食品柜台。' } } },
  4999: { exReplace: { 'し上食くよ欲くしん振。': { jp: '食欲不振。', zh: '食欲不振。' } } },
  5000: { meaning: '食物,食材', exReplace: { '食 料 貯 藏 室。': { jp: '食料貯蔵室。', zh: '食品储藏室。' } } },
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
  4802: { syn: [['嗜好', 'しこう']], rel: [['趣味', 'しゅみ']] },
  4804: { rel: [['広告', 'こうこく']] },
  4808: { syn: [['詰める', 'つめる']] },
  4810: { rel: [['殺害', 'さつがい']] },
  4811: { syn: [['転がる', 'ころがる']] },
  4813: { syn: [['以後', 'いご']] },
  4815: { ant: [['最小', 'さいしょう']] },
  4817: { ant: [['最高', 'さいこう']] },
  4819: { syn: [['最良', 'さいりょう']] },
  4821: { syn: [['災い', 'わざわい']] },
  4822: { syn: [['手腕', 'しゅわん']] },
  4823: { syn: [['育てる', 'そだてる']] },
  4824: { rel: [['選考', 'せんこう']] },
  4825: { syn: [['幸運', 'こううん']] },
  4827: { ant: [['衰退', 'すいたい']] },
  4834: { syn: [['作製', 'さくせい']] },
  4837: { syn: [['悲鳴', 'ひめい']] },
  4839: { syn: [['差す', 'さす']] },
  4840: { syn: [['席', 'せき']] },
  4841: { rel: [['小説家', 'しょうせつか']] },
  4845: { syn: [['区別', 'くべつ']] },
  4847: { syn: [['起こす', 'おこす']] },
  4849: { ant: [['温まる', 'あたたまる']] },
  4853: { rel: [['動物', 'どうぶつ']] },
  4856: { rel: [['参考書', 'さんこうしょ']] },
  4858: { rel: [['数学', 'すうがく']] },
  4859: { rel: [['生産', 'せいさん']] },
  4861: { syn: [['完成する', 'かんせいする']] },
  4868: { rel: [['送金', 'そうきん']] },
  4869: { rel: [['司会者', 'しかいしゃ']] },
  4871: { rel: [['予定', 'よてい']] },
  4872: { syn: [['時代', 'じだい']] },
  4873: { rel: [['給料', 'きゅうりょう']] },
  4874: { syn: [['資本', 'しほん']] },
  4875: { syn: [['敷設', 'ふせつ']] },
  4876: { rel: [['物資', 'ぶっし']] },
  4877: { ant: [['浮かぶ', 'うかぶ']] },
  4878: { syn: [['態度', 'たいど']] },
  4879: { syn: [['服従', 'ふくじゅう']] },
  4880: { rel: [['衣服', 'いふく']] },
  4881: { syn: [['親交', 'しんこう']] },
  4882: { rel: [['着る', 'きる']] },
  4885: { ant: [['就職', 'しゅうしょく']] },
  4887: { syn: [['達成', 'たっせい']] },
  4888: { syn: [['落胆', 'らくたん']] },
  4889: { syn: [['能力', 'のうりょく']] },
  4890: { syn: [['指図', 'さしず']] },
  4892: { syn: [['教示', 'きょうじ']] },
  4895: { syn: [['品物', 'しなもの']] },
  4896: { syn: [['度々', 'たびたび']] },
  4899: { syn: [['払う', 'はらう']] },
  4900: { syn: [['拘束', 'こうそく']] },
  4901: { rel: [['辞職', 'じしょく']] },
  4902: { ant: [['生存', 'せいぞん']] },
  4903: { syn: [['搾る', 'しぼる']] },
  4905: { rel: [['兄弟', 'きょうだい']] },
  4907: { syn: [['誇り', 'ほこり']] },
  4909: { ant: [['派手', 'はで']] },
  4910: { syn: [['名前', 'なまえ']] },
  4912: { rel: [['期限', 'きげん']] },
  4913: { syn: [['終了', 'しゅうりょう']] },
  4914: { rel: [['寒さ', 'さむさ']] },
  4916: { syn: [['屈む', 'かがむ']] },
  4917: { rel: [['駐車場', 'ちゅうしゃじょう']] },
  4919: { rel: [['返済', 'へんさい']] },
  4923: { syn: [['話す', 'はなす']] },
  4924: { rel: [['パン']] },
  4926: { rel: [['学習', 'がくしゅう']] },
  4927: { rel: [['週', 'しゅう']] },
  4931: { ant: [['軽視', 'けいし']] },
  4932: { ant: [['退職', 'たいしょく']] },
  4934: { syn: [['重要', 'じゅうよう']] },
  4935: { syn: [['団体', 'だんたい']] },
  4936: { ant: [['散漫', 'さんまん']] },
  4937: { ant: [['始発', 'しはつ']] },
  4938: { rel: [['電車', 'でんしゃ']] },
  4940: { rel: [['電池', 'でんち']] },
  4941: { syn: [['周囲', 'しゅうい']] },
  4942: { rel: [['市民', 'しみん']] },
  4943: { syn: [['修繕', 'しゅうぜん']] },
  4944: { syn: [['完了', 'かんりょう']] },
  4945: { syn: [['重さ', 'おもさ']] },
  4946: { rel: [['学費', 'がくひ']] },
  4948: { rel: [['休日', 'きゅうじつ']] },
  4949: { rel: [['試験', 'しけん']] },
  4950: { rel: [['医療', 'いりょう']] },
  4952: { ant: [['送信', 'そうしん']] },
  4954: { syn: [['論点', 'ろんてん']] },
  4956: { rel: [['出身校', 'しゅっしんこう']] },
  4960: { rel: [['命', 'いのち']] },
  4961: { ant: [['脇役', 'わきやく']] },
  4962: { syn: [['重要', 'じゅうよう']] },
  4963: { ant: [['供給', 'きょうきゅう']] },
  4964: { syn: [['手順', 'てじゅん']] },
  4965: { syn: [['円滑', 'えんかつ']] },
  4967: { syn: [['順序', 'じゅんじょ']] },
  4972: { ant: [['放火', 'ほうか']] },
  4976: { rel: [['乗車', 'じょうしゃ']] },
  4977: { ant: [['下級', 'かきゅう']] },
  4979: { syn: [['状態', 'じょうたい']] },
  4980: { ant: [['積極的', 'せっきょくてき']] },
  4982: { syn: [['ぶつかる']] },
  4983: { ant: [['少女', 'しょうじょ']] },
  4984: { syn: [['商業', 'しょうぎょう']] },
  4985: { ant: [['下半身', 'かはんしん']] },
  4986: { ant: [['生産', 'せいさん']] },
  4987: { rel: [['製品', 'せいひん']] },
  4988: { ant: [['下品', 'げひん']] },
  4990: { syn: [['試合', 'しあい']] },
  4991: { syn: [['立証', 'りっしょう']] },
  4994: { syn: [['社員', 'しゃいん']] },
  4995: { rel: [['仕事', 'しごと']] },
  4996: { rel: [['勤め先', 'つとめさき']] },
  4997: { syn: [['食べ物', 'たべもの']] },
  4998: { syn: [['食べ物', 'たべもの']] },
  4999: { rel: [['食事', 'しょくじ']] },
  5000: { rel: [['食材', 'しょくざい']] },
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
