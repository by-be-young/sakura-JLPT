import pymupdf
import json

PDF = r'C:\Users\34166\Desktop\橙宝书 新日本语能力考试\橙宝书·新日本语能力考试N1读解【数字版】 (许小明).pdf'
OUT = r'D:\日语自学网站\scripts\n1_full_text.json'

pages = []
with pymupdf.open(PDF) as doc:
    for i in range(doc.page_count):
        page = doc[i]
        t = page.get_text('text', sort=True)
        pages.append({'page': i+1, 'text': t})

with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(pages, f, ensure_ascii=False, indent=1)

print(f'Extracted {len(pages)} pages to {OUT}')
# Show pages with Unit markers
for p in pages:
    t = p['text']
    if 'Unit' in t and any(k in t for k in ['人生', '会社', '文化', '社会', '科学', '環境', '教育', '心理', '医療', '国際', '情報', '自然', '芸術', '歴史', '経済', '政治', '技術', 'コミュニケーション']):
        # Print first line with Unit
        for line in t.split('\n'):
            if 'Unit' in line:
                print(f"Page {p['page']}: {line.strip()[:80]}")
                break
