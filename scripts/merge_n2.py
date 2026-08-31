# 合并 N2 新词到 words.js
# 保留原样例词（含例句/近反义词），N2新词去重后追加
import json, re

# 读取现有 words.js 的 words 数组（直接用 node 转换比较麻烦，用正则近似提取）
# 改为：读 n2_final3.json + 现有样例词从 words.js 提取
import subprocess

# 用 node 读取 words.js 的 words 数组
r = subprocess.run(['node', '--input-type=module', '-e', '''
import { words } from "./src/data/words.js";
console.log(JSON.stringify(words));
'''], capture_output=True, text=True, cwd='D:/日语自学网站')
existing = json.loads(r.stdout)
print('现有词数:', len(existing))

n2 = json.load(open('n2_final3.json', encoding='utf-8'))
print('N2新词:', len(n2))

# 去重键
def key(w):
    return (w['kanji'], w['kana'])
exist_keys = {key(w) for w in existing}

# 处理 N2 新词：去除与现有重复的；level='N2'
dup = 0
added = []
for e in n2:
    k = (e['kanji'], e['kana'])
    if k in exist_keys:
        dup += 1
        continue
    exist_keys.add(k)
    added.append(e)
print('与现有重复跳过:', dup)
print('新增N2词:', len(added))

# 分配新id（从现有最大id+1开始）
max_id = max(w['id'] for w in existing)
next_id = max_id + 1

new_words = []
for e in added:
    w = {
        'id': next_id,
        'level': 'N2',
        'kanji': e['kanji'],
        'kana': e['kana'],
        'pitch': e['pitch'],
        'pos': e['pos'],
        'meaning': e['meaning'],
    }
    if e.get('kanjiFurigana'):
        w['kanjiFurigana'] = e['kanjiFurigana']
    new_words.append(w)
    next_id += 1

# 输出为合并结果（供后续写入 words.js）
all_words = existing + new_words
print('合并后总词数:', len(all_words))

with open('n2_merged.json', 'w', encoding='utf-8') as f:
    json.dump({'existing': existing, 'new_words': new_words, 'all': all_words}, f, ensure_ascii=False, indent=1)
print('已写 n2_merged.json')
