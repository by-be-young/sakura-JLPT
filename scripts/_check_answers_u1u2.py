import json

with open(r'D:\日语自学网站\scripts\n1_full_text.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Unit 1 answers likely around pages 20-23
# Unit 2 answers likely around pages 35-38
for i in list(range(19, 24)) + list(range(34, 39)):
    page = data[i]
    text = page.get('text', '')
    if '答' in text or '答案' in text or '読んだ後で' in text:
        print(f"\n{'='*60}")
        print(f"PAGE {i+1}")
        print(f"{'='*60}")
        print(text[:2500])
