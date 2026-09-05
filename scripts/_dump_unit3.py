import json

with open(r'D:\日语自学网站\scripts\n1_full_text.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Pages 39-53 (0-indexed: 38-52)
for i in range(38, 53):
    page = data[i]
    print(f"\n{'='*60}")
    print(f"PAGE {i+1}")
    print(f"{'='*60}")
    print(page.get('text', '')[:3000])
