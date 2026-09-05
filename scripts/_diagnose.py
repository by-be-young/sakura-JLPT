import json
import re

with open(r'D:\日语自学网站\scripts\n1_full_text.json', 'r', encoding='utf-8') as f:
    pages = json.load(f)

# Check Unit 2 (pages 24-38) for 読む前に forms
print("=== Unit 2 読む前に occurrences ===")
for p in pages[23:38]:
    t = p['text']
    for m in re.finditer(r'.{0,5}む前に.{0,5}', t):
        print(f"  Page {p['page']}: '{m.group()}'")

# Check a passage with missing Q6 - look at raw question text
print("\n=== U1-1 raw questions (page 11) ===")
t = pages[10]['text']
idx = t.find('文の内容に合っている')
if idx >= 0:
    print(t[idx:idx+800])
