# -*- coding: utf-8 -*-
import json, sys, os
sys.stdout.reconfigure(encoding='utf-8')
data = json.load(open(r'D:\日语自学网站\mock_parsed.json', encoding='utf-8'))
usable = [d for d in data if d.get('answer') and len([o for o in d['options'] if o]) >= 2]
print('总解析:', len(data), '可用:', len(usable))
from collections import Counter
print('各回:', dict(Counter(d['mock'] for d in usable)))

lines = ['// 日语N2题库 - 红蓝宝书1000题 模拟测试部分',
         '// 格式简单，新增题目只需往数组里加对象即可',
         'export const questions = [']
for d in usable:
    opts = list(d['options'])
    while len(opts) < 4:
        opts.append('')
    obj = {
        'id': d['id'],
        'mock': d['mock'],
        'sentence': d['sentence'],
        'options': opts,
        'answer': d['answer'],
        'translation': d.get('translation',''),
        'explanation': d.get('explanation',''),
    }
    lines.append('  ' + json.dumps(obj, ensure_ascii=False) + ',')
lines.append(']')
lines.append('')
lines.append('export const mockInfo = {')
for r in range(1,6):
    ids = [d['id'] for d in usable if d['mock']==r]
    if ids:
        lines.append(f'  {r}: {{ name: "第{r}回模拟测试", start: {min(ids)}, end: {max(ids)}, count: {len(ids)} }},')
lines.append('}')
os.makedirs(r'D:\日语自学网站\src\data', exist_ok=True)
open(r'D:\日语自学网站\src\data\questions.js','w',encoding='utf-8').write('\n'.join(lines))
print('已生成 src/data/questions.js')
