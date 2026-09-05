import json
import re

with open(r'D:\日语自学网站\scripts\n1_full_text.json', 'r', encoding='utf-8') as f:
    pages = json.load(f)

# Check pages in units 2, 3, 4 for missing passages
# Unit 2: 24-38, found at 25, 31, 32, 36
# Unit 3: 39-53, found at 40, 47, 49, 51
# Unit 4: 54-67, found at 55, 60, 61, 63

# Search for article-like text (Japanese paragraphs with sentence markers)
for page_num in [26, 27, 28, 29, 30, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 48, 50, 52, 53, 56, 57, 58, 59, 62, 64, 65, 66, 67]:
    p = pages[page_num - 1]
    t = p['text']
    # Look for question patterns or article patterns
    if '文の内容に合っている' in t or '下線部を' in t or '筆者' in t[:200]:
        print(f"\n=== Page {page_num} (question/article found) ===")
        print(t[:600].replace('\n', ' | '))
    # Also look for 読む前に which precedes each passage
    if '読む前に' in t or '遨む前に' in t or '還む前に' in t or '遴む前に' in t:
        print(f"\n=== Page {page_num} (読む前に found) ===")
        # Show what's after 読む前に
        for pattern in ['読む前に', '遨む前に', '還む前に', '遴む前に']:
            idx = t.find(pattern)
            if idx >= 0:
                print(f"  Pattern '{pattern}' at pos {idx}")
                print(t[idx:idx+300].replace('\n', ' | '))
                break
