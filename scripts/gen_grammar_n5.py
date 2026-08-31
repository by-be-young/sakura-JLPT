# -*- coding: utf-8 -*-
"""
从更新后的 N5 文档《蓝宝书文法详解.docx》解析 N5 级数据，输出到临时 JSON，再由
splice_grammar_n5.py 合入 src/data/grammar.js。

新 N5 文档结构（与旧版完全不同）：
  # 第X单元 ...            -> unit（H1）
  ## N. 文法点标题          -> point（H2）
  点内内容：
    **说明** / **例文** / **注意** / **接续** / **读法** 等独立加粗标签 -> label 块
    普通段落                                          -> line 块
    △例句（日文/中文，/ 分隔）                        -> line 块（去掉 △）
    ① 小标题                                          -> sub 块
    - 列表（读法条目 / 寒暄用语）                      -> line 块
    | 表格 |（Markdown 表格）                         -> table 块
"""
import docx, re, json, os

SRC = r'C:\Users\34166\Desktop\蓝宝书文法详解.docx'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'data', '_n5_new.json')

CIRCLED = {str(i): chr(0x2460 + i - 1) for i in range(1, 21)}


def circled(label):
    m = re.match(r'^(.*?)([0-9]{1,2})$', label)
    if m and m.group(2) in CIRCLED:
        return m.group(1) + CIRCLED[m.group(2)]
    return label


def parse_table(lines, idx):
    """从 idx 处解析连续 | 表格行，返回 (table_block, 结束下标)"""
    rows = []
    while idx < len(lines) and lines[idx].strip().startswith('|'):
        row = [c.strip() for c in lines[idx].strip().strip('|').split('|')]
        rows.append(row)
        idx += 1
    # 去掉分隔行（|---|）与空表头
    sep_idx = None
    for i, r in enumerate(rows):
        if r and all(re.fullmatch(r':?-{2,}:?', c or '-') for c in r):
            sep_idx = i
            break
    headers = []
    data_rows = []
    if sep_idx is not None:
        headers = rows[sep_idx - 1] if sep_idx >= 1 else []
        data_rows = rows[sep_idx + 1:]
    else:
        headers = []
        data_rows = rows
    block = {'t': 'table', 'headers': headers, 'rows': data_rows}
    return block, idx


def parse_point(raw_lines):
    blocks = []
    i = 0
    n = len(raw_lines)
    while i < n:
        s = raw_lines[i].strip()
        if not s or s == '---':
            i += 1
            continue
        # 独立加粗标签
        m = re.fullmatch(r'\*\*(.+?)\*\*', s)
        if m:
            label = m.group(1).strip()
            if label.startswith('('):
                blocks.append({'t': 'sub', 'text': label})
            else:
                blocks.append({'t': 'label', 'label': circled(label), 'text': ''})
            i += 1
            continue
        # 表格
        if s.startswith('|') and i + 1 < n and re.match(r'^\|[\s\-:|]+\|?$', raw_lines[i + 1].strip()):
            block, i = parse_table(raw_lines, i)
            blocks.append(block)
            continue
        # △ 例句
        if s.startswith('△'):
            blocks.append({'t': 'line', 'text': s[1:].strip()})
            i += 1
            continue
        # 列表项
        if s.startswith('- '):
            blocks.append({'t': 'line', 'text': s[2:].strip()})
            i += 1
            continue
        # 圈号小标题
        if re.match(r'^[①②③④⑤⑥⑦⑧⑨⑩]', s):
            blocks.append({'t': 'sub', 'text': s})
            i += 1
            continue
        # 普通段落 / 对话行
        blocks.append({'t': 'line', 'text': s})
        i += 1
    if not blocks:
        blocks = [{'t': 'line', 'text': '（本条暂无详解内容）'}]
    return blocks


def main():
    doc = docx.Document(SRC)
    lines = [p.text.rstrip() for p in doc.paragraphs]

    units = []
    cur_unit = None
    cur_point = None
    point_raw = []
    seq = 0

    def flush_point():
        nonlocal cur_point, point_raw, seq
        if cur_point is None:
            return
        seq += 1
        cur_point['id'] = f'N5-{seq}'
        cur_point['blocks'] = parse_point(point_raw)
        cur_unit['points'].append(cur_point)
        cur_point = None
        point_raw = []

    for ln in lines:
        s = ln.strip()
        if s.startswith('# '):
            flush_point()
            cur_unit = {'id': '', 'title': s[3:].strip(), 'points': []}
            units.append(cur_unit)
            cur_point = None
        elif s.startswith('## '):
            flush_point()
            cur_point = {'title': s[3:].strip(), 'blocks': []}
            point_raw = []
        elif s == '---' or (not s and cur_point is None):
            continue
        elif cur_point is not None:
            # 保留空行：表格与表格之间靠空行分隔，不能丢弃
            point_raw.append(ln.rstrip())
        elif cur_unit is not None and s.startswith('- '):
            # 无 ## 点的单元（第10单元 寒暄用语）：每条列表成一个点
            body = s[2:].strip()
            seq += 1
            cur_unit['points'].append({
                'id': f'N5-{seq}',
                'title': body,
                'blocks': [{'t': 'line', 'text': body}],
            })
    flush_point()

    # 单元 id
    for ui, u in enumerate(units, 1):
        u['id'] = f'N5-u{ui}'

    total = sum(len(u['points']) for u in units)
    print('单元数:', len(units), '| 文法点数:', total)
    for u in units:
        print('  ', u['id'], u['title'], '->', len(u['points']), '点')

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump({'id': 'N5', 'name': 'N5 文法详解（整理版）', 'units': units}, f, ensure_ascii=False, separators=(',', ':'))
    print('已写入', OUT)


if __name__ == '__main__':
    main()
