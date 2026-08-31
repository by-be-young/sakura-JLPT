# -*- coding: utf-8 -*-
"""
将新解析的 N5 数据合入 src/data/grammar.js，替换旧 N5，保留 N4~N1（含其 furi）。
"""
import json, re, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS = os.path.join(ROOT, 'src', 'data', 'grammar.js')
NEW = os.path.join(ROOT, 'src', 'data', '_n5_new.json')

data = open(JS, encoding='utf-8').read()
m = re.search(r'export const grammarLevels = (.*)$', data, re.S)
levels = json.loads(m.group(1).rstrip().rstrip(';'))
assert levels[0]['id'] == 'N5', levels[0]['id']

with open(NEW, encoding='utf-8') as f:
    new_n5 = json.load(f)

old_n5_pts = sum(len(u['points']) for u in levels[0]['units'])
new_n5_pts = sum(len(u['points']) for u in new_n5['units'])
print(f'旧 N5: {old_n5_pts} 点 -> 新 N5: {new_n5_pts} 点')
levels[0] = new_n5

out = '// 自动生成：由 scripts/gen_grammar_n5.py 从《蓝宝书文法详解.docx》解析 N5，N4~N1 由旧脚本生成，请勿手改。\n' \
      '// 结构：levels[] -> units[] -> points[] -> blocks[]（furi 为开启振假名时的 ruby 版本）\n' \
      'export const grammarLevels = ' + json.dumps(levels, ensure_ascii=False, separators=(',', ':')) + '\n'
with open(JS, 'w', encoding='utf-8') as f:
    f.write(out)
print('已写回', JS, '| 大小', len(out.encode('utf-8')), 'bytes')
