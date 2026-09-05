import json, re

with open(r'D:\日语自学网站\scripts\n1_full_text.json', 'r', encoding='utf-8') as f:
    pdf = json.load(f)

with open(r'D:\日语自学网站\src\data\reading-n1.js', 'r', encoding='utf-8') as f:
    content = f.read()
start = content.index('[')
end = content.rindex(']')
arr_str = re.sub(r',\s*\]', ']', content[start:end+1])
data = json.loads(arr_str)

# Check specific articles' questions against PDF
# id=1: pages 10-12, questions on page 11-12
# id=7: pages 31-32, questions on page 32
# id=16: pages 54-57, questions on page 56-57
# id=23: pages 73-75, questions on page 74-75

check_ids = [1, 7, 16, 23]
page_ranges = {
    1: (10, 13),
    7: (31, 33),
    16: (55, 58),
    23: (73, 76),
}

for aid in check_ids:
    d = next(x for x in data if x['id'] == aid)
    p_start, p_end = page_ranges[aid]
    
    print(f"\n{'='*70}")
    print(f"ID={aid} (読み物{aid}) - {len(d['questions'])} questions")
    print(f"{'='*70}")
    
    # Print data questions
    for i, q in enumerate(d['questions']):
        print(f"\n  [Data Q{i+1}] {q['stem'][:100]}")
        for j, opt in enumerate(q['options']):
            marker = " <-- ANSWER" if j == q['answer'] else ""
            print(f"    {j}: {opt[:80]}{marker}")
    
    # Print PDF question section
    pdf_text = ''
    for i in range(p_start-1, p_end):
        if i < len(pdf):
            pdf_text += pdf[i].get('text', '') + '\n'
    
    # Find question section
    idx = pdf_text.find('文の内容に合っている')
    if idx < 0:
        idx = pdf_text.find('この文章')
    if idx < 0:
        idx = pdf_text.find('1.')
    
    if idx >= 0:
        print(f"\n  --- PDF question section ---")
        print(pdf_text[idx:idx+1500])
