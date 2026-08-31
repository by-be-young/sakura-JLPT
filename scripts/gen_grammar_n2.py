# -*- coding: utf-8 -*-
"""
从更新后的 N2 文档《蓝宝书n2.docx》解析 N2 级数据，输出到临时 JSON，再由
splice_grammar_n2.py 合入 src/data/grammar.js。

N2 文档结构：
  ### N. 标题            -> point（H3）
  **(1) ～限り（は）**    -> sub 块（子部分标题）
  **接续**：内容 / **说明1**：内容 / **例文**： / **注意**：内容   -> 标签pill + line 块
  △例句（/ 分隔日中文）   -> line 块（去掉△）
  ### 敬語               -> 单元分界（敬语补充部分）
"""
import docx, re, json, os

SRC = r'C:\Users\34166\Desktop\蓝宝书n2.docx'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'data', '_n2_new.json')

CIRCLED = {str(i): chr(0x2460 + i - 1) for i in range(1, 21)}


def circled(label):
    m = re.match(r'^(.*?)([0-9]{1,2})$', label)
    if m and m.group(2) in CIRCLED:
        return m.group(1) + CIRCLED[m.group(2)]
    return label


def parse_point(raw_lines):
    blocks = []
    for s in raw_lines:
        s = s.strip()
        if not s or s == '---':
            continue
        # 子部分标题 **(1) xxx**
        m = re.fullmatch(r'\*\*\((\d+)\)\s*(.*?)\*\*', s)
        if m:
            blocks.append({'t': 'sub', 'text': f'({m.group(1)}) {m.group(2)}'})
            continue
        # 标签 **接续1**：内容
        m = re.fullmatch(r'\*\*(接续|说明|例文|注意)([0-9①-⑩]*)\*\*[：:]\s*(.*)$', s)
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
        cur_point['id'] = f'N2-{seq}'
        cur_point['blocks'] = parse_point(point_raw)
        cur_unit['points'].append(cur_point)
        cur_point = None
        point_raw = []

    def new_unit(title=''):
        return {'id': '', 'title': title, 'points': []}

    for ln in lines:
        s = ln.strip()
        if re.match(r'^### \d+\.', s):
            flush_point()
            if cur_unit is None:
                cur_unit = new_unit()
                units.append(cur_unit)
            cur_point = {'title': s[4:].strip(), 'blocks': []}
            point_raw = []
        elif s == '### 敬語':
            flush_point()
            cur_unit = new_unit('敬语（N2补充部分）')
            units.append(cur_unit)
        elif not s or s == '---':
            continue
        elif cur_point is not None:
            point_raw.append(s)
    flush_point()

    # 首单元标题
    if units and not units[0]['title']:
        units[0]['title'] = '第1单元 ～あげく（に）～に至って等'

    for ui, u in enumerate(units, 1):
        u['id'] = f'N2-u{ui}'

    total = sum(len(u['points']) for u in units)
    print('单元数:', len(units), '| 文法点数:', total)
    for u in units:
        print('  ', u['id'], u['title'][:30], '->', len(u['points']), '点')

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump({'id': 'N2', 'name': 'N2 文法详解（整理版）', 'units': units}, f, ensure_ascii=False, separators=(',', ':'))
    print('已写入', OUT)


if __name__ == '__main__':
    main()
