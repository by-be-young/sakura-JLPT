// 补充题库 · 聴解（N2 全真模拟题1）
// 按問題1〜5 收录，整包共用书页二维码音频；不参与随机练习。
import source from './source.js'
import audioQr from '../../../assets/listening-mock/qr_mock1.png'

const PACK_ID = 'n2-listening-mock1'
const LEVEL = 'N2'
const PART_TITLES = {
  1: '問題1 課題理解',
  2: '問題2 ポイント理解',
  3: '問題3 概要理解',
  4: '問題4 即時応答',
  5: '問題5 統合理解',
}

const raw = []
for (const section of source.sections) {
  // 資料里 6 是問題5 3番的续段，归入問題5
  const part = Math.min(section.section, 5)
  for (const item of section.items) {
    if (item.questions?.length) {
      for (const sub of item.questions) {
        raw.push({
          part,
          n: item.n,
          sub: sub.q,
          sentence: [item.text, sub.q].filter(Boolean).join(' '),
          options: sub.options,
          answer: Number(sub.answer),
          img: item.img,
        })
      }
    } else {
      raw.push({
        part,
        n: item.n,
        sub: '',
        sentence: item.text || `問題${part} ${item.n}番`,
        options: item.options,
        answer: Number(item.answer),
        img: item.img,
      })
    }
  }
}

const count = raw.length

const questions = raw.map((item, i) => ({
  id: 75 + i + 1,
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
  title: `N2 聴解 ${count} 题`,
  shortTitle: `聴解 ${count} 题`,
  type: '听解',
  origin: 'external',
  provider: '',
  providerNote: '',
  url: '',
  count,
  parts,
  audioQr,
  randomable: false,
}]

export const supplementQuestions = questions

export default { supplementPacks, supplementQuestions }
