import pymupdf

PDF = r'C:\Users\34166\Desktop\橙宝书 新日本语能力考试\橙宝书新日本语能力考试N2读解 (徐小明).pdf'
with pymupdf.open(PDF) as doc:
    # Find pages with text
    text_pages = []
    for i in range(doc.page_count):
        t = doc[i].get_text('text', sort=True)
        if len(t) > 50:
            text_pages.append((i+1, len(t)))
    print('Pages with text (>50 chars):', len(text_pages))
    print('First 20:', text_pages[:20])
    # Check for Unit markers
    for i in range(doc.page_count):
        t = doc[i].get_text('text', sort=True)
        if 'Unit' in t and ('人生' in t or '会社' in t or '文化' in t or '社会' in t or '科学' in t or '環境' in t or '教育' in t or '心理' in t):
            print(f'Unit marker at page {i+1}:', t[:200].replace('\n', ' | '))
