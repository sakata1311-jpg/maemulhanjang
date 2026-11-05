# -*- coding: utf-8 -*-
"""Make a contact sheet of the six template covers for visual QA."""
import pathlib
from PIL import Image, ImageDraw, ImageFont

BASE = pathlib.Path(__file__).resolve().parent.parent
SRC = BASE / "assets" / "img" / "templates"
OUT = BASE / "_prototype" / "template-sheet.jpg"
names = ["city", "sunset", "forest", "mono", "sky", "cream"]
W, H = 300, 375
sheet = Image.new("RGB", (W * 3, (H + 34) * 2), "#f7f2e8")
d = ImageDraw.Draw(sheet)
font = ImageFont.truetype(r"C:\Windows\Fonts\malgunbd.ttf", 15)
for i, name in enumerate(names):
    im = Image.open(SRC / f"{name}.png").convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    x = (i % 3) * W
    y = (i // 3) * (H + 34)
    sheet.paste(im, (x, y))
    d.text((x + 10, y + H + 8), name, font=font, fill="#0e1a2b")
sheet.save(OUT, quality=88)
print("saved", OUT)
