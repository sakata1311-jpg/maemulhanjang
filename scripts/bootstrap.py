# -*- coding: utf-8 -*-
"""Create folders, vendor JS, and download sample photos."""
import pathlib
import urllib.request

BASE = pathlib.Path(__file__).resolve().parent.parent

DIRS = [
    "assets/css", "assets/js", "assets/js/vendor", "assets/img",
    "assets/img/samples", "assets/fonts", "blog", "templates", "legal",
    "scripts", "marketing", "secrets", "_prototype",
]

FILES = {
    "https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.js":
        "assets/js/vendor/html-to-image.js",
    "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js":
        "assets/js/vendor/jszip.min.js",
    "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js":
        "assets/js/vendor/qrcode.js",
}

IMAGES = {
    "apartment-1.jpg": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80",
    "living-1.jpg": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
    "kitchen-1.jpg": "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=80",
    "bedroom-1.jpg": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80",
    "house-1.jpg": "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80",
    "city-1.jpg": "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1600&q=80",
}


def download(url: str, dest: pathlib.Path) -> None:
    if dest.exists() and dest.stat().st_size > 1000:
        print("skip", dest.name, dest.stat().st_size)
        return
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=90) as res, open(dest, "wb") as fh:
        fh.write(res.read())
    print("saved", dest.name, dest.stat().st_size)


def main() -> None:
    for rel in DIRS:
        (BASE / rel).mkdir(parents=True, exist_ok=True)
    for url, rel in FILES.items():
        download(url, BASE / rel)
    for name, url in IMAGES.items():
        try:
            download(url, BASE / "assets/img/samples" / name)
        except Exception as exc:  # noqa: BLE001
            print("ERR", name, exc)


if __name__ == "__main__":
    main()
