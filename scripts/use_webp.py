# -*- coding: utf-8 -*-
"""Point marketing pages at the optimized WebP template covers."""
import pathlib

BASE = pathlib.Path(__file__).resolve().parent.parent
KEYS = ["city", "sunset", "forest", "mono", "sky", "cream"]
for name in ["index.html", "templates.html"]:
    path = BASE / name
    text = path.read_text(encoding="utf-8")
    for key in KEYS:
        text = text.replace(f"assets/img/templates/{key}.png", f"assets/img/templates/{key}.webp")
    path.write_text(text, encoding="utf-8")
    print("updated", name)
