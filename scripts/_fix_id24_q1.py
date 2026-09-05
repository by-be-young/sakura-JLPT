import json, re

target = r'D:\日语自学网站\src\data\reading-n1.js'

with open(target, 'r', encoding='utf-8') as f:
    content = f.read()

start = content.index('[')
end = content.rindex(']')
arr_str = re.sub(r',\s*\]', ']', content[start:end+1])
data = json.loads(arr_str)

# Fix id=24 Q1 answer: PDF says X (1), data has 〇 (0)
for d in data:
    if d['id'] == 24:
        print(f"Before: id=24 Q1 answer={d['questions'][0]['answer']}")
        d['questions'][0]['answer'] = 1
        print(f"After: id=24 Q1 answer={d['questions'][0]['answer']}")
        # Also print Q1 stem and options for verification
        print(f"Q1 stem: {d['questions'][0]['stem'][:80]}")
        print(f"Q1 options: {d['questions'][0]['options']}")

# Rewrite
lines = []
lines.append('// 读解题库（N1）：橙宝书《新日本语能力考试N1读解》· 基础编')
lines.append('// - 每篇文章：article（【n】为句号标记，渲染为上标）、translation（全文翻译/文章概要）、analysis（难句分析）')
lines.append('// - 判断题已转为两个选项的选择题（合っている / 合っていない）')
lines.append('// - 语汇/语法预习（読む前に）与改写题不收录')
lines.append('// - 振假名由 scripts/gen_reading_furigana_n1.mjs 自动生成，请勿手改')
lines.append('export const readingN1 = [')
for r in data:
    lines.append('  ' + json.dumps(r, ensure_ascii=False) + ',')
lines.append(']')

with open(target, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines) + '\n')

print('\nFixed and written.')
