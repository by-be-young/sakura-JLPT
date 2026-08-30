# -*- coding: utf-8 -*-
"""解析红蓝宝书 N2 模拟测试题（第1~5回, 731-1000）为结构化 JSON。
忽略图片，仅保留文字；解答区含【答案】/【译文】/【解析】/选项说明，可补全选项。
"""
import re, json, sys
sys.stdout.reconfigure(encoding='utf-8')

def read_lines(path):
    with open(path, encoding='utf-8') as f:
        return f.read().split('\n')

MOCK = {1:(731,784),2:(785,838),3:(839,892),4:(893,946),5:(947,1000)}
FILE_MOCKS = {
    '_struct_201-300.txt': [1,2,3],
    '_struct_301-337.txt': [4,5],
}

# ---------- 题目编号匹配（支持3-4位，允许数字间空格） ----------
def match_qnum(line):
    m = re.match(r'^[ \t]*(\d)\s*(\d)\s*(\d)\s*(\d)?\s*(?=\S|$)', line)
    if not m:
        return None, line
    digits = [m.group(1), m.group(2), m.group(3)]
    if m.group(4):
        digits.append(m.group(4))
    n = int(''.join(digits))
    rest = line[m.end():]
    return n, rest.lstrip(' \t')

# ---------- 切分文件 ----------
def split_file(lines):
    events = []
    for i, l in enumerate(lines):
        m = re.search(r'模\s*擬\s*テ\s*ス\s*ト?卜?第\s*(\d+)\s*回', l)
        if m and '解答' not in l and '解説' not in l:
            events.append((i, 'q', int(m.group(1))))
        m2 = re.search(r'模\s*擬\s*テ\s*ス\s*ト?卜?第\s*(\d+)\s*回.*(?:解答|解説)', l)
        if m2:
            events.append((i, 'a', int(m2.group(1))))
    events.sort()
    q_map = {}
    a_map = {}
    for i, typ, r in events:
        if typ == 'q':
            q_map.setdefault(r, i)
        else:
            a_map.setdefault(r, i)
    result = []
    for r in sorted(q_map):
        if r not in a_map:
            continue
        q_start = q_map[r]
        a_start = a_map[r]
        # 解答区结束：下一个回的题目区起点，或文件末尾
        next_qs = [q_map[x] for x in q_map if x > r]
        a_end = min(next_qs) if next_qs else len(lines)
        result.append((r, lines[q_start:a_start], lines[a_start:a_end]))
    return result

# ---------- 解析题目区 ----------
def parse_questions(sec, expected_range):
    questions = {}
    order = []
    i = 0
    n = len(sec)
    while i < n:
        l = sec[i]
        m = match_qnum(l)
        num = m[0]
        if num is not None and expected_range[0] <= num <= expected_range[1]:
            rest = m[1]
            q = {'num': num, 'sentence': rest.strip(), 'opts_raw': []}
            j = i + 1
            while j < n:
                lj = sec[j]
                mj = match_qnum(lj)
                if mj[0] is not None and expected_range[0] <= mj[0] <= expected_range[1]:
                    break
                s = lj.strip()
                if s == '===TABLE===':
                    k = j+1; tbl = []
                    while k < n and sec[k] != '===END TABLE===':
                        tbl.append(sec[k]); k += 1
                    q['opts_raw'].append(' '.join(tbl))
                    j = k+1
                    continue
                if re.match(r'^問題\d|^問\s*題\s*\d', s) or re.search(r'模\s*擬\s*テ\s*ス', s):
                    break
                if s:
                    q['opts_raw'].append(s)
                j += 1
            if num not in questions:
                questions[num] = q
                order.append(num)
            i = j
        else:
            i += 1
    return questions, order

# ---------- 解析解答区 ----------
def parse_answers(sec, expected_range):
    results = {}
    txt = '\n'.join(sec)
    blocks = re.split(r'(?=\d{3,4}\s*【\s*答\s*案\s*】)', txt)
    for b in blocks:
        m = re.match(r'(\d{3,4})\s*【\s*答\s*案\s*】\s*([1-4])', b)
        if not m:
            continue
        num = int(m.group(1))
        if not (expected_range[0] <= num <= expected_range[1]):
            continue
        ans = int(m.group(2))
        body = b[m.end():]
        tm = re.search(r'【\s*译\s*文\s*】\s*(.*?)(?=【\s*解\s*析\s*】|$)', body, re.S)
        translation = tm.group(1).strip() if tm else ''
        em = re.search(r'【\s*解\s*析\s*】\s*(.*?)(?=选项|【|$)', body, re.S)
        explanation = em.group(1).strip() if em else ''
        opt_exps = {}
        for om in re.finditer(r'选项\s*([1-4])\s*[】:：]?\s*(.*?)(?=选项\s*[1-4]|$)', body, re.S):
            opt_exps[int(om.group(1))] = om.group(2).strip()
        results[num] = {
            'answer': ans,
            'translation': translation,
            'explanation': explanation,
            'opt_exps': opt_exps,
            'body': body.strip()
        }
    return results

# ---------- 提取选项 ----------
def extract_options(raw_lines, answer_block=None):
    opts = ['', '', '', '']
    for ln in raw_lines:
        # 在"非空白 + 空白 + 选项号1-4 + 空白"处分割，保留"1  选项"整体
        for tok in re.split(r'(?<=\S)\s+(?=[1-4]\s)', ln):
            tok = tok.strip()
            m = re.match(r'^([1-4])\s+(.*)$', tok)
            if m:
                idx = int(m.group(1))
                val = m.group(2).strip()
                if 1 <= idx <= 4 and val:
                    opts[idx-1] = val
    # 用解答区选项说明补全
    if answer_block:
        for k, v in sorted(answer_block.get('opt_exps', {}).items()):
            idx = k
            if 1 <= idx <= 4 and not opts[idx-1]:
                first = re.split(r'[\s/／「(（]', v)[0].strip()
                opts[idx-1] = first
    return opts

def main():
    all_data = []
    for fname, mocks in FILE_MOCKS.items():
        lines = read_lines('D:\\日语自学网站\\' + fname)
        for r, qsec, asec in split_file(lines):
            if r not in mocks:
                continue
            rng = MOCK[r]
            questions, order = parse_questions(qsec, rng)
            answers = parse_answers(asec, rng)
            print(f'第{r}回: 题目{len(order)} 解答{len(answers)} 缺题目:', [x for x in range(rng[0],rng[1]+1) if x not in questions], '缺解答:', [x for x in range(rng[0],rng[1]+1) if x not in answers])
            for num in order:
                q = questions[num]
                a = answers.get(num, {'answer': None, 'translation':'', 'explanation':'', 'opt_exps':{}})
                opts = extract_options(q['opts_raw'], a)
                all_data.append({
                    'id': num,
                    'mock': r,
                    'sentence': q['sentence'],
                    'options': opts,
                    'answer': a['answer'],
                    'translation': a.get('translation',''),
                    'explanation': a.get('explanation',''),
                    'opt_exps': a.get('opt_exps', {}),
                })
    all_data.sort(key=lambda x: x['id'])
    with open(r'D:\日语自学网站\mock_parsed.json','w',encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=1)
    print('总题数:', len(all_data))
    missing_ans = [d['id'] for d in all_data if not d['answer']]
    print('缺答案:', missing_ans)
    short = [d['id'] for d in all_data if len([o for o in d['options'] if o]) < 4]
    print('选项不足4:', short)

if __name__ == '__main__':
    main()
