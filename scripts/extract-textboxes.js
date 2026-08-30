// 从docx的textbox中提取选项
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const files = [
  { path: 'C:\\Users\\34166\\Desktop\\红蓝宝书 1000题 N2 （超清版本）_1-100.docx', start: 1, end: 100 },
  { path: 'C:\\Users\\34166\\Desktop\\红蓝宝书 1000题 N2 （超清版本）_101-200.docx', start: 101, end: 200 },
  { path: 'C:\\Users\\34166\\Desktop\\红蓝宝书 1000题 N2 （超清版本）_201-300.docx', start: 201, end: 300 },
  { path: 'C:\\Users\\34166\\Desktop\\红蓝宝书 1000题 N2 （超清版本）_301-337.docx', start: 301, end: 337 },
]

// 动态导入zip库
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { execSync } = require('child_process')

for (const f of files) {
  // 使用python提取textbox内容
  const pyCode = `
import zipfile, re, sys
z = zipfile.ZipFile(sys.argv[1])
xml = z.read('word/document.xml').decode('utf-8')
# 提取所有textbox内容
textboxes = re.findall(r'<w:txbxContent>(.*?)</w:txbxContent>', xml, re.DOTALL)
for i, tb in enumerate(textboxes):
    # 提取所有文本
    texts = re.findall(r'<w:t[^>]*>(.*?)</w:t>', tb, re.DOTALL)
    full = ''.join(texts).strip()
    if full:
        print(f'TB{i}: {full}')
`
  const pyFile = path.join(__dirname, 'extract_tb.py')
  fs.writeFileSync(pyFile, pyCode)
  try {
    const result = execSync(`python "${pyFile}" "${f.path}"`, { encoding: 'utf-8', maxBuffer: 10*1024*1024 })
    const outFile = path.join(__dirname, `tb_${f.start}-${f.end}.txt`)
    fs.writeFileSync(outFile, result, 'utf-8')
    const lines = result.split('\n').filter(l => l.trim())
    console.log(`${f.start}-${f.end}: ${lines.length} 个文本框 -> ${outFile}`)
  } catch (e) {
    console.log(`${f.start}-${f.end}: 提取失败 - ${e.message}`)
  }
}
