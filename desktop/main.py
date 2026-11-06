# -*- coding: utf-8 -*-
"""매물한장 — Windows desktop launcher.

Serves the static studio locally and opens it in a native WebView2 window.
No internet connection is required after the package is built.
"""
from __future__ import annotations

import base64
import http.server
import mimetypes
import os
import pathlib
import re
import socketserver
import sys
import threading
import urllib.request

import webview

APP_NAME = "매물한장"
APP_DIR_NAME = "MaemulHanjang"

mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("image/svg+xml", ".svg")


def resource_root() -> pathlib.Path:
    """Return the bundled web root (PyInstaller _MEIPASS or repo root)."""
    if getattr(sys, "frozen", False):
        return pathlib.Path(getattr(sys, "_MEIPASS", pathlib.Path(sys.executable).parent))
    return pathlib.Path(__file__).resolve().parent.parent


ROOT = resource_root()


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def log_message(self, fmt: str, *args) -> None:  # noqa: A003
        # Keep the packaged app quiet; errors still go to stderr.
        if getattr(self, "path", "").startswith("/api"):
            print(fmt % args, file=sys.stderr)


class Api:
    """Small native bridge for reliable file saving in WebView2."""

    def __init__(self) -> None:
        self.downloads = pathlib.Path.home() / "Downloads"
        self.downloads.mkdir(parents=True, exist_ok=True)

    def save_file(self, data_url: str, filename: str) -> dict:
        try:
            match = re.match(r"^data:([^;]+);base64,(.*)$", data_url or "", re.S)
            if not match:
                return {"ok": False, "error": "invalid data URL"}
            mime, b64 = match.group(1), match.group(2)
            ext = mimetypes.guess_extension(mime) or ".bin"
            safe = pathlib.Path(filename or "file").name
            safe = re.sub(r'[\\/:*?"<>|]+', "_", safe) or "file"
            if not pathlib.Path(safe).suffix:
                safe += ext
            target = self.downloads / safe
            if target.exists():
                stem, suffix = target.stem, target.suffix
                index = 2
                while target.exists():
                    target = self.downloads / f"{stem} ({index}){suffix}"
                    index += 1
            target.write_bytes(base64.b64decode(b64))
            return {"ok": True, "path": str(target)}
        except Exception as exc:  # noqa: BLE001
            return {"ok": False, "error": str(exc)}

    def open_downloads(self) -> dict:
        try:
            os.startfile(str(self.downloads))  # type: ignore[attr-defined]
            return {"ok": True}
        except Exception as exc:  # noqa: BLE001
            return {"ok": False, "error": str(exc)}


def start_server() -> int:
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), QuietHandler)
    httpd.daemon_threads = True
    port = httpd.server_address[1]
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return port


def selftest() -> None:
    """Verify that the packaged web resources are served correctly."""
    port = start_server()
    checks = [
        "app.html?desktop=1",
        "assets/css/app.css",
        "assets/css/site.css",
        "assets/js/config.js",
        "assets/js/license-public.js",
        "assets/js/license.js",
        "assets/js/studio.js",
        "assets/js/vendor/html-to-image.js",
        "assets/js/vendor/jszip.min.js",
        "assets/js/vendor/qrcode.js",
        "assets/fonts/PretendardVariable.woff2",
    ]
    lines: list[str] = []
    ok = True
    for item in checks:
        url = f"http://127.0.0.1:{port}/{item}"
        try:
            with urllib.request.urlopen(url, timeout=10) as response:
                data = response.read()
                lines.append(f"OK   {response.status} {len(data):>8} {item}")
                if response.status != 200 or not data:
                    ok = False
        except Exception as exc:  # noqa: BLE001
            ok = False
            lines.append(f"FAIL {item}: {exc}")
    output = pathlib.Path(os.getenv("TEMP", str(pathlib.Path.home()))) / "maemulhanjang-selftest.txt"
    output.write_text("\n".join(lines), encoding="utf-8")
    sys.exit(0 if ok else 1)


def main() -> None:
    if "--selftest" in sys.argv:
        selftest()
        return
    port = start_server()
    storage = pathlib.Path(os.getenv("LOCALAPPDATA", str(pathlib.Path.home()))) / APP_DIR_NAME
    storage.mkdir(parents=True, exist_ok=True)
    api = Api()
    webview.create_window(
        f"{APP_NAME} — 매물 홍보 스튜디오",
        f"http://127.0.0.1:{port}/app.html?desktop=1",
        width=1440,
        height=920,
        min_size=(1080, 700),
        js_api=api,
        text_select=True,
    )
    webview.start(
        private_mode=False,
        storage_path=str(storage),
        debug=False,
    )


if __name__ == "__main__":
    main()
