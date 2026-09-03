# -*- coding: utf-8 -*-
"""将 gen_mock_n3_data.py 中的 P96..P100 数据写入 questions-n3.js 并填充 mockInfo（幂等）"""
import json, io, os, re, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('gmd', os.path.join(HERE, 'gen_mock_n3_data.py'))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

ALL = mod.P96 + mod.P97 + mod.P98 + mod.P99 + mod.P100
assert len(ALL) == 290, len(ALL)

ids = [q[0] for q in ALL]
assert ids == list(range(711, 1001)), (ids[0], ids[-1])
for q in ALL:
    assert len(q[3]) == 4, q[0]
    assert 1 <= q[4] <= 4, q[0]
    assert q[1] in (1, 2, 3, 4, 5), q[0]

ranges = {1: (711, 768), 2: (769, 826), 3: (827, 884), 4: (885, 942), 5: (943, 1000)}

BASE = os.path.dirname(HERE)
path = os.path.join(BASE, 'src', 'data', 'questions-n3.js')
with io.open(path, encoding='utf-8') as f:
    src = f.read()

# ---- 幂等：只保留「头部注释 + 基础题(到第一个 711 对象前)」 ----
m = re.search(r'\n  \{"id":\s*711,', src)
if m:
    base_part = src[:m.start()].rstrip()
    if not base_part.endswith(','):
        base_part = base_part + ','
    src = base_part + '\n]\n'
else:
    # 没有模拟题：保留基础题数组原样，仅截掉旧的 mockInfo（含注释）
    mi = src.find('export const mockInfo')
    if mi >= 0:
        src = src[:mi].rstrip() + '\n'

# ---- 生成模拟题 JSON ----
ARTICLES = getattr(mod, 'ARTICLES', {})
ARTICLE_GROUPS = [(764, 768), (822, 826), (880, 884), (938, 942), (996, 1000)]

def article_for(qid):
    for s, e in ARTICLE_GROUPS:
        if s <= qid <= e:
            return ARTICLES.get(s, '')
    return ''

lines = []
for (qid, mock, sentence, options, answer, translation, explanation) in ALL:
    obj = {
        "id": qid,
        "mock": mock,
        "sentence": sentence,
        "options": options,
        "answer": answer,
        "translation": translation,
        "explanation": explanation,
        "article": article_for(qid),
        "sentenceFurigana": "",
        "explanationFurigana": "",
    }
    lines.append('  ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')))

# 在数组的最后一个 ] 之前插入模拟题
idx = src.rfind('\n]')
insert = '\n' + ',\n'.join(lines) + '\n'
src = src[:idx] + insert + src[idx:]

# ---- 填充 mockInfo ----
mock_entries = []
for k in range(1, 6):
    s, e = ranges[k]
    mock_entries.append('  "%d": {\n    "name": "第%d回模拟测试",\n    "start": %d,\n    "end": %d,\n    "count": %d\n  }' % (k, k, s, e, e - s + 1))
mock_block = 'export const mockInfo = {\n' + ',\n'.join(mock_entries) + '\n}\n'
src = src.rstrip() + '\n\n' + mock_block

with io.open(path, 'w', encoding='utf-8') as f:
    f.write(src)
print('OK: appended', len(ALL), 'questions; mockInfo filled; total len', len(src))
