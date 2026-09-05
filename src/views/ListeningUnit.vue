<template>
  <div class="container" v-if="unit">
    <!-- 单元头部 -->
    <div class="unit-header">
      <button class="btn btn-ghost btn-sm back-btn" @click="$router.push('/listening')">← 听解</button>
      <div class="unit-title-wrap">
        <h2>Unit {{ unit.id }} · {{ unit.title }}</h2>
        <p class="unit-theme">{{ unit.theme }}</p>
        <p class="unit-range">{{ unit.questionsRange }} · {{ unit.knowledgeTitle }}</p>
      </div>
    </div>

    <!-- 板块切换 -->
    <div class="tabs">
      <button v-for="t in tabs" :key="t.key" class="tab" :class="{ active: tab === t.key }" @click="tab = t.key">
        <span class="tab-emoji">{{ t.emoji }}</span>{{ t.label }}
      </button>
    </div>

    <!-- ============ 词汇板块（左右翻页卡片） ============ -->
    <section v-if="tab === 'words'">
      <div class="qr-banner">
        <img :src="qrImg(9)" alt="音频二维码" />
        <div class="qr-text">
          <div class="qr-title">🔊 扫一扫，听音频</div>
          <div class="qr-sub">本单元词汇音频：{{ unit.words.groups[0].audio }} ~ {{ unit.words.groups[unit.words.groups.length - 1].audio }}</div>
          <div class="qr-tip">扫码后按编号选择对应音频组</div>
        </div>
      </div>

      <div class="flip-wrap">
        <transition :name="wordsAnim">
          <div class="block-card flip-card" :key="'w' + wordsIndex">
            <div class="group-head">
              <h3>{{ curWords.group < 9 ? '語彙のまとめ' + curWords.group : '表現のまとめ' }}（{{ curWords.title }}）</h3>
              <span class="audio-tag">🎧 {{ curWords.audio }}</span>
            </div>
            <div class="word-table">
              <div v-for="(item, i) in curWords.list" :key="i" class="word-row">
                <span class="word-jp" v-html="furiOn && item.furi ? item.furi : item.w"></span>
                <span v-if="!furiOn && item.kana" class="word-kana">{{ item.kana }}</span>
                <span class="word-mean">{{ item.m }}</span>
              </div>
            </div>
          </div>
        </transition>
      </div>
      <div class="flip-pager">
        <button class="page-btn" :disabled="wordsIndex <= 0" @click="wordsPrev">← 上一组</button>
        <span class="page-indicator">第 {{ wordsIndex + 1 }} / {{ unit.words.groups.length }} 组</span>
        <button class="page-btn" :disabled="wordsIndex >= unit.words.groups.length - 1" @click="wordsNext">下一组 →</button>
      </div>
    </section>

    <!-- ============ 题目板块 ============ -->
    <section v-if="tab === 'questions'">
      <div class="qr-banner">
        <img :src="qrImg(14)" alt="音频二维码" />
        <div class="qr-text">
          <div class="qr-title">🔊 扫一扫，听音频</div>
          <div class="qr-sub">本单元题目音频：{{ unit.questions.sections[0].audio }} ~ {{ unit.questions.sections[unit.questions.sections.length - 1].audio }}</div>
          <div class="qr-tip">先扫码听录音，再作答；点击选项或「查看答案」核对</div>
        </div>
      </div>

      <div class="flip-wrap">
        <transition :name="qAnim">
          <div class="block-card flip-card" :key="'q' + qIndex">
            <div class="group-head">
              <h3>{{ curSec.section }}. {{ curSec.title }}</h3>
              <span class="audio-tag">🎧 {{ curSec.audio }}</span>
            </div>

        <!-- 例题（kana 题型） -->
        <div v-if="curSec.example" class="q-example">
          <span class="q-example-tag">例題</span>
          <span v-html="jp(curSec.example.text, curSec.example.textFuri)"></span>
          <span class="q-example-ans">（{{ curSec.example.kanji }}）</span>
        </div>

        <!-- 选择题 -->
        <template v-if="curSec.type === 'select'">
        <div v-for="item in curSec.items" :key="item.n" class="q-item">
          <div class="q-no">{{ item.n }}</div>
          <div class="q-body">
            <div class="q-text" v-html="jp(item.text, item.textFuri)"></div>
            <div class="q-options">
              <button v-for="(opt, i) in item.options" :key="i" class="q-opt"
                :class="optClass(item, 'ab'[i])" :disabled="!!picked(item)"
                @click="choose(item, 'ab'[i])">
                <span class="opt-num">{{ 'ab'[i] }}</span>{{ opt }}
              </button>
            </div>
            <div v-if="picked(item)" class="q-ans-box">
              <div class="q-ans-line" :class="picked(item).correct ? 'ok' : 'no'">
                {{ picked(item).correct ? '✓ 回答正确' : '✗ 正确答案 ' + item.answer }}
              </div>
              <div v-if="item.script" class="q-script">
                <span class="q-script-label">🔉 听力原文</span>
                <span v-html="jp(item.script, item.scriptFuri)"></span>
              </div>
            </div>
          </div>
        </div>
        </template>

        <!-- 补假名 / 补短语 / 填词 -->
        <template v-if="curSec.type === 'kana' || curSec.type === 'phrase'">
          <div v-for="item in curSec.items" :key="item.n + (item.sub || '')" class="q-item">
            <div class="q-no">{{ item.n }}<span v-if="item.sub" class="q-sub">{{ item.sub }}</span></div>
            <div class="q-body">
              <div class="q-text" v-html="jp(item.text, item.textFuri)"></div>
              <button class="btn btn-secondary btn-sm ans-btn" @click="toggleAns(item)">
                {{ shown(item) ? '收起答案' : '查看答案' }}
              </button>
              <div v-if="shown(item)" class="q-ans-box">
                <div class="q-ans-line ok">
                  答案：<b v-html="jp(item.answer, item.answerFuri)"></b>
                  <span v-if="item.kanji" class="q-ans-kanji">（{{ item.kanji }}）</span>
                </div>
                <div v-if="item.script" class="q-script">
                  <span class="q-script-label">🔉 听力原文</span>
                  <span v-html="jp(item.script, item.scriptFuri)"></span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 填词（外来语/汉字词分组） -->
        <template v-if="curSec.type === 'word'">
          <div v-for="(part, pi) in curSec.parts" :key="pi" class="q-part">
            <div class="q-part-name">{{ part.name }}</div>
            <div v-for="item in part.items" :key="item.n" class="q-item">
              <div class="q-no">{{ item.n }}</div>
              <div class="q-body">
                <div class="q-text" v-html="jp(item.text, item.textFuri)"></div>
                <button class="btn btn-secondary btn-sm ans-btn" @click="toggleAns(item)">
                  {{ shown(item) ? '收起答案' : '查看答案' }}
                </button>
                <div v-if="shown(item)" class="q-ans-box">
                  <div class="q-ans-line ok">
                    答案：<b v-html="jp(item.answer, item.answerFuri)"></b>
                    <span v-if="item.kana" class="q-ans-kana">（{{ item.kana }}）</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 会话填空 -->
        <template v-if="curSec.type === 'conv'">
          <div v-for="(conv, ci) in curSec.convs" :key="ci" class="q-conv">
            <div class="q-conv-name">{{ conv.name }}</div>
            <div v-for="(line, li) in conv.lines" :key="li" class="q-conv-line" :class="line.who === '男' ? 'male' : 'female'">
              <span class="q-conv-who">{{ line.who }}</span>
              <span class="q-conv-text" v-html="jp(line.text, line.textFuri)"></span>
            </div>
            <button class="btn btn-secondary btn-sm ans-btn" @click="toggleAns(conv)">
              {{ shown(conv) ? '收起答案' : '查看答案' }}
            </button>
            <div v-if="shown(conv)" class="q-ans-box">
              <div v-for="a in conv.answers" :key="a.n" class="q-ans-line ok q-conv-ans">
                <span class="q-ans-no">{{ a.n }}</span>
                <b v-html="jp(a.answer, a.answerFuri)"></b>
                <span v-if="a.kana" class="q-ans-kana">（{{ a.kana }}）</span>
              </div>
            </div>
          </div>
        </template>
          </div>
        </transition>
      </div>
      <div class="flip-pager">
        <button class="page-btn" :disabled="qIndex <= 0" @click="qPrev">← 上一大题</button>
        <span class="page-indicator">第 {{ qIndex + 1 }} / {{ unit.questions.sections.length }} 大题</span>
        <button class="page-btn" :disabled="qIndex >= unit.questions.sections.length - 1" @click="qNext">下一大题 →</button>
      </div>
    </section>

    <!-- ============ 补充知识板块（左右翻页卡片） ============ -->
    <section v-if="tab === 'knowledge'">
      <div class="qr-banner">
        <img :src="qrImg(17)" alt="音频二维码" />
        <div class="qr-text">
          <div class="qr-title">🔊 扫一扫，听音频</div>
          <div class="qr-sub">本单元知识点音频：{{ unit.knowledge.audio }}</div>
          <div class="qr-tip">对照下方对比表逐组听辨</div>
        </div>
      </div>

      <div class="block-card k-intro-card">
        <h3 class="k-title">{{ unit.knowledge.title }}</h3>
        <p class="k-intro">{{ unit.knowledge.intro }}</p>
      </div>

      <div class="flip-wrap">
        <transition :name="knowAnim">
          <div class="block-card flip-card" :key="'k' + knowIndex">
            <div class="group-head">
              <h3>{{ curPart.heading }}</h3>
              <span class="audio-tag">🎧 {{ curPart.audio }}</span>
            </div>
            <p v-if="curPart.intro" class="k-part-intro">{{ curPart.intro }}</p>
            <div class="k-table-wrap">
              <table class="k-table">
                <thead>
                  <tr>
                    <th class="col-a">左</th>
                    <th>例</th>
                    <th class="col-b">右</th>
                    <th>例</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(p, i) in curPart.pairs" :key="i">
                    <td class="col-a">
                      <span class="k-word">{{ p.l }}</span>
                      <span v-if="p.lk" class="k-kanji">{{ p.lk }}</span>
                    </td>
                    <td class="k-ex" v-html="jp(p.le, p.leFuri)"></td>
                    <td class="col-b">
                      <span class="k-word">{{ p.r }}</span>
                      <span v-if="p.rk" class="k-kanji">{{ p.rk }}</span>
                    </td>
                    <td class="k-ex" v-html="jp(p.re, p.reFuri)"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </transition>
      </div>
      <div class="flip-pager">
        <button class="page-btn" :disabled="knowIndex <= 0" @click="knowPrev">← 上一部分</button>
        <span class="page-indicator">第 {{ knowIndex + 1 }} / {{ unit.knowledge.parts.length }} 部分</span>
        <button class="page-btn" :disabled="knowIndex >= unit.knowledge.parts.length - 1" @click="knowNext">下一部分 →</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { getListeningUnit } from '../data/listening'
import { useFurigana } from '../composables/useFurigana'

const route = useRoute()
const furigana = useFurigana()
const furiOn = computed(() => furigana.isEnabled.value)

const unit = computed(() => getListeningUnit(route.params.unit))
const tab = ref('words')
const tabs = [
  { key: 'words', label: '词汇', emoji: '📖' },
  { key: 'questions', label: '题目', emoji: '📝' },
  { key: 'knowledge', label: '补充知识', emoji: '💡' },
]

// ===== 左右翻页卡片（参考「文法」板块分页翻书） =====
const wordsIndex = ref(0)
const wordsAnim = ref('next')
const curWords = computed(() => unit.value.words.groups[wordsIndex.value])
function wordsNext() {
  if (wordsIndex.value >= unit.value.words.groups.length - 1) return
  wordsAnim.value = 'next'
  wordsIndex.value++
}
function wordsPrev() {
  if (wordsIndex.value <= 0) return
  wordsAnim.value = 'prev'
  wordsIndex.value--
}

const knowIndex = ref(0)
const knowAnim = ref('next')
const curPart = computed(() => unit.value.knowledge.parts[knowIndex.value])
function knowNext() {
  if (knowIndex.value >= unit.value.knowledge.parts.length - 1) return
  knowAnim.value = 'next'
  knowIndex.value++
}
function knowPrev() {
  if (knowIndex.value <= 0) return
  knowAnim.value = 'prev'
  knowIndex.value--
}

// ===== 题目板块翻页（每个大题一页） =====
const qIndex = ref(0)
const qAnim = ref('next')
const curSec = computed(() => unit.value.questions.sections[qIndex.value])
function qNext() {
  if (qIndex.value >= unit.value.questions.sections.length - 1) return
  qAnim.value = 'next'
  qIndex.value++
}
function qPrev() {
  if (qIndex.value <= 0) return
  qAnim.value = 'prev'
  qIndex.value--
}

// 键盘：A 上一页 D 下一页（词汇/题目/知识板块）
function onKeydown(e) {
  const t = e.target
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
  const k = e.key
  if (k === 'a' || k === 'A') {
    if (tab.value === 'words') wordsPrev()
    else if (tab.value === 'questions') qPrev()
    else if (tab.value === 'knowledge') knowPrev()
  } else if (k === 'd' || k === 'D') {
    if (tab.value === 'words') wordsNext()
    else if (tab.value === 'questions') qNext()
    else if (tab.value === 'knowledge') knowNext()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

// 二维码图片（按页码加载）
const qrImgs = import.meta.glob('../assets/listening/qr_p*.png', { eager: true, import: 'default' })
function qrImg(page) {
  const key = '../assets/listening/qr_p' + String(page).padStart(3, '0') + '.png'
  return qrImgs[key] || ''
}

// 振假名渲染：开启时显示 ruby，关闭时显示原文
function jp(text, furi) {
  return furiOn.value && furi ? furi : text
}

// 答案展开状态
const shownSet = reactive(new Set())
function toggleAns(item) {
  if (shownSet.has(item)) shownSet.delete(item)
  else shownSet.add(item)
}
function shown(item) { return shownSet.has(item) }

// 选择题作答状态（数据为静态 import，须存于组件内响应式对象）
const pick = reactive({})
function pkey(item) { return item.n + (item.sub || '') }
function picked(item) { return pick[pkey(item)] || null }
function choose(item, sel) {
  const k = pkey(item)
  if (pick[k] && pick[k].locked) return
  pick[k] = { locked: true, selected: sel, correct: sel === item.answer }
}
function optClass(item, key) {
  const p = picked(item)
  if (!p || !p.locked) return {}
  if (key === item.answer) return { correct: true }
  if (key === p.selected) return { wrong: true }
  return { dim: true }
}
</script>

<style scoped>
.unit-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}
.back-btn { flex-shrink: 0; }
.unit-title-wrap h2 { font-size: 24px; color: var(--ink); }
.unit-theme { font-size: 14px; color: var(--sakura-600); margin-top: 4px; }
.unit-range { font-size: 12px; color: var(--ink-light); margin-top: 2px; }

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: #fff;
  padding: 6px;
  border-radius: 20px;
  box-shadow: var(--shadow);
  border: 1px solid var(--sakura-50);
}
.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 0;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-light);
  transition: all 0.2s;
}
.tab:hover { color: var(--sakura-600); }
.tab.active {
  background: linear-gradient(135deg, var(--sakura-400), var(--sakura-600));
  color: #fff;
  box-shadow: 0 4px 12px rgba(244, 92, 142, 0.3);
}

/* 二维码横幅 */
.qr-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border: 1.5px solid var(--sakura-100);
  border-radius: var(--radius);
  padding: 14px 18px;
  margin-bottom: 16px;
  box-shadow: var(--shadow);
}
.qr-banner img {
  width: 92px;
  height: 92px;
  border-radius: 8px;
  border: 1px solid #eee;
  flex-shrink: 0;
}
.qr-title { font-size: 16px; font-weight: 700; color: var(--sakura-600); }
.qr-sub { font-size: 13px; color: var(--ink); margin-top: 4px; }
.qr-tip { font-size: 12px; color: var(--ink-light); margin-top: 3px; }

.block-card {
  background: #fff;
  border-radius: var(--radius);
  padding: 18px 20px;
  box-shadow: var(--shadow);
  border: 1px solid var(--sakura-50);
  margin-bottom: 16px;
}

/* ===== 左右翻页卡片 ===== */
.flip-wrap {
  position: relative;
  perspective: 1600px;
}
.flip-card {
  transform-style: preserve-3d;
  backface-visibility: hidden;
  margin-bottom: 0;
}
.flip-next-leave-active, .flip-prev-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}
.flip-next-enter-active, .flip-next-leave-active,
.flip-prev-enter-active, .flip-prev-leave-active {
  transition: transform 0.32s ease, opacity 0.32s ease;
}
.flip-next-enter-from { transform: rotateY(-88deg); opacity: 0.2; }
.flip-next-leave-to { transform: rotateY(88deg); opacity: 0.2; }
.flip-prev-enter-from { transform: rotateY(88deg); opacity: 0.2; }
.flip-prev-leave-to { transform: rotateY(-88deg); opacity: 0.2; }

.flip-pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 4px;
}
.page-btn {
  padding: 8px 16px;
  border-radius: 18px;
  border: 2px solid var(--sakura-100);
  background: #fff;
  color: var(--sakura-600);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.page-btn:hover:not(:disabled) { border-color: var(--sakura-300); background: var(--sakura-50); }
.page-btn:disabled { opacity: 0.4; cursor: default; }
.page-indicator { font-size: 13px; color: var(--ink-light); }
.kbd {
  display: inline-block;
  background: #fff;
  border: 1px solid var(--sakura-200);
  border-bottom-width: 2px;
  border-radius: 5px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--sakura-600);
  font-family: inherit;
}
.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.group-head h3 { font-size: 16px; color: var(--ink); }
.audio-tag {
  background: #fff3e0;
  color: #c8860f;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
  white-space: nowrap;
}

/* 词汇表 */
.word-table {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2px 24px;
}
.word-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 7px 4px;
  border-bottom: 1px dashed #f5e8ec;
}
.word-jp { font-size: 16px; color: var(--ink); font-weight: 600; }
.word-kana { font-size: 12px; color: var(--sakura-500); }
.word-mean { font-size: 13px; color: var(--ink-light); margin-left: auto; text-align: right; }
.word-row :deep(ruby) { ruby-position: over; }

/* 题目 */
.q-example {
  background: #f6f3ff;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  color: var(--ink);
  margin-bottom: 10px;
  line-height: 1.8;
}
.q-example-tag {
  background: #7a5c9e;
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  margin-right: 8px;
}
.q-example-ans { color: #7a5c9e; font-weight: 600; margin-left: 6px; }

.q-item {
  display: flex;
  gap: 12px;
  padding: 12px 4px;
  border-bottom: 1px dashed #f5e8ec;
}
.q-item:last-child { border-bottom: none; }
.q-no {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--sakura-100);
  color: var(--sakura-700);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
  position: relative;
}
.q-sub {
  position: absolute;
  right: -6px;
  bottom: -6px;
  background: #fff3e0;
  color: #c8860f;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.q-body { flex: 1; min-width: 0; }
.q-text {
  font-size: 15px;
  line-height: 1.8;
  color: var(--ink);
  margin-bottom: 8px;
}
.q-text :deep(ruby) { ruby-position: over; }

.q-options { display: flex; gap: 10px; flex-wrap: wrap; }
.q-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fff;
  border: 2px solid var(--sakura-100);
  border-radius: 20px;
  font-size: 14px;
  color: var(--ink);
  transition: all 0.2s;
}
.q-opt:hover:not(:disabled) { border-color: var(--sakura-300); background: var(--sakura-50); }
.q-opt.correct { border-color: var(--green); background: #e8f7ef; }
.q-opt.wrong { border-color: var(--red); background: #fdecee; }
.q-opt.dim { opacity: 0.5; }
.q-opt:disabled { cursor: default; }
.opt-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--sakura-100);
  color: var(--sakura-700);
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.q-opt.correct .opt-num { background: var(--green); color: #fff; }
.q-opt.wrong .opt-num { background: var(--red); color: #fff; }

.ans-btn { margin-top: 8px; }
.q-ans-box {
  margin-top: 10px;
  background: #fffbf0;
  border: 1px solid #f5e6c8;
  border-radius: 10px;
  padding: 10px 14px;
}
.q-ans-line { font-size: 14px; line-height: 1.8; }
.q-ans-line.ok { color: #7a7a20; }
.q-ans-line.ok b { color: #b8860b; }
.q-ans-line.no { color: var(--red); }
.q-ans-kanji { color: var(--ink); }
.q-ans-kana { color: var(--ink-light); font-size: 12px; margin-left: 4px; }
.q-script {
  margin-top: 6px;
  font-size: 13px;
  color: var(--ink);
  line-height: 1.8;
}
.q-script-label {
  color: var(--sakura-500);
  font-weight: 600;
  margin-right: 6px;
  font-size: 12px;
}
.q-script :deep(ruby), .q-ans-box :deep(ruby) { ruby-position: over; }

.q-part-name {
  font-size: 13px;
  font-weight: 700;
  color: #7a5c9e;
  background: #f6f3ff;
  display: inline-block;
  padding: 3px 12px;
  border-radius: 12px;
  margin: 8px 0 4px;
}
.q-conv {
  background: #fdf9f5;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 12px;
}
.q-conv-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--sakura-600);
  margin-bottom: 8px;
}
.q-conv-line {
  display: flex;
  gap: 8px;
  font-size: 14px;
  line-height: 1.8;
  margin-bottom: 4px;
}
.q-conv-who {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  margin-top: 3px;
}
.q-conv-line.female .q-conv-who { background: var(--sakura-100); color: var(--sakura-700); }
.q-conv-line.male .q-conv-who { background: #e3f0ff; color: #3b6ea5; }
.q-conv-text { flex: 1; }
.q-conv-text :deep(ruby) { ruby-position: over; }
.q-conv-ans { display: flex; gap: 8px; align-items: baseline; }
.q-ans-no { color: var(--ink-light); font-size: 12px; min-width: 22px; }

/* 补充知识 */
.k-intro-card { background: linear-gradient(135deg, #fffaf5, #fff5f9); }
.k-title { font-size: 18px; color: var(--sakuro-600, var(--sakura-600)); margin-bottom: 8px; }
.k-intro { font-size: 14px; line-height: 2; color: var(--ink); }
.k-part-intro { font-size: 13px; color: var(--sakura-600); margin-bottom: 8px; font-weight: 600; }

.k-table-wrap { overflow-x: auto; }
.k-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 640px;
}
.k-table th, .k-table td {
  padding: 8px 10px;
  border: 1px solid #f5e8ec;
  text-align: left;
  vertical-align: top;
  line-height: 1.7;
}
.k-table thead th {
  background: var(--sakura-50);
  color: var(--sakura-700);
  font-size: 13px;
}
.k-table .col-a { background: #f8fbff; }
.k-table .col-b { background: #fff8f3; }
.k-word { font-weight: 600; color: var(--ink); margin-right: 6px; }
.k-kanji { color: var(--ink-light); font-size: 12px; }
.k-ex { color: var(--ink-light); font-size: 13px; }
.k-ex :deep(ruby) { ruby-position: over; }

@media (max-width: 640px) {
  .word-table { grid-template-columns: 1fr; }
  .unit-header { flex-direction: column; align-items: flex-start; gap: 10px; }
}
</style>
