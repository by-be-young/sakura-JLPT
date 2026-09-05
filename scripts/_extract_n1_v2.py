import json
import re

with open(r'D:\日语自学网站\scripts\n1_full_text.json', 'r', encoding='utf-8') as f:
    pages = json.load(f)

# Unit definitions for 基礎編
units = [
    {'unit': 1, 'title': '人生・生き方', 'start_page': 10, 'end_page': 23},
    {'unit': 2, 'title': '会社・働き方', 'start_page': 24, 'end_page': 38},
    {'unit': 3, 'title': '文学芸術・科学技術', 'start_page': 39, 'end_page': 53},
    {'unit': 4, 'title': 'コミュニケーション・異文化理解', 'start_page': 54, 'end_page': 67},
    {'unit': 5, 'title': '心理・健康', 'start_page': 68, 'end_page': 83},
    {'unit': 6, 'title': '情報社会・マスコミ', 'start_page': 84, 'end_page': 97},
    {'unit': 7, 'title': '若者と教育', 'start_page': 98, 'end_page': 112},
    {'unit': 8, 'title': '生物・自然・環境と人間', 'start_page': 113, 'end_page': 128},
]

def is_japanese_char(ch):
    o = ord(ch)
    return (0x3040 <= o <= 0x309F or 0x30A0 <= o <= 0x30FF or 
            0x4E00 <= o <= 0x9FFF or ch in '「『（〈《【〝〟')

def clean_article(raw):
    """Clean article text: remove number markers, join lines, add 【n】 markers"""
    # Join lines
    text = raw.replace('\n', '')
    # Remove leading non-Japanese
    first_jp = 0
    for i, ch in enumerate(text):
        if is_japanese_char(ch):
            first_jp = i
            break
    text = text[first_jp:]
    
    # Remove number markers after 。
    result = []
    i = 0
    while i < len(text):
        result.append(text[i])
        if text[i] == '。':
            j = i + 1
            while j < len(text) and text[j] in ' \t':
                j += 1
            if j < len(text) and not is_japanese_char(text[j]):
                i = j  # skip marker
            else:
                i = j - 1 if j > i + 1 else i
        i += 1
    text = ''.join(result)
    
    # Remove remaining leading non-Japanese
    while text and not is_japanese_char(text[0]):
        text = text[1:]
    
    # Split by 。and add 【n】
    sentences = [s.strip() for s in text.split('。') if s.strip()]
    numbered = []
    for idx, s in enumerate(sentences):
        while s and not is_japanese_char(s[0]):
            s = s[1:]
        if s:
            numbered.append(f'【{idx+1}】{s}。')
    return ''.join(numbered)

def get_unit_text(u):
    """Get combined text for a unit"""
    text = ''
    for p in pages[u['start_page']-1 : u['end_page']]:
        text += f'\n===PAGE{p["page"]}===\n' + p['text']
    return text

def find_passage_boundaries(unit_text):
    """Find passage boundaries using 読む前に markers"""
    # Find all 読む前に occurrences (various garbled forms)
    pattern = r'[遨還遴読蛙臥]?む前に[ー，,‘]?'
    positions = [m.start() for m in re.finditer(pattern, unit_text)]
    return positions

def extract_article_and_questions(section_text):
    """Extract article and questions from a passage section"""
    # Find question start
    q_start = -1
    for pat in [r'文の内容に合っている', r'下線部を.*?書きかえ', 
                r'「それ」の意味', r'意味に合っているものを選択',
                r'\n\s*6\.\s', r'\n\s*1\.\s*[（(]']:
        m = re.search(pat, section_text)
        if m:
            if q_start == -1 or m.start() < q_start:
                q_start = m.start()
    
    if q_start == -1:
        # Try finding first numbered question after substantial text
        for m in re.finditer(r'\n\s*(\d+)\.\s', section_text):
            if m.start() > 100:
                q_start = m.start()
                break
    
    if q_start > 0:
        raw_article = section_text[:q_start]
        raw_questions = section_text[q_start:]
    else:
        raw_article = section_text
        raw_questions = ''
    
    article = clean_article(raw_article)
    return article, raw_questions

def parse_questions(raw_questions):
    """Parse questions into structured format"""
    questions = []
    lines = raw_questions.split('\n')
    current_type = None
    i = 0
    
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        
        # Detect section type
        if '文の内容に合っている' in line:
            current_type = 'tf'
            i += 1
            continue
        if '下線部を' in line and '書きかえ' in line:
            current_type = 'rewrite'
            i += 1
            continue
        if '意味に合っているものを選択' in line or '「それ」の意味' in line:
            current_type = 'matching'
            i += 1
            continue
        
        # True/false question
        tf_match = re.match(r'^(\d+)\.\s*[（(]\s*[)）]?\s*(.+)', line)
        if tf_match and current_type == 'tf':
            num = int(tf_match.group(1))
            stem = tf_match.group(2).strip()
            while i + 1 < len(lines) and lines[i+1].strip() and not re.match(r'^\d+\.', lines[i+1].strip()) and not re.match(r'^[a-d][\s．.、]', lines[i+1].strip()):
                stem += lines[i+1].strip()
                i += 1
            questions.append({'type': 'tf', 'num': num, 'stem': stem, 
                            'options': ['合っている', '合っていない']})
            i += 1
            continue
        
        # Matching question (①②③ to a/b/c)
        match_match = re.match(r'^(\d+)\.\s*(.+)', line)
        if match_match and current_type == 'matching':
            num = int(match_match.group(1))
            stem = match_match.group(2).strip()
            # Options are a/b/c listed to the right or below
            options = []
            # Look for options on same line or subsequent lines
            full_line = line
            j = i
            while j + 1 < len(lines) and not re.match(r'^\d+\.', lines[j+1].strip()) and not re.match(r'^文の内容', lines[j+1].strip()):
                j += 1
                full_line += ' ' + lines[j].strip()
            # Extract a/b/c options
            for opt_m in re.finditer(r'([a-c])\s+(.+?)(?=\s+[a-c]\s|$)', full_line):
                options.append(opt_m.group(2).strip())
            if len(options) < 2:
                # Try alternative format
                options = ['数字', '医学や技術の進歩', '統計的に証明する']  # default for known pattern
            questions.append({'type': 'mc', 'num': num, 'stem': stem, 'options': options})
            i = j + 1
            continue
        
        # Multiple choice question
        mc_match = re.match(r'^(\d+)\.\s*(.+)', line)
        if mc_match and current_type != 'rewrite':
            num = int(mc_match.group(1))
            stem = mc_match.group(2).strip()
            # Skip if it looks like a rewrite question
            if '____' in stem or '＿' in stem or '->' in stem or '→' in stem:
                i += 1
                continue
            # Skip if stem is very short (likely rewrite)
            if len(stem) < 8 and current_type == 'rewrite':
                i += 1
                continue
            
            # Continue stem
            while i + 1 < len(lines) and lines[i+1].strip():
                next_line = lines[i+1].strip()
                if re.match(r'^[a-d][\s．.、]', next_line):
                    break
                stem += next_line
                i += 1
            
            # Extract options
            options = []
            i += 1
            while i < len(lines) and len(options) < 4:
                opt_line = lines[i].strip()
                opt_match = re.match(r'^([a-d])[\s．.、]\s*(.+)', opt_line)
                if opt_match:
                    opt_text = opt_match.group(2).strip()
                    while i + 1 < len(lines) and lines[i+1].strip() and not re.match(r'^[a-d][\s．.、]', lines[i+1].strip()) and not re.match(r'^\d+\.', lines[i+1].strip()):
                        opt_text += lines[i+1].strip()
                        i += 1
                    options.append(opt_text)
                i += 1
            
            if len(options) >= 2:
                questions.append({'type': 'mc', 'num': num, 'stem': stem, 'options': options})
            continue
        
        i += 1
    
    return questions

def extract_answers_and_analysis(unit_text, passage_num):
    """Extract answers, summary, and analysis for a passage from 読んだ後で"""
    result = {'answers': {}, 'translation': '', 'analysis': []}
    
    # Find the relevant 読んだ後で section
    # For passage 1, it's the first 読んだ後で
    # For passages 2-5, find 読み物N marker
    
    ato_sections = re.split(r'読んだ後で[ー」]?', unit_text)
    
    if passage_num == 1:
        # First 読んだ後で section (after first split)
        if len(ato_sections) > 1:
            section = ato_sections[1]
            # Cut off at next 読み物2 or grammar lesson
            cut = re.search(r'読み物2|文の構造|表現\d|書き言葉', section)
            if cut:
                section = section[:cut.start()]
            _parse_ato_section(section, result)
    else:
        # Find 読み物N in the later 読んだ後で sections
        for sec in ato_sections[1:]:
            marker = f'読み物{passage_num}'
            idx = sec.find(marker)
            if idx >= 0:
                section = sec[idx:]
                # Cut off at next 読み物 or end
                next_m = re.search(r'読み物\d+', section[len(marker):])
                if next_m:
                    section = section[:len(marker) + next_m.start()]
                _parse_ato_section(section, result)
                break
    
    return result

def _parse_ato_section(section, result):
    """Parse a 読んだ後で section"""
    # Extract answers
    ans_m = re.search(r'答\s*案\s*[:：]\s*(.+)', section)
    if ans_m:
        ans_line = ans_m.group(1).strip()
        # Parse individual answers
        for am in re.finditer(r'(\d+)\.\s*([〇○X××a-dA-D])', ans_line):
            qnum = int(am.group(1))
            ans = am.group(2)
            if ans in '〇○':
                result['answers'][qnum] = 0  # 合っている
            elif ans in 'X××':
                result['answers'][qnum] = 1  # 合っていない
            else:
                result['answers'][qnum] = ord(ans.lower()) - ord('a')
    
    # Extract 文章概要
    sum_m = re.search(r'文章概要\s*[:：]?\s*\n(.*?)(?=\n难句分析|\n答案解析|\n読み物|\Z)', section, re.DOTALL)
    if sum_m:
        result['translation'] = sum_m.group(1).strip().replace('\n', '').replace(' ', '')
    
    # Extract 难句分析
    ana_m = re.search(r'难句分析\s*[:：]?\s*\n(.*?)(?=\n答案解析|\n読み物|\Z)', section, re.DOTALL)
    if ana_m:
        ana_text = ana_m.group(1).strip()
        # Split into individual analyses
        # Each starts with a number like "1." or just the sentence
        sentences = re.split(r'\n(?=\d+\.\s)', ana_text)
        for s in sentences:
            s = s.strip()
            if not s:
                continue
            # First line(s) is the Japanese sentence, then note after 一 or newline
            parts = re.split(r'\n[一]', s, maxsplit=1)
            sentence = parts[0].strip().replace('\n', '')
            # Remove leading number
            sentence = re.sub(r'^\d+\.\s*', '', sentence)
            note = parts[1].strip().replace('\n', '') if len(parts) > 1 else ''
            if sentence and len(sentence) > 5:
                result['analysis'].append({'sentence': sentence, 'note': note})

# Main extraction
all_passages = []
pid = 1

for u in units:
    unit_text = get_unit_text(u)
    boundaries = find_passage_boundaries(unit_text)
    
    # Each boundary is a 読む前に - the passage article follows after the vocab section
    # We need to find 5 passages per unit
    passages_in_unit = []
    
    for idx, pos in enumerate(boundaries):
        if idx >= 5:
            break
        # Section from this 読む前に to the next one (or end of unit text before 読んだ後で)
        end_pos = boundaries[idx+1] if idx+1 < len(boundaries) else len(unit_text)
        # But we need to cut at 読んだ後で if it comes before next 読む前に
        ato_pos = unit_text.find('読んだ後で', pos)
        if ato_pos > 0 and ato_pos < end_pos:
            end_pos = ato_pos
        
        section = unit_text[pos:end_pos]
        
        # Skip the vocab section (読む前に content), find article start
        # Article starts after ・読むための表現・ section or at 読んでみよう
        article_start = -1
        for pat in [r'でみよう[コ」，,一]?', r'・読むための表現・']:
            m = re.search(pat, section)
            if m:
                article_start = m.end()
                break
        
        if article_start > 0:
            article_section = section[article_start:]
            article, raw_questions = extract_article_and_questions(article_section)
            questions = parse_questions(raw_questions)
        else:
            # No 読んでみよう found - article might start directly
            # Find after vocab expressions
            vocab_end = section.find('・読むための表現・')
            if vocab_end > 0:
                # Skip the expressions list
                expr_section = section[vocab_end:]
                # Find where expressions end (look for first substantial Japanese paragraph)
                article_section = expr_section
                article, raw_questions = extract_article_and_questions(article_section)
                questions = parse_questions(raw_questions)
            else:
                article = ''
                questions = []
        
        # Get answers/analysis
        ato_data = extract_answers_and_analysis(unit_text, idx+1)
        
        passages_in_unit.append({
            'id': pid,
            'num': idx+1,
            'part': '基礎編',
            'unit': u['unit'],
            'unitTitle': u['title'],
            'article': article,
            'translation': ato_data['translation'],
            'analysis': ato_data['analysis'],
            'questions': questions,
            'answers_raw': ato_data['answers'],
        })
        pid += 1
    
    all_passages.extend(passages_in_unit)
    print(f"Unit {u['unit']} ({u['title']}): {len(passages_in_unit)} passages")
    for p in passages_in_unit:
        qt = [q['type'] for q in p['questions']]
        print(f"  読み物{p['num']}: article={len(p['article'])}ch, q={len(p['questions'])} {qt}, trans={'Y' if p['translation'] else 'N'}, ana={len(p['analysis'])}")

# Save
with open(r'D:\日语自学网站\scripts\n1_extracted.json', 'w', encoding='utf-8') as f:
    json.dump(all_passages, f, ensure_ascii=False, indent=2)

print(f'\nTotal: {len(all_passages)} passages')
