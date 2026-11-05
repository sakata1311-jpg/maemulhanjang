# -*- coding: utf-8 -*-
"""Generate brand assets: QR sample, Open Graph image, sample cover."""
from __future__ import annotations

import math
import pathlib

import segno
from PIL import Image, ImageDraw, ImageFilter, ImageFont

BASE = pathlib.Path(__file__).resolve().parent.parent
IMG = BASE / "assets" / "img"
SAMPLES = IMG / "samples"

NAVY = (14, 26, 43)
CREAM = (247, 242, 232)
WHITE = (255, 253, 248)
ORANGE = (217, 85, 42)
MUTED = (93, 103, 118)
GOLD = (201, 154, 62)

FONT_REG = r"C:\Windows\Fonts\malgun.ttf"
FONT_BOLD = r"C:\Windows\Fonts\malgunbd.ttf"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def cover_card(width: int = 660, height: int = 880) -> Image.Image:
    """A marketing cover card, rendered at 2x for crisp downscaling."""
    photo = Image.open(SAMPLES / "apartment-1.jpg").convert("RGB")
    # cover crop
    target_ratio = width / height
    src_ratio = photo.width / photo.height
    if src_ratio > target_ratio:
        new_w = int(photo.height * target_ratio)
        left = (photo.width - new_w) // 2
        photo = photo.crop((left, 0, left + new_w, photo.height))
    else:
        new_h = int(photo.width / target_ratio)
        top = (photo.height - new_h) // 2
        photo = photo.crop((0, top, photo.width, top + new_h))
    photo = photo.resize((width, height), Image.Resampling.LANCZOS)

    # dark gradient overlay
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for y in range(height):
        t = y / height
        if t < 0.35:
            alpha = int(110 * (1 - t / 0.35))
        else:
            alpha = int(30 + 190 * ((t - 0.35) / 0.65))
        od.line([(0, y), (width, y)], fill=(4, 12, 24, alpha))
    card = Image.alpha_composite(photo.convert("RGBA"), overlay)
    d = ImageDraw.Draw(card)

    # top badge + brand
    d.rounded_rectangle((42, 42, 142, 86), radius=22, fill=WHITE)
    d.text((58, 50), "매매", font=font(26, True), fill=NAVY)
    d.text((width - 42, 50), "매물한장", font=font(23, True), fill=WHITE, anchor="ra")

    # bottom content
    bottom = height - 56
    d.text((44, bottom - 300), "솔트리움 · 24평 · 남향", font=font(23, True), fill=(242, 189, 99))
    d.text((44, bottom - 258), "채광 좋은 3층,", font=font(58, True), fill=WHITE)
    d.text((44, bottom - 194), "바로 입주 가능한 집", font=font(58, True), fill=WHITE)
    d.text((44, bottom - 112), "8억 5,000만", font=font(52, True), fill=WHITE)
    d.text((44, bottom - 50), "전용 59㎡  ·  3/15층  ·  즉시 입주", font=font(20, True), fill=(203, 213, 225))

    # accent line
    d.rectangle((44, bottom - 330, 96, bottom - 324), fill=ORANGE)

    card.putalpha(rounded_mask((width, height), 28))
    return card


def make_og() -> None:
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(img)

    # soft background shapes
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((820, -260, 1460, 380), fill=(217, 85, 42, 26))
    gd.ellipse((-260, 380, 360, 980), fill=(201, 154, 62, 26))
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    d = ImageDraw.Draw(img)

    # logo
    mark = Image.open(IMG / "logo-mark.svg").convert("RGBA") if False else None
    # draw the mark directly (SVG rasterization avoided)
    d.rounded_rectangle((64, 58, 124, 118), radius=16, fill=NAVY)
    d.line((74, 92, 94, 75, 114, 92), fill=CREAM, width=6, joint="curve")
    d.line((82, 89, 82, 107, 106, 107, 106, 89), fill=CREAM, width=6, joint="curve")
    d.rectangle((90, 98, 98, 107), fill=ORANGE)
    d.text((140, 70), "매물한장", font=font(33, True), fill=NAVY)
    d.text((142, 112), "MAEMUL HANJANG", font=font(11, True), fill=MUTED)

    # badge
    badge_text = "공인중개사를 위한 매물 홍보 도구"
    bw = d.textlength(badge_text, font=font(16, True))
    d.rounded_rectangle((64, 158, 64 + bw + 32, 198), radius=20, fill=(246, 217, 204))
    d.text((80, 168), badge_text, font=font(16, True), fill=(184, 63, 26))

    # headline
    d.text((62, 222), "매물 사진 한 장으로,", font=font(50, True), fill=NAVY)
    d.text((62, 286), "오늘 올릴 ", font=font(50, True), fill=NAVY)
    prefix_w = d.textlength("오늘 올릴 ", font=font(50, True))
    d.text((62 + prefix_w, 286), "전단지", font=font(50, True), fill=ORANGE)
    suffix_w = d.textlength("전단지", font=font(50, True))
    d.text((62 + prefix_w + suffix_w, 286), "까지.", font=font(50, True), fill=NAVY)
    d.rectangle((64, 350, 186, 356), fill=(217, 85, 42, 60))

    # subcopy
    d.text((64, 382), "인스타 카드뉴스 · A4 전단지 · 홍보 문구를", font=font(20), fill=MUTED)
    d.text((64, 414), "매물 정보 한 번으로 1분 만에.", font=font(20), fill=MUTED)

    # chips
    chips = ["무료로 시작", "설치 0초", "A4 300dpi"]
    x = 64
    for text in chips:
        w = d.textlength(text, font=font(14, True))
        d.rounded_rectangle((x, 462, x + w + 26, 498), radius=18, fill=WHITE, outline=(222, 212, 196), width=1)
        d.text((x + 13, 472), text, font=font(14, True), fill=(43, 59, 81))
        x += w + 36

    # CTA
    cta = "무료로 만들어보기  →"
    cw = d.textlength(cta, font=font(18, True))
    d.rounded_rectangle((64, 526, 64 + cw + 44, 584), radius=29, fill=ORANGE)
    d.text((86, 544), cta, font=font(18, True), fill=WHITE)

    # card on the right
    card = cover_card()
    card = card.resize((330, 440), Image.Resampling.LANCZOS)
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((818, 108, 1158, 558), radius=24, fill=(14, 26, 43, 55))
    shadow = shadow.filter(ImageFilter.GaussianBlur(24))
    img = Image.alpha_composite(img.convert("RGBA"), shadow)
    card_rot = card.rotate(-4, expand=True, resample=Image.Resampling.BICUBIC)
    img.alpha_composite(card_rot, (818, 76))

    # sticker
    sticker = Image.new("RGBA", (210, 70), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sticker)
    sd.rounded_rectangle((0, 0, 209, 69), radius=14, fill=WHITE)
    sd.text((18, 12), "1분 완성", font=font(18, True), fill=NAVY)
    sd.text((18, 38), "표지 · 정보 · 전단지", font=font(11, True), fill=MUTED)
    img.alpha_composite(sticker, (760, 500))

    img.convert("RGB").save(IMG / "og.png", quality=92, optimize=True)
    print("saved og.png")


def make_qr() -> None:
    qr = segno.make("https://maemulhanjang.com", error="m")
    qr.save(
        IMG / "qr-sample.svg",
        scale=10,
        border=2,
        dark="#0E1A2B",
        light="#FFFFFF",
        kind="svg",
    )
    print("saved qr-sample.svg")


def main() -> None:
    make_qr()
    make_og()


if __name__ == "__main__":
    main()
