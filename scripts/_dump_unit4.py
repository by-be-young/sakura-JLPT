import json

with open(r'D:\日语自学网站\scripts\n1_full_text.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for i in range(53, 67):
    page = data[i]
    print(f"\n{'='*60}")
    print(f"PAGE {i+1}")
    print(f"{'='*60}")
    print(page.get('text', '')[:3000])
