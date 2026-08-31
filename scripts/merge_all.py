# 合并全部等级新词到 words.js 并写回
import json, subprocess

# 读取现有 words.js 样例词
r = subprocess.run(['node', '--input-type=module', '-e', '''
import { words } from "./src/data/words.js";
console.log(JSON.stringify(words));
'''], capture_output=True, text=True, cwd='D:/日语自学网站')
existing = json.loads(r.stdout)

# 样例词 = id <= 65（原手工样例）
samples = [w for w in existing if w['id'] <= 65]
print('样例词:', len(samples))

# N4N5 样例词重新归类到 N4 / N5
N4_MAP = {'戦争', '以前', '爽やか', '塗る', '入院', '社会', '淡い', '尋ねる', '慣れる', '新鮮'}
N5_MAP = {'海', '秘密', '取る', '午後', 'ゆっくり', 'ありがとう', 'しっかり', 'もちろん'}
for w in samples:
    if w['level'] == 'N4N5':
        ident = w['kanji'] or w['kana']
        if ident in N4_MAP:
            w['level'] = 'N4'
        elif ident in N5_MAP:
            w['level'] = 'N5'
        else:
            print('  未归类样例:', ident)
            w['level'] = 'N5'

LEVELS = ['N1', 'N2', 'N3', 'N4', 'N5']
new_pool = {}
for lv in LEVELS:
    new_pool[lv] = json.load(open(f'{lv}_final.json', encoding='utf-8'))

def key(w):
    return (w['kanji'], w['kana'])
exist_keys = {key(w) for w in samples}

max_id = max(w['id'] for w in samples)
new_words = []
from collections import Counter
added_by_level = Counter()
for lv in LEVELS:
    for e in new_pool[lv]:
        k = (e['kanji'], e['kana'])
        if k in exist_keys:
            continue
        exist_keys.add(k)
        w = {
            'id': max_id + 1,
            'level': lv,
            'kanji': e['kanji'],
            'kana': e['kana'],
            'pitch': e['pitch'],
            'pos': e['pos'],
            'meaning': e['meaning'],
        }
        if e.get('kanjiFurigana'):
            w['kanjiFurigana'] = e['kanjiFurigana']
        new_words.append(w)
        added_by_level[lv] += 1
        max_id += 1

print('各等级新增:', dict(added_by_level))
all_words = samples + new_words
print('合并后总词数:', len(all_words))

with open('all_merged.json', 'w', encoding='utf-8') as f:
    json.dump(all_words, f, ensure_ascii=False, indent=1)
print('已写 all_merged.json')
