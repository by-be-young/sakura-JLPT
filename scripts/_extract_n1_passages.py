import json
import re

with open(r'D:\日语自学网站\scripts\n1_full_text.json', 'r', encoding='utf-8') as f:
    pages = json.load(f)

# Build a single text with page markers
all_text = ''
page_starts = {}  # page_num -> char offset
for p in pages:
    page_starts[p['page']] = len(all_text)
    all_text += f'\n===PAGE{p["page"]}===\n' + p['text']

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
    """Check if character is a typical Japanese text character"""
    o = ord(ch)
    return (0x3040 <= o <= 0x309F or  # hiragana
            0x30A0 <= o <= 0x30FF or  # katakana
            0x4E00 <= o <= 0x9FFF or  # kanji
            ch in '「『（〈《【〝〟')  # opening brackets

def clean_article(raw):
    """Clean article text: remove number markers, join lines, add 【n】 markers"""
    # Join lines, remove page markers
    text = raw.replace('\n', '')
    # Remove leading garbage before first Japanese character
    # Find first Japanese char or 「
    first_jp = 0
    for i, ch in enumerate(text):
        if is_japanese_char(ch):
            first_jp = i
            break
    text = text[first_jp:]
    
    # Remove number markers after 。: the char right after 。if not Japanese
    # Also handle 。followed by space then marker
    result = []
    i = 0
    while i < len(text):
        result.append(text[i])
        if text[i] == '。':
            # Skip next char if it's a number marker (non-Japanese, non-space)
            j = i + 1
            # Skip spaces
            while j < len(text) and text[j] in ' \t':
                j += 1
            if j < len(text) and not is_japanese_char(text[j]):
                # Skip the marker (one char)
                i = j
            else:
                i = j - 1 if j > i + 1 else i
        i += 1
    
    text = ''.join(result)
    
    # Also remove any remaining stray markers at start
    while text and not is_japanese_char(text[0]):
        text = text[1:]
    
    # Split by 。and add 【n】 markers
    sentences = [s.strip() for s in text.split('。') if s.strip()]
    numbered = []
    for idx, s in enumerate(sentences):
        # Clean any remaining leading non-Japanese chars
        while s and not is_japanese_char(s[0]):
            s = s[1:]
        if s:
            numbered.append(f'【{idx+1}】{s}。')
    
    return ''.join(numbered)

def extract_questions(raw):
    """Extract questions from the question section text"""
    questions = []
    lines = raw.split('\n')
    
    # Determine question type and extract
    # Patterns:
    # - True/false: "文の内容に合っているものに〇" then numbered items with ()
    # - Rewriting: "下線部を" then numbered items (SKIP)
    # - Multiple choice: numbered question with a/b/c/d options
    
    i = 0
    current_type = None
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        
        # Detect section headers
        if '文の内容に合っている' in line:
            current_type = 'tf'
            i += 1
            continue
        if '下線部を' in line and '書きかえ' in line:
            current_type = 'rewrite'
            i += 1
            continue
        
        # True/false question: starts with number + . + ()
        tf_match = re.match(r'^(\d+)\.\s*[（(]\s*[)）]?\s*(.+)', line)
        if tf_match and current_type == 'tf':
            num = int(tf_match.group(1))
            stem = tf_match.group(2).strip()
            # Continue to next line if stem is cut off
            while i + 1 < len(lines) and lines[i+1].strip() and not re.match(r'^\d+\.', lines[i+1].strip()) and not re.match(r'^[a-d][\s．.]', lines[i+1].strip()):
                stem += lines[i+1].strip()
                i += 1
            questions.append({'type': 'tf', 'num': num, 'stem': stem})
            i += 1
            continue
        
        # Multiple choice question: starts with number + . 
        mc_match = re.match(r'^(\d+)\.\s*(.+)', line)
        if mc_match and not current_type == 'rewrite':
            num = int(mc_match.group(1))
            stem = mc_match.group(2).strip()
            # Check if this could be a rewrite question (has blank ____ or ->)
            if '____' in stem or '＿' in stem or '->' in stem or '→' in stem or '一' in stem[:5]:
                # Likely rewrite, skip
                i += 1
                continue
            
            # Continue stem to next line if needed
            while i + 1 < len(lines) and lines[i+1].strip():
                next_line = lines[i+1].strip()
                if re.match(r'^[a-d][\s．.、]', next_line):
                    break
                stem += next_line
                i += 1
            
            # Extract options a/b/c/d
            options = []
            i += 1
            while i < len(lines) and len(options) < 4:
                opt_line = lines[i].strip()
                opt_match = re.match(r'^([a-d])[\s．.、]\s*(.+)', opt_line)
                if opt_match:
                    opt_text = opt_match.group(2).strip()
                    # Continue option text
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

# Extract all passages
passages = []
passage_id = 1

for u in units:
    unit_text = ''
    for p in pages[u['start_page']-1 : u['end_page']]:
        unit_text += p['text'] + '\n'
    
    # Find all 読んでみよう sections
    # Split by 読んでみよう
    yonde_sections = re.split(r'読んでみよう[コ」]?', unit_text)
    
    # First section is before first 読んでみよう (vocab), skip
    # Each subsequent section is a passage's article + questions
    article_sections = yonde_sections[1:]  # 5 passages per unit
    
    # Find 読んだ後で section(s)
    ato_sections = re.split(r'読んだ後で[ー」]?', unit_text)
    
    for idx, section in enumerate(article_sections):
        num = idx + 1
        
        # Split article from questions
        # Questions start with either "文の内容に合っている" or "下線部を" or a numbered MC question
        q_start = -1
        for pattern in [r'文の内容に合っている', r'下線部を.*書きかえ', r'\n\d+\.\s*[（(]', r'\n6\.\s']:
            m = re.search(pattern, section)
            if m:
                if q_start == -1 or m.start() < q_start:
                    q_start = m.start()
        
        if q_start == -1:
            # Try to find where questions start (look for numbered items)
            for m in re.finditer(r'\n\s*(\d+)\.\s', section):
                if m.start() > 50:  # Not at the very start
                    q_start = m.start()
                    break
        
        if q_start > 0:
            raw_article = section[:q_start]
            raw_questions = section[q_start:]
        else:
            raw_article = section
            raw_questions = ''
        
        article = clean_article(raw_article)
        questions = extract_questions(raw_questions)
        
        passages.append({
            'id': passage_id,
            'num': num,
            'part': '基礎編',
            'unit': u['unit'],
            'unitTitle': u['title'],
            'article': article,
            'raw_questions': raw_questions[:500],
            'questions': questions,
        })
        passage_id += 1

# Save for inspection
with open(r'D:\日语自学网站\scripts\n1_passages_raw.json', 'w', encoding='utf-8') as f:
    json.dump(passages, f, ensure_ascii=False, indent=2)

print(f'Extracted {len(passages)} passages')
for p in passages:
    q_count = len(p['questions'])
    tf_count = sum(1 for q in p['questions'] if q['type'] == 'tf')
    mc_count = sum(1 for q in p['questions'] if q['type'] == 'mc')
    print(f"  U{p['unit']}-{p['num']}: article {len(p['article'])} chars, {q_count} questions ({tf_count} TF, {mc_count} MC)")
