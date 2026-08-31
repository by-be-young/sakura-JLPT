# -*- coding: utf-8 -*-
"""
从更新后的 N1 文档《蓝宝书n1.docx》解析 N1 级数据，输出到临时 JSON，再由
splice_grammar_n1.py 合入 src/data/grammar.js。

N1 文档结构（与 N3 类似，无标题层级）：
  N. 标题            -> point
  接续：内容 / 说明1：内容 / 例文： / 注意：内容   -> 标签pill + line 块
  (1) 子部分标题      -> sub 块
  △例句（/ 分隔日中文） -> line 块（去掉△）
无单元划分，整册为一个单元。
"""
import docx, re, json, os

SRC = r'C:\Users\34166\Desktop\蓝宝书n1.docx'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'data', '_n1_new.json')

CIRCLED = {str(i): chr(0x2460 + i - 1) for i in range(1, 21)}


def circled(label):
    m = re.match(r'^(.*?)([0-9]{1,2})$', label)
    if m and m.group(2) in CIRCLED:
        return m.group(1) + CIRCLED[m.group(2)]
    return label


def clean(s):
    return s.replace('\u200b', '').strip()


def parse_point(raw_lines):
    blocks = []
    for s in raw_lines:
        s = clean(s)
        if not s or s == '---':
            continue
        m = re.match(r'^\((\d+)\)\s*(.*)$', s)
        if m:
            blocks.append({'t': 'sub', 'text': f'({m.group(1)}) {m.group(2)}'})
            continue
        m = re.match(r'^(接续|说明|例文|注意)([0-9①-⑩]*)[：:]\s*(.*)$', s)
        if m:
            label = circled(m.group(1) + m.group(2))
            rest = m.group(3).strip()
            blocks.append({'t': 'label', 'label': label, 'text': ''})
            if rest:
                blocks.append({'t': 'line', 'text': rest[1:].strip() if rest.startswith('△') else rest})
            continue
        if s.startswith('△'):
            blocks.append({'t': 'line', 'text': s[1:].strip()})
            continue
        blocks.append({'t': 'line', 'text': s})
    if not blocks:
        blocks = [{'t': 'line', 'text': '（本条暂无详解内容）'}]
    return blocks


def main():
    doc = docx.Document(SRC)
    lines = [p.text.rstrip() for p in doc.paragraphs]

    points = []
    cur = None
    raw = []
    seq = 0

    def flush():
        nonlocal cur, raw, seq
        if cur is None:
            return
        seq += 1
        cur['id'] = f'N1-{seq}'
        cur['blocks'] = parse_point(raw)
        points.append(cur)
        cur = None
        raw = []

    for ln in lines:
        s = clean(ln)
        if re.match(r'^\d+\.\s', s):
            flush()
            cur = {'title': s, 'blocks': []}
            raw = []
        elif not s or s == '---':
            continue
        elif cur is not None:
            raw.append(s)
    flush()

    units = [{'id': 'N1-u1', 'title': 'N1 文法', 'points': points}]
    print('单元数:', len(units), '| 文法点数:', len(points))

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump({'id': 'N1', 'name': 'N1 文法详解（整理版）', 'units': units}, f, ensure_ascii=False, separators=(',', ':'))
    print('已写入', OUT)


if __name__ == '__main__':
    main()
