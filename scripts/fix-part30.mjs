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
  5601: { kanji: '防ぐ', meaning: '防御;预防', exReplace: { '虫 菌 を 防 く。': { jp: '虫歯を防ぐ。', zh: '预防蛀牙。' } } },
  5602: { meaning: '不足,缺乏' },
  5603: { meaning: '……不足,不够', exReplace: { '睡眠不足。': { jp: '睡眠不足。', zh: '睡眠不足。' }, '力 不 足。': { jp: '力不足。', zh: '能力不足。' } } },
  5605: { meaning: '舞台' },
  5607: { meaning: '物价' },
  5610: { kana: 'ぶつり' },
  5611: { meaning: '船运' },
  5612: { kana: 'ぶひん', exRemove: ['彼は品がある。'] },
  5613: { kana: 'ぶぶん', meaning: '部分,一部分' },
  5614: { exReplace: { '不满を漏らす。': { jp: '不満を漏らす。', zh: '发泄不满。' }, '不满に思う。': { jp: '不満に思う。', zh: '感到不满足;觉得不满意。' } } },
  5616: { meaning: '起跳;下决心' },
  5617: { meaning: '增加,增长' },
  5618: { meaning: '不愉快,不快' },
  5621: { meaning: '加号;正数;利益' },
  5624: { exReplace: { '寝た与りをする。': { jp: '寝た振りをする。', zh: '假装睡觉。' } } },
  5625: { meaning: '无拘无束,自由;免费' },
  5626: { meaning: '撒入;存入,拨入' },
  5629: { meaning: '蓝色,天蓝色' },
  5630: { exReplace: { '地震で窓力ラスが震えた。': { jp: '地震で窓ガラスが震えた。', zh: '由于地震,窗玻璃震动起来了。' } } },
  5632: { exRemove: ['古本屋で本を読む。'] },
  5633: { kana: 'ふるまう', meaning: '行动,动作', exReplace: { '自由に振舞う。': { jp: '自由に振る舞う。', zh: '自由行动。' } } },
  5635: { kana: 'ふれる' },
  5639: { exReplace: { 'ゴミの分别収集。': { jp: 'ゴミの分別収集。', zh: '分类收垃圾。' } } },
  5640: { meaning: '不在乎,不介意' },
  5642: { exReplace: { '弊社からサンプルをお送りいたします。': { jp: '弊社からサンプルをお送りいたします。', zh: '敝公司将为您寄送样品。' } } },
  5643: { meaning: '凹下,瘪了' },
  5645: { kana: 'べつに' },
  5646: { exReplace: { '别々の方 法。': { jp: '別々の方法。', zh: '各自的方法。' } } },
  5647: { exReplace: { 'に人んらを减らす。': { jp: '人員を減らす。', zh: '裁员。' } } },
  5648: { kanji: 'ぺらぺら', kana: 'ぺらぺら' },
  5650: { exReplace: { '体重が减った。': { jp: '体重が減った。', zh: '体重减少了。' } } },
  5652: { exReplace: { '\\ iangle 方針を変換する。': { jp: '方針を変換する。', zh: '改变方针。' } } },
  5654: { meaning: '变更,更改' },
  5655: { kana: 'へんしん', exRemove: ['へんしん ねく。'] },
  5656: { kanji: 'ボーリング', kana: 'ボーリング' },
  5658: { meaning: '明朗;晴朗;(声音)爽朗' },
  5661: { meaning: '募集,征募,招募', exReplace: { '生徒募集を開始する。': { jp: '生徒募集を開始する。', zh: '开始招生。' } } },
  5662: { kanji: '保証', meaning: '保证,担保', exReplace: { '品質を保证する。': { jp: '品質を保証する。', zh: '保证品质。' } } },
  5663: { exRemove: ['ホラー映画。'] },
  5666: { exReplace: { '坊ちやん、これをあげるよ。': { jp: '坊ちゃん、これをあげるよ。', zh: '小朋友,这个给你了。' }, '彼は苦労を知らない坊ちやんだ。': { jp: '彼は苦労を知らない坊ちゃんだ。', zh: '他是娇生惯养的大少爷。' } } },
  5668: { meaning: '人行道' },
  5669: { exReplace: { '\\ iangle 七一夕一を解く。': { jp: 'セーターを解く。', zh: '拆开毛衣。' } } },
  5676: { exReplace: { '迷子を搜す。': { jp: '迷子を捜す。', zh: '寻找走丢的孩子。' } } },
  5677: { kanji: '毎度', meaning: '每次,每回' },
  5678: { meaning: '减号;负数;不利' },
  5680: { meaning: '卷进,卷入;牵连' },
  5681: { kanji: '巻く', meaning: '(自)形成漩涡;(他)缠绕', exReplace: { '包 带 を 卷 く。': { jp: '包帯を巻く。', zh: '缠绷带。' } } },
  5684: { kana: 'まご' },
  5685: { meaning: '决(不)……;万一,难道' },
  5688: { meaning: '贫穷;贫乏,寒酸' },
  5690: { meaning: '(车站或医院等的)等候室', exReplace: { '待 合 室 で 少 々 お 待 ち く だ さ い。': { jp: '待合室で少々お待ちください。', zh: '请在等候室稍候一下。' } } },
  5692: { meaning: '错误,过错' },
  5694: { meaning: '通红,鲜红' },
  5695: { meaning: '漆黑;暗淡' },
  5696: { exReplace: { '真っ黑な髪。': { jp: '真っ黒な髪。', zh: '乌黑的头发。' } } },
  5700: { meaning: '雪白,纯白' },
  5702: { meaning: '窗口;(对外联系的)部门' },
  5703: { meaning: '谈妥;凑齐;归纳' },
  5704: { meaning: '收集;归纳;统一' },
  5707: { exReplace: { '太 陽 が 眩 し い。': { jp: '太陽が眩しい。', zh: '太阳晃眼。' } } },
  5711: { meaning: '迷失;犹豫;迷恋' },
  5712: { meaning: '(花)盛开,满开' },
  5713: { exReplace: { 'あ い じ会場 ょがう主 ん満席せきになった。': { jp: '会場が満席になった。', zh: '会场座无虚席。' } } },
  5714: { meaning: '满足,圆满;完善,完整' },
  5715: { meaning: '(考试等)满分;最高分' },
  5716: { meaning: '……的(样子,状态,程度)' },
  5717: { meaning: '果实,种子;内容' },
  5718: { meaning: '仰视;尊敬,敬重' },
  5719: { meaning: '目送;送行;暂缓', exReplace: { '弟をバ ス停まで見送る。': { jp: '弟をバス停まで見送る。', zh: '将弟弟送到公共汽车站。' } } },
  5720: { meaning: '俯视;小看', exReplace: { '飛行機から町を見下ろす。': { jp: '飛行機から町を見下ろす。', zh: '从飞机上俯瞰城市。' } } },
  5722: { kanji: '見掛ける', exReplace: { '本を見掛けてやめる。': { jp: '本を見掛けてやめる。', zh: '刚一看书就放下了。' }, 'あの人を街でよく見掛ける。': { jp: 'あの人を街でよく見掛ける。', zh: '那个人我常在街上看见。' } } },
  5725: { exReplace: { '右手に富士山が見える。': { jp: '右手に富士山が見える。', zh: '右侧可以看到富士山。' } } },
  5726: { meaning: '凄惨,悲惨,惨痛' },
  5728: { meaning: '神秘;推理小说' },
  5731: { meaning: '凝视;注视', exReplace: { '相手の颜を見つめる。': { jp: '相手の顔を見つめる。', zh: '凝视对方的面孔。' } } },
  5732: { meaning: '重新看;重新认识;好转', exReplace: { '答 案 を 見 直 す。': { jp: '答案を見直す。', zh: '重看答案。' } } },
  5733: { exReplace: { '南側に海が見える。': { jp: '南側に海が見える。', zh: '朝南一侧可以看到海。' } } },
  5734: { meaning: '身份,社会地位', exReplace: { '\\ iangle 身分を隠寸。': { jp: '身分を隠す。', zh: '隐瞒身份。' } } },
  5735: { kanji: '見舞い' },
  5744: { kana: 'むかいあう' },
  5745: { meaning: '不关心,漠不关心' },
  5746: { meaning: '朝向……;适合……' },
  5748: { kanji: '向く' },
  5749: { kanji: '剥く' },
  5753: { exReplace: { '今日はひど<蒸す。': { jp: '今日はひどく蒸す。', zh: '今天非常闷热。' } } },
  5755: { kanji: '無責任', meaning: '无责任感,不负责任' },
  5756: { exReplace: { '2万円を無駄遣いした。': { jp: '2万円を無駄遣いした。', zh: '浪费了两万日元。' } } },
  5757: { meaning: '睡梦里;热衷,着迷' },
  5758: { meaning: '不要钱,免费;免费(提供)' },
  5759: { kana: 'め', exRemove: ['月の輪。'] },
  5760: { exReplace: { '名刺入扎。': { jp: '名刺入れ。', zh: '名片夹。' } } },
  5762: { kanji: '命じる', meaning: '(命ずる)命令,吩咐;任命;起名' },
  5765: { exReplace: { 'め命いれ令主守もる。': { jp: '命令を守る。', zh: '严守命令。' } } },
  5766: { kana: 'めうえ' },
  5767: { meaning: '计量器,计量表;米' },
  5768: { meaning: '下级;晚辈', exRemove: ['目下のところ何も問題はない。'] },
  5770: { meaning: '没有道理;荒谬;乱七八糟' },
  5771: { kana: 'めまい', exReplace: { '眩量がする。': { jp: '眩暈がする。', zh: '眩晕;头晕。' } } },
  5773: { meaning: '批准,许可;许可证,执照' },
  5775: { meaning: '麻烦;照顾,照料', exReplace: { '面倒な手続き。': { jp: '面倒な手続き。', zh: '麻烦的手续。' } } },
  5778: { kanji: '戻す', meaning: '归还;退回;使……恢复', exReplace: { '図書室に本を屐す。': { jp: '図書室に本を戻す。', zh: '归还图书室的书。' }, '時計を3分だけもとに屐す。': { jp: '時計を3分だけもとに戻す。', zh: '将表针拨回三分钟。' } } },
  5779: { meaning: '想要,需要;寻求', exRemove: ['ある止。', 'かばんを持ち歩く。'] },
  5783: { meaning: '事物,事情' },
  5784: { meaning: '可怕的;猛烈的,不得了的' },
  5786: { exReplace: { '稿模様。': { jp: '縞模様。', zh: '条纹图案。' } } },
  5787: { exReplace: { '二飯を盛る。': { jp: 'ご飯を盛る。', zh: '盛饭。' } } },
  5790: { meaning: '任务,职务;角色' },
  5794: { meaning: '跳动,朝气蓬勃,生机勃勃', exRemove: ['くう朝气蓬勃的感觉。'] },
  5797: { kanji: '火傷' },
  5800: { exReplace: { 'ガイドを履う。': { jp: 'ガイドを雇う。', zh: '雇向导。' } } },
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
  5601: { syn: [['防御', 'ぼうぎょ']] },
  5602: { ant: [['過剰', 'かじょう']] },
  5604: { rel: [['瓶', 'びん']] },
  5605: { rel: [['劇場', 'げきじょう']] },
  5606: { ant: [['注意', 'ちゅうい']] },
  5607: { rel: [['値段', 'ねだん']] },
  5608: { syn: [['衝突', 'しょうとつ']] },
  5609: { syn: [['投げる', 'なげる']] },
  5610: { rel: [['化学', 'かがく']] },
  5611: { ant: [['航空便', 'こうくうびん']] },
  5612: { syn: [['パーツ']] },
  5613: { ant: [['全体', 'ぜんたい']] },
  5614: { ant: [['満足', 'まんぞく']] },
  5616: { syn: [['決断', 'けつだん']] },
  5617: { ant: [['減らす', 'へらす']] },
  5618: { ant: [['愉快', 'ゆかい']] },
  5621: { ant: [['マイナス']] },
  5622: { rel: [['素材', 'そざい']] },
  5623: { syn: [['計画', 'けいかく']] },
  5624: { rel: [['ふりをする']] },
  5626: { rel: [['振込', 'ふりこみ']] },
  5628: { syn: [['揺らす', 'ゆらす']] },
  5630: { syn: [['震動', 'しんどう']] },
  5631: { ant: [['新しく', 'あたらしく']] },
  5633: { syn: [['行動する', 'こうどうする']] },
  5634: { ant: [['アクセル']] },
  5635: { syn: [['触る', 'さわる']] },
  5636: { syn: [['計画', 'けいかく']] },
  5638: { syn: [['ムード']] },
  5639: { syn: [['区分', 'くぶん']] },
  5640: { syn: [['無頓着', 'むとんちゃく']] },
  5641: { ant: [['休日', 'きゅうじつ']] },
  5642: { ant: [['貴社', 'きしゃ']] },
  5643: { ant: [['膨らむ', 'ふくらむ']] },
  5644: { rel: [['家', 'いえ']] },
  5646: { syn: [['各々', 'おのおの']] },
  5647: { ant: [['増やす', 'ふやす']] },
  5649: { rel: [['バルコニー']] },
  5650: { ant: [['増える', 'ふえる']] },
  5651: { rel: [['帯', 'おび']] },
  5652: { syn: [['転換', 'てんかん']] },
  5653: { rel: [['塗料', 'とりょう']] },
  5654: { syn: [['改訂', 'かいてい']] },
  5655: { syn: [['返事', 'へんじ']] },
  5657: { syn: [['大広間', 'おおひろま']] },
  5658: { syn: [['明るい', 'あかるい']] },
  5659: { rel: [['歩く', 'あるく']] },
  5660: { rel: [['汚れ', 'よごれ']] },
  5661: { rel: [['採用', 'さいよう']] },
  5662: { syn: [['保障', 'ほしょう']] },
  5663: { ant: [['濡らす', 'ぬらす']] },
  5664: { rel: [['広告', 'こうこく']] },
  5665: { rel: [['長い', 'ながい']] },
  5667: { rel: [['湯', 'ゆ']] },
  5668: { rel: [['道路', 'どうろ']] },
  5669: { syn: [['ほぐす']] },
  5670: { rel: [['体', 'からだ']] },
  5671: { syn: [['笑み', 'えみ']] },
  5672: { syn: [['笑う', 'わらう']] },
  5673: { rel: [['恐怖', 'きょうふ']] },
  5676: { rel: [['迷う', 'まよう']] },
  5678: { ant: [['プラス']] },
  5680: { syn: [['巻き添え', 'まきぞえ']] },
  5681: { syn: [['巻き付ける', 'まきつける']] },
  5682: { rel: [['種', 'たね']] },
  5683: { ant: [['伸ばす', 'のばす']] },
  5684: { rel: [['子供', 'こども']] },
  5686: { syn: [['勝る', 'まさる']] },
  5687: { rel: [['顔', 'かお']] },
  5688: { ant: [['豊か', 'ゆたか']] },
  5689: { syn: [['かき混ぜる', 'かきまぜる']] },
  5690: { rel: [['待つ', 'まつ']] },
  5691: { syn: [['待ち合わせ', 'まちあわせ']] },
  5692: { syn: [['誤り', 'あやまり']] },
  5693: { rel: [['木', 'き']] },
  5694: { syn: [['真紅', 'しんく']] },
  5695: { syn: [['暗黒', 'あんこく']] },
  5696: { ant: [['真っ白', 'まっしろ']] },
  5698: { rel: [['青', 'あお']] },
  5699: { syn: [['一番に', 'いちばんに']] },
  5700: { ant: [['真っ黒', 'まっくろ']] },
  5701: { syn: [['完全に', 'かんぜんに']] },
  5703: { syn: [['一致', 'いっち']] },
  5704: { syn: [['整理', 'せいり']] },
  5705: { syn: [['礼儀', 'れいぎ']] },
  5706: { syn: [['模倣', 'もほう']] },
  5707: { rel: [['目', 'め']] },
  5709: { syn: [['じきに']] },
  5710: { rel: [['顔', 'かお']] },
  5711: { rel: [['迷子', 'まいご']] },
  5712: { ant: [['散る', 'ちる']] },
  5714: { ant: [['不満', 'ふまん']] },
  5715: { rel: [['点数', 'てんすう']] },
  5717: { rel: [['果物', 'くだもの']] },
  5718: { ant: [['見下ろす', 'みおろす']] },
  5719: { ant: [['出迎える', 'でむかえる']] },
  5720: { ant: [['見上げる', 'みあげる']] },
  5721: { syn: [['外見', 'がいけん']] },
  5722: { syn: [['目撃', 'もくげき']] },
  5723: { ant: [['左足', 'ひだりあし']] },
  5724: { ant: [['左側', 'ひだりがわ']] },
  5726: { syn: [['悲惨', 'ひさん']] },
  5727: { rel: [['海', 'うみ']] },
  5729: { ant: [['成人', 'せいじん']] },
  5730: { rel: [['味噌', 'みそ']] },
  5731: { syn: [['凝視', 'ぎょうし']] },
  5732: { syn: [['再検討', 'さいけんとう']] },
  5733: { ant: [['北側', 'きたがわ']] },
  5734: { rel: [['地位', 'ちい']] },
  5735: { rel: [['お見舞い']] },
  5736: { rel: [['訪問', 'ほうもん']] },
  5737: { ant: [['過去', 'かこ']] },
  5739: { syn: [['魅惑', 'みわく']] },
  5741: { ant: [['政府', 'せいふ']] },
  5742: { rel: [['国家', 'こっか']] },
  5743: { syn: [['対面', 'たいめん']] },
  5745: { ant: [['関心', 'かんしん']] },
  5746: { rel: [['方向', 'ほうこう']] },
  5747: { rel: [['小麦', 'こむぎ']] },
  5748: { syn: [['向かう', 'むかう']] },
  5749: { syn: [['剥がす', 'はがす']] },
  5750: { ant: [['嫁', 'よめ']] },
  5751: { syn: [['軽視', 'けいし']] },
  5752: { rel: [['暑い', 'あつい']] },
  5753: { rel: [['蒸し', 'むし']] },
  5754: { syn: [['繋ぐ', 'つなぐ']] },
  5755: { ant: [['責任感', 'せきにんかん']] },
  5756: { syn: [['浪費', 'ろうひ']] },
  5757: { syn: [['熱中', 'ねっちゅう']] },
  5758: { ant: [['有料', 'ゆうりょう']] },
  5761: { rel: [['観光', 'かんこう']] },
  5763: { syn: [['達人', 'たつじん']] },
  5764: { rel: [['名産', 'めいさん']] },
  5765: { syn: [['指令', 'しれい']] },
  5766: { ant: [['目下', 'めした']] },
  5768: { ant: [['目上', 'めうえ']] },
  5769: { syn: [['際立つ', 'きわだつ']] },
  5770: { syn: [['めちゃめちゃ']] },
  5771: { rel: [['目', 'め']] },
  5772: { rel: [['布', 'ぬの']] },
  5773: { rel: [['資格', 'しかく']] },
  5774: { rel: [['面接試験', 'めんせつしけん']] },
  5775: { syn: [['厄介', 'やっかい']] },
  5776: { syn: [['面倒', 'めんどう']] },
  5777: { syn: [['構成員', 'こうせいいん']] },
  5778: { ant: [['進める', 'すすめる']] },
  5779: { syn: [['探す', 'さがす']] },
  5780: { syn: [['本来', 'ほんらい']] },
  5781: { syn: [['音', 'おと']] },
  5782: { syn: [['話', 'はなし']] },
  5783: { syn: [['事柄', 'ことがら']] },
  5784: { syn: [['凄まじい', 'すさまじい']] },
  5785: { rel: [['秋', 'あき']] },
  5786: { syn: [['図柄', 'ずがら']] },
  5787: { syn: [['盛り付ける', 'もりつける']] },
  5788: { syn: [['不平', 'ふへい']] },
  5789: { rel: [['湯', 'ゆ']] },
  5790: { syn: [['役割', 'やくわり']] },
  5791: { rel: [['会社', 'かいしゃ']] },
  5792: { syn: [['翻訳', 'ほんやく']] },
  5793: { syn: [['役に立つ', 'やくにたつ']] },
  5794: { rel: [['活力', 'かつりょく']] },
  5795: { syn: [['任務', 'にんむ']] },
  5796: { syn: [['役目', 'やくめ']] },
  5797: { rel: [['怪我', 'けが']] },
  5798: { rel: [['家', 'いえ']] },
  5799: { rel: [['薬', 'くすり']] },
  5800: { syn: [['雇用', 'こよう']] },
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
