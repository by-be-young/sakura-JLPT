import json
with open(r'D:\日语自学网站\scripts\n1_full_text.json', 'r', encoding='utf-8') as f:
    pages = json.load(f)
for p in pages[23:38]:
    print(f'\n{"="*50}\nPAGE {p["page"]}\n{"="*50}')
    print(p['text'])
