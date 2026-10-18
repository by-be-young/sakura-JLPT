# -*- coding: utf-8 -*-
import re, json, io
with io.open(r'D:\01-项目\日语自学网站\src\data\grammar.js','r',encoding='utf-8') as f:
    txt = f.read()
m = re.search(r'export const grammarLevels = (\[.*\]);?\s*$', txt, re.S)
data = json.loads(m.group(1))
for lv in data:
    counts = [len(u['points']) for u in lv['units']]
    total = sum(counts)
    print(lv['name'], 'total=', total, 'units=', counts)
