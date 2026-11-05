# -*- coding: utf-8 -*-
"""Update the site URL (and optionally the contact email) across the static site.

Usage:
  python scripts/set_site_url.py https://myid.github.io/maemulhanjang
  python scripts/set_site_url.py https://maemulhanjang.com --email hello@maemulhanjang.com
"""
from __future__ import annotations

import argparse
import pathlib
import re
from urllib.parse import urlparse

BASE = pathlib.Path(__file__).resolve().parent.parent
OLD_URL = "https://maemulhanjang.com"
OLD_EMAIL = "hello@maemulhanjang.com"
TARGETS = [
    *BASE.glob("*.html"),
    *BASE.glob("blog/*.html"),
    *BASE.glob("legal/*.html"),
    BASE / "sitemap.xml",
    BASE / "robots.txt",
    BASE / "blog" / "feed.xml",
    BASE / "assets" / "js" / "config.js",
]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("url", help="New site URL, e.g. https://id.github.io/repo")
    parser.add_argument("--email", default="", help="New contact email (optional)")
    args = parser.parse_args()

    new_url = args.url.rstrip("/")
    host = urlparse(new_url).netloc
    if not host:
        raise SystemExit("Invalid URL: " + new_url)

    changed = []
    for path in TARGETS:
        if not path.exists():
            continue
        original = path.read_text(encoding="utf-8")
        text = original.replace(OLD_URL, new_url)
        text = re.sub(r'siteUrl:\s*"[^"]*"', f'siteUrl: "{new_url}"', text)
        text = re.sub(r'domain:\s*"[^"]*"', f'domain: "{host}"', text)
        if args.email:
            text = text.replace(OLD_EMAIL, args.email)
            text = re.sub(r'contactEmail:\s*"[^"]*"', f'contactEmail: "{args.email}"', text)
        if text != original:
            path.write_text(text, encoding="utf-8")
            changed.append(str(path.relative_to(BASE)))

    print(f"Updated {len(changed)} files to {new_url}")
    for item in changed:
        print("  -", item)


if __name__ == "__main__":
    main()
