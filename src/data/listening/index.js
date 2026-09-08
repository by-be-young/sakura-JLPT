// 听解板块总索引：绿宝书《新日本语能力考试N2听解（详解+练习）》Part1 基础编 Unit1-8 + Part2 攻略編 Unit1
// 每个单元含三个独立板块：词汇（聴いてみよう/攻略編无词汇）、题目（問題）、补充知识（聴解の基礎知識/試験対策）
// 分单元分批上线：当前已收录 Unit1-9
import unit1 from './unit1/index.js'
import unit2 from './unit2/index.js'
import unit3 from './unit3/index.js'
import unit4 from './unit4/index.js'
import unit5 from './unit5/index.js'
import unit6 from './unit6/index.js'
import unit7 from './unit7/index.js'
import unit8 from './unit8/index.js'
import unit9 from './unit9/index.js'

export const listeningUnits = [unit1, unit2, unit3, unit4, unit5, unit6, unit7, unit8, unit9]

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
  const kCount = u.knowledge.parts.reduce((s, p) => s + (p.pairs ? p.pairs.length : p.items ? p.items.length : 0), 0)
  return { words: wordCount, questions: qCount, knowledge: kCount }
}
