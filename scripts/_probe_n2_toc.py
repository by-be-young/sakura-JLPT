import pymupdf

PDF = r'C:\Users\34166\Desktop\橙宝书 新日本语能力考试\橙宝书新日本语能力考试N2读解 (徐小明).pdf'
with pymupdf.open(PDF) as doc:
    print('N2 pages:', doc.page_count)
    # Find TOC pages
    for i in range(min(12, doc.page_count)):
        page = doc[i]
        t = page.get_text('text', sort=True)
        if '目次' in t or 'Unit' in t or '読み物' in t:
            print(f'=== page {i+1} ===')
            print(t[:1500].replace('\n', ' | '))
            print()
