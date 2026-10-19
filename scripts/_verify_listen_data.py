# -*- coding: utf-8 -*-
"""听解新数据统一校验：JS 可解析 + 题数核对（N1 unit2-15 / N5 1-12 / N4 1-12）
用法：python scripts/_verify_listen_data.py
题数口径与前端 unitSummary 一致：items 计 items.length；convs 计 answers 总和；parts(word 型) 计 items 总和。
"""
import re, io, json, glob, sys

BASE = r'D:\01-项目\日语自学网站\src\data'

EXPECT = {
    # (目录, 单元id) -> 期望题数
    ('listening-n1', 2): 50, ('listening-n1', 3): 50, ('listening-n1', 4): 50,
    ('listening-n1', 5): 50, ('listening-n1', 6): 50, ('listening-n1', 7): 50, ('listening-n1', 8): 50,
    ('listening-n1', 9): 20, ('listening-n1', 10): 20, ('listening-n1', 11): 20,
    ('listening-n1', 12): 65, ('listening-n1', 13): 7, ('listening-n1', 14): 34, ('listening-n1', 15): 34,
    ('listening-n5', 1): 50, ('listening-n5', 2): 50, ('listening-n5', 3): 50, ('listening-n5', 4): 50,
    ('listening-n5', 5): 50, ('listening-n5', 6): 50,
    ('listening-n5', 7): 15, ('listening-n5', 8): 15, ('listening-n5', 9): 25, ('listening-n5', 10): 27,
    ('listening-n5', 11): 24, ('listening-n5', 12): 24,
    ('listening-n4', 1): 50, ('listening-n4', 2): 50, ('listening-n4', 3): 50, ('listening-n4', 4): 50,
    ('listening-n4', 5): 50, ('listening-n4', 6): 50,
    ('listening-n4', 7): 15, ('listening-n4', 8): 15, ('listening-n4', 9): 25, ('listening-n4', 10): 29,
    ('listening-n4', 11): 28, ('listening-n4', 12): 28,
}

def load_js(path):
    with io.open(path, 'r', encoding='utf-8') as f:
        txt = f.read()
    txt = re.sub(r'^import\s+.*$', '', txt, flags=re.M)
    txt = re.sub(r'^\s*//.*$', '', txt, flags=re.M)
    s = re.sub(r'^\s*export\s+default\s*', '', txt, flags=re.M).strip()
    s = re.sub(r',\s*([}\]])', r'\1', s)
    s = re.sub(r';?\s*$', '', s)
    return json.loads(s)

def count_questions(q):
    total = 0
    for sec in q['sections']:
        if sec.get('items'):
            total += len(sec['items'])
        elif sec.get('convs'):
            total += sum(len(c.get('answers', [])) for c in sec['convs'])
        elif sec.get('parts'):
            total += sum(len(p.get('items', [])) for p in sec['parts'])
    return total

ok_all = True
found = set()
for root, unit in sorted(EXPECT, key=lambda x: (x[0], x[1])):
    d = f'{BASE}\\{root}\\unit{unit}'
    for fname in ('index.js', 'words.js', 'questions.js', 'knowledge.js'):
        p = f'{d}\\{fname}'
        if not io.open(p, 'rb').read().strip():
            print(f'EMPTY/MISSING {p}'); ok_all = False; continue
        if fname == 'index.js':
            # ES 模块：键未加引号属正常（与 unit1 蓝本一致），按正则校验 id/必填键
            txt = io.open(p, 'r', encoding='utf-8').read()
            if not re.search(r'id\s*:\s*%d\b' % unit, txt):
                print(f'ID MISSING {p}: expect id={unit}'); ok_all = False
            for key in ('title', 'words', 'questions', 'knowledge'):
                if not re.search(r'\b%s\s*[,:]' % key, txt):
                    print(f'KEY MISSING {p}: {key}'); ok_all = False
            continue
        try:
            obj = load_js(p)
        except Exception as e:
            print(f'PARSE FAIL {p}: {e}'); ok_all = False; continue
        if fname == 'questions.js':
            c = count_questions(obj)
            exp = EXPECT[(root, unit)]
            if c != exp:
                print(f'COUNT FAIL {root}/unit{unit}: questions={c} expect {exp}'); ok_all = False
            else:
                print(f'OK {root}/unit{unit}: questions={c}')
    found.add((root, unit))

missing = [k for k in EXPECT if k not in found]
if missing:
    print('MISSING UNITS:', missing); ok_all = False

print('==== RESULT:', 'ALL PASS' if ok_all else 'FAILURES ABOVE', '====')
sys.exit(0 if ok_all else 1)
