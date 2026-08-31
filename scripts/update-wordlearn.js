import fs from 'fs'
const p = 'D:/日语自学网站/src/views/WordLearn.vue'
let c = fs.readFileSync(p, 'utf-8')
const NL = '\n'

// 1. 统计区加"已背完"
const old1 = `      <div class="stat-item">
        <span class="stat-num">{{ dueCount }}</span>
        <span class="stat-label">待复习</span>
      </div>`
const new1 = `      <div class="stat-item">
        <span class="stat-num">{{ masteredCount }}</span>
        <span class="stat-label">已背完</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">{{ dueCount }}</span>
        <span class="stat-label">待复习</span>
      </div>`
if (!c.includes(old1)) { console.log('ERROR: old1 not found'); process.exit(1) }
c = c.replace(old1, new1)

// 2. 功能入口区加"重置"按钮
const old2 = `      <div class="func-card" :class="{ disabled: noteCount === 0 }" @click="showNotes = true">
        <div class="func-icon">📝</div>
        <div class="func-name">笔记</div>
        <div class="func-desc">{{ noteCount ? '查看 ' + noteCount + ' 条笔记' : '还没有笔记' }}</div>
      </div>
    </div>`
const new2 = `      <div class="func-card" :class="{ disabled: noteCount === 0 }" @click="showNotes = true">
        <div class="func-icon">📝</div>
        <div class="func-name">笔记</div>
        <div class="func-desc">{{ noteCount ? '查看 ' + noteCount + ' 条笔记' : '还没有笔记' }}</div>
      </div>
    </div>

    <!-- 重置背词记录 -->
    <div class="reset-area">
      <button class="btn btn-ghost btn-sm" @click="confirmResetWords">🗑 清空背词记录</button>
    </div>`
if (!c.includes(old2)) { console.log('ERROR: old2 not found'); process.exit(1) }
c = c.replace(old2, new2)

// 3. 脚本：导入 availableTypes
const old3 = `import { buildQuizRound, getNewWords } from '../composables/wordQuiz'`
const new3 = `import { buildQuizRound, getNewWords, availableTypes } from '../composables/wordQuiz'`
if (!c.includes(old3)) { console.log('ERROR: old3 not found'); process.exit(1) }
c = c.replace(old3, new3)

// 4. 脚本：增加 masteredCount 和确认重置函数
const old4 = `const learnedCount = computed(() => pool.value.filter(w => store.isLearned(w.id)).length)
const dueCount = computed(() => pool.value.filter(w => store.isDueForReview(w.id)).length)
const noteCount = computed(() => pool.value.filter(w => store.hasNote(w.id)).length)
const noteWords = computed(() => pool.value.filter(w => store.hasNote(w.id)))`
const new4 = `const learnedCount = computed(() => pool.value.filter(w => store.isLearned(w.id)).length)
const masteredCount = computed(() => pool.value.filter(w => store.isLearned(w.id) && store.isMastered(w.id, availableTypes(w))).length)
const dueCount = computed(() => pool.value.filter(w => store.isLearned(w.id) && !store.isMastered(w.id, availableTypes(w))).length)
const noteCount = computed(() => pool.value.filter(w => store.hasNote(w.id)).length)
const noteWords = computed(() => pool.value.filter(w => store.hasNote(w.id)))`
if (!c.includes(old4)) { console.log('ERROR: old4 not found'); process.exit(1) }
c = c.replace(old4, new4)

// 5. 复习：改为"未背完的词"
const old5 = `// 复习
function startReview() {
  if (dueCount.value === 0) return
  const due = pool.value.filter(w => store.isDueForReview(w.id))
  quizQuestions.value = buildQuizRound(due, pool.value)
  quizIndex.value = 0
  quizAnswered.value = false
  quizCorrect.value = 0
  quizFinished.value = false
  quizMode.value = 'review'
}`
const new5 = `// 复习：抽取"已学但未背完"的词
function startReview() {
  if (dueCount.value === 0) return
  const due = pool.value.filter(w => store.isLearned(w.id) && !store.isMastered(w.id, availableTypes(w)))
  quizQuestions.value = buildQuizRound(due, pool.value, (id) => store.doneTypes(id))
  quizIndex.value = 0
  quizAnswered.value = false
  quizCorrect.value = 0
  quizFinished.value = false
  quizMode.value = 'review'
}`
if (!c.includes(old5)) { console.log('ERROR: old5 not found'); process.exit(1) }
c = c.replace(old5, new5)

// 6. 学习测验：buildQuizRound 传入 doneTypes，标记题型完成
const old6 = `function startLearnQuiz() {
  quizQuestions.value = buildQuizRound(learnWords.value, pool.value)`
const new6 = `function startLearnQuiz() {
  quizQuestions.value = buildQuizRound(learnWords.value, pool.value, (id) => store.doneTypes(id))`
if (!c.includes(old6)) { console.log('ERROR: old6 not found'); process.exit(1) }
c = c.replace(old6, new6)

// 7. handleQuizAnswer：答对标记题型完成
const old7 = `function handleQuizAnswer(correct) {
  quizAnswered.value = true
  if (correct) quizCorrect.value++
  const w = currentQuizWord()
  if (w) store.recordAnswer(w.id, correct)
}`
const new7 = `function handleQuizAnswer(correct) {
  quizAnswered.value = true
  if (correct) quizCorrect.value++
  const q = quizQuestions.value[quizIndex.value]
  if (q) {
    store.recordAnswer(q.wordId, correct)
    if (correct) store.markTypeDone(q.wordId, q.type)
  }
}`
if (!c.includes(old7)) { console.log('ERROR: old7 not found'); process.exit(1) }
c = c.replace(old7, new7)

// 8. 添加确认重置函数（在 saveNote 后）
const old8 = `function saveNote() {
  store.setNote(editingWord.value.id, editingText.value)
  editingWord.value = null
}`
const new8 = `function saveNote() {
  store.setNote(editingWord.value.id, editingText.value)
  editingWord.value = null
}

function confirmResetWords() {
  if (confirm('确定要清空所有背词记录（学习进度、题型完成、笔记）吗？题库答题记录不受影响。')) {
    store.resetAll()
    exitQuiz()
    learnMode.value = false
    showNotes.value = false
  }
}`
if (!c.includes(old8)) { console.log('ERROR: old8 not found'); process.exit(1) }
c = c.replace(old8, new8)

// 9. 增加 reset-area 样式
const old9 = `.function-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}`
const new9 = `.function-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.reset-area {
  text-align: center;
  margin-bottom: 16px;
}`
if (!c.includes(old9)) { console.log('ERROR: old9 not found'); process.exit(1) }
c = c.replace(old9, new9)

fs.writeFileSync(p, c, 'utf-8')
console.log('Done: 9 replacements applied')
