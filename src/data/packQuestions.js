// 拓展包结构化题目的运行时注册表
// - 已安装拓展包（含 questions.json）的题目在运行时并入现有做题体系（data/questions）
// - key 形如 "N3:pack:n3-zhenti:1"，与静态题库（"N3:1"）不冲突
import { ref } from 'vue'

export const packPool = ref([])

const ID_OFFSET = 100000 // 避免与静态题库 id 冲突（静态每题 id 为 1..N）

export function registerPackQuestions(pack) {
  const list = (pack.questions || []).map(q => ({
    ...q,
    level: pack.level,
    packId: pack.packId,
    session: pack.session,
    source: 'zhenti',
    id: ID_OFFSET + q.examNo,
    key: `${pack.level}:pack:${pack.packId}:${q.examNo}`,
  }))
  // 幂等：同名包先移除旧数据再写入
  packPool.value = [...packPool.value.filter(q => q.packId !== pack.packId), ...list]
}

export function clearPackQuestions(packId) {
  packPool.value = packPool.value.filter(q => q.packId !== packId)
}

export function packQuestionsFor(level, source) {
  return packPool.value.filter(q => q.level === level && (!source || q.source === source))
}
