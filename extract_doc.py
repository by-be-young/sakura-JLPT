# -*- coding: utf-8 -*-
"""从 红蓝宝书 N2 1000题 docx 中按文档顺序提取结构化文本。"""
import sys, os
from docx import Document
from docx.oxml.ns import qn

def iter_block_items(parent):
    """按文档顺序遍历段落和表格。"""
    from docx.document import Document as _Doc
    from docx.table import Table
    from docx.text.paragraph import Paragraph
    from docx.oxml.text.paragraph import CT_P
    from docx.oxml.table import CT_Tbl
    if isinstance(parent, _Doc):
        parent_elm = parent.element.body
    else:
        parent_elm = parent._element
    for child in parent_elm.iterchildren():
        if isinstance(child, CT_P):
            yield Paragraph(child, parent)
        elif isinstance(child, CT_Tbl):
            yield Table(child, parent)

def para_text(p):
    parts = []
    for r in p.runs:
        t = r.text
        if t:
            parts.append(t)
    # 检测内嵌图片数量
    nimg = len(p._element.findall('.//' + qn('wp:inline')))
    return ''.join(parts), nimg

def cell_text(cell):
    lines = []
    for p in cell.paragraphs:
        t, n = para_text(p)
        if t.strip() or n:
            if n:
                t += ('[图x%d]' % n)
            lines.append(t)
    return ' / '.join(lines)

def extract(path, out_path):
    doc = Document(path)
    lines = []
    for block in iter_block_items(doc):
        if block.__class__.__name__ == 'Paragraph':
            t, n = para_text(block)
            if t.strip() or n:
                if n:
                    t += ('[图x%d]' % n)
                lines.append(t)
        else:  # Table
            lines.append('===TABLE===')
            for row in block.rows:
                cells = [cell_text(c) for c in row.cells]
                lines.append(' || '.join(cells))
            lines.append('===END TABLE===')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    return len(lines)

if __name__ == '__main__':
    src = sys.argv[1]
    dst = sys.argv[2]
    n = extract(src, dst)
    print('lines:', n)
