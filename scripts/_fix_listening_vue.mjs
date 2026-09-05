// 临时：批量修正 ListeningUnit.vue 中的振假名调用与 v-if/v-for
import fs from 'fs'
const p = 'D:/日语自学网站/src/views/ListeningUnit.vue'
let s = fs.readFileSync(p, 'utf8')
const before = s

const reps = [
  ['v-html="furiText(sec.example.text)"', 'v-html="jp(sec.example.text, sec.example.textFuri)"'],
  ['v-html="furiText(item.text)"', 'v-html="jp(item.text, item.textFuri)"'],
  ['v-html="furiText(item.script)"', 'v-html="jp(item.script, item.scriptFuri)"'],
  ['v-html="furiText(item.answer)"', 'v-html="jp(item.answer, item.answerFuri)"'],
  ['v-html="furiText(line.text)"', 'v-html="jp(line.text, line.textFuri)"'],
  ['v-html="furiText(a.answer)"', 'v-html="jp(a.answer, a.answerFuri)"'],
  ['v-html="furiText(p.le)"', 'v-html="jp(p.le, p.leFuri)"'],
  ['v-html="furiText(p.re)"', 'v-html="jp(p.re, p.reFuri)"'],
]
for (const [a, b] of reps) s = s.split(a).join(b)

// select 题的 v-if/v-for 同元素修正：包一层 template
const oldSelect = '<div v-if="sec.type === \'select\'" v-for="item in sec.items" :key="item.n" class="q-item">'
const newSelect = '<template v-if="sec.type === \'select\'">\n        <div v-for="item in sec.items" :key="item.n" class="q-item">'
if (s.includes(oldSelect)) s = s.split(oldSelect).join(newSelect)

const selEnd = '          </div>\n        </div>\n\n        <!-- 补假名 / 补短语 / 填词 -->'
const selEndNew = '          </div>\n        </div>\n        </template>\n\n        <!-- 补假名 / 补短语 / 填词 -->'
if (s.includes(selEnd)) s = s.split(selEnd).join(selEndNew)

fs.writeFileSync(p, s, 'utf8')
console.log('changed:', before !== s)
