# -*- coding: utf-8 -*-
"""
从更新后的 N4 文档《蓝宝书n4.docx》解析 N4 级数据，输出到临时 JSON，再由
splice_grammar_n4.py 合入 src/data/grammar.js。

N4 文档结构：
  ### 第X单元 ...        -> unit（H3）
  **N. 标题**            -> point（加粗点标题）
  行内标签：**接续** 内容 / **说明** 内容 / **例文** 内容 / **注意** 内容
  内容行：△例句（/ 分隔日中文）、普通段落
渲染风格与新版 N5 一致：标签为独立 pill，内容为下方 line 块。
"""
import docx, re, json, os

SRC = r'C:\Users\34166\Desktop\蓝宝书n4.docx'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'data', '_n4_new.json')


CIRCLED = {str(i): chr(0x2460 + i - 1) for i in range(1, 21)}

def circled(label):
    m = re.fullmatch(r'(接续|说明|例文|注意)([0-9]{1,2})', label)
    if m and m.group(2) in CIRCLED:
        return m.group(1) + CIRCLED[m.group(2)]
    return label


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
        cur_point['id'] = f'N4-{seq}'
        cur_point['blocks'] = parse_point(point_raw)
        cur_unit['points'].append(cur_point)
        cur_point = None
        point_raw = []

    for ln in lines:
        s = ln.strip()
        if s.startswith('### '):
            flush_point()
            cur_unit = {'id': '', 'title': s[4:].strip(), 'points': []}
            units.append(cur_unit)
            cur_point = None
        elif re.match(r'^\*\*\d+\. ', s):
            flush_point()
            title = re.sub(r'^\*\*|\*\*$', '', s)
            cur_point = {'title': title, 'blocks': []}
            point_raw = []
        elif not s or s == '---':
            continue
        elif cur_point is not None:
            point_raw.append(s)
    flush_point()

    for ui, u in enumerate(units, 1):
        u['id'] = f'N4-u{ui}'

    total = sum(len(u['points']) for u in units)
    print('单元数:', len(units), '| 文法点数:', total)
    for u in units:
        print('  ', u['id'], u['title'][:30], '->', len(u['points']), '点')

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump({'id': 'N4', 'name': 'N4 文法详解（整理版）', 'units': units}, f, ensure_ascii=False, separators=(',', ':'))
    print('已写入', OUT)


def parse_point(raw_lines):
    """点内行 -> blocks。行内标签拆成 标签pill + line 块。"""
    blocks = []
    for ln in raw_lines:
        s = ln.strip()
        if not s or s == '---':
            continue
        m = re.fullmatch(r'\*\*(.+?)\*\*(.*)', s)
        if m:
            label = circled(m.group(1).strip())
            rest = m.group(2).strip()
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


if __name__ == '__main__':
    main()
