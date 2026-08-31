import fs from 'fs'
const p = 'D:/日语自学网站/src/router/index.js'
let c = fs.readFileSync(p, 'utf-8')

// 添加 import
const old1 = "import WordLearn from '../views/WordLearn.vue'\r"
const new1 = "import WordLearn from '../views/WordLearn.vue'\rimport WordStudy from '../views/WordStudy.vue'\rimport WordReview from '../views/WordReview.vue'\r"
if (!c.includes(old1)) { console.log('ERROR: import not found'); process.exit(1) }
c = c.replace(old1, new1)

// 添加路由
const old2 = "  { path: '/words', name: 'words', component: WordLearn },\r"
const new2 = "  { path: '/words', name: 'words', component: WordLearn },\r  { path: '/words/learn', name: 'words-learn', component: WordStudy },\r  { path: '/words/review', name: 'words-review', component: WordReview },\r"
if (!c.includes(old2)) { console.log('ERROR: route not found'); process.exit(1) }
c = c.replace(old2, new2)

fs.writeFileSync(p, c, 'utf-8')
console.log('Done')
