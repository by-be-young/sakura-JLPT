# -*- coding: utf-8 -*-
"""修复标注脚本遗留的 <ruby>〖X〗<注音></ruby> 坏结构 → 〖<ruby>X<注音></ruby>〗"""
import io, json, re

D = 'src/data/grammar.js'
d = io.open(D, encoding='utf-8').read()
pat = re.compile(r'<ruby>〖([^〗]*)〗((?:<rp>\(</rp>|<rp>\)</rp>|<rt>[^<]*</rt>)*)</ruby>')
before = d.count('<ruby>〖')
d2 = pat.sub(lambda m: '〖<ruby>' + m.group(1) + m.group(2) + '</ruby>〗', d)
after = d2.count('<ruby>〖')
io.open(D, 'w', encoding='utf-8').write(d2)
print(f'修复前 <ruby>〖 {before} → 修复后 {after}')

# 重新验证全局
d3 = io.open(D, encoding='utf-8').read()
print('双括号:', d3.count('〖〖'))
print('〗</ruby>:', d3.count('〗</ruby>'))
print('未配对 ruby( =', d3.count('<ruby>'), '):', d3.count('</ruby>'))
