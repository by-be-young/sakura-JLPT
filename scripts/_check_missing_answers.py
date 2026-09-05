import json

with open(r'D:\日语自学网站\scripts\n1_full_text.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Check pages 20-21 for 読み物1 answers, and page 36 for 読み物6
for i in [19, 20, 35]:
    page = data[i]
    text = page.get('text', '')
    print(f"\n{'='*60}")
    print(f"PAGE {i+1}")
    print(f"{'='*60}")
    print(text[:2500])
