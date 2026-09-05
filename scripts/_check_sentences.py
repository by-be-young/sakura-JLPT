import json, re

with open(r'D:\日语自学网站\scripts\n1_full_text.json', 'r', encoding='utf-8') as f:
    pdf = json.load(f)

with open(r'D:\日语自学网站\src\data\reading-n1.js', 'r', encoding='utf-8') as f:
    content = f.read()
start = content.index('[')
end = content.rindex(']')
arr_str = re.sub(r',\s*\]', ']', content[start:end+1])
data = json.loads(arr_str)

# For each article, count sentence markers 【n】 in data
# and compare with sentence numbers in PDF article pages
# Article page ranges (approximate, from earlier analysis):
article_pages = {
    1: (10, 12),   # 読み物1
    2: (14, 16),   # 読み物2
    3: (17, 18),   # 読み物3
    4: (18, 20),   # 読み物4
    5: (20, 22),   # 読み物5
    6: (24, 26),   # 読み物6
    7: (31, 32),   # 読み物7
    8: (32, 33),   # 読み物8
    9: (33, 35),   # 読み物9
    10: (35, 37),  # 読み物10
    11: (39, 42),  # 読み物11
    12: (44, 47),  # 読み物12 (vertical text, garbled)
    13: (47, 49),  # 読み物13
    14: (49, 51),  # 読み物14
    15: (51, 54),  # 読み物15
    16: (54, 57),  # 読み物16
    17: (57, 59),  # 読み物17
    18: (59, 61),  # 読み物18
    19: (61, 64),  # 読み物19
    20: (64, 67),  # 読み物20
    21: (68, 71),  # 読み物21
    22: (71, 73),  # 読み物22
    23: (73, 75),  # 読み物23
    24: (75, 78),  # 読み物24
    25: (78, 81),  # 読み物25
}

print("Sentence count comparison (data vs PDF):")
print(f"{'ID':>3} {'Data':>5} {'PDF':>5} {'Match':>6}")
print("-" * 25)

for d in data:
    aid = d['id']
    data_count = d['article'].count('【')
    
    # Count sentence markers in PDF pages
    p_start, p_end = article_pages.get(aid, (0, 0))
    pdf_text = ''
    for i in range(p_start-1, p_end):
        if i < len(pdf):
            pdf_text += pdf[i].get('text', '')
    
    # PDF uses various markers: I, ', ・, !, ?, etc. (garbled sentence numbers)
    # Count lines that look like sentence starts
    # Actually, let's count the numbered sentence markers pattern
    # In clean pages, sentences are marked with numbers like 1, 2, 3...
    # But the extraction garbles them. Let's use a different approach.
    
    # For clean pages, count occurrences of patterns that look like sentence markers
    # The original PDF uses circled numbers or specific markers
    # Let's just count sentences by looking for the pattern
    
    # Actually, the best approach is to compare with what we know from extraction
    # Let's just report data counts and flag any that seem unusual
    
    print(f"{aid:>3} {data_count:>5} {'?':>5}")

print("\n\nDetailed article previews (first 100 chars of each):")
for d in data:
    print(f"\nid={d['id']}: {d['article'][:120]}...")
