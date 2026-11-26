// 补充题库 · 聴解（N2 模拟题2）
// 問題1〜5 共 32 题；整包共用书页二维码音频；不参与随机练习。
import audioQr from '../../../assets/listening-mock/qr_mock2.png'
import picQ11 from '../../../assets/listening-mock/pic_mock2_q1_1.png'
import picQ12 from '../../../assets/listening-mock/pic_mock2_q1_2.png'

const PACK_ID = 'n2-listening-mock2'
const LEVEL = 'N2'
const PART_TITLES = {
  1: '問題1 課題理解',
  2: '問題2 ポイント理解',
  3: '問題3 概要理解',
  4: '問題4 即時応答',
  5: '問題5 統合理解',
}

const NUM4 = ['①', '②', '③', '④']
const T_NUM4 = '请听录音作答，选项在录音中（①〜④）。'

const raw = [
  // 問題1
  { part: 1, sentence: '四幅图中，哪一幅与录音的描述相符？', options: NUM4, answer: 3, img: picQ11 },
  { part: 1, sentence: '母子俩最终买了什么？', options: NUM4, answer: 2, img: picQ12 },
  { part: 1, sentence: '女人接下来要做什么？', options: ['友達にノートを借ります', '先生に聞きます', '友達に相談します', '自分で調べます'], answer: 3 },
  { part: 1, sentence: '男人让女人做什么？', options: ['一緒に部屋を片付けよう', '部屋を片付ける', '部屋を片付けろな', '部屋を片付けなさい'], answer: 4 },
  { part: 1, sentence: '关于男人对部下和自己的态度，正确的是哪一项？', options: ['部下にも自分にも厳しい', '部下には厳しいが自分には甘い', '部下には甘いが自分には厳しい', '部下にも自分にも甘い'], answer: 3 },

  // 問題2
  { part: 2, sentence: '女人什么时候给男人打电话？', options: ['土曜日の朝早く', '土曜日の夜遅く', '日曜日の朝早く', '日曜日の夜遅く'], answer: 2 },
  { part: 2, sentence: '女人为什么生气？', options: ['気分が悪いからです', 'パーティーがつまらないからです', '青木君が来ないと言ったからです', '青木君が来ていないからです'], answer: 4 },
  { part: 2, sentence: '女人说自己的店排第几位？', options: ['第三位', '第五位', '第七位', '第十位'], answer: 3 },
  { part: 2, sentence: '关于孩子们吃饭，正确的是哪一项？', options: ['兄も妹も今から食べます', '兄も妹も食べません', '兄だけ今から食べます', '妹だけ今から食べます'], answer: 4 },
  { part: 2, sentence: '女人什么时候去加拿大？', options: ['二月二十五日', '二月二十六日', '三月三日', '三月四日'], answer: 3 },
  { part: 2, sentence: '女人什么时候去旅行？', options: ['九月九日', '九月十五日', '十一月十一日', '十一月十五日'], answer: 3 },

  // 問題3
  { part: 3, sentence: T_NUM4, options: NUM4, answer: 4 },
  { part: 3, sentence: T_NUM4, options: NUM4, answer: 3 },
  { part: 3, sentence: T_NUM4, options: NUM4, answer: 3 },
  { part: 3, sentence: T_NUM4, options: NUM4, answer: 4 },
  { part: 3, sentence: T_NUM4, options: NUM4, answer: 4 },

  // 問題4
  ...Array.from({ length: 12 }, (_, i) => ({
    part: 4, sentence: T_NUM4, options: NUM4,
    answer: [2, 1, 1, 3, 1, 2, 3, 3, 2, 2, 1, 3][i],
  })),

  // 問題5
  { part: 5, sentence: '关于男人买车的资金，正确的是哪一项？', options: NUM4, answer: 2 },
  { part: 5, sentence: '女人为什么觉得田中很适合当社长？', options: NUM4, answer: 2 },
  { part: 5, sentence: '两人最初决定使用哪间教室？', options: ['11番教室', '16番教室', '25番教室', '34番教室'], answer: 1 },
  { part: 5, sentence: '两人最终决定使用哪间教室？', options: ['11番教室', '16番教室', '25番教室', '34番教室'], answer: 4 },
]

const questions = raw.map((item, i) => ({
  id: 182 + i + 1,
  no: i + 1,
  examNo: i + 1,
  packId: PACK_ID,
  level: LEVEL,
  type: '听解',
  part: item.part,
  partName: PART_TITLES[item.part],
  unit: item.part,
  sentence: item.sentence,
  sentenceFurigana: '',
  options: item.options,
  answer: item.answer,
  translation: '',
  explanation: '',
  article: '',
  audioQr,
  ...(item.img ? { img: item.img } : {}),
}))

const parts = Object.keys(PART_TITLES).map(no => ({
  no: Number(no),
  name: PART_TITLES[no],
  count: questions.filter(q => q.part === Number(no)).length,
})).filter(p => p.count)

export const supplementPacks = [{
  id: PACK_ID,
  level: LEVEL,
  title: 'N2 聴解 32 题',
  shortTitle: '聴解 32 题',
  type: '听解',
  origin: 'external',
  provider: '',
  providerNote: '',
  url: '',
  count: questions.length,
  parts,
  audioQr,
  randomable: false,
}]

export const supplementQuestions = questions

export default { supplementPacks, supplementQuestions }
