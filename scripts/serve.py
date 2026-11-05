# -*- coding: utf-8 -*-
"""Local preview server with no-cache headers.

Usage:
  python scripts/serve.py
  python scripts/serve.py 8765
"""
from __future__ import annotations

import functools
import http.server
import os
import pathlib
import socketserver
import sys

BASE = pathlib.Path(__file__).resolve().parent.parent


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def log_message(self, fmt: str, *args) -> None:
        print("%s - %s" % (self.address_string(), fmt % args))


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    os.chdir(BASE)
    handler = functools.partial(Handler, directory=str(BASE))
    with socketserver.ThreadingTCPServer(("127.0.0.1", port), handler) as httpd:
        print(f"매물한장 preview: http://127.0.0.1:{port}/")
        print("Ctrl+C to stop")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
