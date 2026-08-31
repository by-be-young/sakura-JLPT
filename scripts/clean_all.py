# 批量清洗全部等级词条并去重
# 输入 all_zones.json → 输出 {level}_clean.json + {level}_bad.json
import json, re, collections

zones = json.load(open('all_zones.json', encoding='utf-8'))

def clean_pos(p):
    p = p.replace('十形', 'ナ形').replace('⋅', '·').replace('新形', 'ナ形')
    p = p.replace('i形', 'イ形').replace('亻形', 'イ形').replace('大形', 'ナ形')
    p = p.replace('$', '')
    p = re.sub(r'^[⓪①②③④⑤⑥⑦⑧⑨⑩]+\[?', '', p)
    p = p.replace('十', 'ナ')
    p = re.sub(r'\s+', '', p)
    p = p.replace('【', '').replace('】', '')
    return p

def clean_meaning(m):
    m = m.strip()
    m = re.split(r'[△▲]', m)[0].strip()
    m = re.sub(r'\d+\s*[.．、]?\s*$', '', m).strip()
    m = re.sub(r'[\s　]+[ぁ-んァ-ヶー・]{1,6}$', '', m).strip()
    return m

KANA_OK = re.compile(r'^[ぁ-んァ-ヶー・]+$')

for level, data in zones.items():
    cleaned, bad = [], []
    seen = set()
    for e in data:
        pos = clean_pos(e['pos'])
        meaning = clean_meaning(e['meaning'])
        kanji, kana = e['kanji'], e['kana']
        if not meaning:
            continue
        key = (kanji, kana)
        if key in seen:
            continue
        seen.add(key)
        pitch = e['pitch'][:2]
        item = {'kanji': kanji, 'kana': kana, 'pitch': pitch, 'pos': pos, 'meaning': meaning}
        if KANA_OK.match(kana):
            cleaned.append(item)
        else:
            bad.append(item)
    with open(f'{level}_clean.json', 'w', encoding='utf-8') as f:
        json.dump(cleaned, f, ensure_ascii=False, indent=1)
    with open(f'{level}_bad.json', 'w', encoding='utf-8') as f:
        json.dump(bad, f, ensure_ascii=False, indent=1)
    posc = collections.Counter()
    for e in cleaned:
        m = re.match(r'(名|他動|自動|自他動|イ形|ナ形|副|感|接頭|接尾|連体|代|嘆|助|連語)', e['pos'])
        posc[m.group(1) if m else '?'] += 1
    print(f'{level}: 清洗后 {len(cleaned)} / 异常kana {len(bad)}')
    print('  词性:', dict(list(posc.items())[:12]))
    for e in bad[:6]:
        print('   bad: kanji=%r kana=%r pos=%r meaning=%r' % (e['kanji'][:12], e['kana'][:12], e['pos'][:10], e['meaning'][:12]))
