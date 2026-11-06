# -*- coding: utf-8 -*-
"""Create a Kmong main image (652x488, 4:3) for the Pro listing.

Kmong rules: no price/discount, no external contact, no absolute superlatives,
colored background, 50px safe margins. This image intentionally includes no
price or contact details.
"""
from __future__ import annotations

import pathlib
from PIL import Image, ImageDraw, ImageFilter, ImageFont

BASE = pathlib.Path(__file__).resolve().parent.parent
SAMPLES = BASE / "assets" / "img" / "samples"
OUT = BASE / "assets" / "img" / "kmong-main.png"

W, H = 652, 488
NAVY = (14, 26, 43)
CREAM = (247, 242, 232)
ORANGE = (217, 85, 42)
MUTED = (185, 194, 206)
WHITE = (255, 253, 248)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    path = r"C:\Windows\Fonts\malgunbd.ttf" if bold else r"C:\Windows\Fonts\malgun.ttf"
    return ImageFont.truetype(path, size)


def rounded_photo(path: pathlib.Path, size: tuple[int, int], radius: int = 8) -> Image.Image:
    photo = Image.open(path).convert("RGB")
    target_ratio = size[0] / size[1]
    src_ratio = photo.width / photo.height
    if src_ratio > target_ratio:
        new_w = int(photo.height * target_ratio)
        left = (photo.width - new_w) // 2
        photo = photo.crop((left, 0, left + new_w, photo.height))
    else:
        new_h = int(photo.width / target_ratio)
        top = (photo.height - new_h) // 2
        photo = photo.crop((0, top, photo.width, top + new_h))
    photo = photo.resize(size, Image.Resampling.LANCZOS)
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    photo.putalpha(mask)
    return photo


def main() -> None:
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)

    # left copy
    d.rounded_rectangle((50, 50, 94, 94), radius=10, fill=CREAM)
    d.line((58, 76, 72, 64, 86, 76), fill=NAVY, width=4, joint="curve")
    d.line((64, 74, 64, 86, 80, 86, 80, 74), fill=NAVY, width=4, joint="curve")
    d.text((104, 56), "매물한장", font=font(22, True), fill=CREAM)
    d.text((104, 82), "공인중개사 매물 홍보 도구", font=font(11), fill=MUTED)

    d.text((50, 126), "매물 전단지", font=font(28, True), fill=CREAM)
    d.text((50, 160), "카드뉴스", font=font(24, True), fill=CREAM)
    d.text((50, 192), "자동 생성", font=font(29, True), fill=ORANGE)
    d.text((50, 244), "사진과 정보만 넣으면", font=font(15, True), fill=CREAM)
    d.text((50, 267), "전단지·카드뉴스·문구가 완성", font=font(11), fill=MUTED)

    # tags
    tags = ["Windows 프로그램", "A4 300dpi"]
    x = 50
    for label in tags:
        w = d.textlength(label, font=font(10, True))
        d.rounded_rectangle((x, 302, x + w + 20, 324), radius=11, fill=(24, 40, 62), outline=(60, 78, 100), width=1)
        d.text((x + 10, 308), label, font=font(10, True), fill=CREAM)
        x += w + 30

    # three cards, no text or prices inside
    card_specs = [
        (SAMPLES / "apartment-1.jpg", (138, 172), (360, 72), 4, "표지"),
        (SAMPLES / "living-1.jpg", (132, 165), (462, 148), -5, "정보"),
        (SAMPLES / "kitchen-1.jpg", (112, 140), (360, 264), 3, "A4"),
    ]
    for path, size, pos, angle, label in card_specs:
        card = rounded_photo(path, size)
        card = card.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
        shadow = Image.new("RGBA", (card.width + 24, card.height + 24), (0, 0, 0, 0))
        sd = ImageDraw.Draw(shadow)
        sd.rounded_rectangle((10, 12, card.width + 10, card.height + 10), radius=10, fill=(0, 0, 0, 90))
        shadow = shadow.filter(ImageFilter.GaussianBlur(8))
        img.paste(shadow, (pos[0] - 12, pos[1] - 12), shadow)
        img.paste(card, pos, card)
        # small label inside the card
        d = ImageDraw.Draw(img)
        tw = d.textlength(label, font=font(9, True))
        d.rounded_rectangle((pos[0] + 9, pos[1] + 9, pos[0] + tw + 23, pos[1] + 25), radius=8, fill=ORANGE)
        d.text((pos[0] + 14, pos[1] + 11), label, font=font(9, True), fill=WHITE)

    # subtle bottom line
    d = ImageDraw.Draw(img)
    d.line((50, 418, 602, 418), fill=(44, 60, 82), width=1)
    d.text((50, 426), "Windows 프로그램 + 웹앱 · 인터넷 없이 사용", font=font(9), fill=MUTED)

    img.save(OUT, quality=95, optimize=True)
    print("saved", OUT)


if __name__ == "__main__":
    main()
