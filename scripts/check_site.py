# -*- coding: utf-8 -*-
"""Static-site sanity check: links, images, meta tags, sitemap entries."""
from __future__ import annotations

import pathlib
import re
import sys
from html.parser import HTMLParser
from urllib.parse import unquote, urlparse

BASE = pathlib.Path(__file__).resolve().parent.parent
SKIP_DIRS = {"_prototype", "secrets", ".git", "node_modules"}
HTML_FILES = [
    p
    for p in BASE.rglob("*.html")
    if not any(part in SKIP_DIRS for part in p.relative_to(BASE).parts)
]


class Parser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[str] = []
        self.images: list[tuple[str, str]] = []
        self.title = ""
        self.description = ""
        self.canonical = ""
        self.h1 = 0
        self._in_title = False
        self._in_h1 = False
        self._in_meta_description = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = dict(attrs)
        if tag == "a" and data.get("href"):
            self.links.append(data["href"] or "")
        if tag in {"img", "source"} and data.get("src"):
            self.images.append((data["src"] or "", data.get("alt") or ""))
        if tag == "title":
            self._in_title = True
        if tag == "h1":
            self.h1 += 1
        if tag == "meta" and (data.get("name") or "").lower() == "description":
            self.description = data.get("content") or ""
        if tag == "link" and (data.get("rel") or "").lower() == "canonical":
            self.canonical = data.get("href") or ""

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False
        if tag == "h1":
            self._in_h1 = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data
        if self._in_h1:
            pass


def local_target(source: pathlib.Path, href: str) -> pathlib.Path | None:
    if not href or href.startswith(("mailto:", "tel:", "javascript:", "#")):
        return None
    parsed = urlparse(href)
    if parsed.scheme in {"http", "https"}:
        return None
    target = unquote(parsed.path)
    if not target:
        return None
    if target.startswith("/"):
        return BASE / target.lstrip("/")
    return (source.parent / target).resolve()


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []
    for page in HTML_FILES:
        raw = page.read_text(encoding="utf-8")
        parser = Parser()
        parser.feed(raw)
        rel = page.relative_to(BASE)
        if not parser.title.strip():
            errors.append(f"{rel}: missing <title>")
        elif len(parser.title) > 70:
            warnings.append(f"{rel}: title is {len(parser.title)} chars")
        if not parser.description:
            errors.append(f"{rel}: missing meta description")
        elif not (50 <= len(parser.description) <= 170):
            warnings.append(f"{rel}: description is {len(parser.description)} chars")
        if not parser.canonical:
            warnings.append(f"{rel}: missing canonical")
        if parser.h1 != 1:
            warnings.append(f"{rel}: {parser.h1} <h1> tags")
        for href in parser.links:
            target = local_target(page, href)
            if target is None:
                continue
            if not target.exists():
                errors.append(f"{rel}: broken link -> {href}")
        for src, alt in parser.images:
            target = local_target(page, src)
            if target is None:
                continue
            if not target.exists():
                errors.append(f"{rel}: missing image -> {src}")
            if not alt and not src.startswith("data:"):
                warnings.append(f"{rel}: image without alt -> {src}")

    sitemap = (BASE / "sitemap.xml").read_text(encoding="utf-8")
    config = (BASE / "assets" / "js" / "config.js").read_text(encoding="utf-8")
    site_match = re.search(r'siteUrl:\s*"([^"]+)"', config)
    site_prefix = urlparse(site_match.group(1)).path.rstrip("/") if site_match else ""
    for loc in re.findall(r"<loc>(.*?)</loc>", sitemap):
        path = urlparse(loc).path
        if site_prefix and path.startswith(site_prefix):
            path = path[len(site_prefix):] or "/"
        if path == "/":
            target = BASE / "index.html"
        elif path.endswith("/"):
            target = BASE / path.lstrip("/") / "index.html"
        else:
            target = BASE / path.lstrip("/")
        if not target.exists():
            errors.append(f"sitemap: missing file for {loc}")

    for path in sorted(BASE.glob("blog/*.html")):
        raw = path.read_text(encoding="utf-8")
        if "practical하게" in raw:
            warnings.append(f"{path.name}: awkward Konglish copy")

    print(f"Checked {len(HTML_FILES)} HTML files.")
    if warnings:
        print("\nWarnings:")
        for item in warnings:
            print("  -", item)
    if errors:
        print("\nErrors:")
        for item in errors:
            print("  -", item)
        return 1
    print("\nNo broken local links or missing assets.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
