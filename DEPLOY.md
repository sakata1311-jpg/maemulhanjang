# 배포 가이드

매물한장은 **정적 사이트**입니다. 서버·DB·빌드가 필요 없습니다.
HTML/CSS/JS 파일을 그대로 올리면 됩니다.

---

## 1. 배포 전 3가지

### (1) 사이트 URL 정하기

- 도메인 구매: `maemulhanjang.com` (또는 원하는 도메인)
- 도메인 없이 시작: `https://아이디.github.io/저장소`
- Cloudflare Pages: `https://프로젝트.pages.dev`

정한 URL을 기준으로 canonical·OG·sitemap을 맞춥니다.

```powershell
# 커스텀 도메인
python scripts/set_site_url.py "https://maemulhanjang.com" --email "실제수신이메일"

# GitHub Pages (도메인 없이)
python scripts/set_site_url.py "https://아이디.github.io/저장소" --email "실제수신이메일"
```

이 스크립트는 HTML의 canonical/OG, `sitemap.xml`, `robots.txt`, `blog/feed.xml`,
`assets/js/config.js`의 `siteUrl`/`analytics.domain`과 이메일을 함께 바꿉니다.

### (2) 이메일 수신 설정

사이트에는 `hello@maemulhanjang.com`이 기본으로 들어가 있습니다.
**도메인 메일을 만들지 않았다면 반드시 실제 이메일로 바꾸세요.**

옵션:

- **Gmail/Naver 메일**: `set_site_url.py --email 내주소@gmail.com`
- **도메인 메일**: Cloudflare Email Routing(무료 포워딩) 또는 Zoho Mail(무료 플랜)
  - 예: `hello@maemulhanjang.com` → 개인 Gmail로 포워딩
- 발송 테스트 필수: 사이트의 구매 문의 버튼으로 메일을 보내 본다.

### (3) 결제 수단

| 방법 | 장점 | 단점 |
|---|---|---|
| 계좌이체 + 수동 키 발급 | 수수료 0%, 즉시 시작 | 수동 응대, 세금계산서 직접 |
| 크몽 | 국내 결제·정산 편함 | 수수료, 상품 등록 심사 |
| Lemon Squeezy | 글로벌 카드, merchant of record | 입금 주기, 수수료 |
| Gumroad | 간단한 디지털 상품 판매 | 수수료, 국내 세금 처리 확인 |
| Toss/PortOne | 국내 카드·간편결제 | 사업자/계약 필요 |

**추천:** 첫 매출은 **계좌이체 + 이메일 수동 발급**으로 시작하고,
월 10건을 넘으면 PG/스토어를 연결합니다.

결제 링크가 생기면 `assets/js/config.js`의 `checkoutUrl`에 넣습니다.

```js
checkoutUrl: "https://your-checkout-link.com/...",
```

그러면 앱의 Pro 모달과 가격 페이지 버튼이 해당 링크로 연결됩니다.
(라이선스 키는 결제 후 수동 발급하거나, Lemon Squeezy의 라이선스 기능을 별도 연결)

---

## 2. GitHub Pages (추천)

### 2-1. 저장소 만들기

1. GitHub 로그인 → **New repository**
2. 이름: `maemulhanjang` (또는 `아이디.github.io`)
3. **Public** 선택 (무료 Pages는 public 필요)
4. README/ignore 추가하지 않고 생성

### 2-2. 파일 올리기

Git이 설치되어 있다면:

```powershell
cd "G:\부업 폴더\MoneyMaker"
git init
git add .
git commit -m "Launch Maemul Hanjang"
git branch -M main
git remote add origin https://github.com/아이디/저장소.git
git push -u origin main
```

> `secrets/`와 `licenses/`는 `.gitignore`에 의해 제외됩니다. 반드시 `git status`로 확인하세요.

Git 없이도 GitHub 웹에서 파일을 업로드할 수 있지만, 폴더 구조가 많아 Git 사용을 권장합니다.

### 2-3. Pages 켜기

1. 저장소 **Settings → Pages**
2. **Build and deployment → Source: Deploy from a branch**
3. Branch: `main`, Folder: `/ (root)`
4. Save
5. 1~2분 후 `https://아이디.github.io/저장소/` 접속

### 2-4. 도메인 없이 쓸 때

```powershell
python scripts/set_site_url.py "https://아이디.github.io/저장소"
git add .
git commit -m "Set site URL"
git push
```

---

## 3. Cloudflare Pages

1. Cloudflare 계정 → **Workers & Pages → Create → Pages → Connect to Git**
2. 저장소 선택
3. Build command: **비워둠**
4. Build output directory: **`/`** (또는 `.`)
5. Deploy

또는 **Direct Upload**으로 폴더를 드래그해도 됩니다.
(단, 업데이트마다 수동 업로드)

---

## 4. Netlify

1. Netlify → **Add new site → Deploy manually**
2. 폴더 전체를 드래그
3. 또는 Git 연결: Build command 없음, Publish directory `.`

---

## 5. 커스텀 도메인 (maemulhanjang.com)

### 5-1. 도메인 구매

- Cloudflare Registrar, Namecheap, Gabia, 후이즈 등
- `.com` 기준 연 1.5만~2.5만 원 수준 (판매처별 상이)
- 구매 후 WHOIS privacy 설정

### 5-2. GitHub Pages DNS

도메인 DNS에 아래를 설정합니다.

**A 레코드 (루트)**

| Type | Name | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

**CNAME (www)**

| Type | Name | Value |
|---|---|---|
| CNAME | www | 아이디.github.io |

그다음 GitHub 저장소 **Settings → Pages → Custom domain**에 `maemulhanjang.com` 입력,
**Enforce HTTPS** 체크.

### 5-3. Cloudflare Pages DNS

- CNAME `@` → `프로젝트.pages.dev` (Cloudflare는 CNAME flattening 지원)
- CNAME `www` → `프로젝트.pages.dev`
- SSL/TLS: Full (strict)

### 5-4. 배포 후

```powershell
python scripts/set_site_url.py "https://maemulhanjang.com" --email "hello@maemulhanjang.com"
```

DNS 전파는 최대 24시간. HTTPS 인증서 발급까지 기다립니다.

---

## 6. 이메일 (도메인 메일)

### Cloudflare Email Routing (무료)

1. 도메인을 Cloudflare에 연결
2. **Email → Email Routing → Enable**
3. Custom address: `hello@maemulhanjang.com` → Forward to: 개인 Gmail
4. Gmail에서 수신 확인 → 필요 시 “Send mail as” 설정

### Zoho Mail (무료 플랜)

- 도메인 소유 확인 → MX 레코드 설정 → 사용자 계정 생성
- 무료 플랜은 웹메일/IMAP 제공

> 사이트의 구매 문의가 이 메일로 오므로, **반드시 수신 테스트**를 하세요.

---

## 7. 결제 연결

### Lemon Squeezy 예시

1. 계정 생성 → Store 설정
2. Product: “매물한장 Pro 평생 라이선스”, 가격 29,000 KRW
3. Checkout URL 복사 → `config.js`의 `checkoutUrl`에 입력
4. 라이선스 키 자동 발급을 쓰려면 Lemon Squeezy의 License API를 별도 연동
   (현재 앱은 오프라인 키를 사용하므로, 결제 후 수동 발급이 가장 간단)

### 크몽 예시

1. 크몽 판매자 가입
2. “매물 전단지·카드뉴스 자동 생성 프로그램 평생 이용권” 등록
3. 구매자에게 이메일로 라이선스 키 발급
4. 크몽 정산 주기 확인

### 계좌이체 예시

1. 구매 문의 수신
2. 금액/입금 계좌 안내
3. 입금 확인
4. `make_license.py`로 키 발급
5. 이메일 발송 + 기록

---

## 8. 분석 설정 (선택)

### Plausible

1. Plausible 계정/사이트 추가
2. 각 HTML의 `</head>` 앞에 스크립트 추가:

```html
<script defer data-domain="maemulhanjang.com" src="https://plausible.io/js/script.js"></script>
```

3. `config.js`에서 `analytics.provider: "plausible"`로 변경
4. 앱 이벤트(`export_png`, `export_zip`, `open_pro_modal` 등)가 자동 전송됩니다.

### Search Console / 서치어드바이저

- Google Search Console: 속성 추가 → `sitemap.xml` 제출
- 네이버 서치어드바이저: 사이트 등록 → `sitemap.xml` 제출
- 네이버는 `naver-site-verification` 메타 태그를 `index.html` head에 추가

---

## 9. 배포 후 체크리스트

- [ ] `/` 랜딩 정상
- [ ] `/app.html` 데모 매물·사진 표시
- [ ] 모바일에서 정보 입력/미리보기 전환
- [ ] Free: 워터마크·Pro 잠금
- [ ] Pro 데모: A4 JPG·ZIP·인쇄
- [ ] `/pricing.html` 가격·구매 문의
- [ ] `/blog/` 글 6개·이미지
- [ ] `/sitemap.xml` 접속
- [ ] `/robots.txt` 접속
- [ ] 이메일 수신 테스트
- [ ] HTTPS 자물쇠
- [ ] 콘솔 에러 없음
- [ ] `secrets/`가 배포되지 않았는지 확인 (public repo에서 절대 접근 불가)

---

## 10. 업데이트 배포

```powershell
# 수정 후
python scripts/check_site.py
git add .
git commit -m "Update ..."
git push
```

GitHub Pages는 push 후 1~2분 내 반영됩니다.
CSS/JS 캐시가 문제되면 `app.html`의 `?v=20261105` 같은 버전 쿼리를 올리세요.

---

## 11. 문제 해결

| 증상 | 확인 |
|---|---|
| 404 | Pages Source/branch, 파일 경로 대소문자 |
| CSS/JS 안 먹음 | 경로, 캐시, `?v=` 쿼리 |
| 이미지 안 보임 | WebP 경로, 대소문자, Git LFS 여부 |
| 도메인 연결 안 됨 | DNS A/CNAME, 24시간 대기, HTTPS 인증서 |
| 이메일 안 옴 | 스팸함, MX/Email Routing, 주소 오타 |
| 결제 버튼이 안 됨 | `checkoutUrl`이 비어 있는지 확인 (비어 있으면 가격 페이지 문의로 이동) |
| 라이선스 활성화 실패 | 키 공백, 만료, `verify_license.py`, HTTPS 여부 |

---

## 12. 보안 주의

- `secrets/license_private.pem`은 **절대** GitHub/블로그/메신저에 올리지 않습니다.
- public 저장소에 올리기 전 `git status`와 `.gitignore`를 확인합니다.
- 고객 이메일/라이선스 기록(`licenses/`)도 커밋하지 않습니다.
- 사이트에는 개인정보처리방침·이용약관 링크가 포함되어 있습니다. 정식 판매 전 사업자 정보와
  환불 정책을 실제 운영에 맞게 검토하세요.
