import json

with open(r'D:\日语自学网站\scripts\n1_full_text.json', 'r', encoding='utf-8') as f:
    pages = json.load(f)

# Check pages 33, 46, 47, 64, 65 in detail
for pn in [33, 34, 46, 47, 64, 65]:
    p = pages[pn - 1]
    print(f'\n{"="*60}')
    print(f'PAGE {pn} ({len(p["text"])} chars)')
    print(f'{"="*60}')
    print(p['text'][:1500])
