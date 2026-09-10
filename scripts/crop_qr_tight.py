# -*- coding: utf-8 -*-
# 按 QR 角点精确裁剪（pts shape (1,4,2)：pts[0] 为 4 角点，每行 [x, y]）
import fitz, numpy as np, cv2
from PIL import Image

pdf = fitz.open(r'C:\Users\34166\Desktop\绿宝书 新日本语能力考试 听力\绿宝书 新日本语能力考试 n2 听解(详解+练习) (许小明).pdf')
outdir = r'D:\日语自学网站\src\assets\listening'

for pno, name in [(266, 'qr_p267.png'), (272, 'qr_p273.png')]:
    pix = pdf[pno].get_pixmap(matrix=fitz.Matrix(4, 4))
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)[:, :, :3]
    d, pts, _ = cv2.QRCodeDetector().detectAndDecode(img)
    p = pts[0]
    xs, ys = p[:, 0], p[:, 1]
    x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())
    pad = int((x1 - x0) * 0.22)
    cx0, cy0 = max(0, x0 - pad), max(0, y0 - pad)
    cx1 = min(img.shape[1], x1 + pad)
    cy1 = min(img.shape[0], y1 + pad)
    crop = img[cy0:cy1, cx0:cx1]
    # 裁成正方形
    h, w = crop.shape[:2]
    s = max(h, w)
    sq = np.full((s, s, 3), 255, np.uint8)
    sq[(s - h) // 2:(s - h) // 2 + h, (s - w) // 2:(s - w) // 2 + w] = crop
    path = outdir + '\\' + name
    Image.fromarray(cv2.cvtColor(sq, cv2.COLOR_BGR2RGB)).save(path)
    # 解码验证
    chk = np.array(Image.open(path).convert('RGB'))[:, :, ::-1]
    d2, _, _ = cv2.QRCodeDetector().detectAndDecode(chk)
    if not d2:
        big = cv2.resize(chk, None, fx=3, fy=3, interpolation=cv2.INTER_LANCZOS4)
        d2, _, _ = cv2.QRCodeDetector().detectAndDecode(big)
    print(name, 'QR区域:', x1 - x0, 'x', y1 - y0, '| 保存:', sq.shape[1], 'x', sq.shape[0], '| 解码:', repr(d2))
