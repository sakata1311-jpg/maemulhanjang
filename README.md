# 매물한장 (Maemul Hanjang)

공인중개사를 위한 **매물 홍보물 생성 웹앱**입니다. 매물 정보와 사진을 한 번 입력하면
인스타 카드뉴스(4:5 · 1:1 · 스토리), A4 전단지, 문자·블로그 문구를 브라우저에서 바로 만듭니다.

- 회원가입·설치·서버 업로드 없음
- 매물 정보와 사진은 **IndexedDB / localStorage**에만 저장
- Pro 라이선스는 **오프라인 전자서명 키**로 확인 (서버·PG 없이 판매 가능)
- 정적 HTML/CSS/JS만으로 동작 → GitHub Pages, Cloudflare Pages, Netlify에 그대로 배포

---

## 1. 빠르게 실행하기

Python 3.10+만 있으면 됩니다.

```powershell
cd "G:\부업 폴더\MoneyMaker"
python scripts/serve.py
```

브라우저에서 <http://127.0.0.1:8765/> 를 엽니다.

> `python -m http.server 8765`로도 충분합니다. `serve.py`는 캐시를 끄고 UTF-8 응답을 안정적으로
> 제공하기 위한 편의 스크립트입니다.

- 랜딩: `/index.html`
- 스튜디오: `/app.html`
- 요금: `/pricing.html`
- 템플릿: `/templates.html`
- 가이드: `/guide.html`
- 블로그: `/blog/index.html`

> 로컬에서 Pro 기능을 시험하려면 `app.html`에서 **Pro 업그레이드 → 데모 Pro로 체험하기**를 누르거나
> `app.html?demo=1`로 접속하세요. 데모 Pro는 `localhost`/`127.0.0.1`에서만 동작합니다.

---

## 2. 핵심 기능

| 기능 | Free | Pro |
|---|---|---|
| 카드뉴스 4:5 | ✓ | ✓ |
| 기본 템플릿 2종 | ✓ | ✓ |
| 전체 템플릿 6종 | — | ✓ |
| A4 전단지 300dpi | — | ✓ |
| 1:1 · 스토리 규격 | — | ✓ |
| 워터마크 | 포함 | 제거 |
| 사진 | 3장 | 5장 |
| 전체 ZIP | — | ✓ |
| 사용 기간 | 무료 | 평생 |

- 템플릿: 시티 · 선셋 · 포레스트 · 모노 · 스카이 · 크림
- 출력: 표지 · 정보 · 연락처 · A4 전단지 (A4는 JPG, 2480×3508px)
- 문구: 표지 제목, 서브 문구, 인스타 캡션, 문자, 블로그 초안 자동 생성
- QR: 중개사 정보의 `QR 링크`로 자동 생성
- 저장: 자동 저장(브라우저), PNG/JPG 개별 저장, ZIP 일괄 저장, 인쇄/PDF

---

## 3. 폴더 구조

```
.
├─ index.html               랜딩
├─ app.html                 매물 스튜디오 (핵심)
├─ pricing.html             요금·구매 안내
├─ templates.html           템플릿 갤러리
├─ guide.html               사용 가이드·광고 표기 체크
├─ blog/                    블로그 (build_site.py 생성)
├─ legal/                   이용약관·개인정보처리방침
├─ assets/
│  ├─ css/                  site.css, app.css, slides.css
│  ├─ js/
│  │  ├─ config.js          브랜드·가격·결제·문의 설정
│  │  ├─ studio.js          스튜디오 로직
│  │  ├─ templates.js       슬라이드 HTML 렌더러
│  │  ├─ copy.js            한국어 문구 생성
│  │  ├─ license.js         오프라인 라이선스 검증
│  │  ├─ license-public.js  공개키 (자동 생성)
│  │  └─ vendor/            html-to-image, JSZip, qrcode-generator
│  ├─ img/templates/        마케팅용 템플릿 커버 (WebP)
│  ├─ img/samples/          데모·블로그용 샘플 사진
│  └─ fonts/                Pretendard
├─ scripts/
│  ├─ gen_keys.py           라이선스 키쌍 생성 (최초 1회)
│  ├─ make_license.py       고객 라이선스 키 발급
│  ├─ verify_license.py     키 검증 (CS 대응)
│  ├─ build_site.py         블로그·sitemap·RSS 생성
│  ├─ check_site.py         링크·메타·이미지 검사
│  ├─ make_assets.py        OG 이미지·QR 생성
│  ├─ make_blog_images.py   블로그 WebP 생성
│  ├─ set_site_url.py       배포 URL 일괄 변경
│  └─ ...
├─ PLAN.md                  사업 기획·90일 로드맵
├─ OPERATIONS.md            운영 플레이북
├─ DEPLOY.md                배포·도메인·결제 설정
├─ marketing/               인스타·커뮤니티·아웃리치 소재
├─ secrets/                 ⚠️ 절대 커밋 금지 (gitignore)
└─ assets/js/config.js      사이트 설정
```

---

## 4. 설정 (배포 전 필수)

`assets/js/config.js`:

```js
window.MH_CONFIG = {
  brand: "매물한장",
  siteUrl: "https://maemulhanjang.com",
  contactEmail: "hello@maemulhanjang.com",
  checkoutUrl: "",              // Lemon Squeezy / Gumroad / Toss 결제 링크
  launchPrice: 29000,
  regularPrice: 49000,
  launchEnds: "2026-12-31",
  analytics: { provider: "", domain: "maemulhanjang.com" },
};
```

### 반드시 바꿔야 하는 것

1. **contactEmail**: 실제 수신 가능한 이메일로 바꾸세요. 도메인 메일을 만들지 않았다면
   Gmail 등 실제 주소로 임시 변경하는 것이 안전합니다.
   - `index.html`, `pricing.html`, `guide.html`, `legal/*.html`, `app.html`의 `hello@...`도 함께 바꾸려면
     아래 명령을 사용하세요.
     ```powershell
     python scripts/set_site_url.py "https://내도메인.com" --email "내이메일@gmail.com"
     ```
     (스크립트는 `--email`을 주면 사이트 내 이메일도 함께 바꿉니다.)
2. **checkoutUrl**: 결제 링크가 없다면 비워두세요. 구매 버튼은 가격 페이지의 이메일 문의로 연결됩니다.
3. **siteUrl / canonical**: 도메인을 사지 않고 GitHub Pages에 먼저 올리면
   `python scripts/set_site_url.py "https://아이디.github.io/저장소"`로 일괄 변경하세요.
4. **analytics.provider**: 기본은 `""`(꺼짐). Plausible을 쓰려면 `"plausible"`로 바꾸고
   각 HTML의 `</head>` 앞에 Plausible 스크립트를 넣으세요.

---

## 5. 라이선스 판매·발급

### 최초 1회: 키쌍 생성

```powershell
python scripts/gen_keys.py
```

- `secrets/license_private.pem` : **비밀키**. 절대 커밋/공유하지 마세요. 오프라인 백업 필수.
- `assets/js/license-public.js` : 공개키. 앱에 포함되어 배포됩니다.
- `secrets/demo-license.txt` : 로컬 데모용 키(참고용).

> 비밀키를 잃어버리면 기존 고객 키는 계속 검증되지만 **새 키를 발급할 수 없습니다.**
> `gen_keys.py --force`로 키를 교체하면 **기존 키가 모두 무효**가 되므로 사용하지 마세요.

### 고객 키 발급

```powershell
python scripts/make_license.py --email buyer@example.com --name "홍길동" --plan pro --out licenses/hong.txt
```

- `--days 365`를 주면 1년 라이선스, 생략하면 평생.
- 발급 후 이메일로 키를 전달하고, 고객은 앱 우측 상단 **Pro 업그레이드 → 라이선스 키 입력**에서 활성화합니다.
- `licenses/` 폴더는 `.gitignore`에 포함되어 있습니다. 고객 개인정보이므로 커밋하지 마세요.

### 판매 흐름 (PG 없이 시작)

1. 고객이 가격 페이지에서 이메일 문의
2. 입금/결제 확인
3. `make_license.py`로 키 발급
4. 이메일로 키 + 사용 안내 발송
5. 필요 시 `licenses/발급기록.csv`에 기록

결제 링크(Lemon Squeezy, Gumroad, Toss 등)가 준비되면 `checkoutUrl`만 채우면 됩니다.
자세한 내용은 `DEPLOY.md` 참고.

---

## 6. 블로그·사이트 빌드

블로그 글은 `scripts/site_content.py`에 정의되어 있습니다.

```powershell
python scripts/build_site.py
python scripts/check_site.py
```

- `build_site.py` : 블로그 index/posts, `sitemap.xml`, `robots.txt`, `blog/feed.xml` 생성
- `check_site.py` : 내부 링크·이미지·title/description/canonical 검사
- 글 추가: `POSTS` 리스트에 dict 추가 → `build_site.py` 실행
- 마케팅 커버: `assets/img/templates/*.webp` (스튜디오에서 내보낸 실제 결과물)

### 이미지·OG 재생성

```powershell
python scripts/make_assets.py        # og.png, qr-sample.svg
python scripts/make_blog_images.py   # 블로그 WebP
python scripts/use_webp.py           # 템플릿 PNG → WebP 참조 교체
```

> `make_assets.py`는 `segno`, `Pillow`가 필요합니다: `pip install segno pillow`.

---

## 7. 배포

### 가장 쉬운 방법: GitHub Pages

1. GitHub에 **public** 저장소 생성 (예: `maemulhanjang`)
2. 이 폴더를 push
3. 저장소 **Settings → Pages → Build and deployment → Deploy from a branch**
   - Branch: `main`
   - Folder: `/ (root)`
4. `https://아이디.github.io/저장소/` 확인
5. 도메인이 없다면:
   ```powershell
   python scripts/set_site_url.py "https://아이디.github.io/저장소"
   ```
   다시 push.

### Cloudflare Pages / Netlify

- Build command: 없음
- Output directory: `.` (저장소 루트)
- 정적 파일만 있으므로 그대로 배포됩니다.

### 커스텀 도메인

`maemulhanjang.com`을 구매했다면 GitHub Pages 설정의 Custom domain에 입력하고,
DNS에 GitHub Pages A 레코드(185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153)와
`www` CNAME을 설정합니다. 자세한 내용은 `DEPLOY.md`.

---

## 8. 테스트 체크리스트

```powershell
python scripts/check_site.py
```

브라우저에서:

- [ ] `index.html` 데스크톱/모바일 레이아웃
- [ ] `app.html`에서 데모 매물 표시, 사진 3장, 템플릿 전환
- [ ] Free: 워터마크 표시, Pro 템플릿 잠금, A4 저장 차단
- [ ] Pro 데모: 워터마크 제거, A4 JPG 저장, ZIP 저장, 인쇄 창
- [ ] 사진 업로드 → 새로고침 후 유지(IndexedDB)
- [ ] 라이선스 키 활성화/해제
- [ ] `pricing.html` 가격 표시·구매 문의
- [ ] 블로그 글 링크·WebP 이미지
- [ ] 콘솔 에러 없음 (폰트 preload 경고는 무시 가능)

---

## 9. 알려진 한계

- **결제 자동화 없음**: 기본은 이메일/수동 결제입니다. PG를 연결하려면 `checkoutUrl`과
  (선택) 라이선스 자동 발급을 별도로 구현해야 합니다.
- **라이선스는 클라이언트 검증**: 코드를 변조하면 우회할 수 있습니다. 29,000원대 디지털 상품에서는
  현실적인 절충안이지만, 고가 상품이 되면 서버 검증으로 옮기세요.
- **브라우저 저장**: 시크릿 모드/브라우저 데이터 삭제 시 작업 내용이 사라집니다.
  완성한 이미지는 반드시 파일로 저장해야 합니다.
- **사진은 브라우저에서 압축**: 1600px JPEG로 저장되므로 원본 화질이 필요한 인쇄는
  원본 사진을 별도 보관하세요.
- **A4는 JPG**: 인쇄용 파일 크기를 줄이기 위해 300dpi JPG로 저장합니다.
- **광고 법적 책임**: 도구는 표기 영역을 자동 구성하지만 최종 광고의 적법성은 사용자 책임입니다.

---

## 10. 크레딧

- 폰트: [Pretendard](https://github.com/orioncactus/pretendard) (SIL Open Font License)
- 라이브러리: html-to-image (MIT), JSZip (MIT), qrcode-generator (MIT)
- 샘플 사진: Unsplash (무료 사용 허용). `assets/img/samples/` 참고.
- 디자인·기획·구현: 매물한장 프로젝트

샘플 사진은 데모용입니다. 실제 고객 매물 사진으로 교체해 사용하세요.
