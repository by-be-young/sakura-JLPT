# -*- coding: utf-8 -*-
"""Test underline detection for N3 文字 questions."""
import re, sys
sys.stdout.reconfigure(encoding='utf-8')
import pykakasi

kks = pykakasi.kakasi()
KANJI = re.compile(r'[\u4e00-\u9fff]')

def has_kanji(s):
    return bool(KANJI.search(s))

def detect(sentence, option):
    """Return (start_orig, end_orig, ok_reason) for underline or None."""
    try:
        res = kks.convert(sentence)
    except Exception:
        return None
    tokens = [(it['orig'], it['hira']) for it in res]
    best = None
    for i, (orig_i, hira_i) in enumerate(tokens):
        if not has_kanji(orig_i):
            continue
        # exact single token
        if hira_i == option:
            cand = (i, i, 'exact1')
        elif option.startswith(hira_i) and len(hira_i) > 0:
            # try extend
            buf = hira_i
            j = i
            while len(buf) < len(option) and j + 1 < len(tokens):
                j += 1
                buf += tokens[j][1]
            if buf == option:
                cand = (i, j, 'exactN')
            elif buf.startswith(option) and len(buf) - len(option) <= 2:
                # over-glued by <=2 kana -> trim
                cand = (i, max(i, j - 1), 'over')
            elif option.startswith(buf):
                cand = (i, j, 'under')
            else:
                continue
        else:
            continue
        # scoring: prefer exact over over/under; shorter span; earlier start
        score = (0 if cand[2] == 'exact1' else (1 if cand[2] == 'exactN' else 2), cand[1] - cand[0], i)
        if best is None or score < best[0]:
            best = (score, cand)
    if best is None:
        return None
    return best[1]

# Parse the MD file
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
        qid = int(m.group(1))
        sentence = m.group(2)
        opt_line = lines[i+1] if i+1 < len(lines) else ''
        mo = opt_pat.match(opt_line)
        ans_line = lines[i+2] if i+2 < len(lines) else ''
        ma = ans_pat.match(ans_line)
        if mo and ma:
            options = [mo.group(k).strip() for k in range(1, 5)]
            answer = int(ma.group(1))
            explanation = ma.group(2).strip()
            questions.append({'id': qid, 'sentence': sentence, 'options': options,
                              'answer': answer, 'explanation': explanation})
        i += 3
    else:
        i += 1

# Filter 文字 (position 1-2 in group of 6)
text_qs = [q for q in questions if ((q['id'] - 1) % 6) in (0, 1)]
print('total questions:', len(questions), '| 文字 questions:', len(text_qs))

ok = 0
fail = []
for q in text_qs:
    option = q['options'][q['answer'] - 1]
    r = detect(q['sentence'], option)
    if r:
        ok += 1
    else:
        fail.append((q['id'], q['sentence'], option, q['explanation'][:40]))

print('detect success: %d / %d' % (ok, len(text_qs)))
print('--- FAILURES ---')
for f in fail[:40]:
    print(f[0], '|', f[2], '|', f[1], '|', f[3])
