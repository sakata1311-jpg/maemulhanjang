# -*- coding: utf-8 -*-
"""Build the Windows desktop program and the Kmong-ready ZIP.

Requirements:
  pip install pywebview pyinstaller
"""
from __future__ import annotations

import pathlib
import shutil
import subprocess
import sys
import zipfile

BASE = pathlib.Path(__file__).resolve().parent.parent
DIST = BASE / "dist"
BUILD = BASE / "build"
APP_NAME = "MaemulHanjang"
FINAL_FOLDER = "매물한장_프로그램"
GUIDE = BASE / "assets" / "guide" / "maemulhanjang-pro-guide.pdf"
HOWTO = BASE / "desktop" / "사용방법.txt"


def add_data(relative: str) -> str:
    return f"{relative};{relative}"


def add_file(relative: str) -> str:
    # A file destination must be a directory ('.'), otherwise PyInstaller
    # creates a folder named after the file and puts the file inside it.
    return f"{relative};."


def main() -> None:
    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--clean",
        "--windowed",
        f"--name={APP_NAME}",
        f"--icon={BASE / 'desktop' / 'icon.ico'}",
        "--collect-all",
        "webview",
        "--hidden-import=webview.platforms.edgechromium",
        "--add-data",
        add_file("app.html"),
        "--add-data",
        add_file("index.html"),
        "--add-data",
        add_file("pricing.html"),
        "--add-data",
        add_file("templates.html"),
        "--add-data",
        add_file("guide.html"),
        "--add-data",
        add_data("assets"),
        "--add-data",
        add_data("blog"),
        "--add-data",
        add_data("legal"),
        str(BASE / "desktop" / "main.py"),
    ]
    print("Running PyInstaller...")
    subprocess.run(cmd, cwd=str(BASE), check=True)

    app_dir = DIST / APP_NAME
    if not app_dir.exists():
        raise SystemExit("PyInstaller output not found: " + str(app_dir))

    shutil.copyfile(GUIDE, app_dir / "사용가이드.pdf")
    shutil.copyfile(HOWTO, app_dir / "사용방법.txt")

    zip_path = DIST / "매물한장_프로그램_Windows.zip"
    if zip_path.exists():
        zip_path.unlink()

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for path in app_dir.rglob("*"):
            if path.is_file():
                rel = path.relative_to(app_dir)
                zf.write(path, pathlib.Path(FINAL_FOLDER) / rel)

    print("Built:", app_dir)
    print("ZIP  :", zip_path)
    print("Size :", round(zip_path.stat().st_size / 1024 / 1024, 1), "MB")


if __name__ == "__main__":
    main()
