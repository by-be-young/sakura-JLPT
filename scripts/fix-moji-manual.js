// 手动修正剩余16道文字题的下划线（假名->汉字）
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qPath = path.join(__dirname, '../src/data/questions.js')
let content = fs.readFileSync(qPath, 'utf-8')

const fixes = [
  { id: 38,  old: 'できるだけ無駄を<u>はぶき</u>、シンプルな生活を送る。', newSent: 'できるだけ無駄を<u>省き</u>、シンプルな生活を送る。' },
  { id: 73,  old: '花瓶が倒れて、水が<u>こぼれて</u>しまった。', newSent: '花瓶が倒れて、水が<u>零れて</u>しまった。' },
  { id: 74,  old: '翻訳の仕事を<u>あんいに</u>に引き受けて、後悔している。', newSent: '翻訳の仕事を<u>安易に</u>引き受けて、後悔している。' },
  { id: 86,  old: '佐藤さんは味方として<u>たのもしい</u>男だ。', newSent: '佐藤さんは味方として<u>頼もしい</u>男だ。' },
  { id: 109, old: '封筒に貼った切手が<u>はがれ</u>た。', newSent: '封筒に貼った切手が<u>剥がれ</u>た。' },
  { id: 145, old: 'この島は海に<u>かこまれて</u>景色がすばらしい。', newSent: 'この島は海に<u>囲まれて</u>景色がすばらしい。' },
  { id: 151, old: '社長は誰にでも<u>へいどう</u>に接する。', newSent: '社長は誰にでも<u>平等</u>に接する。' },
  { id: 181, old: '地震で家が<u>かたむ</u>いた。', newSent: '地震で家が<u>傾</u>いた。' },
  { id: 217, old: '説明が不十分で誤解を<u>まねい</u>しまった。', newSent: '説明が不十分で誤解を<u>招い</u>てしまった。' },
  { id: 230, old: '食べ物を<u>そうまつ</u>にしてはいけないとよく母に言われた。', newSent: '食べ物を<u>粗末</u>にしてはいけないとよく母に言われた。' },
  { id: 235, old: '高齢者を<u>ねらっ</u>詐欺事件が増えている。', newSent: '高齢者を<u>狙っ</u>た詐欺事件が増えている。' },
  { id: 253, old: '彼女の無神経さには<u>あきれ</u>しまう。', newSent: '彼女の無神経さには<u>呆れ</u>てしまう。' },
  { id: 266, old: '会社のトップには、<u>ほしゅ</u>的な重役が多い。', newSent: '会社のトップには、<u>保守</u>的な重役が多い。' },
  { id: 289, old: '新しい機械の性能を<u>ため</u>す。', newSent: '新しい機械の性能を<u>試</u>す。' },
  { id: 325, old: '緊張して足が<u>ふる</u>えた。', newSent: '緊張して足が<u>震</u>えた。' },
  { id: 343, old: '一人暮らしをしていると、母の手料理が<u>こいし</u>くなる。', newSent: '一人暮らしをしていると、母の手料理が<u>恋し</u>くなる。' },
]

let count = 0
for (const f of fixes) {
  const oldStr = '"sentence": "' + f.old.replace(/"/g, '\\"') + '"'
  const newStr = '"sentence": "' + f.newSent.replace(/"/g, '\\"') + '"'
  if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr)
    count++
    console.log(`题${f.id}: 已修正`)
  } else {
    console.log(`题${f.id}: 未找到原句!`)
  }
}

fs.writeFileSync(qPath, content, 'utf-8')
console.log(`\n共修正 ${count}/${fixes.length} 题`)
