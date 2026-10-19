// 听解板块 N4 总索引：绿宝书《新日本语能力考试N4听解》Part1 基础篇 Unit1-6（300題）+ Part2 攻略篇 Unit1-4（84題）+ Part3 实践篇（56題）
// 每个单元含三个独立板块：词汇（聴いてみよう/攻略篇・实践篇无词汇）、题目（練習/問題）、补充知识（会话表达/考试对策等）
import unit1 from './unit1/index.js'
import unit2 from './unit2/index.js'
import unit3 from './unit3/index.js'
import unit4 from './unit4/index.js'
import unit5 from './unit5/index.js'
import unit6 from './unit6/index.js'
import unit7 from './unit7/index.js'
import unit8 from './unit8/index.js'
import unit9 from './unit9/index.js'
import unit10 from './unit10/index.js'
import unit11 from './unit11/index.js'
import unit12 from './unit12/index.js'

export const listeningUnits = [unit1, unit2, unit3, unit4, unit5, unit6, unit7, unit8, unit9, unit10, unit11, unit12]

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
