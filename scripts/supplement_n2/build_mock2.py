# -*- coding: utf-8 -*-
"""生成 N2 模拟题2 语言知识・阅读数据（三个题包）。"""
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))
from mock2_lang import VOCAB
from mock2_articles import ARTICLES, ARTICLE_FOR, PART_NAMES

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'src' / 'data' / 'supplement-n2-mock2.js'

# 给需要下划线的词加标记
TARGETS = {
    1: '強盗', 2: '国境', 3: '健康', 4: '植物', 5: '禁煙',
    6: 'ちょうさ', 7: 'れいとう', 8: 'れんらく', 9: 'かつよう', 10: 'ぶたい',
    21: '頼もしい', 22: 'いつか', 23: 'ふるさと', 24: 'さかのぼって',
    25: 'やかましい', 26: '豊富な', 27: 'じょじょに',
}

# 問題4 原题下划线词（题面按原书还原）
FIXED_SENTENCES = {
    16: '漢字を覚えるために、<u>いろいろな</u>方法を試してみた。',
    17: '水を<u>温める</u>と蒸気が出てきます。',
    18: '終わったことですから、失敗を<u>後悔</u>してもしょうがない。',
    19: '犯人は銀行員から現金を<u>奪った</u>。',
    20: '彼は力があって、スポーツもできて、あたまもよくて、とても<u>頼り</u>になる。',
}

QUESTION_TYPE = {
    **{n: '文字' for n in range(1, 11)},
    **{n: '語彙' for n in range(11, 33)},
    **{n: '文法' for n in range(33, 55)},
    **{n: '読解' for n in range(55, 76)},
}

PACKS = [
    dict(id='n2-mock2-vocab-32', title='N2 文字・語彙 32 题', short='文字・語彙 32 题',
         type='語彙', parts=(1, 6)),
    dict(id='n2-mock2-grammar-22', title='N2 文法 22 题', short='文法 22 题',
         type='文法', parts=(7, 9)),
    dict(id='n2-mock2-reading-21', title='N2 読解 21 题', short='読解 21 题',
         type='読解', parts=(10, 14)),
]


def pack_of(no):
    if 1 <= no <= 32:
        return PACKS[0]
    if 33 <= no <= 54:
        return PACKS[1]
    return PACKS[2]


def build_pack_meta(pack):
    parts = []
    for p in range(pack['parts'][0], pack['parts'][1] + 1):
        nos = [q[0] for q in VOCAB if q[1] == p]
        parts.append({'no': p, 'name': PART_NAMES[p], 'count': len(nos)})
    return {
        'id': pack['id'],
        'level': 'N2',
        'title': pack['title'],
        'shortTitle': pack['short'],
        'type': pack['type'],
        'origin': 'external',
        'provider': '',
        'providerNote': '',
        'url': '',
        'count': sum(p['count'] for p in parts),
        'parts': parts,
    }


def build_questions():
    out = []
    seq = {}
    for book_no, part, sentence, options, answer in VOCAB:
        s = FIXED_SENTENCES.get(book_no, sentence)
        if book_no in TARGETS and '<u>' not in s:
            s = s.replace(TARGETS[book_no], f'<u>{TARGETS[book_no]}</u>')
        if part == 6:
            s = f'<u>{s}</u>'
        pack = pack_of(book_no)
        seq[pack['id']] = seq.get(pack['id'], 0) + 1
        out.append({
            'id': 107 + book_no,
            'no': seq[pack['id']],
            'examNo': book_no,
            'packId': pack['id'],
            'level': 'N2',
            'type': QUESTION_TYPE[book_no],
            'part': part,
            'partName': PART_NAMES[part],
            'unit': 1,
            'sentence': s,
            'sentenceFurigana': '',
            'options': options,
            'answer': answer,
            'translation': '',
            'explanation': '',
            'article': ARTICLES.get(ARTICLE_FOR.get(book_no, ''), ''),
        })
    return out


def main():
    packs = [build_pack_meta(p) for p in PACKS]
    questions = build_questions()
    body_packs = json.dumps(packs, ensure_ascii=False, indent=2)
    body_questions = json.dumps(questions, ensure_ascii=False, indent=2)
    js = f'''// 补充题库 · N2 模拟题2（文字・語彙 / 文法 / 読解）
// 题面逐页转录，答案取自官方答案页。
// 由 scripts/supplement_n2/build_mock2.py 生成，请勿手改。

export const mock2Packs = {body_packs};

export const mock2Questions = {body_questions};
'''
    OUT.write_text(js, encoding='utf-8')
    counts = {}
    for q in questions:
        counts[q['type']] = counts.get(q['type'], 0) + 1
    print('packs', [(p['id'], p['count']) for p in packs])
    print('questions', len(questions), counts)


if __name__ == '__main__':
    main()
