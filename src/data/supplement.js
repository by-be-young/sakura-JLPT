// 补充题库入口：独立于红蓝宝书题库（questions.js），
// 不并入 levelQuestions / levelQuestionsAll，避免与主题库混在一起。
import { supplementPacks as packs, supplementN3Questions } from './supplement-n3'

export const supplementPacks = packs

function makeKey(q) {
  return `sup:${q.level}:${q.packId}:${q.no}`
}

export const supplementQuestions = supplementN3Questions.map(q => ({
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
