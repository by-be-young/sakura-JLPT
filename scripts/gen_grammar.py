# -*- coding: utf-8 -*-
"""
从《蓝宝书文法详解.docx》生成 前端学习板块数据文件 src/data/grammar.js

结构映射：
  # N5 文法详解（整理版）  -> level
  ## 第X单元 ...          -> unit
  ### N. 文法点标题       -> point
  点内内容行               -> blocks（label / sub / line）
特殊处理：
  - 无 ### 的单元（如 N5 第10单元 常用寒暄用语）把每条裸列表当成一个点
  - 跳过 "整理说明"、H1 后导语、"---"
  - 对话续行（B：……）作为 line 保留
  - 标签数字归一化为圈号（说明1 -> 说明①）
"""
import docx, re, json, os

SRC = r'C:\Users\34166\Desktop\蓝宝书文法详解.docx'
OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'grammar.js')

CIRCLED = {str(i): chr(0x2460 + i - 1) for i in range(1, 21)}  # ①~⑳

LABEL_NORM = {
    '接続': '接续',          # OCR 变体
}


def circled_label(label):
    """把标签末尾的数字转成圈号，如 说明1 -> 说明①"""
    m = re.match(r'^(.*?)([0-9]{1,2})$', label)
    if m:
        base, num = m.group(1), m.group(2)
        if num in CIRCLED:
            return base + CIRCLED[num]
    return label


def skip_line(s):
    """需要丢弃的辅助行"""
    if not s:
        return True
    if s == '---':
        return True
    if '整理说明' in s:
        return True
    return False


def parse_blocks(raw_lines):
    """把点内的原始行解析成渲染块列表"""
    blocks = []
    for ln in raw_lines:
        s = ln.strip()
        if skip_line(s):
            continue
        if s.startswith('- '):
            body = s[2:].strip()
            m = re.match(r'^\*\*(.+?)\*\*[：:]?\s*(.*)$', body)
            if m:
                label = m.group(1).strip()
                text = m.group(2).strip()
                if label.startswith('('):
                    # 子标题，如 (1) ～いかんで…
                    blocks.append({'t': 'sub', 'text': label})
                    if text:
                        blocks.append({'t': 'line', 'text': text})
                else:
                    disp = circled_label(LABEL_NORM.get(label, label))
                    blocks.append({'t': 'label', 'label': disp, 'text': text})
            else:
                blocks.append({'t': 'line', 'text': body})
        else:
            # 对话续行 / 点内自由行（B：……、尊他语特殊形式：）
            blocks.append({'t': 'line', 'text': s})
    return blocks


def main():
    doc = docx.Document(SRC)
    lines = [p.text.rstrip() for p in doc.paragraphs]

    levels = []
    cur_level = None
    cur_unit = None
    cur_point = None
    point_seq = 0          # 每个 level 内点的序号
    unit_seq = 0           # 每个 level 内单元的序号
    point_raw = []         # 当前点收集的原始行

    def flush_point():
        nonlocal point_seq, point_raw, cur_point
        if cur_point is None:
            return
        blocks = parse_blocks(point_raw)
        if not blocks:
            # 无内容的点也保留标题，占位提示
            blocks = [{'t': 'line', 'text': '（本条暂无详解内容）'}]
        point_seq += 1
        pid = f"{cur_level['id']}-{point_seq}"
        cur_point['id'] = pid
        cur_point['blocks'] = blocks
        cur_unit['points'].append(cur_point)
        cur_point = None
        point_raw = []

    in_level = False  # 是否已过 H1 导语、进入正题

    for ln in lines:
        s = ln.strip()

        if s.startswith('# '):
            flush_point()
            name = s[2:].strip()
            lid = re.match(r'^(N[1-5])', name)
            level_id = lid.group(1) if lid else name
            cur_level = {
                'id': level_id,
                'name': name,
                'units': [],
            }
            levels.append(cur_level)
            cur_unit = None
            point_seq = 0
            unit_seq = 0
            in_level = False
            continue

        if cur_level is None:
            continue

        if s.startswith('## '):
            flush_point()
            unit_seq += 1
            uid = f"{cur_level['id']}-u{unit_seq}"
            cur_unit = {
                'id': uid,
                'title': s[3:].strip(),
                'points': [],
            }
            cur_level['units'].append(cur_unit)
            in_level = True
            continue

        if s.startswith('### '):
            flush_point()
            in_level = True
            if cur_unit is None:
                # N1 无单元标题，收进一个合成单元
                unit_seq += 1
                uid = f"{cur_level['id']}-u{unit_seq}"
                cur_unit = {'id': uid, 'title': s[3:3], 'points': []}
                cur_level['units'].append(cur_unit)
            cur_point = {'title': s[4:].strip(), 'blocks': []}
            point_raw = []
            continue

        if not in_level:
            # H1 后的导语行，跳过
            continue

        if cur_point is not None:
            point_raw.append(s)
        elif cur_unit is not None and s.startswith('- ') and not skip_line(s):
            # 无 ### 的单元：每条裸列表成为一个点（如寒暄用语）
            body = s[2:].strip()
            point_seq += 1
            pid = f"{cur_level['id']}-{point_seq}"
            cur_unit['points'].append({
                'id': pid,
                'title': body,
                'blocks': [{'t': 'line', 'text': body}],
            })

    flush_point()

    # ---- 汇总校验 ----
    total = 0
    for lv in levels:
        n = sum(len(u['points']) for u in lv['units'])
        total += n
        print(f"{lv['id']}: 单元 {len(lv['units'])} 个, 文法点 {n} 个")
    print('合计:', total)

    # ---- 输出 JS ----
    js = "// 自动生成：由 scripts/gen_grammar.py 从《蓝宝书文法详解.docx》解析而来，请勿手改。\n"
    js += "// 结构：levels[] -> units[] -> points[] -> blocks[]\n"
    js += "export const grammarLevels = " + json.dumps(levels, ensure_ascii=False, separators=(',', ':')) + ";\n"
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(js)
    print('已写入', OUT, os.path.getsize(OUT), 'bytes')


if __name__ == '__main__':
    main()
