import fs from 'fs'
const p = 'D:/日语自学网站/src/App.vue'
let c = fs.readFileSync(p, 'utf-8')
const isCRLF = c.includes('\r\n')
const nl = isCRLF ? '\r\n' : '\n'

const old = `<router-link to="/" class="nav-link" :class="{ active: $route.path === '/' }">首页</router-link>${nl}            <router-link to="/stats" class="nav-link" :class="{ active: $route.path === '/stats' }">统计</router-link>`
const neu = `<router-link to="/" class="nav-link" :class="{ active: $route.path === '/' }">首页</router-link>${nl}            <router-link to="/words" class="nav-link" :class="{ active: $route.path.startsWith('/words') }">背词</router-link>${nl}            <router-link to="/stats" class="nav-link" :class="{ active: $route.path === '/stats' }">统计</router-link>`

if (!c.includes(old)) { console.log('ERROR: nav links not found'); process.exit(1) }
c = c.replace(old, neu)
fs.writeFileSync(p, c, 'utf-8')
console.log('Done')
