// 临时：把题目板块改为左右翻页卡片
import fs from 'fs'
const p = 'D:/日语自学网站/src/views/ListeningUnit.vue'
let s = fs.readFileSync(p, 'utf8')
const before = s

// 1) 开头：block-card 包裹 → 翻页结构
const headOld = `      <div v-for="sec in unit.questions.sections" :key="sec.section" class="block-card">
        <div class="group-head">
          <h3>{{ sec.section }}. {{ sec.title }}</h3>
          <span class="audio-tag">🎧 {{ sec.audio }}</span>
        </div>`
const headNew = `      <div class="flip-wrap">
        <transition :name="qAnim">
          <div class="block-card flip-card" :key="'q' + qIndex">
            <div class="group-head">
              <h3>{{ curSec.section }}. {{ curSec.title }}</h3>
              <span class="audio-tag">🎧 {{ curSec.audio }}</span>
            </div>`
if (!s.includes(headOld)) { console.log('ERROR: head not found'); process.exit(1) }
s = s.split(headOld).join(headNew)

// 2) 板块内 sec. → curSec.（仅题目板块模板使用 sec 变量）
s = s.replace(/sec\./g, 'curSec.')

// 3) 结尾：conv template 结束 → 加 pager 闭合
const tailOld = `        </template>
      </div>
    </section>

    <!-- ============ 补充知识板块（左右翻页卡片） ============ -->`
const tailNew = `        </template>
          </div>
        </transition>
      </div>
      <div class="flip-pager">
        <button class="page-btn" :disabled="qIndex <= 0" @click="qPrev">← 上一大题</button>
        <span class="page-indicator">第 {{ qIndex + 1 }} / {{ unit.questions.sections.length }} 大题</span>
        <button class="page-btn" :disabled="qIndex >= unit.questions.sections.length - 1" @click="qNext">下一大题 →</button>
      </div>
    </section>

    <!-- ============ 补充知识板块（左右翻页卡片） ============ -->`
if (!s.includes(tailOld)) { console.log('ERROR: tail not found'); process.exit(1) }
s = s.split(tailOld).join(tailNew)

fs.writeFileSync(p, s, 'utf8')
console.log('changed:', before !== s)
