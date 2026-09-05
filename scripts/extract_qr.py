# 精确提取听解 PDF 各页二维码：仅保留尺寸合理的检测结果，误检过滤
import pymupdf, cv2, numpy as np, os

PDF = r'C:\Users\34166\Desktop\绿宝书 新日本语能力考试 听力\绿宝书 新日本语能力考试 n2 听解(详解+练习) (许小明).pdf'
OUT = r'D:\日语自学网站\src\assets\listening'
os.makedirs(OUT, exist_ok=True)

detector = cv2.QRCodeDetector()

def try_detect(img_rgb):
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    best = None
    for th in [None, 41, 25, 61]:
        src = gray
        if th:
            src = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, th, 12)
        try:
            data, points, _ = detector.detectAndDecode(src)
        except Exception:
            points = None
        if points is not None and len(points) > 0:
            best = (data, points)
            break
    return best

results = {}
with pymupdf.open(PDF) as doc:
    for pno in range(8, 104):
        page = doc[pno]
        mat = pymupdf.Matrix(4, 4)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
        if pix.n >= 3:
            img = img[:, :, :3]
        best = try_detect(img)
        if not best:
            results[pno + 1] = None
            continue
        data, points = best
        pts = points[0].astype(int)
        x0, y0 = int(pts[:, 0].min()), int(pts[:, 1].min())
        x1, y1 = int(pts[:, 0].max()), int(pts[:, 1].max())
        w, h = x1 - x0, y1 - y0
        # 误检过滤：二维码应接近方形，尺寸合理
        if w <= 0 or h <= 0 or max(w, h) / min(w, h) > 1.4 or max(w, h) > 520 or min(w, h) < 60:
            results[pno + 1] = None
            continue
        pad = int(max(w, h) * 0.08)
        x0 = max(0, x0 - pad); y0 = max(0, y0 - pad)
        x1 = min(pix.width, x1 + pad); y1 = min(pix.height, y1 + pad)
        crop = img[y0:y1, x0:x1]
        results[pno + 1] = (crop, bool(data))

ok_pages = sorted([p for p, v in results.items() if v])
for p in ok_pages:
    crop, dec = results[p]
    fn = os.path.join(OUT, f'qr_p{p:03d}.png')
    cv2.imwrite(fn, cv2.cvtColor(crop, cv2.COLOR_RGB2BGR))
print('含二维码页数:', len(ok_pages))
print('页码:', ok_pages)
# 移除无二维码页的旧文件
for f in os.listdir(OUT):
    if f.startswith('qr_p') and f.endswith('.png'):
        pno = int(f[5:8])
        if pno not in results or results[pno] is None:
            os.remove(os.path.join(OUT, f))
print('清理完成')
