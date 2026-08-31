# -*- coding: utf-8 -*-
"""健壮解析：提取音调标记 + 挑选高质量样例词条"""
import docx, re, json

files = [
    (r'C:\Users\34166\Desktop\超值白金版·红宝书大全集  新日本语能力考试N1-N5文字词汇详解_1-145.docx', 'N1'),
    (r'C:\Users\34166\Desktop\超值白金版·红宝书大全集  新日本语能力考试N1-N5文字词汇详解_146-290.docx', 'N2'),
    (r'C:\Users\34166\Desktop\超值白金版·红宝书大全集  新日本语能力考试N1-N5文字词汇详解_291-435.docx', 'N3'),
    (r'C:\Users\34166\Desktop\超值白金版·红宝书大全集  新日本语能力考试N1-N5文字词汇详解_436-580.docx', 'N4N5'),
]

# 音调：\textcircledN 中间可能有任意空格
PITCH_RE = re.compile(r'\\text\s*[cC]\s*[iI]\s*[rR]\s*[cC]\s*[lL]\s*[eE]\s*[dD]\s*(\d)')
CIRCLE = {'①':'1','②':'2','③':'3','④':'4','⑤':'5','⑥':'6','⑦':'7','⑧':'8','⑨':'9','⑩':'10','⓪':'0'}

def clean_paras(path):
    doc = docx.Document(path)
    return [p.text.strip() for p in doc.paragraphs if p.text.strip()]

def is_kana(s):
    if not s: return False
    return all('\u3040' <= c <= '\u309f' or c in 'ー・' for c in s)

def parse_entry(line):
    body = re.sub(r'^[□口■○●]', '', line).strip()
    m = re.match(r'^(.*?)\((.*?)\)\s*(.*)$', body)
    if m:
        kanji = m.group(1).strip().replace(' ', '')
        kana = m.group(2).strip()
        rest = m.group(3)
    else:
        rest = body
        kanji = ''; kana = ''
    # 音调：从整个条目提取
    pitches = PITCH_RE.findall(body) or [CIRCLE[c] for c in body if c in CIRCLE]
    # 词性
    pos_m = re.search(r'[\[【](.*?)[\]】]', rest)
    pos = pos_m.group(1).strip() if pos_m else ''
    # 释义：去掉音调标记、词性、序号
    meaning = rest
    meaning = PITCH_RE.sub('', meaning)
    meaning = re.sub(r'[⓪①-⑨]', '', meaning)
    meaning = re.sub(r'[\[【].*?[\]】]', '', meaning)
    meaning = re.sub(r'^\s*\d+[\.\)、]?\s*', '', meaning)
    meaning = re.sub(r'\s+', '', meaning)
    meaning = meaning.strip('　 .,，、;；')
    return {'kanji': kanji, 'kana': kana, 'pitch': pitches[:2], 'pos': pos, 'meaning': meaning}

results = []
for path, level in files:
    paras = clean_paras(path)
    for i, line in enumerate(paras):
        if line.startswith('□') or line.startswith('口'):
            examples = []
            for j in range(i+1, min(i+5, len(paras))):
                if paras[j].startswith('△'):
                    ex = paras[j][1:].strip()
                    # 去掉例句中的音调残留
                    ex = PITCH_RE.sub('', ex)
                    ex = re.sub(r'\s+', '', ex)
                    examples.append(ex)
                elif paras[j].startswith('□') or paras[j].startswith('口'):
                    break
            w = parse_entry(line)
            if w['kana'] and is_kana(w['kana']) and w['meaning'] and len(w['meaning']) <= 30 and w['kana'] not in ('ほん','とき'):
                # 排除明显OCR错误：kanji含假名混入或乱码
                if re.search(r'[\u4e00-\u9fff]', w['kana']): continue
                w['level'] = level
                w['examples'] = examples[:2]
                results.append(w)

print('高质量词条:', len(results))
from collections import Counter
print(Counter(w['level'] for w in results))
# 音调覆盖率
has_pitch = sum(1 for w in results if w['pitch'])
print(f'音调标注率: {has_pitch}/{len(results)} = {has_pitch/len(results)*100:.0f}%')
# 有例句率
has_ex = sum(1 for w in results if w['examples'])
print(f'有例句率: {has_ex}/{len(results)} = {has_ex/len(results)*100:.0f}%')

# 每等级抽样展示
for level in ['N4N5','N3','N2','N1']:
    sub = [w for w in results if w['level']==level]
    print(f'\n=== {level} 示例（前8）===')
    for w in sub[:8]:
        print(w['kanji'], '|', w['kana'], '|', w['pitch'], '|', w['pos'], '|', w['meaning'][:20], '| 例:', w['examples'][0][:20] if w['examples'] else '无')

with open('words_clean.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=1)
print('\n已保存 words_clean.json')
