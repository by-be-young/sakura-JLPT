# -*- coding: utf-8 -*-
"""
将新解析的 N2 数据合入 src/data/grammar.js，替换旧 N2，保留 N5/N4/N3/N1（含其 furi）。
"""
import json, re, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS = os.path.join(ROOT, 'src', 'data', 'grammar.js')
NEW = os.path.join(ROOT, 'src', 'data', '_n2_new.json')

data = open(JS, encoding='utf-8').read()
m = re.search(r'export const grammarLevels = (.*)$', data, re.S)
levels = json.loads(m.group(1).rstrip().rstrip(';'))
idx = next(i for i, l in enumerate(levels) if l['id'] == 'N2')
old_pts = sum(len(u['points']) for u in levels[idx]['units'])

with open(NEW, encoding='utf-8') as f:
    new_n2 = json.load(f)
new_pts = sum(len(u['points']) for u in new_n2['units'])
print(f'旧 N2: {old_pts} 点 -> 新 N2: {new_pts} 点')
levels[idx] = new_n2

out = '// 自动生成：N5/N4/N3/N2 由 scripts/gen_grammar_n5.py、gen_grammar_n4.py、gen_grammar_n3.py、gen_grammar_n2.py 从蓝宝书各分册解析，N1 由旧脚本生成，请勿手改。\n' \
      '// 结构：levels[] -> units[] -> points[] -> blocks[]（furi 为开启振假名时的 ruby 版本）\n' \
      'export const grammarLevels = ' + json.dumps(levels, ensure_ascii=False, separators=(',', ':')) + '\n'
with open(JS, 'w', encoding='utf-8') as f:
    f.write(out)
print('已写回', JS, '| 大小', len(out.encode('utf-8')), 'bytes')
