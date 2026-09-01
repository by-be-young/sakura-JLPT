# -*- coding: utf-8 -*-
import io, json, re

D = 'src/data/grammar.js'
d = io.open(D, encoding='utf-8').read()
m = re.search(r'export const grammarLevels = (\[.*);?\s*$', d, re.S)
data = json.loads(m.group(1))

HL = '〖{}〗'

# 人工候选：标题 -> 候选词列表（空=跳过待手动）
MANUAL = {
    '1. ~ず(に)': ['ず'],
    '8. 可能助动词「れる/られる」': [],
    '9. 使役助动词「せる/させる」': [],
    '10. 被动助动词「れる/られる」': [],
    '11. 使役被动助动词「される/させられる」': [],
    '12. 命令助动词「れ/ろ」': [],
    '13. 禁止助动词「な」': [],
    '35. ~方': ['方'],
    '36. ~さ': [],
    '47. 疑问词+か': [],
    '48. 疑问词+も': [],
    '56. 必ず': ['必ず'],
}

def variants(root):
    cands = {root}
    for seg in root.split('/'):
        seg = seg.strip()
        if not seg:
            continue
        cands.add(seg)
        L = len(seg)
        if seg.endswith('する') and L >= 4:
            st = seg[:-3] + 'し'
            cands.update([st, st + 'た', st + 'て', st + 'ま', st + 'ない'])
        elif seg.endswith('くる') and L >= 4:
            st = seg[:-3] + 'き'
            cands.update([st, st + 'た', st + 'て', st + 'ま', st + 'ない'])
        elif seg.endswith('る') and L >= 4:
            st = seg[:-1]
            cands.update([st, st + 'た', st + 'て', st + 'ま', st + 'ない', st + 'よう', st + 'ば'])
            cands.update([st + 'っ', st + 'り', st + 'ら'])
        elif seg.endswith('く') and L >= 4:
            st = seg[:-1]
            cands.update([st + 'き', st + 'い', st + 'っ', st + 'か'])
        elif seg.endswith('う') and L >= 4:
            st = seg[:-1]
            cands.update([st + k for k in 'きぎしちりみびにい'])
            cands.update([st + 'っ', st + 'わ'])
        elif seg.endswith('い') and L >= 3:
            st = seg[:-1]
            cands.update([st + 'く', st + 'かっ', st + 'くて'])
    return sorted((c for c in cands if len(c) >= 2), key=len, reverse=True)

def extract_root(title):
    if title in MANUAL:
        return MANUAL[title]
    t = re.sub(r'^[\d．.、\s]+', '', title).strip()
    if not t.startswith('~'):
        return []
    t = t[1:].strip()
    base = re.split(r'[（(]', t)[0].strip().replace('…', '')
    root = base
    for suf in ['です', 'だ']:
        if root.endswith(suf) and len(root) > len(suf):
            root = root[:-len(suf)]
    if len(root) <= 1 or '~' in root:
        return []
    return variants(root)

def process_point(p):
    title = p['title']
    cands = extract_root(title)
    ex_idx = []
    in_ex = False
    for i, b in enumerate(p.get('blocks', [])):
        if b.get('t') == 'label':
            in_ex = str(b.get('label', '')).startswith('例文')
            continue
        if in_ex and b.get('t') == 'line':
            ex_idx.append(i)
    if not cands or not ex_idx:
        return ex_idx, cands, 0
    hit = 0
    for i in ex_idx:
        b = p['blocks'][i]
        txt = b.get('text', '')
        jp = txt.split('/')[0]
        for c in cands:
            if c in jp:
                hit += 1
                break
        newt = txt
        for c in cands:
            newt = newt.replace(c, HL.format(c))
        if newt != txt:
            b['text'] = newt
        if 'furi' in b:
            nf = b['furi']
            for c in cands:
                nf = nf.replace(c, HL.format(c))
            if nf != b['furi']:
                b['furi'] = nf
    return ex_idx, cands, hit

report = []
for lv in data:
    if lv['id'] not in ('N4',):
        continue
    for u in lv.get('units', []):
        for p in u.get('points', []):
            ex_idx, cands, hit = process_point(p)
            if ex_idx:
                n = len(ex_idx)
                if cands:
                    status = 'OK' if hit else 'NOHIT'
                    report.append((lv['id'], p['title'], '/'.join(cands)[:26], f'{hit}/{n}', status))
                else:
                    report.append((lv['id'], p['title'], '', f'{n}', 'MANUAL'))
            else:
                report.append((lv['id'], p['title'], '', '0', 'NOEX'))

io.open(D, 'w', encoding='utf-8').write(d)
# 将修改后的 data 序列化写回（保留头部注释，单行 JSON）
prefix = d[:d.index('export const grammarLevels')]
out = prefix + 'export const grammarLevels = ' + json.dumps(data, ensure_ascii=False) + '\n'
io.open(D, 'w', encoding='utf-8').write(out)
ok = sum(1 for r in report if r[4] == 'OK')
manual = sum(1 for r in report if r[4] in ('MANUAL', 'NOHIT'))
print(f'=== N4: OK={ok} 待手动={manual} ===')
for r in report:
    print('\t'.join(r))
