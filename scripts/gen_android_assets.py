# -*- coding: utf-8 -*-
"""生成 Android 工程所需图标：mipmap 启动图标 + 自适应前景 + 启动屏 splash。"""
import os
import sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANDROID_RES = os.path.join(ROOT, "android", "app", "src", "main", "res")
ICON_SRC = os.path.join(ROOT, "build", "icon-1024.png")

# mipmap 尺寸规范
MIPMAPS = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192,
}

# splash 尺寸（宽x高）
SPLASHES = {
    "drawable-land-hdpi": (800, 480),
    "drawable-land-mdpi": (480, 320),
    "drawable-land-xhdpi": (1280, 720),
    "drawable-land-xxhdpi": (1600, 960),
    "drawable-land-xxxhdpi": (1920, 1280),
    "drawable-port-hdpi": (480, 800),
    "drawable-port-mdpi": (320, 480),
    "drawable-port-xhdpi": (720, 1280),
    "drawable-port-xxhdpi": (960, 1600),
    "drawable-port-xxxhdpi": (1280, 1920),
}


def write_mipmaps():
    icon = Image.open(ICON_SRC).convert("RGBA")
    for dpi, size in MIPMAPS.items():
        d = os.path.join(ANDROID_RES, f"mipmap-{dpi}")
        os.makedirs(d, exist_ok=True)
        img = icon.resize((size, size), Image.LANCZOS)
        img.save(os.path.join(d, "ic_launcher.png"))
        img.save(os.path.join(d, "ic_launcher_round.png"))
        # 自适应前景：内容放大到安全区（1024 源图内容约在 60% 内，直接全图）
        fg = icon.resize((int(size * 1.4), int(size * 1.4)), Image.LANCZOS)
        # 透明底画布
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        off = (size - fg.width) // 2
        canvas.alpha_composite(fg, (off, off))
        canvas.save(os.path.join(d, "ic_launcher_foreground.png"))
        print("mipmap", dpi, "ok")


def write_splashes():
    icon = Image.open(ICON_SRC).convert("RGBA")
    for folder, (w, h) in SPLASHES.items():
        d = os.path.join(ANDROID_RES, folder)
        os.makedirs(d, exist_ok=True)
        bg = Image.new("RGBA", (w, h), (255, 245, 248, 255))
        # 中央图标（占短边 40%）
        side = int(min(w, h) * 0.4)
        logo = icon.resize((side, side), Image.LANCZOS)
        bg.alpha_composite(logo, ((w - side) // 2, (h - side) // 2))
        bg.convert("RGB").save(os.path.join(d, "splash.png"))
        print("splash", folder, "ok")


def main():
    write_mipmaps()
    write_splashes()
    print("done")


if __name__ == "__main__":
    sys.exit(main())
