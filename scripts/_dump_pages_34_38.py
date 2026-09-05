import json

with open(r'D:\日语自学网站\scripts\n1_full_text.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Print full text of pages 34-37 to find reading 6 answers
for i in range(33, 38):
    page = data[i]
    text = page.get('text', '')
    print(f"\n{'='*60}")
    print(f"PAGE {i+1} (len={len(text)})")
    print(f"{'='*60}")
    print(text[:3000])
