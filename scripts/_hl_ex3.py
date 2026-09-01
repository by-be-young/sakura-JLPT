# -*- coding: utf-8 -*-
import io, json, re

D = 'src/data/grammar.js'
d = io.open(D, encoding='utf-8').read()
m = re.search(r'export const grammarLevels = (\[.*);?\s*$', d, re.S)
data = json.loads(m.group(1))

HL = '〖{}〗'

# 人工候选：标题 -> 精确高亮串列表（原样匹配例文）
MANUAL = {
    '1. ~ず(に)': ['ず'],
    '8. 可能助动词「れる/られる」': ['使え', '調べられ'],
    '9. 使役助动词「せる/させる」': ['笑わせ', '考えさせ'],
    '10. 被动助动词「れる/られる」': ['褒められ', '注意され', '見られ', '降られ', '入院され', '予定され', '読まれ'],
    '11. 使役被动助动词「される/させられる」': ['待たされ', '行かせられ', '謝らせられ'],
    '12. 命令助动词「れ/ろ」': ['起きろ', '勉強しろ'],
    '13. 禁止助动词「な」': ['捨てるな', '止めるな'],
    '14. ~ておく/とく': ['ておいて', 'ておきます'],
    '16. ~てくる': ['てきます', 'てきました', 'てきた'],
    '18. ~てみる': ['てみて', 'てみましょう'],
    '22. ~の/んです': ['んです', 'んですか'],
    '26. ~てはいけない': ['てはいけません'],
    '29. ~なくてはならない/なくてはいけない': ['なくてはいけません'],
    '30. ~すぎる': ['吸いすぎ', 'すぎて', 'すぎで'],
    '35. ~方': ['方'],
    '36. ~さ': ['広さ', '軽さ'],
    '47. 疑问词+か': ['何か', 'いつか', '誰か'],
    '48. 疑问词+も': ['どれも', '誰も'],
    '50. ~たり/~たり~たり': ['散歩をしたり', '料理を作ったり', '本を読んだり', '勉強したり', '出たり', '入ったり'],
    '51. ~し/~し~し': ['お金もないし', '言葉もわからないし', '友だちもいないし', 'きれいだし', '広いし'],
    '52. ~ほど~ない': ['ほど'],
    '56. 必ず': ['必ず'],
    '63. ~ば': ['なければ', 'すれば', 'なれば'],
    '64. ~と': ['聞くと', 'ならないと', 'この調子だと', 'たとえると', '開けると', '駅を出ると', '食べ終わると', '帰ると'],
    '66. もし~ても': ['もし'],
    '71. ~ようにする': ['ようにしています', 'ようにします'],
    '72. ~(よ)うとする': ['なろうとして', '出ようとした'],
    '75. ちっとも~ない': ['ちっとも'],
    '80. ~がする': ['がします', 'がしている', 'がしました'],
    '81. ~か~ないか': ['被るか被らないか', '行くか行かないか'],
    '87. ~(よ)うと思う': ['作ろうと思います', '登ろうと思っています'],
    '88. あげる/さしあげる': ['あげる', 'さしあげました'],
    '90. もらう/いただく': ['もらった', 'いただきました'],
    '92. くれる/くださる': ['くれました', 'くださいました'],
    '97. ~(さ)せてください/(さ)せないでください': ['やらせてください', '遊ばせないでください', '休ませてください'],
    '99. 見える/お見えになる': ['お見えになりました'],
    '108. お/ご~なさる': ['お話しなさいました', 'ご予約なさった'],
    '109. お/ご~になる': ['お帰りになりました', 'お待ちになって'],
    '110. お/ご~ください': ['お伝えください', 'お座りください'],
    '111. 敬语助动词「れる/られる」': ['帰られました', '行かれる'],
    '113. おる': ['おります', 'おりました'],
    '121. 拝見する': ['拝見します', '拝見して'],
    '122. 拝借する': ['拝借して', '拝借したい'],
    '124. 承る': ['承りました', '承ら'],
    '125. あがる': ['あがります'],
    '126. お/ご~する': ['お持ちします', 'お返しします'],
    '127. お/ご~いたす': ['お渡しいたします', 'ご説明いたします'],
    '128. ~ておる': ['ております', 'でおります'],
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
            cands.update([st + 'い'])
        elif seg.endswith('す') and L >= 2:
            st = seg[:-1]
            cands.update([st + 'し', st + 'さ', st + 'せ'])
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
        # 纯词汇标题（敬语等具体词）：无结构符号且含假名/汉字时自动提取
        if not re.search(r'[「」/+（）()…？?、,~]', t) and re.search(r'[\u3040-\u30ff\u4e00-\u9fff]', t):
            root = re.sub(r'^[\d．.、\s]+', '', t).strip()
            if len(root) >= 2:
                return variants(root)
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

def mark_hits(text, cands):
    """长优先 + 临时占位符，避免候选间包含导致的重复标记"""
    slots = {}
    out = text
    idx = 0
    for c in sorted(set(cands), key=len, reverse=True):
        if not c:
            continue
        ph = '\x01%d\x02' % idx
        new = out.replace(c, ph)
        if new != out:
            slots[ph] = c
            idx += 1
            out = new
    for ph, c in slots.items():
        out = out.replace(ph, HL.format(c))
    return out

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
        newt = mark_hits(txt, cands)
        if newt != txt:
            b['text'] = newt
        if 'furi' in b:
            nf = mark_hits(b['furi'], cands)
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
