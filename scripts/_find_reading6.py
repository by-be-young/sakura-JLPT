import json

with open(r'D:\日语自学网站\scripts\n1_full_text.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Search pages 28-37 for 読み物6 answers
for i in range(27, 38):
    page = data[i]
    text = page.get('text', '')
    if '読み物6' in text:
        print(f"\n{'='*60}")
        print(f"PAGE {i+1}")
        print(f"{'='*60}")
        idx = text.find('読み物6')
        print(text[max(0,idx-100):idx+1500])
