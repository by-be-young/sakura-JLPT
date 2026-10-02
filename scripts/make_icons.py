# -*- coding: utf-8 -*-
"""生成樱花日语应用图标（PWA / Electron / Android 共用）。
输出到 public/icons/ 与 build/ 目录。
"""
import math
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICON_DIR = os.path.join(ROOT, "public", "icons")
BUILD_DIR = os.path.join(ROOT, "build")
os.makedirs(ICON_DIR, exist_ok=True)
os.makedirs(BUILD_DIR, exist_ok=True)

SIZE = 1024


def radial_gradient(size, top, bottom):
    """垂直径向渐变：顶部 top 色，底部 bottom 色（带一点高光偏移）。"""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cx = size / 2
    cy = size / 2
    r = size / 2
    for y in range(size):
        for x in range(size):
            dx = (x - cx) / r
            dy = (y - cy) / r
            d = math.sqrt(dx * dx + dy * dy)
            if d <= 1.0:
                t = (y / size) ** 1.2  # 纵向渐变
                # 轻微径向变暗（边缘稍深）
                edge = max(0.0, d) * 0.25
                r_ = int(top[0] + (bottom[0] - top[0]) * t - edge * 40)
                g_ = int(top[1] + (bottom[1] - top[1]) * t - edge * 40)
                b_ = int(top[2] + (bottom[2] - top[2]) * t - edge * 40)
                img.putpixel((x, y), (max(0, r_), max(0, g_), max(0, b_), 255))
    return img


def make_petal(size, color):
    """单瓣樱花花瓣（叶形）：底部尖、两侧圆润。"""
    petal = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(petal)
    w = size
    # 花瓣路径：底部尖点 (w/2, h)，两侧最宽处约 0.72h，顶端圆头
    h = size
    cx = w / 2
    tip_bottom = h * 0.98
    top_y = h * 0.06
    half_w = w * 0.42
    # 用多个点近似叶形曲线
    pts = [(cx, tip_bottom)]
    steps = 40
    for i in range(steps + 1):
        t = i / steps  # 0=底 1=顶
        y = tip_bottom - (tip_bottom - top_y) * t
        # 宽度曲线：先张开后收拢
        bulge = math.sin(t * math.pi) ** 0.8
        xw = half_w * bulge * (1 - t * 0.25)
        pts.append((cx - xw, y))
        # 只记录左侧，右侧镜像
    for i in range(steps, -1, -1):
        t = i / steps
        y = tip_bottom - (tip_bottom - top_y) * t
        bulge = math.sin(t * math.pi) ** 0.8
        xw = half_w * bulge * (1 - t * 0.25)
        pts.append((cx + xw, y))
    d.polygon(pts, fill=color)
    # 顶部中央加一道浅色高光
    hl = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    dh = ImageDraw.Draw(hl)
    hw = w * 0.16
    hpts = [(cx, tip_bottom * 0.9)]
    for i in range(steps + 1):
        t = i / steps
        y = tip_bottom * 0.9 - (tip_bottom * 0.9 - top_y) * t
        bulge = math.sin(t * math.pi) ** 1.4
        xw = hw * bulge
        hpts.append((cx - xw, y))
    for i in range(steps, -1, -1):
        t = i / steps
        y = tip_bottom * 0.9 - (tip_bottom * 0.9 - top_y) * t
        bulge = math.sin(t * math.pi) ** 1.4
        xw = hw * bulge
        hpts.append((cx + xw, y))
    dh.polygon(hpts, fill=(255, 255, 255, 90))
    petal = Image.alpha_composite(petal, hl)
    return petal


def draw_sakura(d, cx, cy, r):
    """在画布上画一朵五瓣樱花。"""
    # 花瓣
    petal_layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    petal_size = int(r * 1.6)
    petal = make_petal(petal_size, (255, 255, 255, 255))
    center_dist = r * 0.52
    for i in range(5):
        ang = i * 72 - 90
        rad = math.radians(ang)
        px = cx + math.cos(rad) * center_dist
        py = cy + math.sin(rad) * center_dist
        rotated = petal.rotate(-ang, resample=Image.BICUBIC, expand=True)
        petal_layer.alpha_composite(rotated, (int(px - rotated.width / 2), int(py - rotated.height / 2)))
    # 中心花蕊：三个小粉点
    d_center = ImageDraw.Draw(petal_layer)
    for i in range(3):
        a = math.radians(i * 120 - 90)
        r_ = r * 0.10
        dot = (cx + math.cos(a) * r * 0.14, cy + math.sin(a) * r * 0.14)
        d_center.ellipse([dot[0] - r_, dot[1] - r_, dot[0] + r_, dot[1] + r_], fill=(255, 143, 191, 255))
    return petal_layer


def build_icon(size, out_path):
    base = radial_gradient(size, (255, 231, 242), (255, 122, 178))
    d = ImageDraw.Draw(base)
    # 底部柔和高光弧
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    dg = ImageDraw.Draw(glow)
    dg.ellipse([size * 0.18, size * 0.16, size * 0.82, size * 0.80],
               fill=(255, 255, 255, 70))
    glow = glow.filter(__import__("PIL.ImageFilter", fromlist=["ImageFilter"]).GaussianBlur(size * 0.05))
    base = Image.alpha_composite(base, glow)
    # 樱花
    s = build_icon_sakura(size)
    base = Image.alpha_composite(base, s)
    # 圆形裁剪（保持方形，透明角）
    mask = Image.new("L", (size, size), 0)
    dm = ImageDraw.Draw(mask)
    dm.ellipse([0, 0, size, size], fill=255)
    base.putalpha(mask)
    base.save(out_path)


def build_icon_sakura(size):
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx = cy = size / 2
    r = size * 0.30
    # 花瓣层
    petal_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    petal_size = int(r * 1.7)
    petal = make_petal(petal_size, (255, 255, 255, 255))
    center_dist = r * 0.55
    for i in range(5):
        ang = i * 72 - 90
        rad = math.radians(ang)
        px = cx + math.cos(rad) * center_dist
        py = cy + math.sin(rad) * center_dist
        rotated = petal.rotate(-ang, resample=Image.BICUBIC, expand=True)
        petal_layer.alpha_composite(rotated, (int(px - rotated.width / 2), int(py - rotated.height / 2)))
    layer = Image.alpha_composite(layer, petal_layer)
    d2 = ImageDraw.Draw(layer)
    # 花蕊
    for i in range(3):
        a = math.radians(i * 120 - 90)
        rr = r * 0.10
        dot = (cx + math.cos(a) * r * 0.13, cy + math.sin(a) * r * 0.13)
        d2.ellipse([dot[0] - rr, dot[1] - rr, dot[0] + rr, dot[1] + rr], fill=(255, 143, 191, 255))
    return layer


def main():
    sizes = [512, 192, 180, 256, 128, 48]
    for s in sizes:
        out = os.path.join(ICON_DIR, f"icon-{s}.png")
        build_icon(s, out)
        print("generated", out)

    # Windows ICO（Electron）
    ico_path = os.path.join(BUILD_DIR, "icon.ico")
    ico_src = os.path.join(ICON_DIR, "icon-256.png")
    img = Image.open(ico_src)
    img.save(ico_path, format="ICO", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print("generated", ico_path)

    # Android 圆形启动图标（ic_launcher 家族，Capacitor 会再生成，这里给一个 1024 源图）
    build_icon(1024, os.path.join(BUILD_DIR, "icon-1024.png"))
    print("generated build/icon-1024.png")


if __name__ == "__main__":
    main()
