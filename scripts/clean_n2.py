# 清洗 N2 词条并去重
# 输入 n2_final.json → 输出 n2_clean.json
import json, re

data = json.load(open('n2_final.json', encoding='utf-8'))
print('原始:', len(data))

def clean_pos(p):
    p = p.replace('十形', 'ナ形').replace('⋅', '·').replace('新形', 'ナ形')
    p = p.replace('i形', 'イ形').replace('亻形', 'イ形').replace('大形', 'ナ形')
    p = p.replace('$', '')
    p = re.sub(r'^[⓪①②③④⑤⑥⑦⑧⑨⑩]+\[?', '', p)   # 去掉误混入的音调
    p = p.replace('十', 'ナ')
    p = re.sub(r'\s+', '', p)
    # 去掉pos里的多余符号噪声（如 名·自他動3 中混入的【】
    p = p.replace('【', '').replace('】', '')
    return p

def clean_meaning(m):
    m = m.strip()
    # 截断到△（混入的例句）
    m = re.split(r'[△▲]', m)[0].strip()
    # 截断到混入的注音：无汉字片假名串（如 世人 这种注音行）或 数字+点
    m = re.sub(r'\d+\s*[.．、]?\s*$', '', m).strip()
    # 去掉混入的孤立片假名注音（位于末尾，如 あわ しあわ 等）
    m = re.sub(r'[\s　]+[ぁ-んァ-ヶー・]{1,6}$', '', m).strip()
    # 去掉开头的 伪注音（如 しよう あか）
    # 截断：若释义以假名串开头且很短（注音误并），保留（难判断）
    return m

cleaned = []
seen = set()
for e in data:
    pos = clean_pos(e['pos'])
    meaning = clean_meaning(e['meaning'])
    kanji = e['kanji']
    kana = e['kana']
    if not meaning:
        continue
    # 去重键：kana（假名词）或 kanji+kana
    key = (kanji, kana)
    if key in seen:
        continue
    seen.add(key)
    # 去重后同词多个音调取第一个
    pitch = e['pitch'][:2]
    cleaned.append({'kanji': kanji, 'kana': kana, 'pitch': pitch, 'pos': pos, 'meaning': meaning})

print('清洗后:', len(cleaned))

# 统计
import collections
posc = collections.Counter()
for e in cleaned:
    # 主词性
    m = re.match(r'(名|他動|自動|自他動|イ形|ナ形|副|感|接頭|接尾|連体|代|嘆)', e['pos'])
    posc[m.group(1) if m else e['pos']] += 1
print('词性分布:', dict(posc))

with open('n2_clean.json', 'w', encoding='utf-8') as f:
    json.dump(cleaned, f, ensure_ascii=False, indent=1)
print('已写 n2_clean.json')
