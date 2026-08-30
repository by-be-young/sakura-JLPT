// 在原题库文件基础上插入/更新振假名字段，保留用户注释和格式
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import KuroshiroModule from 'kuroshiro'
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji'

const Kuroshiro = KuroshiroModule.default || KuroshiroModule
const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  console.log('初始化 kuroshiro + kuromoji 字典...')
  const kuroshiro = new Kuroshiro()
  await kuroshiro.init(new KuromojiAnalyzer({
    dictPath: path.join(__dirname, '../node_modules/kuromoji/dict')
  }))
  console.log('字典加载完成')

  const questionsPath = path.join(__dirname, '../src/data/questions.js')
  const { questions } = await import('../src/data/questions.js?t=' + Date.now())

  console.log(`共 ${questions.length} 题，生成振假名...`)

  // 生成所有振假名
  const furiMap = {}
  let sOk = 0, eOk = 0, fail = 0

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    try {
      const sentText = (q.sentence || '').replace(/<[^>]+>/g, '')
      furiMap[q.id] = {
        sentence: sentText ? await kuroshiro.convert(sentText, { to: 'hiragana', mode: 'furigana' }) : '',
        explanation: '',
      }
      sOk++
    } catch (e) {
      furiMap[q.id] = { sentence: q.sentence || '', explanation: '' }
      fail++
    }

    if (q.explanation) {
      try {
        const lines = q.explanation.split(/<br\s*\/?>/i)
        const converted = []
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) { converted.push(''); continue }
          const clean = trimmed.replace(/<[^>]+>/g, '')
          converted.push(await kuroshiro.convert(clean, { to: 'hiragana', mode: 'furigana' }))
        }
        furiMap[q.id].explanation = converted.join('<br>')
        eOk++
      } catch (e) {
        furiMap[q.id].explanation = q.explanation
      }
    }

    if ((i + 1) % 100 === 0) {
      console.log(`  进度: ${i + 1}/${questions.length}`)
    }
  }

  console.log(`生成完成: 题干${sOk}, 解析${eOk}, 失败${fail}`)

  // 读取原文件，在每个题目对象中插入/更新振假名字段，保留注释
  let content = fs.readFileSync(questionsPath, 'utf-8')

  // 匹配每个题目对象: 从 "id": N, 开始到该对象结束的 }
  // 格式:  {\n    "id": 1,\n    ...\n  },
  const questionRegex = /(\{\n\s+"id":\s*(\d+),[\s\S]*?\n\s+\})(,?)/g

  let matchCount = 0
  content = content.replace(questionRegex, (full, objBody, idStr, trailingComma) => {
    const id = Number(idStr)
    const furi = furiMap[id]
    if (!furi) return full

    // 移除已存在的振假名字段（如果有）
    let body = objBody
    body = body.replace(/\n\s+"sentenceFurigana":\s*"[^"]*",?/g, '')
    body = body.replace(/\n\s+"explanationFurigana":\s*"[^"]*",?/g, '')

    // 转义双引号
    const esc = s => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

    // 确定缩进（找第一个字段的缩进）
    const indentMatch = body.match(/\n(\s+)"id":/)
    const indent = indentMatch ? indentMatch[1] : '    '

    // 检查最后一个字段是否已有尾随逗号
    const hasTrailingComma = /,\n\s+\}$/.test(body)
    const commaPrefix = hasTrailingComma ? '\n' : ',\n'

    // 在最后一个字段后、闭合 } 前插入振假名字段
    const insertText = `${commaPrefix}${indent}"sentenceFurigana": "${esc(furi.sentence)}",\n${indent}"explanationFurigana": "${esc(furi.explanation)}"`

    body = body.replace(/\n(\s+)\}$/, (m, closeIndent) => {
      return `${insertText}\n${closeIndent}}`
    })

    matchCount++
    return body + trailingComma
  })

  fs.writeFileSync(questionsPath, content, 'utf-8')
  console.log(`已更新 ${matchCount} 道题的振假名字段，保留原文件注释和格式`)
  console.log(`写入: ${questionsPath}`)
}

main().catch(e => {
  console.error('生成失败:', e)
  process.exit(1)
})
