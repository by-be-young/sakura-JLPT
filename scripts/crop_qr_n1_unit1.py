# -*- coding: utf-8 -*-
# 提取 N1 Unit1 二维码（词汇页9/问题页11/知识页13），按角点紧密裁剪+解码验证
# 注意：检测与裁剪必须在同一坐标系（region_img）内进行
import fitz, numpy as np, cv2, os
from PIL import Image

pdf = fitz.open(r'C:\Users\34166\Desktop\绿宝书 新日本语能力考试 听力\绿宝书 新日本语能力考试 n1 听解(详解+练习) (许小明).pdf')
outdir = r'D:\日语自学网站\src\assets\listening-n1'

def crop_qr_from(img):
    """在给定图上检测 QR 并按角点裁剪（pts shape (1,4,2)，pts[0] 每行 [x,y]）"""
    d, pts, _ = cv2.QRCodeDetector().detectAndDecode(img)
    if pts is None:
        return None, None
    p = pts[0]
    xs, ys = p[:, 0], p[:, 1]
    x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())
    pad = int((x1 - x0) * 0.22)
    cx0, cy0 = max(0, x0 - pad), max(0, y0 - pad)
    cx1 = min(img.shape[1], x1 + pad)
    cy1 = min(img.shape[0], y1 + pad)
    return img[cy0:cy1, cx0:cx1], d

os.makedirs(outdir, exist_ok=True)
for pno, name in [(9, 'qr_p9.png'), (11, 'qr_p11.png'), (13, 'qr_p13.png')]:
    pix = pdf[pno].get_pixmap(matrix=fitz.Matrix(6, 6))
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)[:, :, :3]
    h, w = img.shape[:2]
    region = img[int(h*0.02):int(h*0.32), int(w*0.5):int(w*1.0)]
    crop, d = crop_qr_from(region)
    if crop is None:
        print(name, 'NO QR DETECTED'); continue
    ch, cw = crop.shape[:2]
    s = max(ch, cw)
    sq = np.full((s, s, 3), 255, np.uint8)
    sq[(s - ch) // 2:(s - ch) // 2 + ch, (s - cw) // 2:(s - cw) // 2 + cw] = crop
    path = outdir + '\\' + name
    Image.fromarray(cv2.cvtColor(sq, cv2.COLOR_BGR2RGB)).save(path)
    chk = np.array(Image.open(path).convert('RGB'))[:, :, ::-1]
    d2, _, _ = cv2.QRCodeDetector().detectAndDecode(chk)
    if not d2:
        big = cv2.resize(chk, None, fx=3, fy=3, interpolation=cv2.INTER_LANCZOS4)
        d2, _, _ = cv2.QRCodeDetector().detectAndDecode(big)
    print(name, 'saved', sq.shape[1], 'x', sq.shape[0], '|', repr(d2))
