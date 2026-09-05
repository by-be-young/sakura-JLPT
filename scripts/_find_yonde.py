import json
import re

with open(r'D:\日语自学网站\scripts\n1_full_text.json', 'r', encoding='utf-8') as f:
    pages = json.load(f)

# Find all occurrences of んでみよう across all pages
for p in pages[9:128]:
    t = p['text']
    for m in re.finditer(r'.んでみよう.', t):
        start = max(0, m.start()-5)
        end = min(len(t), m.end()+5)
        context = t[start:end].replace('\n', '|')
        print(f"Page {p['page']}: ...{context}...")
