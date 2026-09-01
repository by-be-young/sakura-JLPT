# -*- coding: utf-8 -*-
"""把 text 中的 〖高亮〗 占位符同步到 furi（ruby 感知，幂等）。

furi 可能为两种注音格式：
  1) 标准 ruby：<ruby>買<rt>か</rt></ruby>（标签跳过）
  2) 内联注音：買(か)（半角括号且内容为假名，视为注音跳过）
构建「可读文本流」，使其与 text 去掉占位符后的纯文本一致，再按偏移映射回 furi 包裹 〖〗。
"""
import io, json, re

D = 'src/data/grammar.js'
d = io.open(D, encoding='utf-8').read()
m = re.search(r'export const grammarLevels = (\[.*);?\s*$', d, re.S)
data = json.loads(m.group(1))


def build_stream(furi):
    """返回 (可读文本流, 流字符索引->furi字符索引)。

    跳过：所有 <...> 标签、<rt>…</rt> 注音内容、<rp>(</rp>/<rp>)</rp> 的括号，
    以及内联 (かな) 注音。剩下的即可见正文（汉字+假名原文）。
    """
    stream, pos = [], []
    i, n = 0, len(furi)
    while i < n:
        ch = furi[i]
        if ch == '<':
            j = furi.find('>', i)
            if j < 0:
                j = n
            tag = furi[i + 1:j].strip()
            i = j + 1
            if tag == 'rt':
                k = furi.find('</rt>', i)
                i = (k + 5) if k >= 0 else n
                continue
            if tag in ('rp', '/rp'):
                if i < n and furi[i] in '()':
                    i += 1
                continue
            continue
        if ch == '(':
            j = furi.find(')', i)
            if j > i and (j - i) <= 6 and all('\u3040' <= c <= '\u30ff' for c in furi[i + 1:j]):
                i = j + 1
                continue
        stream.append(ch)
        pos.append(i)
        i += 1
    return ''.join(stream), pos


def spans_in_plain(text):
    """text 中各 〖词〗 在去掉占位符后的纯文本中的 [s,e) 区间。"""
    spans, base, i, n = [], 0, 0, len(text)
    while i < n:
        c = text[i]
        if c == '〖':
            j = text.index('〗', i)
            word = text[i + 1:j]
            spans.append((base, base + len(word)))
            base += len(word)
            i = j + 1
        elif c == '〗':
            i += 1
        else:
            base += 1
            i += 1
    return spans


fixed = empty = skipped = already = 0
for lv in data:
    for u in lv.get('units', []):
        for p in u.get('points', []):
            for b in p.get('blocks', []):
                txt = b.get('text', '')
                if '〖' not in txt:
                    continue
                furi = b.get('furi')
                if not furi:
                    empty += 1
                    continue
                if '〖' in furi:
                    already += 1
                    continue
                spans = spans_in_plain(txt)
                if not spans:
                    continue
                stream, pos = build_stream(furi)
                plain = txt.replace('〖', '').replace('〗', '')
                if stream != plain:
                    skipped += 1
                    continue
                f = furi
                for s, e in reversed(spans):
                    fs = pos[s]
                    fe = pos[e - 1] + 1
                    f = f[:fs] + '〖' + f[fs:fe] + '〗' + f[fe:]
                b['furi'] = f
                fixed += 1

prefix = d[:d.index('export const grammarLevels')]
out = prefix + 'export const grammarLevels = ' + json.dumps(data, ensure_ascii=False) + '\n'
io.open(D, 'w', encoding='utf-8').write(out)
print(f'同步 {fixed} 块 | 空furi {empty} | 流不匹配跳过 {skipped} | 已含占位符 {already}')
