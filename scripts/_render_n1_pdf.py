import pymupdf
import os

PDF = r'C:\Users\34166\Desktop\橙宝书 新日本语能力考试\橙宝书·新日本语能力考试N1读解【数字版】 (许小明).pdf'
OUT = r'D:\日语自学网站\scripts\pdf_pages_n1'
os.makedirs(OUT, exist_ok=True)

matrix = pymupdf.Matrix(2.0, 2.0)
with pymupdf.open(PDF) as doc:
    for i in range(doc.page_count):
        page = doc[i]
        pix = page.get_pixmap(matrix=matrix, alpha=False)
        pix.save(os.path.join(OUT, f"p{i+1:03d}.png"))
print("done", doc.page_count)
