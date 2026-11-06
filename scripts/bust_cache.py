# -*- coding: utf-8 -*-
"""Add a cache-busting version query to local CSS/JS references."""
import pathlib
import re

BASE = pathlib.Path(__file__).resolve().parent.parent
VERSION = "20261105f"
ASSETS = [
    "assets/css/site.css",
    "assets/css/app.css",
    "assets/css/slides.css",
    "assets/js/config.js",
    "assets/js/common.js",
    "assets/js/license-public.js",
    "assets/js/license.js",
    "assets/js/copy.js",
    "assets/js/templates.js",
    "assets/js/studio.js",
]

changed = []
for path in BASE.rglob("*.html"):
    if any(part in {"_prototype", "secrets"} for part in path.parts):
        continue
    text = path.read_text(encoding="utf-8")
    original = text
    text = text.replace("?v=20261105b", f"?v={VERSION}")
    text = text.replace("?v=20261105c", f"?v={VERSION}")
    text = text.replace("?v=20261105d", f"?v={VERSION}")
    for asset in ASSETS:
        # Match both root and ../ paths and replace any existing version query.
        pattern = re.compile(r'(?P<prefix>(?:\.\./)?' + re.escape(asset) + r')(?:\?v=[^"\'<> ]*)?')
        text = pattern.sub(rf'\g<prefix>?v={VERSION}', text)
    if text != original:
        path.write_text(text, encoding="utf-8")
        changed.append(str(path.relative_to(BASE)))
print("updated", len(changed), "files")
for item in changed:
    print("  -", item)

