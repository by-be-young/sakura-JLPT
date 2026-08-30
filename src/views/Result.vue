<template>
  <div class="container">
    <div class="card">
      <div class="result-hero">
        <div class="result-score">{{ score }}<span class="unit">分</span></div>
        <p style="color:var(--ink-light); margin-top:8px; font-size:15px;">
          {{ modeLabel }} · 共 {{ total }} 题
        </p>
      </div>

      <div class="result-detail">
        <div class="stat-card">
          <div class="num" style="color:var(--green);">{{ correct }}</div>
          <div class="label">答对</div>
        </div>
        <div class="stat-card">
          <div class="num" style="color:var(--red);">{{ wrong }}</div>
          <div class="label">答错</div>
        </div>
        <div class="stat-card">
          <div class="num">{{ accuracy }}%</div>
          <div class="label">正确率</div>
        </div>
      </div>

      <div style="text-align:center; margin-top:24px; display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
        <button class="btn btn-primary" @click="retry">再练一次</button>
        <button class="btn btn-secondary" @click="reviewWrong" v-if="wrong > 0">复习错题</button>
        <button class="btn btn-ghost" @click="$router.push('/')">返回首页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { questions } from '../data/questions'
import { useStore } from '../store/useStore'

const route = useRoute()
const router = useRouter()
const store = useStore()

const fromMode = computed(() => route.query.from || '')
const mockId = computed(() => Number(route.query.mock) || 0)

const modeLabel = computed(() => {
  if (fromMode.value === 'mock') return `第${mockId.value}回模拟测试`
  const map = { sequential: '顺序练习', random: '随机练习', wrong: '错题重做', favorites: '收藏练习' }
  return map[fromMode.value] || '练习'
})

// 本次会话的题目范围
const sessionQuestions = computed(() => {
  if (fromMode.value === 'mock') {
    return questions.filter(q => q.mock === mockId.value)
  }
  return questions
})

const total = computed(() => sessionQuestions.value.length)
const correct = computed(() => sessionQuestions.value.filter(q => {
  const a = store.getAnswer(q.id)
  return a && a.correct
}).length)
const wrong = computed(() => total.value - correct.value)
const accuracy = computed(() => total.value ? Math.round(correct.value / total.value * 100) : 0)
const score = computed(() => accuracy.value)

function retry() {
  if (fromMode.value === 'mock') {
    router.push({ name: 'quiz', params: { mode: 'mock' }, query: { mock: mockId.value } })
  } else {
    router.push({ name: 'quiz', params: { mode: fromMode.value } })
  }
}

function reviewWrong() {
  router.push({ name: 'quiz', params: { mode: 'wrong' } })
}
</script>
