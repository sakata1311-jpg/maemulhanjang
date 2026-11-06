# -*- coding: utf-8 -*-
"""Build a 4-page buyer guide PDF for Kmong / Lemon delivery."""
from __future__ import annotations

import pathlib

from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

BASE = pathlib.Path(__file__).resolve().parent.parent
OUT = BASE / "assets" / "guide" / "maemulhanjang-pro-guide.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

NAVY = (14 / 255, 26 / 255, 43 / 255)
CREAM = (247 / 255, 242 / 255, 232 / 255)
ORANGE = (217 / 255, 85 / 255, 42 / 255)
MUTED = (93 / 255, 103 / 255, 118 / 255)
WHITE = (1, 1, 1)

pdfmetrics.registerFont(TTFont("Malgun", r"C:\Windows\Fonts\malgun.ttf"))
pdfmetrics.registerFont(TTFont("MalgunBd", r"C:\Windows\Fonts\malgunbd.ttf"))

W, H = A4


def wrap(c: canvas.Canvas, text: str, x: float, y: float, width: float, size: int, leading: int, font: str = "Malgun", color=MUTED):
    c.setFont(font, size)
    c.setFillColorRGB(*color)
    line = ""
    for word in text.split():
        candidate = (line + " " + word).strip()
        if pdfmetrics.stringWidth(candidate, font, size) <= width:
            line = candidate
        else:
            if line:
                c.drawString(x, y, line)
                y -= leading
            line = word
    if line:
        c.drawString(x, y, line)
        y -= leading
    return y


def header(c: canvas.Canvas, page_no: int, title: str) -> None:
    c.setFillColorRGB(*NAVY)
    c.rect(0, H - 88, W, 88, fill=1, stroke=0)
    c.setFillColorRGB(*CREAM)
    c.setFont("MalgunBd", 12)
    c.drawString(48, H - 40, "매물한장")
    c.setFont("Malgun", 9)
    c.setFillColorRGB(185 / 255, 194 / 255, 206 / 255)
    c.drawString(48, H - 56, "공인중개사를 위한 매물 홍보 도구")
    c.setFont("Malgun", 9)
    c.drawRightString(W - 48, H - 40, title)
    c.setFillColorRGB(*MUTED)
    c.setFont("Malgun", 8)
    c.drawRightString(W - 48, 24, f"{page_no} / 4")


def page_1(c: canvas.Canvas) -> None:
    header(c, 1, "Pro 사용 가이드")
    c.setFillColorRGB(*NAVY)
    c.setFont("MalgunBd", 30)
    c.drawString(48, H - 180, "매물한장 Pro")
    c.setFillColorRGB(*ORANGE)
    c.drawString(48, H - 218, "사용 가이드")
    c.setFillColorRGB(*MUTED)
    wrap(
        c,
        "매물 정보와 사진만 넣으면 인스타 카드뉴스, A4 전단지, 문자·블로그 문구가 자동으로 구성됩니다.",
        48,
        H - 260,
        W - 96,
        12,
        20,
    )
    c.setFillColorRGB(*CREAM)
    c.roundRect(48, H - 430, W - 96, 130, 10, fill=1, stroke=0)
    c.setFillColorRGB(*NAVY)
    c.setFont("MalgunBd", 13)
    c.drawString(66, H - 350, "시작 전에 확인하세요")
    c.setFont("Malgun", 10)
    c.setFillColorRGB(*MUTED)
    c.drawString(66, H - 372, "1. 크몽 메시지로 받은 앱 주소와 라이선스 키를 확인합니다.")
    c.drawString(66, H - 390, "2. Chrome 또는 Edge 최신 버전을 사용합니다.")
    c.drawString(66, H - 408, "3. 매물 정보와 사진은 브라우저에만 저장됩니다.")
    c.setFont("MalgunBd", 12)
    c.setFillColorRGB(*NAVY)
    c.drawString(48, H - 480, "이 가이드의 순서")
    items = [
        "1. 앱 접속과 라이선스 활성화",
        "2. 매물 정보 입력",
        "3. 템플릿 선택과 저장",
        "4. A4 전단지 인쇄",
        "5. 자주 묻는 질문",
    ]
    y = H - 508
    for item in items:
        c.setFont("Malgun", 11)
        c.setFillColorRGB(*MUTED)
        c.drawString(64, y, item)
        y -= 22
    c.setFillColorRGB(*MUTED)
    c.setFont("Malgun", 8)
    c.drawString(48, 42, "본 가이드는 구매자용입니다. 앱 주소와 라이선스 키는 크몽 메시지로 별도 안내됩니다.")
    c.showPage()


def page_2(c: canvas.Canvas) -> None:
    header(c, 2, "라이선스 활성화")
    c.setFillColorRGB(*NAVY)
    c.setFont("MalgunBd", 20)
    c.drawString(48, H - 150, "Pro 라이선스 활성화")
    steps = [
        ("01", "앱에 접속합니다", "크몽 메시지로 받은 앱 주소를 Chrome/Edge에서 엽니다."),
        ("02", "Pro 업그레이드를 누릅니다", "오른쪽 위의 ‘Pro 업그레이드’ 버튼을 클릭합니다."),
        ("03", "라이선스 키를 입력합니다", "크몽 메시지로 받은 키를 붙여넣고 ‘활성화’를 누릅니다."),
        ("04", "PRO 사용 중을 확인합니다", "워터마크가 사라지고 Pro 템플릿이 열리면 완료입니다."),
    ]
    y = H - 205
    for num, title, desc in steps:
        c.setFillColorRGB(*ORANGE)
        c.setFont("MalgunBd", 12)
        c.drawString(48, y, num)
        c.setFillColorRGB(*NAVY)
        c.setFont("MalgunBd", 14)
        c.drawString(84, y, title)
        y -= 20
        c.setFillColorRGB(*MUTED)
        c.setFont("Malgun", 10)
        y = wrap(c, desc, 84, y, W - 132, 10, 16)
        y -= 18
    c.setFillColorRGB(*CREAM)
    c.roundRect(48, 120, W - 96, 100, 10, fill=1, stroke=0)
    c.setFillColorRGB(*NAVY)
    c.setFont("MalgunBd", 11)
    c.drawString(66, 190, "키를 잃어버렸거나 활성화가 안 되나요?")
    c.setFont("Malgun", 9)
    c.setFillColorRGB(*MUTED)
    c.drawString(66, 170, "크몽 메시지로 구매 이메일과 오류 화면을 보내주세요.")
    c.drawString(66, 154, "확인 후 재발급 또는 해결 방법을 안내드립니다.")
    c.showPage()


def page_3(c: canvas.Canvas) -> None:
    header(c, 3, "매물 입력과 저장")
    c.setFillColorRGB(*NAVY)
    c.setFont("MalgunBd", 20)
    c.drawString(48, H - 150, "매물 정보 넣고, 템플릿 고르고, 저장")
    bullets = [
        "거래 유형·가격·면적·층·방향·입주 가능일을 입력합니다.",
        "주소는 동 단위까지만 입력하는 것을 권장합니다.",
        "첫 번째 사진이 표지, 두 번째·세 번째 사진이 상세 사진으로 사용됩니다.",
        "강조 포인트를 선택하면 카드와 문구가 더 구체적으로 바뀝니다.",
        "표지·정보·연락처 카드를 PNG로 저장하거나 A4 전단지로 인쇄합니다.",
    ]
    y = H - 190
    for b in bullets:
        c.setFillColorRGB(*ORANGE)
        c.setFont("MalgunBd", 11)
        c.drawString(48, y, "•")
        c.setFillColorRGB(*MUTED)
        c.setFont("Malgun", 10)
        y = wrap(c, b, 62, y, W - 110, 10, 16) - 6
    # sample images
    img1 = ImageReader(str(BASE / "assets" / "img" / "samples" / "apartment-1.jpg"))
    img2 = ImageReader(str(BASE / "assets" / "img" / "samples" / "living-1.jpg"))
    c.drawImage(img1, 48, 110, width=235, height=150, preserveAspectRatio=True, anchor="c", mask="auto")
    c.drawImage(img2, W - 283, 110, width=235, height=150, preserveAspectRatio=True, anchor="c", mask="auto")
    c.setFillColorRGB(*MUTED)
    c.setFont("Malgun", 8)
    c.drawString(48, 94, "표지 사진 예시")
    c.drawRightString(W - 48, 94, "상세 사진 예시")
    c.showPage()


def page_4(c: canvas.Canvas) -> None:
    header(c, 4, "인쇄와 FAQ")
    c.setFillColorRGB(*NAVY)
    c.setFont("MalgunBd", 20)
    c.drawString(48, H - 150, "A4 전단지 인쇄")
    c.setFillColorRGB(*MUTED)
    c.setFont("Malgun", 10)
    wrap(
        c,
        "A4 탭에서 ‘인쇄/PDF’를 누르면 300dpi JPG가 준비됩니다. 인쇄 창에서 용지 A4, 배율 100%, 여백 없음, 배경 그래픽 켜기를 선택하세요. 대량 인쇄는 JPG 파일을 인쇄소에 전달하는 것이 안정적입니다.",
        48,
        H - 180,
        W - 96,
        10,
        17,
    )
    c.setFillColorRGB(*NAVY)
    c.setFont("MalgunBd", 14)
    c.drawString(48, H - 310, "자주 묻는 질문")
    faqs = [
        ("설치가 필요한가요?", "아니요. 브라우저에서 바로 사용합니다."),
        ("매물 정보는 어디에 저장되나요?", "앱을 연 브라우저에만 저장됩니다. 서버로 전송되지 않습니다."),
        ("다른 기기에서도 쓸 수 있나요?", "같은 라이선스 키를 새 브라우저에 입력하면 됩니다. 작업 내용은 기기별로 새로 입력해야 합니다."),
        ("사진이 서버에 올라가나요?", "아니요. 사진은 브라우저에서 압축·저장됩니다."),
        ("환불은 어떻게 하나요?", "디지털 상품 특성상 키 발급 후 제한됩니다. 자세한 기준은 크몽 상품 페이지를 확인해 주세요."),
    ]
    y = H - 340
    for q, a in faqs:
        c.setFillColorRGB(*NAVY)
        c.setFont("MalgunBd", 10)
        c.drawString(48, y, "Q. " + q)
        y -= 16
        c.setFillColorRGB(*MUTED)
        c.setFont("Malgun", 9)
        y = wrap(c, "A. " + a, 48, y, W - 96, 9, 14) - 12
    c.setFillColorRGB(*CREAM)
    c.roundRect(48, 100, W - 96, 80, 10, fill=1, stroke=0)
    c.setFillColorRGB(*NAVY)
    c.setFont("MalgunBd", 10)
    c.drawString(66, 156, "문의")
    c.setFont("Malgun", 9)
    c.setFillColorRGB(*MUTED)
    c.drawString(66, 138, "구매·라이선스·인쇄 문의는 크몽 메시지로 보내주세요.")
    c.drawString(66, 122, "영업일 기준 24시간 이내에 답변드립니다.")
    c.showPage()


def main() -> None:
    c = canvas.Canvas(str(OUT), pagesize=A4)
    c.setTitle("매물한장 Pro 사용 가이드")
    c.setAuthor("매물한장")
    page_1(c)
    page_2(c)
    page_3(c)
    page_4(c)
    c.save()
    print("saved", OUT, OUT.stat().st_size)


if __name__ == "__main__":
    main()
