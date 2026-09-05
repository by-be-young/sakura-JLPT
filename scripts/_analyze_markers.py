import json
import re
from collections import Counter

with open(r'D:\日语自学网站\scripts\n1_full_text.json', 'r', encoding='utf-8') as f:
    pages = json.load(f)

# Find all 読んでみよう sections in 基礎編 (pages 10-128, index 9-127)
# Analyze characters that appear right after 。
marker_chars = Counter()
for p in pages[9:128]:
    t = p['text']
    # Find characters after 。
    for m in re.finditer(r'。(.)', t):
        ch = m.group(1)
        if ch not in '\n\r\t ' and not re.match(r'[぀-ヿ一-龠「」『』（）、]', ch):
            marker_chars[ch] += 1

print("Characters after 。(non-Japanese):")
for ch, cnt in marker_chars.most_common(30):
    print(f"  U+{ord(ch):04X} '{ch}' : {cnt}")

# Also check start of article (after 読んでみよう)
print("\n--- First chars after 読んでみよう ---")
for p in pages[9:128]:
    t = p['text']
    idx = t.find('読んでみよう')
    if idx >= 0:
        rest = t[idx+6:idx+20].replace('\n','').replace(' ','')
        if rest:
            print(f"  Page {p['page']}: '{rest[:10]}' first char U+{ord(rest[0]):04X}")
