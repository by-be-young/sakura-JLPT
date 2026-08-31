# -*- coding: utf-8 -*-
"""
从更新后的 N3 文档《蓝宝书n3.docx》解析 N3 级数据，输出到临时 JSON，再由
splice_grammar_n3.py 合入 src/data/grammar.js。

N3 文档结构（无标题层级）：
  N. 标题            -> point（如 "1. ～間あいだ"）
  接续：内容 / 说明1：内容 / 例文： / 注意：内容   -> 标签pill + line 块
  △例句（/ 分隔日中文） -> line 块（去掉△）
  | 表格 |           -> table 块
单元划分沿用旧数据：第1-130点为「第1单元 ～間、～間に等」，第131-140点为「敬语（N3补充部分）」。
"""
import docx, re, json, os

SRC = r'C:\Users\34166\Desktop\蓝宝书n3.docx'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'data', '_n3_new.json')

CIRCLED = {str(i): chr(0x2460 + i - 1) for i in range(1, 21)}
LABEL_NAMES = {'接续', '说明', '例文', '注意'}


def circled(label):
    m = re.match(r'^(.*?)([0-9]{1,2})$', label)
    if m and m.group(2) in CIRCLED:
        return m.group(1) + CIRCLED[m.group(2)]
    return label


def parse_table(lines, idx):
    rows = []
    while idx < len(lines) and lines[idx].strip().startswith('|'):
        rows.append([c.strip() for c in lines[idx].strip().strip('|').split('|')])
        idx += 1
    sep_idx = None
    for i, r in enumerate(rows):
        if r and all(re.fullmatch(r':?-{2,}:?', c or '-') for c in r):
            sep_idx = i
            break
    if sep_idx is not None:
        headers = rows[sep_idx - 1] if sep_idx >= 1 else []
        data_rows = rows[sep_idx + 1:]
    else:
        headers, data_rows = [], rows
    return {'t': 'table', 'headers': headers, 'rows': data_rows}, idx


def parse_point(raw_lines):
    blocks = []
    i = 0
    n = len(raw_lines)
    while i < n:
        s = raw_lines[i].strip()
        if not s or s == '---':
            i += 1
            continue
        if s.startswith('|') and i + 1 < n and re.match(r'^\|[\s\-:|]+\|?$', raw_lines[i + 1].strip()):
            block, i = parse_table(raw_lines, i)
            blocks.append(block)
            continue
        m = re.match(r'^(接续|说明|例文|注意)([0-9①-⑩]*)[：:]\s*(.*)$', s)
        if m:
            label = circled(m.group(1) + m.group(2))
            rest = m.group(3).strip()
            blocks.append({'t': 'label', 'label': label, 'text': ''})
            if rest:
                blocks.append({'t': 'line', 'text': rest[1:].strip() if rest.startswith('△') else rest})
            i += 1
            continue
        if s.startswith('△'):
            blocks.append({'t': 'line', 'text': s[1:].strip()})
            i += 1
            continue
        blocks.append({'t': 'line', 'text': s})
        i += 1
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
        cur['id'] = f'N3-{seq}'
        cur['blocks'] = parse_point(raw)
        points.append(cur)
        cur = None
        raw = []

    for ln in lines:
        s = ln.strip()
        if re.match(r'^\d+\.\s', s):
            flush()
            cur = {'title': s, 'blocks': []}
            raw = []
        elif not s or s == '---':
            continue
        elif cur is not None:
            raw.append(s)
    flush()

    # 单元划分：1-130 -> 第1单元，131-140 -> 敬语补充
    cut = 130
    unit1 = {'id': 'N3-u1', 'title': '第1单元 ～間、～間に等', 'points': points[:cut]}
    unit2 = {'id': 'N3-u2', 'title': '敬语（N3补充部分）', 'points': points[cut:]}
    units = [unit1, unit2]

    print('单元数:', len(units), '| 文法点数:', len(points))
    for u in units:
        print('  ', u['id'], u['title'][:30], '->', len(u['points']), '点')

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump({'id': 'N3', 'name': 'N3 文法详解（整理版）', 'units': units}, f, ensure_ascii=False, separators=(',', ':'))
    print('已写入', OUT)


if __name__ == '__main__':
    main()
