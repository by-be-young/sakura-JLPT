// 临时测试2：kuroshiro 对新 N5 例句格式的注音效果
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const Kuroshiro = require('kuroshiro').default
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji')
const kuroshiro = new Kuroshiro()
await kuroshiro.init(new KuromojiAnalyzer())
const samples = [
  'これは去年買ったカメラです。【2007年真题】/这是去年买的照相机。',
  'おとといは雨で、昨日は雪でした。【2008年真题】/前天下雨，昨天下雪了。',
  'B「はい、そうでした。」/“是，以前是的。”',
  '第一（だいいち）',
  'ありがとうございます。谢谢。',
]
for (const s of samples) {
  const r = await kuroshiro.convert(s, { to: 'hiragana', mode: 'furigana' })
  console.log('IN :', s)
  console.log('OUT:', r)
  console.log('---')
}
