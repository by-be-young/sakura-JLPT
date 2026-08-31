import fs from 'fs'
const p = 'D:/日语自学网站/src/router/index.js'
let c = fs.readFileSync(p, 'utf-8')
const NL = '\r\n'

// 1. 添加 WordLearn 导入
const old1 = "import UnitSelect from '../views/UnitSelect.vue'"
const new1 = "import UnitSelect from '../views/UnitSelect.vue'" + NL + "import WordLearn from '../views/WordLearn.vue'"
if (!c.includes(old1)) { console.log('ERROR: old1 not found'); process.exit(1) }
c = c.replace(old1, new1)

// 2. 添加路由
const old2 = "  { path: '/units', name: 'units', component: UnitSelect },"
const new2 = "  { path: '/units', name: 'units', component: UnitSelect }," + NL + "  { path: '/words', name: 'words', component: WordLearn },"
if (!c.includes(old2)) { console.log('ERROR: old2 not found'); process.exit(1) }
c = c.replace(old2, new2)

fs.writeFileSync(p, c, 'utf-8')
console.log('Done: router updated')
