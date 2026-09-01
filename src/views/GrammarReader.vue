<template>
  <div class="reader-page">
    <!-- 顶部工具条 -->
    <div class="reader-bar">
      <button class="btn btn-ghost btn-sm" @click="$router.push('/study')">← 学习</button>
      <span class="reader-title">{{ level?.name.replace(' 文法详解（整理版）', '') || '' }} <span class="reader-sub">{{ points.length }} 点</span></span>
      <div class="reader-actions">
        <button class="mode-toggle" :class="{ active: mode === 'paged' }" @click="setMode('paged')">分页阅读</button>
        <button class="mode-toggle" :class="{ active: mode === 'sequential' }" @click="setMode('sequential')">顺序阅读</button>
        <button class="toc-btn" @click="tocOpen = true">☰ 目录<span v-if="markedCount" class="marked-badge">{{ markedCount }}</span></button>
      </div>
    </div>

    <!-- 分页模式：上一页/下一页 -->
    <div v-if="mode === 'paged'" class="pager-bar">
      <button class="page-btn" :disabled="currentIndex <= 0" @click="prevPage">← 上一页 <span class="kbd">A</span></button>
      <span class="page-indicator">第 {{ currentIndex + 1 }} / {{ points.length }} 点</span>
      <button class="page-btn" :disabled="currentIndex >= points.length - 1" @click="nextPage"><span class="kbd">D</span> 下一页 →</button>
    </div>

    <!-- 主阅读区 -->
    <div
      ref="contentEl"
      class="reader-content"
      :class="{ paged: mode === 'paged', sequential: mode === 'sequential' }"
      @pointerdown="onPointerDown"
    >
      <!-- 顺序阅读：连续滚动 -->
      <template v-if="mode === 'sequential'">
        <div v-for="(u, ui) in level.units" :key="u.id" class="unit-block">
          <div class="unit-head" :data-unit="ui"><span class="unit-dot"></span>{{ u.title }}</div>
          <section
            v-for="p in u.points"
            :key="p.id"
            :id="'gp-' + p.id"
            :data-pid="p.id"
            class="gp-card"
            :class="{ marked: isMarked(p.id), current: p.id === currentPointId }"
          >
            <div class="gp-head">
              <h3 class="gp-title">{{ p.title }}</h3>
              <button class="mark-btn" :class="{ active: isMarked(p.id) }" @click="toggleMark(p.id)" title="在目录中标记/取消此点">★</button>
            </div>
            <div class="gp-body">
              <template v-for="(g, gi) in usageGroups(p.blocks)" :key="gi">
                <div class="gp-usage" :class="{ 'gp-usage--boxed': g.box }">
                <template v-for="(b, i) in g.blocks" :key="i">
                <div v-if="b.t === 'label'" class="gp-row">
                  <span class="gp-label">{{ b.label }}</span>
                  <span v-if="b.text" class="gp-text" v-html="blockHtml(b)"></span>
                </div>
                <div v-else-if="b.t === 'sub'" class="gp-sub" v-html="blockHtml(b)"></div>
                <div v-else-if="b.t === 'table'" class="gp-table">
                  <table>
                    <thead v-if="b.headers && b.headers.length">
                      <tr><th v-for="(h, hi) in b.headers" :key="hi">{{ h }}</th></tr>
                    </thead>
                    <tbody>
                      <tr v-for="(r, ri) in b.rows" :key="ri">
                        <td v-for="(c, ci) in r" :key="ci">{{ c }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <template v-else-if="b.t === 'line' && b.isEx">
          <div class="gp-line" :class="{ 'gp-line--ex-dash': !b.isExLast && !b._cnHtml }" v-html="b._jpHtml"></div>
          <div v-if="b._cnHtml" class="gp-line gp-tr" :class="{ 'gp-line--ex-dash': !b.isExLast }" v-html="b._cnHtml"></div>
        </template>
        <div v-else-if="b.t === 'line'" class="gp-line" v-html="isContLine(g.blocks, i) ? contHtml(b) : blockHtml(b)"></div>
                </template>
                </div>
              </template>
            </div>
          </section>
        </div>
      </template>

      <!-- 分页阅读：每点一页（双层：over 当前页 + under 预载目标页，实现翻书） -->
      <template v-else>
        <div class="book">
          <div
            v-for="leaf in bookLeaves"
            :key="leaf.key"
            class="page-wrap book-leaf"
            :class="[leaf.cls, { marked: isMarked(leaf.point.id) }]"
          >
            <div class="page-meta">{{ leaf.point.unitTitle }}</div>
            <div class="gp-head">
              <h3 class="gp-title">{{ leaf.point.title }}</h3>
              <button class="mark-btn" :class="{ active: isMarked(leaf.point.id) }" @click="toggleMark(leaf.point.id)" title="在目录中标记/取消此点">★</button>
            </div>
            <div class="gp-body">
              <template v-for="(g, gi) in usageGroups(leaf.point.blocks)" :key="gi">
                <div class="gp-usage" :class="{ 'gp-usage--boxed': g.box }">
                <template v-for="(b, i) in g.blocks" :key="i">
                <div v-if="b.t === 'label'" class="gp-row">
                  <span class="gp-label">{{ b.label }}</span>
                  <span v-if="b.text" class="gp-text" v-html="blockHtml(b)"></span>
                </div>
                <div v-else-if="b.t === 'sub'" class="gp-sub" v-html="blockHtml(b)"></div>
                <div v-else-if="b.t === 'table'" class="gp-table">
                  <table>
                    <thead v-if="b.headers && b.headers.length">
                      <tr><th v-for="(h, hi) in b.headers" :key="hi">{{ h }}</th></tr>
                    </thead>
                    <tbody>
                      <tr v-for="(r, ri) in b.rows" :key="ri">
                        <td v-for="(c, ci) in r" :key="ci">{{ c }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <template v-else-if="b.t === 'line' && b.isEx">
          <div class="gp-line" :class="{ 'gp-line--ex-dash': !b.isExLast && !b._cnHtml }" v-html="b._jpHtml"></div>
          <div v-if="b._cnHtml" class="gp-line gp-tr" :class="{ 'gp-line--ex-dash': !b.isExLast }" v-html="b._cnHtml"></div>
        </template>
        <div v-else-if="b.t === 'line'" class="gp-line" v-html="isContLine(g.blocks, i) ? contHtml(b) : blockHtml(b)"></div>
                </template>
                </div>
              </template>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 侧边目录 -->
    <div v-if="tocOpen" class="toc-backdrop" @click="tocOpen = false" @wheel="onTocBackdropWheel"></div>
    <aside v-if="tocOpen" class="toc">
      <div class="toc-header">
        <span class="toc-title">目录 · {{ level?.name.replace(' 文法详解（整理版）', '') }}</span>
        <button class="toc-close" @click="tocOpen = false">✕</button>
      </div>
      <div class="toc-list">
        <div v-for="(u, ui) in level.units" :key="u.id" class="toc-unit">
          <div class="toc-unit-title">{{ u.title }}</div>
          <div
            v-for="p in u.points"
            :key="p.id"
            class="toc-item"
            :class="{ current: p.id === currentPointId, marked: isMarked(p.id) }"
            :ref="el => setTocRef(el, p.id)"
          >
            <button class="toc-mark" :class="{ active: isMarked(p.id) }" @click.stop="toggleMark(p.id)" :title="isMarked(p.id) ? '取消标记' : '标记此点'">
              {{ isMarked(p.id) ? '★' : '☆' }}
            </button>
            <span class="toc-label" @click="jumpTo(p.id)">{{ p.title }}</span>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { grammarLevels } from '../data/grammar'
import { useGrammarStore } from '../store/grammarStore'
import { useFurigana } from '../composables/useFurigana'

const route = useRoute()
const store = useGrammarStore()
const furigana = useFurigana()

const levelId = computed(() => String(route.params.level || '').toUpperCase())
const level = computed(() => grammarLevels.find(l => l.id === levelId.value) || grammarLevels[0])
const points = computed(() => {
  const arr = []
  if (!level.value) return arr
  level.value.units.forEach(u => {
    u.points.forEach(p => arr.push(p))
  })
  return arr
})
const allIds = computed(() => points.value.map(p => p.id))

// ===== 状态 =====
const mode = ref('paged')
const tocOpen = ref(false)
const currentIndex = ref(0)
const currentPointId = ref('')
const contentEl = ref(null)
const tocRefs = {}
const markedCount = computed(() => store.markedCountOf(points.value))

const currentPoint = computed(() => points.value[currentIndex.value] || null)

// ===== 富文本：转义 + 加粗；开启振假名时优先渲染 ruby 版本 =====
function fmt(s) {
  if (!s) return ''
  let h = String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  h = h.replace(/\n/g, '<br>')
  return h
}

const KANA_RE = /[\u3040-\u30ff]/

// 例句中日文 / 中文译文的分隔：取第一个“/”之后无假名的位置作为日/中边界
function splitTrans(text) {
  let idx = text.indexOf('/')
  while (idx >= 0) {
    const after = text.slice(idx + 1)
    if (!KANA_RE.test(after)) return { jp: text.slice(0, idx), cn: after }
    idx = text.indexOf('/', idx + 1)
  }
  return { jp: text, cn: '' }
}

// 输出一段文本的 HTML（不包含翻译拆分）：
// 1) 圈号分点换行（①…②… -> 每点一行）
// 2) 【xx年真题】等标记置灰
function richHtml(raw) {
  if (!raw) return ''
  let html = raw
  html = html.replace(/([①②③④⑤⑥⑦⑧⑨⑩])/g, (m, c, off) => off === 0 ? m : '<br>' + c)
  html = html.replace(/【([^】]+)】/g, '<span class="gp-tag">【$1】</span>')
  return html
}

// 判断第 i 个块是否为「接续」标签下的内容行（内部无需振假名，斜杠选项竖排+大括号）
function isContLine(blocks, i) {
  const b = blocks && blocks[i]
  if (!b || b.t !== 'line') return false
  for (let j = i - 1; j >= 0; j--) {
    const t = blocks[j].t
    if (t === 'label') return (blocks[j].label || '').includes('接续')
    if (t === 'sub' || t === 'table') return false
  }
  return false
}

// ===== 接续行渲染：不使用振假名；斜杠选项竖排，用纵跨多行的超大花括号包裹 =====
const CONT_CLASS_WORDS = ['动词', '名词', '形容词', '词干', '形式', '句子']

function contLcp(parts) {
  let i = 0
  const p0 = parts[0] || ''
  while (i < p0.length && parts.every(p => p[i] === p0[i])) i++
  return p0.slice(0, i)
}

// 解析接续文本（在 fmt 转义后调用）：{ prefix, opts, suffix, group2 }
function parseContinuation(text) {
  const parts = text.split('/')
  if (parts.length === 1) return null
  const hasClass = x => CONT_CLASS_WORDS.some(w => x.includes(w))
  // 特例：结构特殊，手工指定
  const special = {
    '～が/は+他动词「て形」+ある': { prefix: '～', opts: ['が', 'は'], suffix: '+他动词「て形」+ある', group2: null },
    'ちっとも+い形容词词干+く/动词「ない形」+ない': { prefix: 'ちっとも+', opts: ['い形容词词干+く', '动词「ない形」'], suffix: '+ない', group2: null },
    'もし+动词「て形」/い形容词「て形」/な形容词词干+で/名词+で+も': { prefix: 'もし+', opts: ['动词「て形」', 'い形容词「て形」', 'な形容词词干+で', '名词+で'], suffix: '+も', group2: null },
    '动词辞书形/动词「ない形」+ない+つもりだ': { prefix: '', opts: ['动词辞书形', '动词「ない形」+ない'], suffix: '+つもりだ', group2: null },
    '动词辞书形/动词「ない形」+ない/动词可能形+よう(に)': { prefix: '', opts: ['动词辞书形', '动词「ない形」+ない', '动词可能形'], suffix: '+よう(に)', group2: null },
    '动词辞书形/动词「ない形」+ない/动词可能形+ようになる': { prefix: '', opts: ['动词辞书形', '动词「ない形」+ない', '动词可能形'], suffix: '+ようになる', group2: null },
    '动词辞书形/动词「ない形」+ない+ようにする': { prefix: '', opts: ['动词辞书形', '动词「ない形」+ない'], suffix: '+ようにする', group2: null },
    '动词辞书形/动词「ない形」+ない+ことがある': { prefix: '', opts: ['动词辞书形', '动词「ない形」+ない'], suffix: '+ことがある', group2: null },
    'III类动词：(~)する→ (~)させてください；来る→来させてください/させないでください': null
  }
  if (text in special) return special[text]

  // 1) 尾部后缀组：最后一个 / 前最近的 +，形如 +A/B 且 A/B 非词类标记
  const lastSlash = text.lastIndexOf('/')
  const lp = text.lastIndexOf('+', lastSlash - 1)
  if (lp >= 0) {
    const inner = text.slice(lp + 1)
    if (!inner.includes('+') && inner.includes('/')) {
      const g2opts = inner.split('/')
      if (!g2opts.some(hasClass)) {
        const main = text.slice(0, lp)
        const mparts = main.split('/')
        const prefix = contLcp(mparts)
        const opts = mparts.length > 1 ? mparts.map(x => x.slice(prefix.length)) : []
        return { prefix, opts, suffix: '', group2: { prefix: '+', opts: g2opts } }
      }
    }
  }

  // 2) 前缀+选项组（兜底）：首段含 + 且末段无 +
  const first = parts[0], last = parts[parts.length - 1]
  if (first.includes('+') && !last.includes('+') && !contLcp(parts)) {
    const fi = first.lastIndexOf('+')
    return { prefix: first.slice(0, fi + 1), opts: [first.slice(fi + 1), ...parts.slice(1)], suffix: '', group2: null }
  }

  // 3) 普通型：公共前缀 + 选项 + 尾部公共后缀
  const prefix = contLcp(parts)
  const rest = parts.map(p => p.slice(prefix.length))
  let suffix = ''
  const rl = rest[rest.length - 1]
  const ri = rl.lastIndexOf('+')
  if (ri >= 0) suffix = rl.slice(ri)
  const opts = rest.map(r => suffix && r.endsWith(suffix) ? r.slice(0, -suffix.length) : r)
  return { prefix, opts, suffix, group2: null }
}

function contBrace(dir) {
  const d = dir === 'l'
    ? 'M10 2 L3 2 L3 98 L10 98'
    : 'M2 2 L9 2 L9 98 L2 98'
  return '<span class="cont-brace-wrap"><svg class="cont-brace" viewBox="0 0 12 100" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>'
}

// 接续字段专业术语释义表（悬停提示）
const CONT_TERMS = {
  '动词辞书形': '动词的词典基本形（原形）。\n五段动词以「う」段假名结尾（書く・話す），一段动词以「る」结尾（食べる・見る），另有「来る・する」。\n例：食べる、行く、来る。',
  '动词普通形': '动词的简体（非礼貌）形式，含现在形与过去形。\n现在形＝辞书形／ない形；过去形＝た形。\n例：食べる・食べない・食べた。',
  '动词意志形': '表示意志、提议。\n五段动词：词尾「う」段→「お」段＋う（行く→行こう）\n一段动词：去「る」＋よう（食べる→食べよう）\n来る→来よう，する→しよう。',
  '动词意向形': '同「动词意志形」（～よう），表示主观意志、打算。',
  '动词可能形': '表示「能……／会……」。\n五段动词：「う」段→「え」段＋る（話す→話せる）\n一段动词：去「る」＋られる（食べる→食べられる）\n来る→来られる，する→できる。',
  '动词命令形': '表示命令。\n五段动词：「う」段→「え」段（書く→書け）\n一段动词：去「る」＋ろ（食べる→食べろ）\n来る→来い，する→しろ／せよ。',
  '动词使役形': '表示「让（某人）做……」。\nI类动词：「ない形」＋せる（書かせる）\nII类动词：「ない形」＋させる（食べさせる）\n来る→来させる，する→させる。',
  '动词「て形」': '动词的接续连用形。\n五段动词发生音便：書く→書いて、読む→読んで、買う→買って、話す→話して\n一段动词：去「る」＋て（食べる→食べて）\n来る→来て，する→して。',
  '动词「た形」': '动词的过去形，与「て形」同形（て→た）。\n書く→書いた，食べる→食べた，来る→来た，する→した。',
  '动词「ない形」': '动词的否定形。\n五段动词：「う」段→「あ」段＋ない（書く→書かない）\n一段动词：去「る」＋ない（食べる→食べない）\n来る→来ない，する→しない。',
  '动词「ます形」': '动词的礼貌形（连用形）。\n五段动词：「う」段→「い」段＋ます（書く→書きます）\n一段动词：去「る」＋ます（食べる→食べます）\n来る→来ます，する→します。',
  '动词「ば形」': '动词的假定形，表示条件「如果……」。\n五段动词：「う」段→「え」段＋ば（書く→書けば）\n一段动词：去「る」＋れば（食べる→食べれば）\n来る→来れば，する→すれば。',
  '动词「ている形」': '动词「て形」＋いる，表示动作正在进行或状态的持续。\n例：食べている、書いている。',
  '动词「まい」': '接动词辞书形后，表示否定推量或否定意志（相当于「ないだろう／まいとする」）。\nする→するまい／すまい。',
  '动词词干': '动词去掉活用词尾后的部分。\n例：「食べ」（食べる）、「書」（書く）。',
  '动词否定形': '动词的「ない形」，表示否定。\n例：書かない、食べない。',
  'い形容词辞书形': '一类形容词（い形容词）的基本形，以「い」结尾。\n例：高い、新しい、暑い。',
  'い形容词普通形': '一类形容词的简体形。\n现在形＝词干＋い（高い）\n过去形＝词干＋かった（高かった）\n否定＝词干＋くない（高くない）。',
  'い形容词「て形」': '一类形容词的接续形，词干＋くて（高くて），用于连接下文。',
  'い形容词「かった形」': '一类形容词的过去形，词干＋かった（高かった）。',
  'い形容词词干': '一类形容词去掉词尾「い」后的部分（高→高い），可接「く」「かった」等。',
  'な形容词词干': '二类形容词（形容动词）的基本部分（静か→静か）。\n接「な」修饰名词（静かな）；接「に」作副词（静かに）。',
  'な形容词普通形': '二类形容词的简体形。\n现在形＝词干＋だ（静かだ）\n过去形＝词干＋だった（静かだった）\n否定＝词干＋ではない。',
  '名词': '表示人或事物名称的词。\n日语名词后接助词「の・に・を・で」等构成句子成分。',
  '名词修饰形': '各类词修饰名词时的连体形。\n名词＋の；动词辞书形／た形；い形容词＋い；な形容词＋な。',
  '句子的简体形': '句子的简体（非礼貌）形式，用「だ・である・动词普通形」等构成。',
  '数量词': '表示数量、程度的词。\n例：一人・二本・三つ・一回。',
  '疑问词': '表示疑问的词。\n例：誰・何・どこ・いつ・なぜ。',
  '各词类「た形」': '各类词（动词・い形容词・な形容词・名词）的过去形。\n动词た形；い形容词かった；な形容词だった；名词だった。',
  'I类动词': '五段活用动词，词尾为「う」段假名。\n例：書く・読む・話す・買う。',
  'II类动词': '一段活用动词，词尾为「る」。\n例：食べる・見る・起きる，去「る」接续。',
  'III类动词': 'カ变动词「来る」＋サ变动词「する」。\n「する」前的名词部分称为「サ変動詞語幹」。',
  'サ変動詞語幹': 'サ变动词「する」前面的名词部分。\n例：勉強（する）・散歩（する）・旅行（する）。',
}
const CONT_TERM_KEYS = Object.keys(CONT_TERMS).sort((a, b) => b.length - a.length)
const CONT_TERM_RE = new RegExp(CONT_TERM_KEYS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g')
function withTermTip(s) {
  return s.replace(CONT_TERM_RE, m => '<span class="cont-term">' + m + '<span class="term-tip">' + CONT_TERMS[m].replace(/\n/g, '<br>') + '</span></span>')
}
// 术语提示框悬浮定位：fixed 相对视口，避免超出卡片/滚动容器被裁剪
function getScrollParent(el) {
  let p = el.parentElement
  while (p) {
    const s = window.getComputedStyle(p)
    if (/(auto|scroll|overlay)/.test(s.overflowY) || /(auto|scroll|overlay)/.test(s.overflow)) return p
    p = p.parentElement
  }
  return document.body
}
// 悬浮窗紧贴词条（absolute 相对词条），并用 JS 约束在滚动容器可视范围内避免被裁剪
function placeTermTip(term) {
  const tip = term.querySelector('.term-tip')
  if (!tip) return
  tip.style.visibility = 'hidden'
  tip.style.display = 'block'
  const tw = tip.offsetWidth
  const th = tip.offsetHeight
  tip.style.display = ''
  tip.style.visibility = ''
  const sc = getScrollParent(term)
  const sr = sc.getBoundingClientRect()
  const tr = term.getBoundingClientRect()
  const gap = 8
  const below = sr.bottom - tr.bottom
  const above = tr.top - sr.top
  // 纵向：默认词条下方；下方空间不足且上方够时，向上弹出
  let top = tr.height + gap
  if (below < th + gap * 2 && above >= below) top = -(th + gap)
  // 水平：相对词条居中，并限制在容器内
  let left = tr.width / 2 - tw / 2
  const tLeft = tr.left - sr.left
  left = Math.max(gap - tLeft, Math.min(left, sr.width - tLeft - tw - gap))
  tip.style.position = 'absolute'
  tip.style.top = top + 'px'
  tip.style.left = left + 'px'
  tip.style.transform = 'none'
}
let termTipEntered = null
function onTermTipOver(e) {
  const term = e.target.closest('.cont-term')
  if (term && term !== termTipEntered) {
    termTipEntered = term
    placeTermTip(term)
  }
}
function onTermTipOut(e) {
  const term = e.target.closest('.cont-term')
  if (term === termTipEntered && (!e.relatedTarget || !term.contains(e.relatedTarget))) {
    termTipEntered = null
  }
}


function contOptsHtml(opts) {
  return '<span class="cont-opts">' + opts.map(o => '<span class="opt">' + o + '</span>').join('') + '</span>'
}

function contHtml(b) {
  const text = b.text || ''
  const p = parseContinuation(fmt(text))
  if (!p) return richHtml(withTermTip(fmt(text)))
  let h = ''
  if (p.prefix) h += '<span class="cont-prefix">' + withTermTip(p.prefix) + '</span>'
  if (p.opts.length) h += contBrace('l') + contOptsHtml(p.opts.map(withTermTip)) + contBrace('r')
  if (p.group2) {
    h += '<span class="cont-plus">' + withTermTip(p.group2.prefix) + '</span>'
    h += contBrace('l') + contOptsHtml(p.group2.opts.map(withTermTip)) + contBrace('r')
  }
  if (p.suffix) h += '<span class="cont-suffix">' + withTermTip(p.suffix) + '</span>'
  return '<span class="cont">' + h + '</span>'
}

// 输出某一块的 HTML：振假名开启且有 furi 数据时直接渲染 ruby，否则走普通格式化
function blockHtml(b) {
  const raw = furigana.isEnabled.value && b.furi ? b.furi : fmt(b.text)
  return richHtml(raw)
}

// 在 furi（ruby HTML）中定位第 occurrence 个“文本 /”：跳过 </rp>、</ruby> 等闭合标签内的 /
function findTextSlash(html, occurrence) {
  let count = 0
  for (let i = 0; i < html.length; i++) {
    if (html[i] === '/' && html[i - 1] !== '<') {
      count++
      if (count === occurrence) return i
    }
  }
  return -1
}

// 渲染例句的“日文 / 译文”两部分 HTML（仅例文行）：译文用独立 div 呈现，避免在 v-html 中拼接 br/span
function exParts(b) {
  const useFuri = furigana.isEnabled.value && b.furi
  const base = b.text || ''
  const { jp, cn } = splitTrans(base)
  if (!cn) return { jpHtml: blockHtml(b), cnHtml: '' }
  let jpHtml, cnHtml
  if (useFuri) {
    // 在 furi 版本上定位与原文相同的边界“/”（kuroshiro 不改变文本“/”的数量与顺序）
    const jpCount = (jp.match(/\//g) || []).length
    const pos = findTextSlash(b.furi, jpCount + 1)
    if (pos < 0) return { jpHtml: blockHtml(b), cnHtml: '' }
    jpHtml = richHtml(b.furi.slice(0, pos))
    cnHtml = richHtml(b.furi.slice(pos + 1))
  } else {
    jpHtml = richHtml(fmt(jp))
    cnHtml = richHtml(fmt(cn))
  }
  return { jpHtml, cnHtml }
}

// 按用法分组：带圈号的标签（说明①、例文②…）按圈号分组，(N) 子标题归属其后的组；
// 一个点内有 ≥2 组时，每组用大粉框包裹，实现不同用法之间的隔离；同时做组内例句拆分装饰。
function usageGroups(blocks) {
  const groups = []
  let cur = null
  let curKey = null
  let pendingSub = null
  for (const b of blocks) {
    if (b.t === 'sub') {
      pendingSub = b
      continue
    }
    let key
    if (b.t === 'label') {
      const m = /[①-⑩]/.exec(b.label || '')
      key = m ? m[0] : 'main'
    } else {
      key = curKey
    }
    if (!cur || key !== curKey) {
      cur = { key, blocks: [] }
      groups.push(cur)
      curKey = key
      if (pendingSub) { cur.blocks.push(pendingSub); pendingSub = null }
    }
    cur.blocks.push(b)
  }
  if (pendingSub) {
    if (cur) cur.blocks.push(pendingSub)
    else groups.push({ key: 'sub', blocks: [pendingSub] })
  }
  const boxed = groups.length >= 2
  for (const g of groups) {
    g.box = boxed && (g.key !== 'main' || (g.blocks[0] && g.blocks[0].t === 'sub'))
    let inExample = false
    let run = 0
    const res = []
    for (const b of g.blocks) {
      const m = { ...b }
      if (b.t === 'label') {
        inExample = String(b.label || '').startsWith('例文')
        run = 0
      } else if (b.t === 'line') {
        if (inExample) {
          m.isEx = true
          run++
          const parts = exParts(b)
          m._jpHtml = parts.jpHtml
          m._cnHtml = parts.cnHtml
        }
      } else {
        run = 0
      }
      res.push(m)
    }
    for (let i = res.length - 1; i >= 0; i--) {
      if (res[i].isEx && (i === res.length - 1 || !res[i + 1].isEx)) {
        res[i].isExLast = true
      }
    }
    g.blocks = res
  }
  return groups
}

function isMarked(pid) { return store.isMarked(pid) }
function toggleMark(pid) { store.toggleMark(pid) }

// ===== 翻页（分页翻书：下一页翻起露出预载页，上一页翻下覆盖当前页）=====
const flip = ref('') // '' | 'next' | 'prev'（动画方向，非空表示翻页动画中）
const animTarget = ref(null) // 动画期间预载的目标页（下一/上一页）
let flipping = false
const bookLeaves = computed(() => {
  const cp = currentPoint.value
  if (!cp) return []
  const leaves = []
  if (flip.value === 'next' && animTarget.value) {
    // 下一页：下层预载下一页（静态），上层当前页翻起
    leaves.push({ key: 'u-' + animTarget.value.id, point: animTarget.value, cls: 'under-leaf' })
    leaves.push({ key: 'o-' + cp.id, point: cp, cls: 'over-leaf over-away' })
  } else if (flip.value === 'prev' && animTarget.value) {
    // 上一页：当前页不动，下层上一页翻下覆盖
    leaves.push({ key: 'u-' + animTarget.value.id, point: animTarget.value, cls: 'under-leaf under-down' })
    leaves.push({ key: 'o-' + cp.id, point: cp, cls: 'over-leaf' })
  } else {
    leaves.push({ key: 'o-' + cp.id, point: cp, cls: 'over-leaf' })
  }
  return leaves
})
function nextPage() {
  if (flipping || currentIndex.value >= points.value.length - 1) return
  flipping = true
  animTarget.value = points.value[currentIndex.value + 1]
  flip.value = 'next'
  setTimeout(() => {
    currentIndex.value++
    syncProgress()
    flip.value = ''
    animTarget.value = null
    flipping = false
  }, 300)
}
function prevPage() {
  if (flipping || currentIndex.value <= 0) return
  flipping = true
  animTarget.value = points.value[currentIndex.value - 1]
  flip.value = 'prev'
  setTimeout(() => {
    currentIndex.value--
    syncProgress()
    flip.value = ''
    animTarget.value = null
    flipping = false
  }, 300)
}

function syncProgress() {
  const p = points.value[currentIndex.value]
  if (p) {
    currentPointId.value = p.id
    store.markLearned(p.id)
    store.setLastPoint(level.value.id, p.id)
  }
}

// ===== 跳转到某一点 =====
function jumpTo(pid) {
  if (flipping) return
  const idx = allIds.value.indexOf(pid)
  if (idx < 0) return
  currentIndex.value = idx
  currentPointId.value = pid
  store.markLearned(pid)
  store.setLastPoint(level.value.id, pid)
  if (mode.value === 'sequential') {
    nextTick(() => {
      const el = document.getElementById('gp-' + pid)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
  tocOpen.value = false
}

// ===== 模式切换 =====
function setMode(m) {
  if (mode.value === m) return
  flip.value = ''
  animTarget.value = null
  flipping = false
  mode.value = m
  store.setMode(level.value.id, m)
  if (m === 'sequential') {
    // 切到顺序阅读：滚到当前点
    nextTick(() => {
      const p = points.value[currentIndex.value]
      if (p) {
        const el = document.getElementById('gp-' + p.id)
        if (el) el.scrollIntoView({ block: 'start' })
      }
    })
  }
}

// ===== 键盘：L 切换振假名；分页模式下 A 上一页 / D 下一页 =====
function onKeydown(e) {
  const t = e.target
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
  const k = e.key
  // 振假名快捷键（与全站一致）
  if (k === 'l' || k === 'L') {
    e.preventDefault()
    furigana.toggle()
    return
  }
  if (mode.value !== 'paged') return
  if (k === 'a' || k === 'A') { e.preventDefault(); prevPage() }
  else if (k === 'd' || k === 'D') { e.preventDefault(); nextPage() }
}

// ===== 鼠标拖动 / 点击区域翻页（分页模式）=====
let drag = null
function onPointerDown(e) {
  if (mode.value !== 'paged') return
  drag = { x: e.clientX, y: e.clientY, moved: false }
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}
function onPointerMove(e) {
  if (!drag) return
  const dx = e.clientX - drag.x
  const dy = e.clientY - drag.y
  if (Math.abs(dx) > 8 || Math.abs(dy) > 8) drag.moved = true
}
function onPointerUp(e) {
  if (!drag) return
  const wasMove = drag.moved
  drag = null
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  // 拖动不翻页（仅点击生效）
  if (wasMove) return
  // 点击：右侧翻下一页，左侧翻上一页
  const el = contentEl.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const x = e.clientX - rect.left
  const w = rect.width
  if (x > w * 0.62) nextPage()
  else if (x < w * 0.38) prevPage()
}

// ===== 目录背景滚轮透传：顺序阅读时开目录也能滚动正文 =====
function onTocBackdropWheel(e) {
  if (mode.value === 'sequential' && !e.ctrlKey) {
    window.scrollBy(0, e.deltaY)
  }
}

// ===== 顺序阅读：滚动定位当前点 =====
let scTicking = false
function onScroll() {
  if (mode.value !== 'sequential' || scTicking) return
  scTicking = true
  requestAnimationFrame(() => {
    scTicking = false
    const secs = contentEl.value ? contentEl.value.querySelectorAll('[data-pid]') : []
    let cur = 0
    // 正文为整页滚动：以视口顶部向下 160px 作为“当前阅读位置”参考线
    const threshold = 160
    for (let i = 0; i < secs.length; i++) {
      const r = secs[i].getBoundingClientRect()
      if (r.top <= threshold) cur = i
      else break
    }
    if (secs[cur]) {
      const pid = secs[cur].getAttribute('data-pid')
      const idx = allIds.value.indexOf(pid)
      if (idx >= 0 && idx !== currentIndex.value) {
        currentIndex.value = idx
        currentPointId.value = pid
        store.markLearned(pid)
        store.setLastPoint(level.value.id, pid)
      }
    }
  })
}

// ===== 目录项引用（用于打开时滚动到当前项）=====
function setTocRef(el, pid) {
  if (el) tocRefs[pid] = el
}

function scrollTocToCurrent() {
  const pid = currentPointId.value
  if (pid && tocRefs[pid]) {
    tocRefs[pid].scrollIntoView({ block: 'center' })
  }
}

// ===== 初始化 / 恢复进度 =====
function restore() {
  mode.value = store.getMode(level.value.id)
  const lastPid = store.getLastPoint(level.value.id)
  const idx = lastPid ? allIds.value.indexOf(lastPid) : -1
  currentIndex.value = idx >= 0 ? idx : 0
  const p = points.value[currentIndex.value]
  currentPointId.value = p ? p.id : ''
  if (p) store.markLearned(p.id)
  nextTick(() => {
    if (mode.value === 'sequential' && p) {
      const el = document.getElementById('gp-' + p.id)
      if (el) el.scrollIntoView({ block: 'start' })
    }
  })
}

watch(levelId, () => { restore() })

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('mouseover', onTermTipOver, true)
  document.addEventListener('mouseout', onTermTipOut, true)
  restore()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  document.removeEventListener('mouseover', onTermTipOver, true)
  document.removeEventListener('mouseout', onTermTipOut, true)
})

watch(tocOpen, (v) => {
  if (v) nextTick(scrollTocToCurrent)
})

// 目录打开状态下，翻页 / 滚动导致当前点变化时，让目录跟随滚动到当前项
watch(currentPointId, () => {
  if (tocOpen.value) nextTick(scrollTocToCurrent)
})
</script>

<style scoped>
.reader-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px 20px 48px;
  position: relative;
  z-index: 1;
}
.reader-bar {
  position: sticky;
  top: 60px;
  z-index: 90;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(255, 250, 245, 0.94);
  backdrop-filter: blur(10px);
  border: 2px solid #ffe3ec;
  border-radius: 14px;
}
.reader-title {
  font-size: 18px;
  font-weight: 700;
  color: #c2556f;
  margin-right: auto;
}
.reader-sub { font-size: 12px; color: #b98a94; font-weight: 400; margin-left: 6px; }
.reader-actions { display: flex; align-items: center; gap: 8px; }
.mode-toggle {
  padding: 7px 14px;
  border-radius: 18px;
  border: 2px solid #ffd3e0;
  background: #fffafc;
  color: #b98a94;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.mode-toggle:hover { border-color: #ff9dbd; color: #c2556f; }
.mode-toggle.active {
  background: linear-gradient(145deg, #ff9dbd, #ff7da0);
  color: #fff;
  border-color: #ff7da0;
  box-shadow: 0 4px 12px rgba(255, 125, 160, 0.3);
}
.toc-btn {
  position: relative;
  padding: 7px 14px;
  border-radius: 18px;
  border: 2px solid #ffd3e0;
  background: #fffafc;
  color: #c2556f;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.toc-btn:hover { border-color: #ff9dbd; background: #fff0f5; }
.marked-badge {
  display: inline-block;
  background: #e08a00;
  color: #fff;
  font-size: 11px;
  min-width: 17px;
  height: 17px;
  line-height: 17px;
  border-radius: 9px;
  margin-left: 4px;
  padding: 0 4px;
}

/* 分页工具栏 */
.pager-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}
.page-btn {
  padding: 8px 16px;
  border-radius: 18px;
  border: 2px solid #ffd3e0;
  background: #fffafc;
  color: #c2556f;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.page-btn:hover:not(:disabled) { border-color: #ff9dbd; background: #fff0f5; }
.page-btn:disabled { opacity: 0.4; cursor: default; }
.page-indicator { font-size: 13px; color: #b98a94; }
.kbd {
  display: inline-block;
  background: #fff;
  border: 1px solid #ffc9d9;
  border-bottom-width: 2px;
  border-radius: 5px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: #c2556f;
  font-family: inherit;
}

/* 阅读内容区 */
.reader-content { position: relative; }
.reader-content.paged { cursor: default; perspective: 1800px; }

/* 分页翻书特效：下一页翻起露出预载页，上一页翻下覆盖当前页 */
.book { position: relative; perspective: 1800px; height: calc(100vh - 205px); min-height: 340px; }
.book-leaf { backface-visibility: hidden; transform-style: preserve-3d; transform-origin: left center; will-change: transform; height: 100%; min-height: 0; overflow-y: auto; overflow-x: hidden; }
.over-leaf { position: relative; z-index: 2; }
.under-leaf { position: absolute; top: 0; left: 0; right: 0; z-index: 1; }
.over-leaf.over-away { animation: over-away 0.3s ease forwards; }
@keyframes over-away { from { transform: rotateY(0deg); } to { transform: rotateY(-90deg); } }
.under-leaf.under-down { animation: under-down 0.3s ease; }
@keyframes under-down { from { transform: rotateY(-90deg); } to { transform: rotateY(0deg); } }

/* 顺序阅读：单元 */
.unit-block { margin-bottom: 26px; }
.unit-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #a8436a;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #ffd3e0;
}
.unit-dot { width: 8px; height: 8px; border-radius: 50%; background: linear-gradient(145deg, #ff9dbd, #ff7da0); flex-shrink: 0; }

/* 文法点卡片 */
.gp-card {
  background: #fffafc;
  border: 2px solid #ffe3ec;
  border-radius: 16px;
  padding: 18px 20px;
  margin-bottom: 14px;
  scroll-margin-top: 90px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.gp-card.current { border-color: #ff9dbd; box-shadow: 0 4px 16px rgba(255, 125, 160, 0.15); }
.gp-card.marked { border-left: 5px solid #ffb347; }
.gp-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.gp-title { font-size: 16.5px; font-weight: 700; color: #7a3a52; line-height: 1.5; flex: 1; }
.mark-btn {
  flex-shrink: 0;
  font-size: 20px;
  color: #d8bcc4;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
  padding: 2px;
}
.mark-btn:hover { transform: scale(1.2); }
.mark-btn.active { color: #ffb347; text-shadow: 0 0 6px rgba(255, 179, 71, 0.4); }
.gp-body { display: flex; flex-direction: column; gap: 6px; }
.gp-row { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.gp-label {
  flex-shrink: 0;
  background: #ffe9f0;
  color: #c2556f;
  font-size: 14px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 10px;
  line-height: 1.7;
}
/* 用法分组：同一用法（说明①+例文①…）框进同一个大粉框，隔离不同用法 */
.gp-usage { display: flex; flex-direction: column; gap: 6px; }
.gp-usage--boxed {
  border: 2px solid #f79ab4;
  border-radius: 14px;
  padding: 10px 12px;
  background: #fffafd;
}
.gp-text { font-size: 16px; color: #5c3b47; line-height: 1.8; }
.gp-sub {
  margin-top: 4px;
  font-size: 15px;
  font-weight: 700;
  color: #b36a5e;
  background: #fff3f6;
  border-left: 3px solid #f79ab4;
  padding: 4px 10px;
  border-radius: 0 8px 8px 0;
}
.gp-line {
  font-size: 16px;
  color: #4a3a44;
  line-height: 1.9;
  padding-left: 4px;
}
/* 例句之间用粉色虚线隔开（最后一条不显示） */
.gp-line--ex-dash { border-bottom: 1.5px dashed #f2a6bf; padding-bottom: 6px; margin-bottom: 2px; }
/* 【xx年真题】等标记置灰（v-html 注入，需 :deep） */
/* 【xx年真题】等标记置灰（v-html 注入，需 :deep） */
:deep(.gp-tag) { color: #a0a0a6; }
/* 接续：斜杠选项竖排 + 纵跨多行的超大花括号（v-html 注入，需 :deep） */
:deep(.cont) { display: inline-flex; align-items: center; vertical-align: middle; }
:deep(.cont-prefix), :deep(.cont-suffix), :deep(.cont-plus) { display: inline-flex; align-items: center; }
:deep(.cont-opts) { display: inline-flex; flex-direction: column; }
:deep(.cont-opts .opt) { display: block; white-space: nowrap; line-height: 1.5; padding: 0 1px; }
:deep(.cont-brace-wrap) { position: relative; display: inline-flex; align-self: stretch; width: 16px; flex: 0 0 auto; }
:deep(.cont-brace) { position: absolute; top: 0; bottom: 0; left: 0; height: 100%; width: 100%; color: #d06a86; }
/* 接续专业术语悬停提示 */
:deep(.cont-term) { position: relative; cursor: help; border-bottom: 1px dashed #d06a86; }
:deep(.cont-term .term-tip) {
  position: absolute; top: calc(100% + 8px); left: 50%; transform: translateX(-50%);
  z-index: 300; display: none;
  width: 240px; padding: 8px 10px;
  background: #fffdfd; border: 1px solid #ffd3e0; border-radius: 8px;
  box-shadow: 0 6px 20px rgba(244, 92, 142, 0.18);
  font-size: 12px; line-height: 1.6; color: #5a4a54; text-align: left; white-space: normal; font-weight: 400;
}
:deep(.cont-term:hover .term-tip) { display: block; }

/* 例句中的中文译文：独占一行 + 略不同颜色 */
.gp-tr { color: #9a6240; }
.gp-line:lang(ja), .gp-text:lang(ja), .gp-title:lang(ja) { font-family: 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', 'Meiryo', serif; }
.gp-table { overflow-x: auto; margin: 2px 0 6px; }
.gp-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14.5px;
  line-height: 1.6;
  background: #fff;
  border: 1px solid #f3d3dd;
  border-radius: 8px;
  overflow: hidden;
}
.gp-table th, .gp-table td {
  border: 1px solid #f3d3dd;
  padding: 5px 9px;
  text-align: center;
  white-space: nowrap;
}
.gp-table th {
  background: #fff0f5;
  color: #a04a63;
  font-weight: 700;
}
.gp-table td { color: #4a3a44; }
.gp-table tbody tr:nth-child(even) { background: #fff7fa; }

/* 分页阅读：单页 */
.page-wrap {
  background: #fffafc;
  border: 2px solid #ffe3ec;
  border-radius: 18px;
  padding: 26px 30px;
  min-height: 46vh;
  box-shadow: 0 8px 26px rgba(255, 125, 160, 0.12);
  margin: 0 auto;
  max-width: 780px;
  transition: border-color 0.2s;
}
.page-wrap.marked { border-color: #ffd59a; }
.page-meta {
  font-size: 12px;
  color: #b98a94;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

/* 侧边目录 */
.toc-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(74, 58, 68, 0.35);
  z-index: 94;
}
.toc {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: min(340px, 88vw);
  background: #fffafc;
  border-left: 2px solid #ffd3e0;
  z-index: 95;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 28px rgba(74, 58, 68, 0.15);
  animation: slideIn 0.22s ease;
}
@keyframes slideIn {
  from { transform: translateX(40px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.toc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 2px solid #ffe3ec;
}
.toc-title { font-size: 16px; font-weight: 700; color: #c2556f; }
.toc-close {
  font-size: 16px;
  color: #b98a94;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
}
.toc-close:hover { background: #ffe9f0; color: #c2556f; }
.toc-list { flex: 1; overflow-y: auto; padding: 10px 12px 24px; }
.toc-unit { margin-bottom: 8px; }
.toc-unit-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #b36a5e;
  padding: 6px 8px;
  background: #fff3f6;
  border-radius: 8px;
  margin-bottom: 2px;
}
.toc-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 8px;
  cursor: pointer;
  border-left: 3px solid transparent;
}
.toc-item:hover { background: #fff0f5; }
.toc-item.current { background: #ffe9f0; border-left-color: #ff7da0; }
.toc-item.marked .toc-label { color: #b06a10; }
.toc-mark {
  flex-shrink: 0;
  background: none;
  border: none;
  font-size: 15px;
  color: #d8bcc4;
  cursor: pointer;
  padding: 2px;
  line-height: 1;
}
.toc-mark:hover { color: #ffb347; }
.toc-mark.active { color: #ffb347; }
.toc-label {
  flex: 1;
  font-size: 13px;
  color: #6b4a52;
  line-height: 1.5;
  word-break: break-all;
}
.toc-item.current .toc-label { font-weight: 700; color: #a8436a; }

@media (max-width: 640px) {
  .reader-page { padding: 12px 12px 40px; }
  .reader-actions { flex-wrap: wrap; }
  .mode-toggle { padding: 6px 10px; font-size: 12px; }
  .page-wrap { padding: 18px 16px; }
  .book { height: calc(100vh - 160px); }
}
</style>
