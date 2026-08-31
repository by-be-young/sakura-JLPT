# 解析红宝书N2词汇词条 v3（最终）
# 输出: n2_final.json  [{kanji, kana, pitch, pos, meaning}]
import docx, re, json

F2 = r'C:\Users\34166\Desktop\超值白金版·红宝书大全集  新日本语能力考试N1-N5文字词汇详解_146-290.docx'
F3 = r'C:\Users\34166\Desktop\超值白金版·红宝书大全集  新日本语能力考试N1-N5文字词汇详解_291-435.docx'

def paras_of(path):
    d = docx.Document(path)
    return [p.text.strip() for p in d.paragraphs if p.text.strip()]

p2 = paras_of(F2); p3 = paras_of(F3)
n2 = p2[1068:] + p3[:1152]

CIRC = {'0':'⓪','1':'①','2':'②','3':'③','4':'④','5':'⑤','6':'⑥','7':'⑦','8':'⑧','9':'⑨','10':'⑩'}
def clean_circle(s):
    def repl(m): return CIRC.get(m.group(1), m.group(0))
    pats = [
        r'\\textcircled\{?(\d+)\}?', r'\\text\s*circled\{?(\d+)\}?',
        r'\\textc\s*ircled\{?(\d+)\}?', r'\\textci\s*rcled\{?(\d+)\}?',
        r'\\textcir\s*cled\{?(\d+)\}?', r'\\textc\s*irled\{?(\d+)\}?',
        r'\\te\s*xtcircled\{?(\d+)\}?', r'\\t\s*extcircled\{?(\d+)\}?',
        r'\\te\s*xtc\s*ircled\{?(\d+)\}?', r'\\text\s*c\s*ircled\{?(\d+)\}?',
    ]
    for p in pats:
        s = re.sub(p, repl, s)
    s = re.sub(r'\\t\s*riangle', '△', s)
    s = re.sub(r'\\B\s*ox', '□', s)
    s = re.sub(r'\\s\s*quar', '□', s)
    s = s.replace('\\triangle', '△').replace('\\Box','□')
    return s

POS_RE = re.compile(r'\[([^\]]*(?:名|動|形|副|感|接頭|接尾|連体|代|嘆|助)[^\]]*)\]')

KANA_OK = re.compile(r'^[ぁ-んァ-ヶー・]+$')

# OCR 错字映射（用于括号读音修复）
OCR_FIX = {
    '<': 'く', 'L': 'し', '书': 'お', '示': 'ふ', '九': 'れ',
    '加': 'あ', '5': 'う', '二': 'こ', '元': 'わ', '屯': 'つ',
    '勺': '', '儿': '', '汪': '', '品': 'ん', '巴': '',
    '己': '', '石': '', '往': '', '確': '', '流': '', '談': '',
    '上': '', '少': '', '舌': '', '力': 'か', '亡': '', '止': 'と',
}

# 人工修复表：键为词条原始（去空格）中含有的特征串 → 修正后的 kana（片假名或假名）
MANUAL_FIX = {
    'アウ卜': 'アウト',
    '才一ケス卜ラ': 'オーケストラ',
    '力ッ卜': 'カット',
    'サ一クル': 'サークル',
    'スク一ル': 'スクール',
    '夕亻卜ル': 'タイトル',
    '二ーズ': 'ニーズ',
    '一ゲン': 'バーゲン',
    'ベストセラー': 'ベストセラー',
    '~編': 'へん',
    '~逼': 'へん',
    'マ一ク': 'マーク',
    '毛一夕一': 'モーター',
    'ュ二一ク': 'ユニーク',
    'エアメール': 'エアメール',
    '才 一 ケス卜ラ': 'オーケストラ',
}
def manual_fix(t_flat):
    for k, v in MANUAL_FIX.items():
        if k in t_flat:
            return v
    return None
def fix_kana(k):
    out = []
    for c in k:
        if ('ぁ'<=c<='ん') or ('ァ'<=c<='ヶ') or c in 'ー・':
            out.append(c)
        elif c in OCR_FIX:
            out.append(OCR_FIX[c])
        # 其他字符（拉丁、乱码）跳过
    return ''.join(out)

def parse_entry(t):
    s = clean_circle(t)
    if not s.startswith('□'):
        return None
    body = s[1:].strip()
    m_pos = POS_RE.search(body)
    if not m_pos:
        return None
    pos = m_pos.group(1)
    head = body[:m_pos.start()].strip()
    meaning = body[m_pos.end():].strip()
    pitches = re.findall(r'[⓪①②③④⑤⑥⑦⑧⑨⑩]', head)
    # 读音括号
    m_kana = re.search(r'\(([^)]+)\)', head)
    if m_kana:
        kana_raw = m_kana.group(1).replace(' ', '')
        word = head[:m_kana.start()].replace(' ', '')
        # 外来语：kana是拉丁 → kana=word（片假名）
        if re.fullmatch(r'[a-zA-Z]+', kana_raw):
            kana = word  # word是片假名
            kanji = ''
        else:
            kana = fix_kana(kana_raw)
            kanji = word
    else:
        word = head
        # 分离音调圈号
        w2 = re.sub(r'[⓪①②③④⑤⑥⑦⑧⑨⑩]', '', word)
        if KANA_OK.match(w2):
            kana = w2
            kanji = ''
        else:
            kana = fix_kana(w2)
            kanji = w2 if re.search(r'[\u4e00-\u9fff]', w2) else ''
    # 若 kana 仍异常，尝试人工修复表
    if not KANA_OK.match(kana):
        mf = manual_fix(s.replace(' ', ''))
        if mf:
            kana = mf
    return {'kanji': kanji, 'kana': kana, 'pitch': pitches, 'pos': pos, 'meaning': meaning}

entries = []
for t in n2:
    if t.startswith('□'):
        e = parse_entry(t)
        if e:
            entries.append(e)

print('总解析:', len(entries))
good = [e for e in entries if KANA_OK.match(e['kana'])]
print('kana合法:', len(good))
bad = [e for e in entries if not KANA_OK.match(e['kana'])]
print('kana仍异常:', len(bad))
print()
print('=== 仍异常词条 ===')
for e in bad:
    print('  kanji=%r kana=%r pos=%r' % (e['kanji'][:20], e['kana'][:20], e['pos']))

with open('n2_final.json','w',encoding='utf-8') as f:
    json.dump(good, f, ensure_ascii=False, indent=1)
print()
print('已写 n2_final.json 有效词条', len(good))
