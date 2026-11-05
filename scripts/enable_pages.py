# -*- coding: utf-8 -*-
"""Enable GitHub Pages for this repository using the local git credential.

Run once after creating the GitHub repository:
  python scripts/enable_pages.py sakata1311-jpg maemulhanjang

The token is read from Git Credential Manager and is never printed.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request


def credential() -> str:
    env = dict(os.environ)
    env["GIT_TERMINAL_PROMPT"] = "0"
    result = subprocess.run(
        ["git", "credential", "fill"],
        input="protocol=https\nhost=github.com\n\n",
        text=True,
        capture_output=True,
        env=env,
        check=False,
    )
    if result.returncode != 0:
        raise SystemExit("Git credential not available. Use GitHub Settings → Pages instead.")
    for line in result.stdout.splitlines():
        if line.startswith("password="):
            return line.split("=", 1)[1]
    raise SystemExit("No password/token in Git credential.")


def api(method: str, url: str, token: str, body: dict | None = None) -> tuple[int, str]:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    request = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "maemulhanjang-deploy",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.status, response.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8", "replace")


def main() -> None:
    owner = sys.argv[1] if len(sys.argv) > 1 else "sakata1311-jpg"
    repo = sys.argv[2] if len(sys.argv) > 2 else "maemulhanjang"
    token = credential()
    base = f"https://api.github.com/repos/{owner}/{repo}/pages"

    status, body = api("GET", base, token)
    if status == 200:
        print("Pages already enabled:")
        print(body)
        return

    status, body = api("POST", base, token, {"build_type": "workflow"})
    print("POST", status)
    print(body)
    if status in (201, 204, 409):
        status2, body2 = api("GET", base, token)
        print("GET", status2)
        print(body2)


if __name__ == "__main__":
    main()
