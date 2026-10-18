<template>
  <!-- 单根节点：路由页被 <Transition> 包裹，多根会破坏 out-in 过渡（历史事故） -->
  <div class="unit-root">
  <div class="container unit-page" v-if="unit">
    <!-- ==================== 页头 ==================== -->
    <header class="page-head unit-head" v-reveal>
      <div class="page-head-main">
        <button class="back-btn unit-back" type="button" title="返回听解列表" aria-label="返回听解列表"
          @click="$router.push('/listening')">
          <span class="back-arrow" aria-hidden="true">←</span>
          <span>听解</span>
        </button>
        <div class="page-head-text">
          <div class="unit-kicker">
            <span>Unit {{ unit.id }}</span>
            <span class="unit-dot" aria-hidden="true"></span>
            <span>{{ level }} 听解</span>
          </div>
          <h1 class="page-title">{{ unit.title }}</h1>
          <p class="page-sub unit-theme">{{ unit.theme }}</p>
        </div>
      </div>
      <div v-if="unit.questionsRange || unit.knowledgeTitle" class="page-actions unit-meta">
        <span v-if="unit.questionsRange" class="chip-pill accent">🎧 {{ unit.questionsRange }}</span>
        <span v-if="unit.knowledgeTitle" class="chip-pill iris" :title="unit.knowledgeTitle">💡 {{ unit.knowledgeTitle }}</span>
      </div>
    </header>

    <!-- ==================== 板块切换 ==================== -->
    <div class="unit-tabs" role="tablist" aria-label="听解单元板块">
      <button v-for="t in tabs" :key="t.key" :id="'utab-' + t.key" type="button" class="unit-tab"
        :class="{ active: tab === t.key }" role="tab" :aria-selected="tab === t.key"
        @click="tab = t.key">
        <span class="ut-emoji" aria-hidden="true">{{ t.emoji }}</span>
        <span class="ut-label">{{ t.label }}</span>
      </button>
    </div>

    <!-- ==================== 音频接入卡 ==================== -->
    <div v-if="audioCard" class="audio-card surface" v-reveal="{ delay: 60 }">
      <button class="audio-qr" type="button" :title="'放大' + audioCard.title + '二维码'"
        :aria-label="'放大' + audioCard.title + '二维码，扫码播放'" aria-haspopup="dialog" @click="openQr">
        <img v-if="audioCard.img" :src="audioCard.img" :alt="audioCard.title + '二维码'" loading="lazy" />
        <span v-else class="qr-fallback">
          <span aria-hidden="true">▦</span>
          <small>教材第 {{ audioCard.page || '—' }} 页</small>
        </span>
        <span class="qr-expand" aria-hidden="true">⤢</span>
      </button>

      <div class="audio-main">
        <div class="audio-head">
          <div class="audio-titles">
            <span class="audio-kicker">{{ audioCard.kicker }}</span>
            <span class="audio-title">{{ audioCard.title }}</span>
          </div>
          <span class="audio-range">{{ audioCard.range }}</span>
        </div>
        <div class="audio-rail" role="progressbar" :aria-valuemin="1" :aria-valuemax="audioCard.total"
          :aria-valuenow="audioCard.current" aria-label="当前音频分组">
          <span class="audio-rail-fill" :style="{ width: (audioCard.current / audioCard.total * 100) + '%' }"></span>
        </div>
        <div class="audio-meta">
          <span class="audio-pos">第 {{ audioCard.current }} / {{ audioCard.total }} 组</span>
          <span v-if="audioCard.currentCode" class="audio-code">当前 {{ audioCard.currentCode }}</span>
        </div>
        <p class="audio-hint">{{ audioCard.hint }}</p>
      </div>

      <div class="audio-play-wrap">
        <button class="audio-play" type="button" title="打开音频二维码，扫码播放" aria-label="打开音频二维码，扫码播放"
          aria-haspopup="dialog" @click="openQr">
          <span class="play-tri" aria-hidden="true">▶</span>
        </button>
        <span class="audio-play-cap">扫码播放</span>
      </div>
    </div>

    <!-- 注意：这里不能再用 mode="out-in"（嵌套在外层页面过渡里会与外层 out-in 互相等待，
         导致离开本页时整站路由切换卡死、下一页渲染不出来）。普通淡入淡出即可。 -->
    <transition name="tab-swap">
    <!-- ============ 词汇板块（左右翻页卡片） ============ -->
    <section v-if="tab === 'words'" key="words" id="upanel-words" role="tabpanel" aria-labelledby="utab-words"
      class="unit-panel">
      <div class="flip-wrap">
        <transition :name="wordsAnim">
          <div class="block-card flip-card surface" :key="'w' + wordsIndex">
            <div class="group-head">
              <h3 class="surface-title">{{ /重要短语/.test(curWords.title) ? '表現のまとめ' : '語彙のまとめ' + curWords.group }}（{{ curWords.title }}）</h3>
              <span v-if="curWords.audio" class="audio-tag">🎧 {{ curWords.audio }}</span>
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
        <button class="page-btn" type="button" :disabled="wordsIndex <= 0" title="上一组（快捷键 A）"
          @click="wordsPrev">← 上一组</button>
        <div class="pager-mid">
          <span class="page-indicator">第 <b>{{ wordsIndex + 1 }}</b> / {{ unit.words.groups.length }} 组</span>
          <div class="pager-dots" aria-hidden="true">
            <i v-for="i in unit.words.groups.length" :key="i" :class="{ on: i - 1 === wordsIndex }"></i>
          </div>
        </div>
        <button class="page-btn" type="button" :disabled="wordsIndex >= unit.words.groups.length - 1"
          title="下一组（快捷键 D）" @click="wordsNext">下一组 →</button>
      </div>
      <p class="page-hint"><span class="kbd">A</span> 上一组<span class="kbd">D</span> 下一组</p>
    </section>

    <!-- ============ 题目板块 ============ -->
    <section v-else-if="tab === 'questions'" key="questions" id="upanel-questions" role="tabpanel"
      aria-labelledby="utab-questions" class="unit-panel">
      <div class="flip-wrap">
        <transition :name="qAnim">
          <div class="block-card flip-card surface" :key="'q' + qIndex">
            <div class="group-head">
              <h3 class="surface-title">{{ curSec.section }}. {{ curSec.title }}</h3>
              <span v-if="curSec.audio" class="audio-tag">🎧 {{ curSec.audio }}</span>
            </div>

        <!-- 例题（kana 题型） -->
        <div v-if="curSec.example" class="q-example">
          <span class="q-example-tag">例題</span>
          <span v-html="jp(curSec.example.text, curSec.example.textFuri)"></span>
          <span class="q-example-ans">（{{ curSec.example.kanji }}）</span>
        </div>

        <!-- 选择题 / 判断正误 -->
        <template v-if="curSec.type === 'select' || curSec.type === 'judge'">
        <div v-for="item in curSec.items" :key="item.n" class="q-item">
          <div class="q-head">
            <div class="q-no">{{ item.n }}</div>
            <span v-if="item.audio" class="q-audio">🎧 {{ item.audio }}</span>
          </div>
          <div class="q-body">
            <div v-if="item.text" class="q-text" v-html="jp(item.text, item.textFuri)"></div>

            <!-- 双问（質問1/質問2，統合理解） -->
            <template v-if="item.questions && item.questions.length">
              <div v-for="(sq, qi) in item.questions" :key="qi" class="q-subq">
                <div class="q-subq-name">{{ sq.q }}</div>
                <div class="q-options">
                  <button v-for="(opt, i) in sq.options" :key="i" class="q-opt option-item"
                    :class="[optClass(item, optKey(sq, i), qi), { disabled: !!picked(item, qi) }]"
                    :disabled="!!picked(item, qi)"
                    @click="choose(item, optKey(sq, i), opt, qi, sq.answer)">
                    <span v-if="!isNumOpt(opt)" class="opt-num">{{ optKey(sq, i) }}</span>{{ opt }}
                  </button>
                </div>
                <div v-if="picked(item, qi)" class="q-ans-box">
                  <div class="q-ans-line" :class="picked(item, qi).correct ? 'ok' : 'no'">
                    {{ picked(item, qi).correct ? '✓ 回答正确' : '✗ 正确答案 ' + sq.answer }}
                  </div>
                </div>
              </div>
              <div v-if="picked(item, 0) && picked(item, 1)" class="q-detail">
                <div v-if="item.vocab && item.vocab.length" class="q-vocab">
                  <span class="q-script-label">📖 词汇</span>
                  <span v-for="(v, vi) in item.vocab" :key="vi" class="q-vocab-item">
                    <b v-html="jp(v.w, v.wFuri)"></b>：{{ v.m }}
                  </span>
                </div>
                <div v-if="item.analysis && item.analysis.length" class="q-analysis">
                  <span class="q-script-label">💡 精讲</span>
                  <div v-for="(p, ai) in item.analysis" :key="ai" class="q-analysis-p" v-html="jp(p.t, p.tFuri)"></div>
                </div>
                <div v-if="item.script" class="q-script">
                  <span class="q-script-label">🔉 听力原文</span>
                  <span v-html="jp(item.script, item.scriptFuri)"></span>
                </div>
              </div>
            </template>

            <!-- 单问 -->
            <template v-else>
            <div class="q-options">
              <button v-for="(opt, i) in item.options" :key="i" class="q-opt option-item"
                :class="[optClass(item, optKey(item, i)), { disabled: !!picked(item) }]"
                :disabled="!!picked(item)"
                @click="choose(item, optKey(item, i), opt)">
                <span v-if="!isNumOpt(opt)" class="opt-num">{{ optKey(item, i) }}</span>{{ opt }}
              </button>
            </div>
            <div v-if="picked(item)" class="q-ans-box">
              <div class="q-ans-line" :class="picked(item).correct ? 'ok' : 'no'">
                {{ picked(item).correct ? '✓ 回答正确' : '✗ 正确答案 ' + item.answer }}
              </div>
              <div v-if="item.vocab && item.vocab.length" class="q-vocab">
                <span class="q-script-label">📖 词汇</span>
                <span v-for="(v, vi) in item.vocab" :key="vi" class="q-vocab-item">
                  <b v-html="jp(v.w, v.wFuri)"></b>：{{ v.m }}
                </span>
              </div>
              <div v-if="item.analysis && item.analysis.length" class="q-analysis">
                <span class="q-script-label">💡 精讲</span>
                <div v-for="(p, ai) in item.analysis" :key="ai" class="q-analysis-p" v-html="jp(p.t, p.tFuri)"></div>
              </div>
              <div v-if="item.script" class="q-script">
                <span class="q-script-label">🔉 听力原文</span>
                <span v-html="jp(item.script, item.scriptFuri)"></span>
              </div>
            </div>
            </template>
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
                  <span v-if="item.kanji" class="q-ans-kanji">（<span v-html="furiOn && item.kanjiFuri ? item.kanjiFuri : item.kanji"></span>）</span>
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

        <!-- 补句子+敬语普通形 -->
        <template v-if="curSec.type === 'keigo'">
          <div v-for="item in curSec.items" :key="item.n" class="q-item">
            <div class="q-no">{{ item.n }}</div>
            <div class="q-body">
              <div class="q-text" v-html="jp(item.text, item.textFuri)"></div>
              <button class="btn btn-secondary btn-sm ans-btn" @click="toggleAns(item)">
                {{ shown(item) ? '收起答案' : '查看答案' }}
              </button>
              <div v-if="shown(item)" class="q-ans-box">
                <div v-for="(a, i) in item.answers" :key="i" class="q-ans-line ok q-keigo-ans">
                  <span class="q-ans-no">{{ ['①', '②', '③'][i] || (i + 1) }}</span>
                  <b v-html="jp(a.answer, a.answerFuri)"></b>
                  <span class="q-keigo-plain">（普通形：<span v-html="jp(a.plain, a.plainFuri)"></span>）</span>
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
        <button class="page-btn" type="button" :disabled="qIndex <= 0" title="上一大题（快捷键 A）"
          @click="qPrev">← 上一大题</button>
        <div class="pager-mid">
          <span class="page-indicator">第 <b>{{ qIndex + 1 }}</b> / {{ unit.questions.sections.length }} 大题</span>
          <div class="pager-dots" aria-hidden="true">
            <i v-for="i in unit.questions.sections.length" :key="i" :class="{ on: i - 1 === qIndex }"></i>
          </div>
        </div>
        <button class="page-btn" type="button" :disabled="qIndex >= unit.questions.sections.length - 1"
          title="下一大题（快捷键 D）" @click="qNext">下一大题 →</button>
      </div>
      <p class="page-hint"><span class="kbd">A</span> 上一大题<span class="kbd">D</span> 下一大题</p>
    </section>

    <!-- ============ 补充知识板块（左右翻页卡片） ============ -->
    <section v-else key="knowledge" id="upanel-knowledge" role="tabpanel" aria-labelledby="utab-knowledge"
      class="unit-panel">
      <div class="block-card k-intro-card surface">
        <div class="k-intro-head">
          <span class="icon-tile amber sm" aria-hidden="true">💡</span>
          <h3 class="k-title">{{ unit.knowledge.title }}</h3>
        </div>
        <p class="k-intro">{{ unit.knowledge.intro }}</p>
      </div>

      <div class="flip-wrap">
        <transition :name="knowAnim">
          <div class="block-card flip-card surface" :key="'k' + knowIndex">
            <div class="group-head">
              <h3 class="surface-title">{{ curPart.heading }}</h3>
              <span v-if="curPart.audio" class="audio-tag">🎧 {{ curPart.audio }}</span>
            </div>
            <p v-if="curPart.intro" class="k-part-intro">{{ curPart.intro }}</p>
            <!-- 表现卡片（kind=card）：句型+说明+中日例文 -->
            <div v-if="curPart.kind === 'card'" class="k-cards stagger">
              <div v-for="(it, ii) in curPart.items" :key="ii" class="k-card">
                <div class="k-card-head">
                  <span class="k-card-no">{{ it.no }}</span>
                  <span class="k-card-pattern" v-html="jp(it.pattern, it.patternFuri)"></span>
                  <span class="k-card-meaning">{{ it.meaning }}</span>
                </div>
                <p v-if="it.desc" class="k-card-desc">{{ it.desc }}</p>
                <div class="k-card-lines">
                  <div v-for="(ln, li) in it.lines" :key="li" class="k-card-line">
                    <div class="k-card-jp"><span v-if="ln.who" class="k-card-who">{{ ln.who }}</span><span v-html="jp(ln.jp, ln.jpFuri)"></span></div>
                    <div class="k-card-cn">{{ ln.cn }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="k-table-wrap">
              <table class="k-table">
                <thead>
                  <tr>
                    <template v-for="(c, i) in kCols(curPart)" :key="'h' + i">
                      <th :class="c.cls">{{ c.title }}</th>
                    </template>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(p, i) in curPart.pairs" :key="i">
                    <template v-for="(c, j) in kCols(curPart)" :key="'c' + j">
                      <td v-if="c.key === 'c'" class="k-cat">{{ p.c }}</td>
                      <td v-else-if="c.key === 'l'" :class="c.cls">
                        <span class="k-word" v-html="furiOn && p.lFuri ? p.lFuri : p.l"></span>
                        <span v-if="p.lk" class="k-kanji">{{ p.lk }}</span>
                      </td>
                      <td v-else-if="c.key === 'le'" class="k-ex" v-html="jp(p.le, p.leFuri)"></td>
                      <td v-else-if="c.key === 'r'" :class="c.cls">
                        <span class="k-word" v-html="furiOn && p.rFuri ? p.rFuri : p.r"></span>
                        <span v-if="p.rk" class="k-kanji">{{ p.rk }}</span>
                      </td>
                      <td v-else class="k-ex" v-html="jp(p.re, p.reFuri)"></td>
                    </template>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-if="curPart.kind !== 'card'" class="k-table-hint">左右滑动查看完整对比表</p>
          </div>
        </transition>
      </div>
      <div class="flip-pager">
        <button class="page-btn" type="button" :disabled="knowIndex <= 0" title="上一部分（快捷键 A）"
          @click="knowPrev">← 上一部分</button>
        <div class="pager-mid">
          <span class="page-indicator">第 <b>{{ knowIndex + 1 }}</b> / {{ unit.knowledge.parts.length }} 部分</span>
          <div class="pager-dots" aria-hidden="true">
            <i v-for="i in unit.knowledge.parts.length" :key="i" :class="{ on: i - 1 === knowIndex }"></i>
          </div>
        </div>
        <button class="page-btn" type="button" :disabled="knowIndex >= unit.knowledge.parts.length - 1"
          title="下一部分（快捷键 D）" @click="knowNext">下一部分 →</button>
      </div>
      <p class="page-hint"><span class="kbd">A</span> 上一部分<span class="kbd">D</span> 下一部分</p>
    </section>
    </transition>

    <!-- 音频二维码面板：扫码播放的唯一入口 -->
    <Teleport to="body" :disabled="true">
      <transition name="qr-pop">
        <div v-if="qrOpen" class="modal-mask qr-mask" @click.self="closeQr">
          <div class="modal-card qr-modal" role="dialog" aria-modal="true" aria-labelledby="qr-modal-title">
            <div class="modal-head">
              <div>
                <h3 id="qr-modal-title" class="modal-title">音频二维码</h3>
                <p v-if="audioCard" class="qr-modal-sub">{{ audioCard.title }} · {{ audioCard.range }}</p>
              </div>
              <button ref="qrCloseRef" class="modal-close" type="button" title="关闭" aria-label="关闭"
                @click="closeQr">✕</button>
            </div>
            <p class="qr-modal-hint">用手机扫描对应二维码播放；也可点击卡片上的二维码放大。</p>
            <div class="qr-grid">
              <div v-for="t in (audioCard ? audioCard.tracks : [])" :key="t.key" class="qr-grid-item"
                :class="{ current: t.current }" :aria-current="t.current ? 'true' : undefined">
                <div class="qr-grid-img">
                  <img v-if="t.img" :src="t.img" :alt="t.code + ' 音频二维码'" loading="lazy" />
                  <div v-else class="qr-grid-missing">
                    <span aria-hidden="true">▦</span>
                    <small>教材第 {{ t.page || '—' }} 页</small>
                  </div>
                </div>
                <div class="qr-grid-code">{{ t.code }}</div>
                <div class="qr-grid-label" :title="t.label">{{ t.label }}</div>
              </div>
            </div>
            <p v-if="audioCard && !audioCard.tracks.length" class="qr-empty">本单元暂无可用二维码。</p>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
  <div v-else class="container empty-tip">
    <div class="icon-tile iris empty-ico" aria-hidden="true">🎧</div>
    <p>当前等级（{{ level }}）暂无此单元，请从听解列表进入。</p>
    <button class="btn btn-primary" type="button" @click="$router.push('/listening')">返回听解列表</button>
  </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { getListeningUnit as getN2ListeningUnit } from '../data/listening'
import { getListeningUnit as getN1ListeningUnit } from '../data/listening-n1'
import { useFurigana } from '../composables/useFurigana'
import { useLevel } from '../store/levelStore'

const route = useRoute()
const { level } = useLevel()
const furigana = useFurigana()
const furiOn = computed(() => furigana.isEnabled.value)

const unit = computed(() => {
  const id = route.params.unit
  return level.value === 'N1' ? getN1ListeningUnit(id) : getN2ListeningUnit(id)
})
const wordsQrPage = computed(() => (unit.value?.words?.groups[0]?.qrPage) || 0)
const questionsQrPage = computed(() => (unit.value?.questions?.sections[qIndex.value]?.qrPage) || 0)
const knowQrPage = computed(() => (unit.value?.knowledge?.qrPages && unit.value.knowledge.qrPages[0]) || 0)
const tab = ref(unit.value?.words?.groups?.length ? 'words' : 'questions')
const tabs = computed(() => [
  { key: 'words', label: '词汇', emoji: '📖' },
  { key: 'questions', label: '题目', emoji: '📝' },
  { key: 'knowledge', label: '补充知识', emoji: '💡' },
].filter(t => t.key !== 'words' || (unit.value?.words?.groups?.length)))

// ===== 左右翻页卡片（参考「文法」板块分页翻书） =====
const wordsIndex = ref(0)
const wordsAnim = ref('next')
const curWords = computed(() => unit.value?.words?.groups?.[wordsIndex.value] || { list: [] })
function wordsNext() {
  if (!unit.value || wordsIndex.value >= unit.value.words.groups.length - 1) return
  wordsAnim.value = 'next'
  wordsIndex.value++
}
function wordsPrev() {
  if (!unit.value || wordsIndex.value <= 0) return
  wordsAnim.value = 'prev'
  wordsIndex.value--
}

const knowIndex = ref(0)
const knowAnim = ref('next')
const curPart = computed(() => unit.value?.knowledge?.parts?.[knowIndex.value] || { pairs: [] })
function knowNext() {
  if (!unit.value || knowIndex.value >= unit.value.knowledge.parts.length - 1) return
  knowAnim.value = 'next'
  knowIndex.value++
}
function knowPrev() {
  if (!unit.value || knowIndex.value <= 0) return
  knowAnim.value = 'prev'
  knowIndex.value--
}

// ===== 题目板块翻页（每个大题一页） =====
const qIndex = ref(0)
const qAnim = ref('next')
const curSec = computed(() => unit.value?.questions?.sections?.[qIndex.value] || {})
function qNext() {
  if (!unit.value || qIndex.value >= unit.value.questions.sections.length - 1) return
  qAnim.value = 'next'
  qIndex.value++
}
function qPrev() {
  if (!unit.value || qIndex.value <= 0) return
  qAnim.value = 'prev'
  qIndex.value--
}

// 键盘：A 上一页 D 下一页（词汇/题目/知识板块）；Esc 关闭二维码面板
function onKeydown(e) {
  if (e.key === 'Escape' && qrOpen.value) {
    closeQr()
    return
  }
  if (qrOpen.value) return
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

// 二维码图片（按页码加载，静态引入保证打包）
import qrP009 from '../assets/listening/qr_p009.png'
import qrP014 from '../assets/listening/qr_p014.png'
import qrP017 from '../assets/listening/qr_p017.png'
import qrP019 from '../assets/listening/qr_p019.png'
import qrP022 from '../assets/listening/qr_p022.png'
import qrP031 from '../assets/listening/qr_p031.png'
import qrP035 from '../assets/listening/qr_p035.png'
import qrP043 from '../assets/listening/qr_p043.png'
import qrP047 from '../assets/listening/qr_p047.png'
import qrP053 from '../assets/listening/qr_p053.png'
import qrP057 from '../assets/listening/qr_p057.png'
import qrP065 from '../assets/listening/qr_p065.png'
import qrP070 from '../assets/listening/qr_p070.png'
import qrP077 from '../assets/listening/qr_p077.png'
import qrP080 from '../assets/listening/qr_p080.png'
import qrP088 from '../assets/listening/qr_p088.png'
import qrP091 from '../assets/listening/qr_p091.png'
import qrP102 from '../assets/listening/qr_p102.png'
import qrP114 from '../assets/listening/qr_p114.png'
import qrP120 from '../assets/listening/qr_p120.png'
import qrP126 from '../assets/listening/qr_p126.png'
import qrP132 from '../assets/listening/qr_p132.png'
import qrP138 from '../assets/listening/qr_p138.png'
import qrP144 from '../assets/listening/qr_p144.png'
import qrP150 from '../assets/listening/qr_p150.png'
import qrP156 from '../assets/listening/qr_p156.png'
import qrP162 from '../assets/listening/qr_p162.png'
import qrP169 from '../assets/listening/qr_p169.png'
import qrP175 from '../assets/listening/qr_p175.png'
import qrP179 from '../assets/listening/qr_p179.png'
import qrP184 from '../assets/listening/qr_p184.png'
import qrP189 from '../assets/listening/qr_p189.png'
import qrP195 from '../assets/listening/qr_p195.png'
import qrP202 from '../assets/listening/qr_p202.png'
import qrP215 from '../assets/listening/qr_p215.png'
import qrP228 from '../assets/listening/qr_p228.png'
import qrP243 from '../assets/listening/qr_p243.png'
import qrP253 from '../assets/listening/qr_p253.png'
import qrP259 from '../assets/listening/qr_p259.png'
import qrP267 from '../assets/listening/qr_p267.png'
import qrP273 from '../assets/listening/qr_p273.png'
// N1 听解二维码（src/assets/listening-n1/，按 PDF 页号）
import qrN1_9 from '../assets/listening-n1/qr_p9.png'
import qrN1_11 from '../assets/listening-n1/qr_p11.png'
import qrN1_13 from '../assets/listening-n1/qr_p13.png'
const qrImgsN2 = { 9: qrP009, 14: qrP014, 17: qrP017, 19: qrP019, 22: qrP022, 31: qrP031, 35: qrP035, 43: qrP043, 47: qrP047, 53: qrP053, 57: qrP057, 65: qrP065, 70: qrP070, 77: qrP077, 80: qrP080, 88: qrP088, 91: qrP091, 102: qrP102, 114: qrP114, 120: qrP120, 126: qrP126, 132: qrP132, 138: qrP138, 144: qrP144, 150: qrP150, 156: qrP156, 162: qrP162, 169: qrP169, 175: qrP175, 179: qrP179, 184: qrP184, 189: qrP189, 195: qrP195, 202: qrP202, 215: qrP215, 228: qrP228, 243: qrP243, 253: qrP253, 259: qrP259, 267: qrP267, 273: qrP273 }
const qrImgsN1 = { 9: qrN1_9, 11: qrN1_11, 13: qrN1_13 }
function qrImg(page) {
  const map = level.value === 'N1' ? qrImgsN1 : qrImgsN2
  return (page && map[page]) || ''
}

// ===== 音频卡数据：本页没有内置音频文件，音频通过教材二维码扫码播放 =====
// 卡片负责展示当前板块的音频编号、分组位置，并集中提供所有二维码
const qrOpen = ref(false)
const qrCloseRef = ref(null)
let qrReturnFocus = null

const audioCard = computed(() => {
  const u = unit.value
  if (!u) return null

  if (tab.value === 'words') {
    const groups = u.words?.groups || []
    if (!groups.length) return null
    const tracks = groups.map((g, i) => ({
      key: 'w' + i,
      code: g.audio || `第 ${i + 1} 组`,
      label: g.title || `第 ${i + 1} 组`,
      page: g.qrPage,
      img: qrImg(g.qrPage),
      current: i === wordsIndex.value,
    }))
    const cur = groups[Math.min(wordsIndex.value, groups.length - 1)]
    return {
      key: 'words',
      kicker: '本单元词汇',
      title: '词汇音频',
      range: tracks.length > 1 ? `${tracks[0].code} — ${tracks[tracks.length - 1].code}` : tracks[0].code,
      current: Math.min(wordsIndex.value + 1, groups.length),
      total: groups.length,
      currentCode: cur?.audio || '',
      hint: '扫码后按编号选择对应音频组，先听原声再跟读。',
      page: wordsQrPage.value,
      img: qrImg(wordsQrPage.value),
      tracks,
    }
  }

  if (tab.value === 'questions') {
    const sections = u.questions?.sections || []
    if (!sections.length) return null
    const tracks = sections.map((s, i) => ({
      key: 'q' + i,
      code: s.audio || `第 ${i + 1} 大题`,
      label: `第 ${s.section ?? i + 1} 大题${s.title ? ' · ' + s.title : ''}`,
      page: s.qrPage,
      img: qrImg(s.qrPage),
      current: i === qIndex.value,
    }))
    const cur = sections[Math.min(qIndex.value, sections.length - 1)]
    return {
      key: 'questions',
      kicker: '本单元题目',
      title: '题目音频',
      range: tracks.length > 1 ? `${tracks[0].code} — ${tracks[tracks.length - 1].code}` : tracks[0].code,
      current: Math.min(qIndex.value + 1, sections.length),
      total: sections.length,
      currentCode: cur?.audio || '',
      hint: '先扫码听录音，再作答；点击选项或「查看答案」核对。',
      page: questionsQrPage.value,
      img: qrImg(questionsQrPage.value),
      tracks,
    }
  }

  const k = u.knowledge
  if (!k || !k.audio) return null
  const parts = k.parts || []
  const pages = (k.qrPages || []).filter(Boolean)
  const tracks = pages.map((p, i) => ({
    key: 'k' + i,
    code: pages.length > 1 ? `二维码 ${i + 1}` : '音频二维码',
    label: `教材第 ${p} 页`,
    page: p,
    img: qrImg(p),
    current: false,
  }))
  const cur = parts[Math.min(knowIndex.value, parts.length - 1)]
  return {
    key: 'knowledge',
    kicker: '本单元知识点',
    title: '知识音频',
    range: k.audio,
    current: Math.min(knowIndex.value + 1, Math.max(parts.length, 1)),
    total: Math.max(parts.length, 1),
    currentCode: cur?.audio || k.audio,
    hint: '对照下方对比表逐组听辨，注意长短音与清浊音。',
    page: knowQrPage.value,
    img: qrImg(knowQrPage.value),
    tracks,
  }
})

async function openQr() {
  qrReturnFocus = typeof document !== 'undefined' ? document.activeElement : null
  qrOpen.value = true
  await nextTick()
  qrCloseRef.value?.focus()
}
function closeQr() {
  qrOpen.value = false
  const el = qrReturnFocus
  qrReturnFocus = null
  if (el && typeof el.focus === 'function') el.focus()
}

// 振假名渲染：开启时显示 ruby，关闭时显示原文
function jp(text, furi) {
  return furiOn.value && furi ? furi : text
}

// 知识表格列：按 part.head 配置表头（l/le/r/re 顺序），标题为空的列整列隐藏
function kCols(part) {
  const head = part.head || ['左', '例', '右', '例']
  const multi = head.length >= 5
  const keys = multi ? ['c', 'l', 'le', 'r', 're'] : ['l', 'le', 'r', 're']
  const cls = multi ? ['col-c', 'col-a', 'k-ex', 'col-b', 'k-ex'] : ['col-a', 'k-ex', 'col-b', 'k-ex']
  return keys.map((k, i) => ({ key: k, title: head[i], cls: cls[i] })).filter(c => c.title)
}

// 答案展开状态
const shownSet = reactive(new Set())
function toggleAns(item) {
  if (shownSet.has(item)) shownSet.delete(item)
  else shownSet.add(item)
}
function shown(item) { return shownSet.has(item) }

// 选择题/判断题作答状态（数据为静态 import，须存于组件内响应式对象）
const pick = reactive({})
function pkey(item, qi) { return item.n + (item.sub || '') + (qi != null ? ':' + qi : '') }
function picked(item, qi) { return pick[pkey(item, qi)] || null }
function choose(item, sel, optText, qi, answer) {
  const k = pkey(item, qi)
  if (pick[k] && pick[k].locked) return
  const ans = answer || item.answer
  pick[k] = { locked: true, selected: sel, optText, correct: sel === ans || optText === ans }
}
function optKey(item, i) {
  return item.options.length > 2 ? '1234'[i] : 'ab'[i]
}
function isNumOpt(opt) {
  return /^[①②③④]$/.test(opt)
}
function optClass(item, key, qi) {
  const p = picked(item, qi)
  if (!p || !p.locked) return {}
  const ans = qi != null && item.questions && item.questions[qi] ? item.questions[qi].answer : item.answer
  if (key === ans || (p.optText === ans && p.selected === key)) return { correct: true }
  if (key === p.selected) return { wrong: true }
  return { dim: true }
}
</script>

<style scoped>
/* ===== 页头 ===== */
.unit-head { align-items: flex-end; margin-bottom: 18px; }
.unit-head .page-head-main { align-items: flex-start; gap: 14px; }
.unit-back { flex-shrink: 0; margin-top: 3px; min-height: 40px; }
.back-arrow { display: inline-block; transition: transform var(--dur-2) var(--ease-out-expo); }
.unit-back:hover .back-arrow { transform: translateX(-1px); }
.unit-kicker {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: var(--sakura-600);
}
.unit-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--sakura-300); }
.unit-head .page-title { margin-top: 5px; font-size: 26px; letter-spacing: 0.6px; }
.unit-theme {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-light);
  max-width: 64ch;
}
.unit-meta { gap: 7px; }
.unit-meta .chip-pill,
.unit-meta .chip-pill.iris {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 分段标签 ===== */
.unit-tabs {
  display: flex;
  gap: 4px;
  padding: 5px;
  margin: 0 0 18px;
  border-radius: var(--radius-pill);
  background: var(--sakura-50);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-card);
}
.unit-tab {
  position: relative;
  z-index: 0;
  isolation: isolate;
  flex: 1 1 0;
  min-width: 0;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 9px 8px;
  border-radius: var(--radius-pill);
  color: var(--text-light);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.2px;
  transition: color var(--dur-2) var(--ease-soft), transform var(--dur-2) var(--ease-spring);
}
.unit-tab::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background: var(--grad-sakura);
  opacity: 0;
  transform: scale(0.92);
  transition: opacity var(--dur-2) var(--ease-soft), transform var(--dur-4) var(--ease-spring);
}
.unit-tab:hover:not(.active) { color: var(--sakura-600); }
.unit-tab:hover:not(.active)::before { opacity: 1; background: var(--sakura-100); transform: none; }
.unit-tab.active { color: #fff; animation: seg-pop 420ms var(--ease-spring); }
.unit-tab.active::before {
  opacity: 1;
  transform: none;
  box-shadow: 0 6px 18px -8px var(--sakura-600);
}
.unit-tab:active { transform: scale(0.98); }
.ut-emoji {
  font-size: 16px;
  line-height: 1;
  filter: grayscale(0.2);
  transition: transform var(--dur-3) var(--ease-spring), filter var(--dur-2);
}
.unit-tab:hover .ut-emoji { filter: none; }
.unit-tab.active .ut-emoji { filter: none; transform: translateY(-1px) scale(1.08); }
.ut-label { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ===== 音频接入卡 ===== */
.audio-card {
  position: relative;
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 16px;
  margin-bottom: 18px;
  overflow: hidden;
  isolation: isolate;
  border-radius: var(--radius-lg);
  background: var(--card-grad);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-card);
}
.audio-card::before {
  content: '';
  position: absolute;
  z-index: -1;
  top: -130px;
  right: -70px;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--sakura-100) 0%, transparent 68%);
  opacity: 0.7;
  pointer-events: none;
}
.audio-card::after {
  content: '';
  position: absolute;
  z-index: -1;
  left: -60px;
  bottom: -110px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--iris-soft) 0%, transparent 68%);
  opacity: 0.55;
  pointer-events: none;
}
.audio-qr {
  position: relative;
  width: 100px;
  height: 100px;
  padding: 6px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 16px;
  background: var(--card);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-card);
  cursor: zoom-in;
  transition: transform var(--dur-3) var(--ease-spring), border-color var(--dur-2), box-shadow var(--dur-3);
}
.audio-qr img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 10px;
  transition: transform var(--dur-3) var(--ease-out-expo);
}
.audio-qr:hover { border-color: var(--sakura-300); box-shadow: var(--shadow); }
.audio-qr:hover img { transform: scale(1.04); }
.audio-qr:active { transform: scale(0.97); }
.qr-expand {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: var(--text);
  font-size: 12px;
  line-height: 1;
}
.qr-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 1px dashed var(--border-strong);
  border-radius: 10px;
  background: var(--sakura-50);
  color: var(--text-faint);
  font-size: 22px;
}
.qr-fallback small { font-size: 9.5px; }
.audio-main { min-width: 0; }
.audio-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.audio-titles { display: flex; flex-direction: column; min-width: 0; }
.audio-kicker {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--text-light);
}
.audio-title {
  font-size: 15.5px;
  font-weight: 800;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.audio-range {
  flex-shrink: 0;
  padding: 3px 9px;
  border-radius: var(--radius-pill);
  background: var(--sakura-50);
  border: 1px solid var(--border);
  color: var(--sakura-600);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.audio-rail {
  position: relative;
  height: 6px;
  margin-top: 12px;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: var(--sakura-100);
}
.audio-rail-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: var(--grad-sakura);
  transition: width var(--dur-4) var(--ease-out-expo);
}
.audio-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-top: 7px;
  font-size: 11px;
  color: var(--text-light);
}
.audio-pos { color: var(--text); font-weight: 700; font-variant-numeric: tabular-nums; }
.audio-code { color: var(--text-faint); }
.audio-code::before { content: '·'; margin-right: 6px; color: var(--text-faint); }
.audio-hint { margin-top: 5px; font-size: 11.5px; line-height: 1.55; color: var(--text-light); overflow-wrap: anywhere; }
.audio-play-wrap { display: flex; flex-direction: column; align-items: center; gap: 5px; flex-shrink: 0; }
.audio-play {
  position: relative;
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--grad-sakura);
  color: #fff;
  box-shadow: 0 8px 20px -8px var(--sakura-600);
  transition: transform var(--dur-2) var(--ease-spring), box-shadow var(--dur-3) var(--ease-out-expo);
}
.audio-play::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1px solid var(--sakura-200);
  opacity: 0;
  transition: inset var(--dur-3) var(--ease-out-expo), opacity var(--dur-3);
}
.audio-play:hover { transform: translateY(-1px) scale(1.04); box-shadow: 0 12px 24px -10px var(--sakura-600); }
.audio-play:hover::before { inset: -7px; opacity: 1; }
.audio-play:active { transform: scale(0.93); }
.play-tri { font-size: 17px; line-height: 1; margin-left: 2px; }
.audio-play-cap { font-size: 10px; font-weight: 700; color: var(--text-light); white-space: nowrap; }

/* ===== 二维码面板 ===== */
.qr-mask { z-index: var(--z-modal); }
.qr-modal { width: min(560px, 100%); }
.qr-modal .modal-close { width: 40px; height: 40px; }
.qr-modal-sub { margin-top: 3px; font-size: 12px; color: var(--text-light); }
.qr-modal-hint { margin-bottom: 14px; font-size: 12.5px; line-height: 1.7; color: var(--text-light); }
.qr-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.qr-grid-item {
  padding: 9px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: var(--card);
  transition: border-color var(--dur-2), box-shadow var(--dur-2), transform var(--dur-2) var(--ease-out-expo);
}
.qr-grid-item.current { border-color: var(--sakura-400); box-shadow: 0 0 0 3px var(--sakura-100); }
.qr-grid-img {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 10px;
  background: var(--card);
}
.qr-grid-img img { width: 100%; height: 100%; object-fit: contain; }
.qr-grid-code { margin-top: 6px; font-size: 11px; font-weight: 800; color: var(--sakura-600); }
.qr-grid-label {
  margin-top: 2px;
  font-size: 10.5px;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.qr-grid-missing {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 1px dashed var(--border-strong);
  border-radius: 10px;
  background: var(--sakura-50);
  color: var(--text-faint);
  font-size: 24px;
}
.qr-grid-missing small { font-size: 9.5px; }
.qr-empty { font-size: 12px; color: var(--text-light); }
.qr-pop-enter-active, .qr-pop-leave-active { transition: opacity var(--dur-2) var(--ease-soft); }
.qr-pop-enter-from, .qr-pop-leave-to { opacity: 0; }

/* ===== 板块切换过渡 ===== */
.unit-panel { outline: none; }
.tab-swap-enter-active { transition: opacity var(--dur-3) var(--ease-out-expo), transform var(--dur-4) var(--ease-out-expo); }
/* 不用 mode="out-in"（会与页面级 out-in 死锁），离场时脱离文档流，避免两个面板同时占位导致跳动 */
.tab-swap-leave-active { position: absolute; left: 0; right: 0; pointer-events: none; transition: opacity 140ms var(--ease-soft), transform 140ms var(--ease-soft); }
.tab-swap-enter-from { opacity: 0; transform: translateY(10px); }
.tab-swap-leave-to { opacity: 0; transform: translateY(-6px); }

/* ===== 内容卡片 ===== */
.block-card {
  position: relative;
  background: var(--card-grad);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px 22px;
  box-shadow: var(--shadow-card);
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
  pointer-events: none;
}
.flip-next-enter-active, .flip-next-leave-active,
.flip-prev-enter-active, .flip-prev-leave-active {
  transition: transform 360ms var(--ease-out-expo), opacity 260ms var(--ease-soft);
}
.flip-next-enter-active, .flip-next-leave-active { transform-origin: left center; }
.flip-prev-enter-active, .flip-prev-leave-active { transform-origin: right center; }
.flip-next-enter-from { transform: rotateY(-84deg); opacity: 0.15; }
.flip-next-leave-to { transform: rotateY(84deg); opacity: 0.15; }
.flip-prev-enter-from { transform: rotateY(84deg); opacity: 0.15; }
.flip-prev-leave-to { transform: rotateY(-84deg); opacity: 0.15; }

/* ===== 分页 ===== */
.flip-pager {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
}
.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 42px;
  padding: 9px 16px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--sakura-600);
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  transition:
    transform var(--dur-2) var(--ease-spring),
    border-color var(--dur-2) var(--ease-soft),
    background var(--dur-2) var(--ease-soft),
    box-shadow var(--dur-3) var(--ease-out-expo);
}
.page-btn:hover:not(:disabled) {
  border-color: var(--sakura-300);
  background: var(--sakura-50);
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}
.page-btn:active:not(:disabled) { transform: scale(0.96); }
.page-btn:disabled { opacity: 0.35; cursor: default; }
.pager-mid { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 0; }
.page-indicator {
  font-size: 12.5px;
  color: var(--text-light);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.page-indicator b { color: var(--text); font-weight: 800; }
.pager-dots { display: flex; align-items: center; gap: 4px; }
.pager-dots i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--border-strong);
  transition: width var(--dur-3) var(--ease-out-expo), background var(--dur-2) var(--ease-soft);
}
.pager-dots i.on { width: 16px; border-radius: 3px; background: var(--sakura-500); }
.page-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin-top: 8px;
  font-size: 10.5px;
  color: var(--text-faint);
}
.kbd {
  display: inline-block;
  padding: 0 6px;
  border: 1px solid var(--border-strong);
  border-bottom-width: 2px;
  border-radius: 5px;
  background: var(--card);
  color: var(--sakura-600);
  font-family: inherit;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.6;
}
/* ===== 卡片标题 ===== */
.group-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}
.group-head h3 {
  min-width: 0;
  font-size: 16px;
  line-height: 1.55;
  color: var(--text);
  overflow-wrap: anywhere;
}
.group-head .surface-title::before { align-self: flex-start; margin-top: 3px; }
.audio-tag {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  background: var(--amber-soft);
  color: var(--amber);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

/* ===== 词汇表 ===== */
.word-table {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px 26px;
}
.word-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 9px 10px;
  border-bottom: 1px solid var(--line);
  border-radius: 10px;
  transition: background var(--dur-2) var(--ease-soft);
}
.word-row:hover { background: var(--sakura-50); }
.word-jp { font-size: 16px; font-weight: 700; color: var(--text); overflow-wrap: anywhere; }
.word-kana { flex-shrink: 0; font-size: 11.5px; color: var(--sakura-500); }
.word-mean {
  max-width: 62%;
  margin-left: auto;
  color: var(--text-light);
  font-size: 12.5px;
  text-align: right;
  overflow-wrap: anywhere;
}
.word-row :deep(ruby) { ruby-position: over; }

/* ===== 题目 ===== */
.q-example {
  margin-bottom: 12px;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-left: 3px solid var(--iris);
  border-radius: 12px;
  background: var(--iris-soft);
  color: var(--text);
  font-size: 14px;
  line-height: 1.85;
}
.q-example-tag {
  display: inline-block;
  margin-right: 8px;
  padding: 2px 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--card);
  color: var(--iris);
  font-size: 10.5px;
  font-weight: 700;
  vertical-align: 1px;
}
.q-example-ans { margin-left: 6px; color: var(--iris); font-weight: 700; }

.q-item {
  display: flex;
  gap: 12px;
  padding: 16px 2px;
  border-bottom: 1px solid var(--line);
}
.q-item:last-child { border-bottom: none; padding-bottom: 6px; }
.q-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  width: 60px;
}
.q-no {
  position: relative;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--sakura-100);
  color: var(--sakura-700);
  font-size: 13.5px;
  font-weight: 800;
  box-shadow: var(--shadow-card);
}
.q-sub {
  position: absolute;
  right: -6px;
  bottom: -6px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--amber-soft);
  color: var(--amber);
  font-size: 10px;
  font-weight: 700;
}
.q-body { flex: 1; min-width: 0; }
.q-text {
  margin-bottom: 10px;
  color: var(--text);
  font-size: 15px;
  line-height: 1.85;
  overflow-wrap: anywhere;
}
.q-text :deep(ruby) { ruby-position: over; }

.q-options { display: flex; flex-direction: column; gap: 8px; }
.q-subq { margin-top: 14px; }
.q-subq + .q-subq { margin-top: 16px; padding-top: 14px; border-top: 1px dashed var(--border); }
.q-subq-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  background: var(--iris-soft);
  color: var(--iris);
  font-size: 12.5px;
  font-weight: 800;
}
.q-detail { margin-top: 16px; }
.q-opt {
  width: 100%;
  min-height: 46px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border: 2px solid var(--border);
  border-radius: 14px;
  background: var(--card);
  color: var(--text);
  font-size: 14.5px;
  line-height: 1.6;
  text-align: left;
  transition:
    transform var(--dur-2) var(--ease-spring),
    border-color var(--dur-2) var(--ease-soft),
    background var(--dur-2) var(--ease-soft),
    box-shadow var(--dur-2) var(--ease-soft);
}
.q-opt:hover:not(:disabled):not(.disabled) { border-color: var(--sakura-300); background: var(--card-hover); }
.q-opt.correct { border-color: var(--green); background: var(--green-soft); }
.q-opt.wrong { border-color: var(--red); background: var(--red-soft); }
.q-opt.dim { opacity: 0.45; }
.q-opt:disabled { cursor: default; }
.opt-num {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--sakura-100);
  color: var(--sakura-700);
  font-size: 12.5px;
  font-weight: 800;
}
.q-opt.correct .opt-num { background: var(--green); color: #fff; }
.q-opt.wrong .opt-num { background: var(--red); color: #fff; }

.ans-btn { margin-top: 10px; min-height: 40px; }
.q-ans-box {
  margin-top: 12px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--sakura-50);
  animation: ans-in var(--dur-3) var(--ease-out-expo);
}
@keyframes ans-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: none; }
}
.q-ans-line { color: var(--text); font-size: 13.5px; line-height: 1.85; }
.q-ans-line.ok { color: var(--green); font-weight: 700; }
.q-ans-line.ok b { color: var(--green); }
.q-ans-line.no { color: var(--red); font-weight: 700; }
.q-ans-kanji { color: var(--text); }
.q-ans-kana { margin-left: 4px; color: var(--text-light); font-size: 12px; }
.q-keigo-ans { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; }
.q-keigo-ans b { color: var(--green); }
.q-keigo-plain { color: var(--text-light); font-size: 12px; }
.q-script {
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--card);
  color: var(--text);
  font-size: 13px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
.q-script-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-right: 7px;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--sakura-100);
  color: var(--sakura-700);
  font-size: 11px;
  font-weight: 700;
  vertical-align: 1px;
}
.q-script :deep(ruby), .q-ans-box :deep(ruby) { ruby-position: over; }

.q-audio {
  max-width: 100%;
  padding: 2px 7px;
  border-radius: var(--radius-pill);
  background: var(--amber-soft);
  color: var(--amber);
  font-size: 10.5px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.q-vocab {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
  margin-top: 10px;
  color: var(--text);
  font-size: 12.5px;
  line-height: 1.9;
}
.q-vocab .q-script-label { margin-right: 2px; }
.q-vocab-item {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  padding: 2px 8px;
  border-radius: 8px;
  background: var(--iris-soft);
  overflow-wrap: anywhere;
}
.q-vocab-item b { color: var(--iris); }
.q-analysis { margin-top: 12px; }
.q-analysis .q-script-label { margin-bottom: 4px; }
.q-analysis-p {
  margin-top: 6px;
  padding-left: 10px;
  border-left: 2px solid var(--border);
  color: var(--text-light);
  font-size: 12.5px;
  line-height: 1.9;
  text-align: justify;
  overflow-wrap: anywhere;
}
.q-analysis-p :deep(ruby) { ruby-position: over; }

.q-part + .q-part { margin-top: 18px; padding-top: 14px; border-top: 1px dashed var(--border); }
.q-part-name {
  display: inline-flex;
  margin: 4px 0 6px;
  padding: 3px 12px;
  border-radius: var(--radius-pill);
  background: var(--iris-soft);
  color: var(--iris);
  font-size: 12px;
  font-weight: 800;
}
.q-conv {
  padding: 14px;
  margin-bottom: 12px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--card);
}
.q-conv-name { margin-bottom: 10px; color: var(--sakura-600); font-size: 12.5px; font-weight: 800; }
.q-conv-line {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 7px;
  font-size: 13.5px;
  line-height: 1.8;
}
.q-conv-who {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  border-radius: 50%;
  background: var(--sakura-100);
  color: var(--sakura-700);
  font-size: 11px;
  font-weight: 800;
}
.q-conv-line.male .q-conv-who { background: var(--cyan-soft); color: var(--cyan); }
.q-conv-text {
  flex: 1;
  min-width: 0;
  padding: 5px 10px;
  border-radius: 10px;
  background: var(--sakura-50);
  overflow-wrap: anywhere;
}
.q-conv-line.male .q-conv-text { background: var(--cyan-soft); }
.q-conv-text :deep(ruby) { ruby-position: over; }
.q-conv-ans { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; }
.q-ans-no { min-width: 22px; color: var(--text-light); font-size: 12px; }

/* ===== 补充知识 ===== */
.k-intro-card { overflow: hidden; }
.k-intro-card::before {
  content: '';
  position: absolute;
  top: -80px;
  right: -40px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--amber-soft) 0%, transparent 68%);
  opacity: 0.8;
  pointer-events: none;
}
.k-intro-head { position: relative; display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.k-title { color: var(--text); font-size: 17px; font-weight: 800; line-height: 1.4; }
.k-intro {
  position: relative;
  color: var(--text-light);
  font-size: 13.5px;
  line-height: 1.95;
  text-align: justify;
  overflow-wrap: anywhere;
}
.k-part-intro {
  margin-bottom: 10px;
  padding: 7px 11px;
  border-radius: 10px;
  background: var(--iris-soft);
  color: var(--iris);
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.6;
}

.k-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--line);
  border-radius: 12px;
}
.k-table {
  width: 100%;
  min-width: 600px;
  border-collapse: collapse;
  font-size: 13.5px;
}
.k-table th, .k-table td {
  padding: 9px 10px;
  border: 1px solid var(--line);
  text-align: left;
  vertical-align: top;
  line-height: 1.7;
}
.k-table thead th {
  background: var(--sakura-50);
  color: var(--sakura-700);
  font-size: 12px;
  font-weight: 700;
}
.k-table .col-a { background: var(--cyan-soft); }
.k-table .col-b { background: var(--amber-soft); }
.k-table .k-cat {
  background: var(--sakura-50);
  color: var(--sakura-700);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.k-table .col-c {
  min-width: 26px;
  background: var(--sakura-100);
  color: var(--sakura-700);
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  writing-mode: vertical-rl;
  letter-spacing: 2px;
}
.k-word { margin-right: 6px; color: var(--text); font-weight: 700; overflow-wrap: anywhere; }
.k-kanji { color: var(--text-light); font-size: 11.5px; }
.k-ex { color: var(--text-light); font-size: 12.5px; }
.k-ex :deep(ruby) { ruby-position: over; }
.k-table-hint { display: none; margin-top: 8px; color: var(--text-faint); font-size: 11px; text-align: center; }

/* 表现卡片（知识 kind=card） */
.k-cards { display: flex; flex-direction: column; gap: 12px; }
.k-card {
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-left: 3px solid var(--sakura-400);
  border-radius: 14px;
  background: var(--card);
  transition:
    transform var(--dur-2) var(--ease-out-expo),
    box-shadow var(--dur-3) var(--ease-out-expo),
    border-color var(--dur-2) var(--ease-soft);
}
.k-card:nth-child(3n + 2) { border-left-color: var(--iris); }
.k-card:nth-child(3n) { border-left-color: var(--cyan); }
@media (hover: hover) and (pointer: fine) {
  .k-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-card); }
}
.k-card-head { display: flex; align-items: baseline; flex-wrap: wrap; gap: 7px; margin-bottom: 7px; }
.k-card-no {
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--grad-sakura);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}
.k-card-pattern { color: var(--sakura-700); font-size: 14.5px; font-weight: 800; }
.k-card-meaning {
  padding: 1px 8px;
  border-radius: var(--radius-pill);
  background: var(--sakura-50);
  color: var(--text-light);
  font-size: 12px;
}
.k-card-desc { margin-bottom: 10px; color: var(--text-light); font-size: 12.5px; line-height: 1.9; overflow-wrap: anywhere; }
.k-card-lines { display: flex; flex-direction: column; gap: 8px; }
.k-card-line { border-top: 1px dashed var(--border); padding-top: 8px; }
.k-card-line:first-child { border-top: none; padding-top: 0; }
.k-card-jp { color: var(--text); font-size: 13.5px; line-height: 1.8; overflow-wrap: anywhere; }
.k-card-who {
  display: inline-block;
  min-width: 24px;
  margin-right: 6px;
  padding: 0 6px;
  border-radius: 5px;
  background: var(--amber-soft);
  color: var(--amber);
  font-size: 11px;
  font-weight: 700;
  text-align: center;
}
.k-card-cn { margin-top: 2px; color: var(--text-light); font-size: 12.5px; line-height: 1.8; }
.k-card :deep(ruby) { ruby-position: over; }

/* ===== 键盘焦点（覆盖带阴影的按钮，保证焦点环可见） ===== */
.audio-qr:focus-visible,
.audio-play:focus-visible,
.page-btn:focus-visible,
.unit-tab:focus-visible {
  outline: 2px solid var(--sakura-400);
  outline-offset: 2px;
}

/* ===== 深色模式：浅色渐变上的文字改为深色，保证对比度 ===== */
[data-theme="dark"] .unit-tab.active,
[data-theme="dark"] .audio-play,
[data-theme="dark"] .k-card-no { color: var(--bg); }
[data-theme="dark"] .q-opt.correct .opt-num,
[data-theme="dark"] .q-opt.wrong .opt-num { color: var(--bg); }

/* ===== 响应式 ===== */
@media (max-width: 760px) {
  .word-table { grid-template-columns: 1fr; gap: 0; }
  .unit-head .page-title { font-size: 23px; }
}

@media (max-width: 640px) {
  .unit-head { align-items: flex-start; margin-bottom: 14px; }
  .unit-head .page-head-main { align-items: flex-start; gap: 10px; }
  .unit-back { padding: 7px 12px; }
  .unit-head .page-title { margin-top: 4px; font-size: 20px; }
  .unit-kicker { font-size: 10px; letter-spacing: 1.1px; }
  .unit-theme { font-size: 12.5px; }
  .unit-meta { width: 100%; }
  .unit-meta .chip-pill { flex: 0 1 auto; max-width: 100%; }
  .unit-tabs { margin-bottom: 14px; }
  .unit-tab { padding: 9px 5px; gap: 5px; font-size: 13px; }
  .ut-emoji { font-size: 15px; }
  .audio-card { grid-template-columns: 88px minmax(0, 1fr) auto; gap: 12px; padding: 13px; }
  .audio-qr { width: 88px; height: 88px; padding: 5px; }
  .audio-title { font-size: 14.5px; }
  .audio-range { font-size: 10px; padding: 2px 7px; }
  .audio-hint { font-size: 11px; }
  .audio-play { width: 50px; height: 50px; }
  .play-tri { font-size: 15px; }
  .block-card { padding: 16px; }
  .group-head h3 { font-size: 14.5px; }
  .audio-tag { font-size: 10px; padding: 3px 8px; }
  .word-row { padding: 9px 6px; }
  .word-mean { max-width: 65%; }
  .q-item { gap: 10px; padding: 14px 0; }
  .q-head { width: 52px; }
  .q-no { width: 30px; height: 30px; font-size: 12.5px; }
  .q-text { font-size: 14.5px; }
  .q-opt { padding: 10px 12px; font-size: 14px; }
  .q-example { font-size: 13px; }
  .q-conv { padding: 12px; }
  .k-table-hint { display: block; }
  .k-table { min-width: 560px; font-size: 13px; }
  .flip-pager { gap: 8px; }
  .page-btn { padding: 8px 12px; font-size: 12.5px; }
  .page-hint { display: none; }
  .qr-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .qr-modal-hint { font-size: 12px; }
}

@media (max-width: 380px) {
  .unit-tab { font-size: 12.5px; }
  .audio-card { grid-template-columns: 76px minmax(0, 1fr) auto; }
  .audio-qr { width: 76px; height: 76px; }
  .audio-play { width: 46px; height: 46px; }
  .audio-play-cap { font-size: 9px; }
  .page-indicator { font-size: 11.5px; }
}

/* ===== 空状态 ===== */
.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 60px 20px;
  color: var(--text-light);
  text-align: center;
}
.empty-ico {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  font-size: 30px;
  animation: float-soft 4.2s ease-in-out infinite;
}
.empty-tip p { font-size: 14px; line-height: 1.8; }
</style>
