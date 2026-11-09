// 题库统一入口：合并 N2 / N3 两个级别的题目 + 内置 N2/N3 真题
// - 每道题统一附带 level 与 key（level:id）字段
// - mockInfo 的键为 "级别:回数"（如 "N2:1"），便于按级别区分
import { questions as n2Questions, mockInfo as n2Mock } from './questions-n2'
import { questions as n3Questions, mockInfo as n3Mock } from './questions-n3'
import { zhentiN2 } from './zhentiN2'
import { zhentiN3 } from './zhentiN3'

// 支持的级别（仅有题库数据的级别；全局等级为 N5~N1，见 levelStore）
export const LEVELS = ['N2', 'N3']

// 每个级别的展示配置（模拟测试回数 = 可用的回数；N3 暂未开放，占位入口使用 mockSlot）
export const levelConfig = {
  N2: { id: 'N2', name: 'N2', title: 'N2 级', mockCount: 5 },
  N3: { id: 'N3', name: 'N3', title: 'N3 级', mockCount: 5 },
}

// 级别展示标题（N5~N1 通用）
export function levelTitle(level) {
  return levelConfig[level]?.title || level + ' 级'
}

// 该级别是否已有刷题题库（N5/N4/N1 暂无题库，显示待补充）
export function hasQuizData(level) {
  return !!levelConfig[level]
}

function decorate(list, level) {
  return list.map(q => ({ ...q, level, key: level + ':' + q.id }))
}

// 真题 id 偏移，按级别分配不同基数，避免两套真题 examNo 相同导致 id 冲突
const ZHENTI_ID_OFFSET = { N2: 200000, N3: 100000 }

// 内置真题：随应用打包的 N3（2024-12，70 题）与 N2（2021-12，71 题）
function decorateZhenti(data, level) {
  const base = ZHENTI_ID_OFFSET[level] || 300000
  return (data.questions || []).map(q => ({
    ...q,
    level,
    packId: data.packId,
    session: data.session,
    source: 'zhenti',
    id: base + q.examNo,
    key: `${level}:pack:${data.packId}:${q.examNo}`,
  }))
}

export const zhentiQuestions = [
  ...decorateZhenti(zhentiN2, 'N2'),
  ...decorateZhenti(zhentiN3, 'N3'),
]

// 真题包元信息（供真题专区 / 练习页入口展示）
export const zhentiPacks = [
  { level: 'N2', session: '2021-12', packId: 'n2-zhenti', count: decorateZhenti(zhentiN2, 'N2').length },
  { level: 'N3', session: '2024-12', packId: 'n3-zhenti', count: decorateZhenti(zhentiN3, 'N3').length },
]

// 合并后的全量题目（N2 + N3 + 内置真题）
export const questions = [
  ...decorate(n2Questions, 'N2'),
  ...decorate(n3Questions, 'N3'),
  ...zhentiQuestions,
]

// 按级别取题（不含模拟题；内置真题并入同一数据流）
export function levelQuestions(level) {
  return [
    ...questions.filter(q => q.level === level && !q.mock),
  ]
}

// 按级别取题（含模拟题；内置真题并入同一数据流）
export function levelQuestionsAll(level) {
  return [
    ...questions.filter(q => q.level === level),
  ]
}

// 仅取某级别的内置真题（真题专项用）
export function levelPackQuestions(level, packId) {
  return zhentiQuestions.filter(q => q.level === level && (!packId || q.packId === packId))
}

// 按级别取模拟题
export function levelMockQuestions(level, mockId) {
  return questions.filter(q => q.level === level && q.mock === mockId)
}

// mockInfo：键 = "级别:回数"
export const mockInfo = {
  ...Object.fromEntries(Object.entries(n2Mock).map(([k, v]) => [
    'N2:' + k, { ...v, level: 'N2', mockKey: 'N2:' + k, mockId: Number(k) },
  ])),
  ...Object.fromEntries(Object.entries(n3Mock).map(([k, v]) => [
    'N3:' + k, { ...v, level: 'N3', mockKey: 'N3:' + k, mockId: Number(k) },
  ])),
}

// 获取某级别某回的模拟信息（不存在则返回 null）
export function getMock(level, mockId) {
  return mockInfo[level + ':' + mockId] || null
}
