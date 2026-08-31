# -*- coding: utf-8 -*-
"""
将 N5 第 10 单元（常用寒暄用语）的 29 个点合并为 1 个点，
内嵌两列表格（寒暄语 / 中文意思），按 grammar.js 原格式写回。
"""
import io, re, json

PATH = 'src/data/grammar.js'
data = io.open(PATH, encoding='utf-8').read()
m = re.search(r'export const grammarLevels = (.*)$', data, re.S)
levels = json.loads(m.group(1).rstrip().rstrip(';'))

n5 = next(l for l in levels if l['id'] == 'N5')
u10 = n5['units'][9]  # 第 10 单元
assert '寒暄' in u10['title'], u10['title']

points = u10['points']
print('原第10单元点数:', len(points))


def split_greeting(text):
    """按第一个「。」拆分为 [日文, 中文]。"""
    i = text.find('。')
    assert i >= 0, text
    return text[:i + 1], text[i + 1:]


rows = []
for p in points:
    b = p['blocks'][0]
    assert b['t'] == 'line', (p['id'], b['t'])
    jp, cn = split_greeting(b['text'])
    rows.append([jp, cn])

merged = {
    'title': '常用寒暄用语（%d条）' % len(points),
    'blocks': [
        {'t': 'table', 'headers': ['寒暄语', '中文意思'], 'rows': rows}
    ],
    'id': 'N5-U10-greetings',
}
u10['points'] = [merged]
print('合并后点数:', len(u10['points']))
print('表格行数:', len(rows))
print('首行:', rows[0])
print('末行:', rows[-1])

out = '// 自动生成：N5/N4 由 scripts/gen_grammar_n5.py 与 gen_grammar_n4.py 从《蓝宝书文法详解.docx》《蓝宝书n4.docx》解析，N3~N1 由旧脚本生成，请勿手改。\n' \
      '// 结构：levels[] -> units[] -> points[] -> blocks[]（furi 为开启振假名时的 ruby 版本）\n' \
      'export const grammarLevels = ' + json.dumps(levels, ensure_ascii=False, separators=(',', ':')) + '\n'
io.open(PATH, 'w', encoding='utf-8').write(out)
print('已写回', PATH, '| 大小', len(out.encode('utf-8')), 'bytes')
