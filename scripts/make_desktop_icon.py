# -*- coding: utf-8 -*-
"""Generate the Windows application icon."""
from __future__ import annotations

import pathlib
from PIL import Image, ImageDraw

BASE = pathlib.Path(__file__).resolve().parent.parent
OUT = BASE / "desktop" / "icon.ico"
PNG = BASE / "desktop" / "icon.png"

NAVY = (14, 26, 43)
CREAM = (247, 242, 232)
ORANGE = (217, 85, 42)


def main() -> None:
    size = 256
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((4, 4, size - 4, size - 4), radius=58, fill=NAVY)
    # house outline
    d.line((48, 128, 128, 56, 208, 128), fill=CREAM, width=18, joint="curve")
    d.line((70, 116, 70, 206, 186, 206, 186, 116), fill=CREAM, width=18, joint="curve")
    d.rounded_rectangle((108, 154, 148, 206), radius=8, fill=ORANGE)
    img.save(PNG)
    img.save(OUT, sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
    print("saved", OUT, OUT.stat().st_size)


if __name__ == "__main__":
    main()
