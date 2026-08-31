// 背词题型生成逻辑
// 支持5种题型：
// 1. kana2kanji  看假名选汉字（需有汉字）
// 2. kanji2kana  看汉字选假名（需有汉字）
// 3. word2meaning 看单词选释义
// 4. meaning2word 看释义选单词
// 5. fillblank    例句挖空选单词（需例句包含目标词）

// 判断单词是否真的含汉字（排除kanji字段为纯假名的情况）
function hasRealKanji(word) {
  return !!word.kanji && /[\u4e00-\u9fff]/.test(word.kanji)
}

// 某词的可用题型（按词条属性判定）
export function availableTypes(word) {
  const types = []
  if (hasRealKanji(word)) {
    types.push('kana2kanji', 'kanji2kana')
  }
  if (word.meaning) {
    types.push('word2meaning', 'meaning2word')
  }
  if (word.examples && word.examples.some(e => e.jp && (word.kanji ? e.jp.includes(word.kanji) : e.jp.includes(word.kana)))) {
    types.push('fillblank')
  }
  return types
}

// 从词库中取"目标词附近的单词"作为干扰项候选池
// 说明：词库按读音（五十音）排序，相邻词的读音/字形相近，
//       用作干扰项更贴近真实考题（读音题干扰项读音相近）。
function buildNearbyPool(pool, target, range = 8) {
  const idx = pool.findIndex(w => w.id === target.id)
  if (idx < 0) return pool.filter(w => w.id !== target.id)
  const nearbyIds = new Set()
  for (let i = 1; i <= range; i++) {
    if (idx - i >= 0) nearbyIds.add(pool[idx - i].id)
    if (idx + i < pool.length) nearbyIds.add(pool[idx + i].id)
  }
  const candidates = pool.filter(w => nearbyIds.has(w.id))
  return candidates.length >= 3 ? candidates : pool.filter(w => w.id !== target.id)
}

// 生成4个选项（1个正确答案 + 3个干扰项）
function buildOptions(candidates, correctValue, keyFn, maxTries = 100) {
  const options = [correctValue]
  const used = new Set([keyFn(correctValue)])
  const list = [...candidates]
  let tries = 0
  while (options.length < 4 && tries < maxTries) {
    tries++
    const idx = Math.floor(Math.random() * list.length)
    const cand = list[idx]
    const key = keyFn(cand)
    if (!used.has(key)) {
      options.push(cand)
      used.add(key)
    }
  }
  // 随机打乱
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[options[i], options[j]] = [options[j], options[i]]
  }
  const correctIndex = options.indexOf(correctValue)
  return { options, correctIndex }
}

// 从例句中提取挖空位置：遍历例句，找一个包含目标词（kanji或kana）的例句挖空
function buildFillBlank(target, pool) {
  const targetStr = target.kanji || target.kana
  for (const ex of target.examples) {
    if (!ex.jp) continue
    const idx = ex.jp.indexOf(targetStr)
    if (idx >= 0) {
      return {
        before: ex.jp.slice(0, idx),
        after: ex.jp.slice(idx + targetStr.length),
        zh: ex.zh || '',
      }
    }
  }
  return null
}

// 生成一道题
export function generateQuestion(target, pool, type) {
  const nearby = buildNearbyPool(pool, target)
  switch (type) {
    case 'kana2kanji': {
      if (!hasRealKanji(target)) return null
      const candidates = nearby.filter(w => w.kanji && w.kanji !== target.kanji).map(w => w.kanji)
      const { options, correctIndex } = buildOptions(candidates, target.kanji, v => v)
      return {
        type,
        prompt: target.kana,
        pitch: target.pitch,
        options,
        correctIndex,
        answerText: target.kanji,
      }
    }
    case 'kanji2kana': {
      if (!hasRealKanji(target)) return null
      const candidates = nearby.filter(w => w.kana && w.kana !== target.kana).map(w => w.kana)
      const { options, correctIndex } = buildOptions(candidates, target.kana, v => v)
      return {
        type,
        prompt: target.kanji,
        options,
        correctIndex,
        answerText: target.kana,
        optionPitches: options.map(k => {
          const w = pool.find(x => x.kana === k)
          return w ? w.pitch : []
        }),
      }
    }
    case 'word2meaning': {
      const candidates = nearby.filter(w => w.meaning && w.meaning !== target.meaning).map(w => w.meaning)
      const { options, correctIndex } = buildOptions(candidates, target.meaning, v => v)
      return {
        type,
        prompt: target,
        options,
        correctIndex,
        answerText: target.meaning,
      }
    }
    case 'meaning2word': {
      const candidates = nearby.filter(w => w !== target && (w.kanji || w.kana))
      const { options, correctIndex } = buildOptions(candidates, target, w => w.id)
      return {
        type,
        prompt: target.meaning,
        options,
        correctIndex,
        answerText: target.kanji || target.kana,
      }
    }
    case 'fillblank': {
      if (!target.examples || !target.examples.length) return null
      const blank = buildFillBlank(target, pool)
      if (!blank) return null
      const candidates = nearby.filter(w => w !== target && (w.kanji || w.kana))
      const { options, correctIndex } = buildOptions(candidates, target, w => w.id)
      return {
        type,
        prompt: blank,
        options,
        correctIndex,
        answerText: target.kanji || target.kana,
      }
    }
    default:
      return null
  }
}

// 为一组单词生成一轮题目：
// 对每个词，生成其所有【可用且未完成】的题型（每个题型一题）
// 传入 getDoneTypes(wordId) 返回已完成题型集合
export function buildQuizRound(words, pool, getDoneTypes) {
  const questions = []
  for (const w of words) {
    const done = getDoneTypes ? getDoneTypes(w.id) : new Set()
    for (const t of availableTypes(w)) {
      if (done.has(t)) continue
      const q = generateQuestion(w, pool, t)
      if (q) {
        questions.push({ ...q, wordId: w.id })
      }
    }
  }
  // 打乱题目顺序
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[questions[i], questions[j]] = [questions[j], questions[i]]
  }
  return questions
}

// 新学：从未学单词中随机抽取
export function getNewWords(allWords, learnedSet, count = 10) {
  const unseen = allWords.filter(w => !learnedSet.has(w.id))
  // Fisher-Yates 洗牌
  const arr = [...unseen]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, count)
}

// 复习：返回需要复习的单词（已学但未背完，或生疏）
export function getReviewWords(allWords, isDue, isMastered) {
  return allWords.filter(w => isLearnedCheck(w) && !isMastered(w.id))
}
function isLearnedCheck(w) { return true } // 占位，实际由调用方过滤
