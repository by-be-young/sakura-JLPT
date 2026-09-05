import pymupdf

PDF = r'C:\Users\34166\Desktop\橙宝书 新日本语能力考试\橙宝书新日本语能力考试N2读解 (徐小明).pdf'
with pymupdf.open(PDF) as doc:
    for i in range(4, 12):
        page = doc[i]
        t = page.get_text('text', sort=True)
        print(f'=== page {i+1}: {len(t)} chars ===')
        print(t[:1200].replace('\n', ' | '))
        print()
