// 补充题库入口：独立于红蓝宝书题库（questions.js），
// 不并入 levelQuestions / levelQuestionsAll，避免与主题库混在一起。
import { supplementPacks as n3Packs, supplementN3Questions } from './supplement-n3'
import { supplementPacks as n2Packs, supplementN2Questions } from './supplement-n2'
import { mock2Questions } from './supplement-n2-mock2'
import { supplementPacks as listenPacks, supplementQuestions as listenQuestions } from './supplement/listening-n2-mock1'
import { supplementPacks as listen2Packs, supplementQuestions as listen2Questions } from './supplement/listening-n2-mock2'

// 语言知识三域按类别合并（不按套区分）：模拟题2 并入模拟题1 的三个题包。
// 听解保留独立题包，因为每套共用不同的书页二维码音频。
const LANG_TARGET = {
  'n2-mock2-vocab-32': 'n2-mock1-vocab-32',
  'n2-mock2-grammar-22': 'n2-mock1-grammar-22',
  'n2-mock2-reading-21': 'n2-mock1-reading-21',
}

const nextNo = {}
for (const q of supplementN2Questions) {
  nextNo[q.packId] = Math.max(nextNo[q.packId] || 0, q.no)
}

const extraN2Questions = mock2Questions.map(q => {
  const packId = LANG_TARGET[q.packId] || q.packId
  nextNo[packId] = (nextNo[packId] || 0) + 1
  return { ...q, packId, no: nextNo[packId] }
})

const n2PacksMerged = n2Packs.map(base => {
  const extra = extraN2Questions.filter(q => q.packId === base.id)
  const count = base.count + extra.length
  const name = (base.shortTitle || base.title).replace(/\s*\d+\s*题$/, '').trim()
  const parts = base.parts.map(part => ({
    ...part,
    count: part.count + extra.filter(q => q.part === part.no).length,
  }))
  return {
    ...base,
    title: `N2 ${name} ${count} 题`,
    shortTitle: `${name} ${count} 题`,
    count,
    parts,
  }
})

export const supplementPacks = [...n2PacksMerged, ...listenPacks, ...listen2Packs, ...n3Packs]

function makeKey(q) {
  return `sup:${q.level}:${q.packId}:${q.no}`
}

export const supplementQuestions = [...supplementN2Questions, ...extraN2Questions, ...listenQuestions, ...listen2Questions, ...supplementN3Questions].map(q => ({
  ...q,
  key: makeKey(q),
  source: 'supplement',
  bank: 'supplement',
}))

export function supplementQuestionsOfLevel(level) {
  return supplementQuestions.filter(q => q.level === level)
}

export function supplementQuestionsOf(level, packId = '', part = 0) {
  let list = supplementQuestions.filter(q => q.level === level)
  if (packId) list = list.filter(q => q.packId === packId)
  if (part) list = list.filter(q => q.part === part)
  return list.slice().sort((a, b) => (a.packId === b.packId ? a.no - b.no : a.packId.localeCompare(b.packId)))
}

export function supplementPacksOfLevel(level) {
  return supplementPacks.filter(p => p.level === level)
}

// 某等级的补充题库统计（独立计数，取自 answered 的 sup: 前缀）
export function supplementStatsOfLevel(level, answered = {}) {
  const total = supplementQuestionsOfLevel(level).length
  let done = 0
  let correct = 0
  for (const [k, v] of Object.entries(answered || {})) {
    if (!k.startsWith(`sup:${level}:`)) continue
    done++
    if (v && v.correct) correct++
  }
  return {
    total,
    done,
    pct: total ? Math.round(done / total * 100) : 0,
    rate: done ? Math.round(correct / done * 100) : null,
  }
}

export function supplementPackStats(packId, level, answered = {}) {
  const list = supplementQuestions.filter(q => q.packId === packId)
  let done = 0
  let correct = 0
  for (const q of list) {
    const a = answered[q.key]
    if (a) {
      done++
      if (a.correct) correct++
    }
  }
  return {
    total: list.length,
    done,
    pct: list.length ? Math.round(done / list.length * 100) : 0,
    rate: done ? Math.round(correct / done * 100) : null,
  }
}
