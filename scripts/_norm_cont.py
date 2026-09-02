# -*- coding: utf-8 -*-
"""把 N3/N2/N1「接续」标签下行内的全角「／」「＋」归一化为半角 / +，
使 parseContinuation 能识别并渲染中括号（与 N4/N5 一致）。"""
import io, json, re

D = 'src/data/grammar.js'
d = io.open(D, encoding='utf-8').read()
m = re.search(r'export const grammarLevels = (\[.*);?\s*$', d, re.S)
data = json.loads(m.group(1))

changed = 0
for lv in data:
    if lv['id'] not in ('N3', 'N2', 'N1'):
        continue
    for u in lv.get('units', []):
        for p in u.get('points', []):
            in_cont = False
            for b in p.get('blocks', []):
                if b.get('t') == 'label':
                    in_cont = str(b.get('label', '')).startswith('接续')
                    continue
                if in_cont and b.get('t') == 'line':
                    t = b.get('text', '')
                    nt = t.replace('／', '/').replace('＋', '+')
                    if nt != t:
                        b['text'] = nt
                        changed += 1

prefix = d[:d.index('export const grammarLevels')]
out = prefix + 'export const grammarLevels = ' + json.dumps(data, ensure_ascii=False) + '\n'
io.open(D, 'w', encoding='utf-8').write(out)
print(f'归一化接续行 {changed} 条')
