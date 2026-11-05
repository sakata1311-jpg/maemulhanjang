# -*- coding: utf-8 -*-
"""Create optimized 3:2 WebP images for blog cards and post covers."""
import pathlib
from PIL import Image

BASE = pathlib.Path(__file__).resolve().parent.parent
SRC = BASE / "assets" / "img" / "samples"
DEST = BASE / "assets" / "img" / "blog"
DEST.mkdir(parents=True, exist_ok=True)
TARGET = (1200, 800)

for source in SRC.glob("*.jpg"):
    image = Image.open(source).convert("RGB")
    src_ratio = image.width / image.height
    target_ratio = TARGET[0] / TARGET[1]
    if src_ratio > target_ratio:
        width = int(image.height * target_ratio)
        left = (image.width - width) // 2
        image = image.crop((left, 0, left + width, image.height))
    else:
        height = int(image.width / target_ratio)
        top = (image.height - height) // 2
        image = image.crop((0, top, image.width, top + height))
    image = image.resize(TARGET, Image.Resampling.LANCZOS)
    out = DEST / f"{source.stem}.webp"
    image.save(out, "WEBP", quality=82, method=6)
    print(out.name, out.stat().st_size)
