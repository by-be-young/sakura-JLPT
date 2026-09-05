import json

with open(r'D:\日语自学网站\scripts\n1_full_text.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Check all pages 10-38 for answer sections
for i in range(9, 38):
    page = data[i]
    text = page.get('text', '')
    if '読んだ後で' in text or ('読み物' in text and '答' in text):
        print(f"\nPAGE {i+1}: contains answer section")
        # Find the answer part
        idx = text.find('読んだ後で')
        if idx < 0:
            idx = text.find('答')
        print(text[max(0,idx-50):idx+1500])
        print("...")
