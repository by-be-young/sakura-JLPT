import json

with open(r'D:\日语自学网站\scripts\n1_full_text.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Check pages 15-19 for 読み物1 answers, page 27-28 for 読み物6
for i in list(range(14, 20)) + list(range(26, 30)):
    page = data[i]
    text = page.get('text', '')
    if '答' in text or '読み物1' in text or '読み物6' in text:
        print(f"\n{'='*60}")
        print(f"PAGE {i+1}")
        print(f"{'='*60}")
        print(text[:2000])
