# -*- coding: utf-8 -*-
import re

with open(r'D:\日语自学网站\src\data\questions.js', encoding='utf-8-sig') as f:
    text = f.read()

pat = re.compile(r'"id":\s*(\d+),\s*"type":\s*"([^"]+)",\s*"unit":\s*(\d+)')
units = {}
for m in pat.finditer(text):
    units.setdefault(int(m.group(3)), []).append(int(m.group(1)))

for u in sorted(units):
    qs = units[u]
    print('unit %2d -> %3d - %3d   count %2d' % (u, min(qs), max(qs), len(qs)))

# mock questions: find all question objects with "mock" field
mocks = re.findall(r'"id":\s*(\d+)[\s\S]*?"mock":\s*(\d+)', text)
print('mock question pairs found:', len(mocks))
mock_ids = sorted(set(int(a) for a, _ in mocks))
print('mock ids:', mock_ids)
