# -*- coding: utf-8 -*-
"""
N3 题库 MD → src/data/questions-n3.js 转换器

用法:
    python parse_n3.py <输入.md> [输出路径]

规则:
- 每 6 题中：前 2 题=文字(读音)，中间 2 题=語彙，后 2 题=文法（与 N2 一致）
- 单元划分：1-18 单元各 36 题（001-648）；第 19 单元 649-679；第 20 单元 680-710
- 文字题：自动识别句中目标汉字并加 <u></u> 下划线（基于 pykakasi 读音匹配）
- 含填空（　　）的句子不做下划线
- 振假名(sentenceFurigana/explanationFurigana)：本占位数据暂不生成，交答题逻辑自动回退到原句
"""
import re
import sys
import json
import pykakasi

sys.stdout.reconfigure(encoding='utf-8')

KKS = pykakasi.kakasi()
KANJI = re.compile(r'[\u4e00-\u9fff]')
BLANK = re.compile(r'[（(]\s*[）)]')

QID_PAT = re.compile(r'^\*\*(\d+)\*\*\s*(.*)$')
OPT_PAT = re.compile(r'^\s*1\.\s*(.*?)\s*2\.\s*(.*?)\s*3\.\s*(.*?)\s*4\.\s*(.*?)\s*$')
ANS_PAT = re.compile(r'^\*\*答案[:：](\d)\*\*\s*(.*)$')


def has_kanji(s):
    return bool(KANJI.search(s))


def unit_of(qid):
    if qid <= 648:
        return (qid - 1) // 36 + 1
    if qid <= 679:
        return 19
    return 20


def type_of(qid):
    pos = (qid - 1) % 6
    if pos <= 1:
        return '文字'
    if pos <= 3:
        return '語彙'
    return '文法'


def detect_underline(sentence, option):
    """识别句中被考查读音的汉字词，返回其子串（用于加 <u>）；失败返回 None。"""
    try:
        res = KKS.convert(sentence)
    except Exception:
        return None
    tokens = [(it['orig'], it['hira']) for it in res]
    best = None

    def consider(score, span):
        nonlocal best
        if best is None or score < best[0]:
            best = (score, span)

    for i in range(len(tokens)):
        orig_i, hira_i = tokens[i]
        if not has_kanji(orig_i) or not hira_i:
            continue
        # 情况1：整词精确读音（可能由多个 token 组成，最后一个 token 可部分消费）
        if option.startswith(hira_i):
            rem = option[len(hira_i):]
            span_orig = orig_i
            j = i
            if rem == '':
                consider((0, 0, i), (orig_i, 'full1'))
            else:
                for j in range(i + 1, len(tokens)):
                    oj, hj = tokens[j]
                    if rem.startswith(hj):
                        rem = rem[len(hj):]
                        span_orig += oj
                        if rem == '':
                            consider((1, j - i, i), (span_orig, 'fullN'))
                            break
                    elif hj.startswith(rem):
                        span_orig += oj[:len(rem)]
                        consider((2, j - i, i), (span_orig, 'partial'))
                        break
                    else:
                        break
        # 情况2：汉字词被 pykakasi 并入复合词（如 運転免許→うんてんめんきょ）
        # 或带后缀粘着（如 非常に→ひじょうに）。option 是该 token 读音的子串。
        idx = hira_i.find(option)
        if idx >= 0:
            n_kana = len(hira_i)
            n_char = len(orig_i)
            # 按比例映射 kana 位置到字符位置（近似）
            cs = int(round(idx / n_kana * n_char))
            ce = int(round((idx + len(option)) / n_kana * n_char))
            if ce > cs:
                consider((3, 0, i), (orig_i[cs:ce], 'sub'))

    if best is None:
        return None
    return best[1][0]


def build_sentence(sentence, qtype, option):
    """生成 sentence（文字题带下划线）。"""
    if qtype == '文字' and not BLANK.search(sentence):
        sub = detect_underline(sentence, option)
        if sub and sub in sentence:
            return sentence.replace(sub, '<u>%s</u>' % sub, 1)
    return sentence


def split_translation(explanation):
    """从解析文本中拆出译文与解析。"""
    translation = ''
    rest = explanation
    m = re.search(r'句意\s*[:：]?\s*[「"“"]*([^」”"]+?)[」”"]*。?$', explanation)
    if m:
        translation = m.group(1).strip()
        rest = explanation[:m.start()].rstrip('。；;，,').strip()
    else:
        # 兜底：取最后一个 “＝X” 结尾的 X 作为译文
        m2 = re.search(r'＝([^＝]+?)(?:。|$)\s*$', explanation)
        if m2:
            translation = m2.group(1).strip().rstrip('。')
        # rest 保持全文
    return translation, rest


def parse(md_path):
    with open(md_path, encoding='utf-8') as f:
        lines = f.read().splitlines()

    questions = []
    i = 0
    while i < len(lines):
        m = QID_PAT.match(lines[i])
        if not m:
            i += 1
            continue
        qid = int(m.group(1))
        sentence = m.group(2).strip()
        opt_line = lines[i + 1] if i + 1 < len(lines) else ''
        ans_line = lines[i + 2] if i + 2 < len(lines) else ''
        mo = OPT_PAT.match(opt_line)
        ma = ANS_PAT.match(ans_line)
        if not (mo and ma):
            print('  [WARN] 跳过无法解析的题 %s：%s' % (qid, sentence[:30]))
            i += 3
            continue
        options = [mo.group(k).strip() for k in range(1, 5)]
        answer = int(ma.group(1))
        explanation = ma.group(2).strip()

        qtype = type_of(qid)
        unit = unit_of(qid)
        option = options[answer - 1] if 1 <= answer <= 4 else ''
        sent = build_sentence(sentence, qtype, option)
        translation, exp = split_translation(explanation)

        questions.append({
            'id': qid,
            'type': qtype,
            'unit': unit,
            'sentence': sent,
            'options': options,
            'answer': answer,
            'translation': translation,
            'explanation': exp or explanation,
        })
        i += 3
    return questions


def to_js(questions):
    out = []
    out.append('// 本文件由 scripts/parse_n3.py 从题库 MD 自动生成，请勿手改。')
    out.append('// 生成时间：由脚本生成时写入')
    out.append('export const questions = [')
    for q in questions:
        obj = {
            'id': q['id'],
            'type': q['type'],
            'unit': q['unit'],
            'sentence': q['sentence'],
            'options': q['options'],
            'answer': q['answer'],
            'translation': q['translation'],
            'explanation': q['explanation'],
        }
        out.append('  ' + json.dumps(obj, ensure_ascii=False) + ',')
    out.append(']')
    out.append('')
    out.append('// N3 模拟测试暂未开放，保留空结构，补充后在此填写')
    out.append('export const mockInfo = {}')
    out.append('')
    return '\n'.join(out)


if __name__ == '__main__':
    md = sys.argv[1] if len(sys.argv) > 1 else r'C:\Users\34166\Desktop\N3考级分P开头题目_答案.md'
    out_path = sys.argv[2] if len(sys.argv) > 2 else r'D:\日语自学网站\src\data\questions-n3.js'
    qs = parse(md)
    print('解析到题目数：%d' % len(qs))
    from collections import Counter
    print('类型统计：', dict(Counter(q['type'] for q in qs)))
    print('单元统计：', dict(Counter(q['unit'] for q in qs)))
    und = sum(1 for q in qs if '<u>' in q['sentence'])
    blank_skip = sum(1 for q in qs if q['type'] == '文字' and BLANK.search(q['sentence']))
    print('文字题数：%d，其中加下划线 %d，含填空跳过 %d' % (
        sum(1 for q in qs if q['type'] == '文字'), und, blank_skip))
    js = to_js(qs)
    js = js.replace('// 生成时间：由脚本生成时写入',
                    '// 生成时间：%s' % __import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M'))
    with open(out_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(js)
    print('已写入：%s' % out_path)
