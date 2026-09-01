# -*- coding: utf-8 -*-
import re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ==== Analyze N2 questions.js unit divisions ====
with open(r'D:\日语自学网站\src\data\questions.js', encoding='utf-8-sig') as f:
    text = f.read()

units = {}
for m in re.finditer(r'"id":\s*(\d+),\s*"type":\s*"([^"]+)",\s*"unit":\s*(\d+)', text):
    qid = int(m.group(1)); typ = m.group(2); unit = int(m.group(3))
    units.setdefault(unit, []).append((qid, typ))

print("===== N2 unit divisions =====")
for u in sorted(units):
    qs = units[u]
    ids = [x[0] for x in qs]
    types = [x[1] for x in qs]
    print(f"unit {u:2d}: {ids[0]} - {ids[-1]}  count={len(ids)}  types={dict((t, types.count(t)) for t in set(types))}")

# check id range
ids_all = [int(x) for x in re.findall(r'"id":\s*(\d+)', text)]
print("N2 total objects with id:", len(ids_all))
print("N2 max id:", max(ids_all))

# check mock questions
mocks = re.findall(r'"id":\s*(\d+).*?"mock":\s*(\d+)', text, re.S)
print("N2 mock qids:", [int(a) for a,b in mocks])
