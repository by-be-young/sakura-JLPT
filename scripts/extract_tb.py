
import zipfile, re, sys
z = zipfile.ZipFile(sys.argv[1])
xml = z.read('word/document.xml').decode('utf-8')
# 提取所有textbox内容
textboxes = re.findall(r'<w:txbxContent>(.*?)</w:txbxContent>', xml, re.DOTALL)
for i, tb in enumerate(textboxes):
    # 提取所有文本
    texts = re.findall(r'<w:t[^>]*>(.*?)</w:t>', tb, re.DOTALL)
    full = ''.join(texts).strip()
    if full:
        print(f'TB{i}: {full}')
