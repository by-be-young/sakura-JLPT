import json

with open(r'D:\日语自学网站\scripts\n1_full_text.json', 'r', encoding='utf-8') as f:
    pages = json.load(f)

# Print pages 10-23 (Unit 1) full text
for p in pages[9:23]:
    print(f'\n{"="*60}')
    print(f'PAGE {p["page"]}')
    print(f'{"="*60}')
    print(p['text'])
