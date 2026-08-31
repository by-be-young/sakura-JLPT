// 临时测试：kuroshiro 对文法中日混排文本的注释效果
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const Kuroshiro = require('kuroshiro').default
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji')
const kuroshiro = new Kuroshiro()
await kuroshiro.init(new KuromojiAnalyzer())
const samples = [
  'これは去年買ったカメラです。（这是去年买的相机。）',
  '妹は学生じゃありません。会社員です。（妹妹不是学生，是公司职员。）',
  '接续：名词1 + は + 名词2 + です/ではありません',
  '名A +（が）あっての + 名B',
  '表示条件，正因为有A，才有B的存在。',
  'A：あの人 は田中さんですか。（那个人是田中吗？）',
  '～間、～間に等',
]
for (const s of samples) {
  try {
    const r = await kuroshiro.convert(s, { to: 'hiragana', mode: 'furigana' })
    console.log('IN :', s)
    console.log('OUT:', r)
  } catch (e) { console.log('ERR', s, e.message) }
  console.log('---')
}
