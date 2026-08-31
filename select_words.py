# -*- coding: utf-8 -*-
"""精选每等级词条候选"""
import json, re, random

words = json.load(open('words_clean.json', encoding='utf-8'))

def is_clean(w):
    if '\\text' in w['meaning'] or 'circled' in w['meaning']: return False
    if not w['pitch']: return False
    if not w['examples']: return False
    if re.search(r'[\\{}a-zA-Z0-9]', (w['kanji'] or '') + (w['kana'] or '')): return False
    if len(w['kanji'] or '') > 6: return False
    if len(w['kana']) > 10: return False
    bad = ['答:', '力', '口', '|']
    if any(b in (w['meaning'] + ''.join(w['examples'])) for b in bad): return False
    if re.search(r'[与反力及人境無]', w['kanji'] or ''): return False
    return True

clean = [w for w in words if is_clean(w)]
print('候选:', len(clean))

random.seed(7)
selected = []
for level in ['N4N5', 'N3', 'N2', 'N1']:
    sub = [w for w in clean if w['level'] == level]
    random.shuffle(sub)
    selected += sub[:16]

with open('selected_words.txt', 'w', encoding='utf-8') as f:
    for i, w in enumerate(selected):
        ex = w['examples'][0] if w['examples'] else ''
        ex2 = w['examples'][1] if len(w['examples']) > 1 else ''
        line = '{}|{}|{}|{}|{}|{}|{}|{}|{}'.format(
            i, w['level'], w['kanji'], w['kana'], ','.join(w['pitch']), w['pos'], w['meaning'], ex, ex2)
        f.write(line + '\n')

print('已保存 selected_words.txt')
