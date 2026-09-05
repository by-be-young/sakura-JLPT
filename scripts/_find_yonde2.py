import json
import re

with open(r'D:\日语自学网站\scripts\n1_full_text.json', 'r', encoding='utf-8') as f:
    pages = json.load(f)

# Search for でみよう which should be more stable
count = 0
for p in pages[9:128]:
    t = p['text']
    for m in re.finditer(r'でみよう', t):
        start = max(0, m.start()-8)
        end = min(len(t), m.end()+3)
        context = t[start:end].replace('\n', '|')
        print(f"Page {p['page']}: ...{context}...")
        count += 1
print(f'\nTotal: {count}')
