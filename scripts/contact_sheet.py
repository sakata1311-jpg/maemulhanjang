# -*- coding: utf-8 -*-
"""Build a contact sheet of sample photos for visual QA."""
import pathlib
from PIL import Image, ImageDraw, ImageFont

BASE = pathlib.Path(__file__).resolve().parent.parent
SAMPLES = BASE / "assets" / "img" / "samples"
files = sorted(SAMPLES.glob("*.jpg"))
W, H = 360, 270
cols = 3
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * W, rows * (H + 30)), "white")
d = ImageDraw.Draw(sheet)
font = ImageFont.truetype(r"C:\Windows\Fonts\malgun.ttf", 16)
for i, f in enumerate(files):
    im = Image.open(f).convert("RGB")
    im.thumbnail((W, H))
    x = (i % cols) * W
    y = (i // cols) * (H + 30)
    sheet.paste(im, (x + (W - im.width) // 2, y))
    d.text((x + 8, y + H + 5), f.name, font=font, fill="black")
sheet.save(BASE / "_prototype" / "contact-sheet.jpg", quality=85)
print("saved", BASE / "_prototype" / "contact-sheet.jpg")
