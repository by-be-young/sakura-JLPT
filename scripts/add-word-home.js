import fs from 'fs'
const p = 'D:/日语自学网站/src/views/Home.vue'
let c = fs.readFileSync(p, 'utf-8')
const NL = '\r\n'

// 在 "练习模式" 标题前插入背词入口板块
const old1 = '    <!-- 练习模式 -->' + NL + '    <div class="section-title">练习模式</div>'
const new1 = '    <!-- 背词板块 -->' + NL + '    <div class="section-title">背词</div>' + NL + '    <div class="mode-grid">' + NL + '      <div class="mode-card" @click="$router.push(\'/words\')">' + NL + '        <div class="emoji">🌸</div>' + NL + '        <h3>背词</h3>' + NL + '        <p>红宝书词汇 · 新学/复习/笔记 · 多种题型 · 音调标注</p>' + NL + '      </div>' + NL + '    </div>' + NL + NL + '    <!-- 练习模式 -->' + NL + '    <div class="section-title">练习模式</div>'
if (!c.includes(old1)) { console.log('ERROR: old1 not found'); process.exit(1) }
c = c.replace(old1, new1)

fs.writeFileSync(p, c, 'utf-8')
console.log('Done: Home updated')
