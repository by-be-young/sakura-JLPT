// 手动修正最后22题
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qPath = path.join(__dirname, '../src/data/questions.js')
let content = fs.readFileSync(qPath, 'utf-8')

const fixes = [
  // 文字题：加下划线
  { id: 374, old: '日本の地域別人口分布について調べる。', newSent: '日本の地域別人口<u>分布</u>について調べる。' },
  { id: 386, old: '今住んでいるアパートは駅から徒歩10分のところにある。', newSent: '今住んでいるアパートは駅から<u>徒歩</u>10分のところにある。' },
  { id: 392, old: 'アメリカの駐日大使が記者会見を開いた。', newSent: 'アメリカの駐日<u>大使</u>が記者会見を開いた。' },
  { id: 416, old: '今年の大学新卒者の平均給与は去年よりやや低い。', newSent: '今年の大学新卒者の平均<u>給与</u>は去年よりやや低い。' },
  { id: 446, old: '彼は前より、強気な発言をした。', newSent: '彼は前より、<u>強気</u>な発言をした。' },
  { id: 458, old: '金閣寺は大勢の観光客でにぎやかだ。', newSent: '金閣寺は<u>大勢</u>の観光客でにぎやかだ。' },
  { id: 470, old: '父の借金で、わが家は生活が苦しい。', newSent: '父の<u>借金</u>で、わが家は生活が苦しい。' },
  { id: 482, old: '彼女は顔に微笑みを浮かべていた。', newSent: '彼女は顔に<u>微笑み</u>を浮かべていた。' },
  { id: 499, old: '沈黙は金、雄弁は銀。', newSent: '<u>沈黙</u>は金、雄弁は銀。' },
  { id: 524, old: 'いくら探しても預金通帳が見つからない。', newSent: 'いくら探しても預金<u>通帳</u>が見つからない。' },
  { id: 542, old: 'ハンカチで額の汗を拭った。', newSent: 'ハンカチで<u>額</u>の汗を拭った。' },
  { id: 667, old: '山田さんが辞めたって、ほんとう？', newSent: '山田さんが辞め<u>たって</u>、ほんとう？' },
  { id: 668, old: '言葉はコミュニケーションの道具の一つでしかあるまい。', newSent: '言葉はコミュニケーションの道具の一つ<u>でしかあるまい</u>。' },
  { id: 674, old: '「あの人の言うことはよくわからないよ。日本語といっても方言なんだもん。」', newSent: '「あの人の言うことはよくわからないよ。日本語といっても方言なんだ<u>もん</u>。」' },
  { id: 680, old: '出産した妻をサポートするため、育児休暇を取った。', newSent: '出産した妻を<u>サポート</u>するため、育児休暇を取った。' },
  { id: 703, old: '彼のスピーチは大きな喝采を浴びた。', newSent: '彼のスピーチは大きな<u>喝采</u>を浴びた。' },
  { id: 709, old: '「田中くん、君の考えどおりにしたまえ。」', newSent: '「田中くん、君の考えどおりに<u>し</u>たまえ。」' },
  // 語彙/文法题：替换为填空
  { id: 402, old: '高橋さんはピアニストであるばかりでなく、実業家でもある。', newSent: '高橋さんはピアニスト( )、実業家でもある。' },
  { id: 426, old: '少子高齢化問題は、これから日本の最も重要な課題になるといっても過言ではない。', newSent: '少子高齢化問題は、これから日本の最も重要な課題になる( )。' },
  { id: 671, old: '本文の内容を補足するため、グラフを追加した。', newSent: '本文の内容を( )するため、グラフを追加した。' },
  { id: 684, old: '高いレベルの英語力を維持するため、定期的に検定を受ける。', newSent: '高いレベルの英語力を( )するため、定期的に検定を受ける。' },
  { id: 719, old: '「課長、至急、ご対応をお願いします。」', newSent: '「課長、( )、ご対応をお願いします。」' },
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
