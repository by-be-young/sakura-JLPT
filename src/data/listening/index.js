// 听解板块总索引：绿宝书《新日本语能力考试N2听解（详解+练习）》Part1 基础编 Unit1-8
// 每个单元含三个独立板块：词汇（聴いてみよう）、题目（問題）、补充知识（聴解の基礎知識）
// 分单元分批上线：当前已收录 Unit1
import unit1 from './unit1/index.js'

export const listeningUnits = [unit1]

// 按 id 取单元
export function getListeningUnit(id) {
  return listeningUnits.find(u => u.id === Number(id)) || null
}

// 单元统计（首页展示）
export function unitSummary(u) {
  const wordCount = u.words.groups.reduce((s, g) => s + g.list.length, 0)
  let qCount = 0
  for (const sec of u.questions.sections) {
    if (sec.items) qCount += sec.items.length
    else if (sec.convs) qCount += sec.convs.reduce((s, c) => s + c.answers.length, 0)
    else if (sec.parts) qCount += sec.parts.reduce((s, p) => s + p.items.length, 0)
  }
  const kCount = u.knowledge.parts.reduce((s, p) => s + p.pairs.length, 0)
  return { words: wordCount, questions: qCount, knowledge: kCount }
}
