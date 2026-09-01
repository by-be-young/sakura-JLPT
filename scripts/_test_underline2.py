# -*- coding: utf-8 -*-
"""Improved underline detection test."""
import re, sys
sys.stdout.reconfigure(encoding='utf-8')
import pykakasi

kks = pykakasi.kakasi()
KANJI = re.compile(r'[\u4e00-\u9fff]')

def has_kanji(s):
    return bool(KANJI.search(s))

def detect(sentence, option):
    """Return (i, j, orig_substr, mode) or None."""
    try:
        res = kks.convert(sentence)
    except Exception:
        return None
    tokens = [(it['orig'], it['hira']) for it in res]
    best = None
    for i in range(len(tokens)):
        orig_i, hira_i = tokens[i]
        if not has_kanji(orig_i):
            continue
        if not option.startswith(hira_i) or not hira_i:
            continue
        rem = option[len(hira_i):]
        span_orig = orig_i
        span_j = i
        found = None
        if rem == '':
            found = (i, i, orig_i, 'full1')
        else:
            for j in range(i + 1, len(tokens)):
                oj, hj = tokens[j]
                if rem.startswith(hj):
                    rem = rem[len(hj):]
                    span_orig += oj
                    span_j = j
                    if rem == '':
                        found = (i, j, span_orig, 'fullN')
                        break
                elif hj.startswith(rem):
                    span_orig += oj[:len(rem)]
                    found = (i, j, span_orig, 'partial')
                    break
                else:
                    break
        if found is None:
            continue
        score = (0 if found[3] == 'full1' else (1 if found[3] == 'fullN' else 2),
                 found[1] - found[0], i)
        if best is None or score < best[0]:
            best = (score, found)
    return best[1] if best else None

# Parse MD
with open(r'C:\Users\34166\Desktop\N3考级分P开头题目_答案.md', encoding='utf-8') as f:
    lines = f.read().splitlines()

qid_pat = re.compile(r'^\*\*(\d{3})\*\*\s*(.*)$')
opt_pat = re.compile(r'^\s*1\.\s*(.*?)\s*2\.\s*(.*?)\s*3\.\s*(.*?)\s*4\.\s*(.*?)\s*$')
ans_pat = re.compile(r'^\*\*答案：(\d)\*\*\s*(.*)$')

questions = []
i = 0
while i < len(lines):
    m = qid_pat.match(lines[i])
    if m:
        qid = int(m.group(1)); sentence = m.group(2)
        mo = opt_pat.match(lines[i+1] if i+1 < len(lines) else '')
        ma = ans_pat.match(lines[i+2] if i+2 < len(lines) else '')
        if mo and ma:
            options = [mo.group(k).strip() for k in range(1, 5)]
            questions.append({'id': qid, 'sentence': sentence, 'options': options,
                              'answer': int(ma.group(1))})
        i += 3
    else:
        i += 1

text_qs = [q for q in questions if ((q['id'] - 1) % 6) in (0, 1)]
print('文字 questions:', len(text_qs))
ok = 0; fail = []
for q in text_qs:
    option = q['options'][q['answer'] - 1]
    r = detect(q['sentence'], option)
    if r:
        # verify the found substr actually appears in sentence
        if r[2] in q['sentence']:
            ok += 1
        else:
            fail.append((q['id'], 'SUBS-NOT-IN-SENT', option, q['sentence'], r[2]))
    else:
        fail.append((q['id'], 'NOHIT', option, q['sentence'], ''))
print('success: %d / %d' % (ok, len(text_qs)))
print('--- FAILURES ---')
for f in fail:
    print(f[0], '|', f[1], '|', f[2], '|', f[3], '|', f[4])
