# -*- coding: utf-8 -*-
"""Build the blog, sitemap, robots.txt and RSS feed from scripts/site_content.py."""
from __future__ import annotations

import datetime as dt
import html
import pathlib
import re
import sys
from xml.sax.saxutils import escape as xml_escape

BASE = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE / "scripts"))
from site_content import POSTS  # noqa: E402

SITE = "https://maemulhanjang.com"
BRAND = "매물한장"
TODAY = dt.date.today().isoformat()

POSTS = sorted(POSTS, key=lambda post: post["date"], reverse=True)


def human_date(value: str) -> str:
    return value.replace("-", ".")


def blog_thumb(post: dict) -> str:
    return f"../assets/img/blog/{pathlib.Path(post['thumb']).stem}.webp"


def nav(active: str) -> str:
    items = [
        ("templates.html", "템플릿", "templates"),
        ("guide.html", "사용법", "guide"),
        ("pricing.html", "요금", "pricing"),
        ("blog/index.html", "블로그", "blog"),
    ]
    links = []
    for href, label, key in items:
        current = ' aria-current="page"' if key == active else ""
        links.append(f'<a href="../{href}"{current}>{label}</a>')
    return "\n".join(links)


def header(active: str) -> str:
    return f"""  <header class="site-header">
    <div class="wrap nav">
      <a class="brand" href="../index.html" aria-label="매물한장 홈">
        <img class="brand-mark" src="../assets/img/logo-mark.svg" alt="" width="38" height="38">
        <span class="brand-word"><strong>매물한장</strong><span>MAEMUL HANJANG</span></span>
      </a>
      <nav class="nav-links" aria-label="주요 메뉴">{nav(active)}</nav>
      <div class="nav-actions">
        <a class="btn btn-primary btn-sm" href="../app.html">무료로 만들기 <span class="arrow">→</span></a>
        <button class="nav-toggle" type="button" aria-label="메뉴 열기" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span></button>
      </div>
    </div>
  </header>
  <div class="mobile-menu" id="mobile-menu">
    <a href="../templates.html">템플릿 <span>→</span></a>
    <a href="../guide.html">사용법 <span>→</span></a>
    <a href="../pricing.html">요금 <span>→</span></a>
    <a href="../blog/index.html">블로그 <span>→</span></a>
    <a class="btn btn-primary" href="../app.html">무료로 만들기 <span class="arrow">→</span></a>
  </div>"""


def footer() -> str:
    return f"""  <footer class="site-footer">
    <div class="wrap">
      <div class="footer-top">
        <div class="footer-brand">
          <a class="brand" href="../index.html" aria-label="매물한장 홈">
            <img class="brand-mark" src="../assets/img/logo-mark.svg" alt="" width="38" height="38">
            <span class="brand-word"><strong style="color:var(--paper)">매물한장</strong><span>MAEMUL HANJANG</span></span>
          </a>
          <p>공인중개사의 매물 홍보 시간을 줄이는 도구. Windows 프로그램과 브라우저에서 동작하고, 매물 정보는 외부로 전송되지 않습니다.</p>
        </div>
        <div class="footer-col"><h4>제품</h4><a href="../app.html">매물 만들기</a><a href="../templates.html">템플릿</a><a href="../pricing.html">요금</a><a href="../guide.html">사용법</a></div>
        <div class="footer-col"><h4>자료</h4><a href="../blog/index.html">블로그</a><a href="../blog/realtor-instagram-cardnews.html">인스타 카드뉴스 가이드</a><a href="../blog/flyer-required-disclosures.html">광고 표기 체크리스트</a></div>
        <div class="footer-col"><h4>문의</h4><a href="mailto:sakata1311@gmail.com" data-contact-email data-contact-text>sakata1311@gmail.com</a><a href="../legal/terms.html">이용약관</a><a href="../legal/privacy.html">개인정보처리방침</a></div>
      </div>
      <div class="footer-bottom">
        <p>© <span data-year>2026</span> 매물한장. All rights reserved. 매물한장은 공인중개사의 광고물 제작을 돕는 도구이며, 광고 내용의 정확성과 법적 표기 의무는 사용자에게 있습니다.</p>
        <div class="footer-legal"><a href="../legal/terms.html">이용약관</a><a href="../legal/privacy.html">개인정보처리방침</a></div>
      </div>
    </div>
  </footer>"""


def head(title: str, description: str, canonical: str, image: str = "assets/img/og.png", article: dict | None = None) -> str:
    article_meta = ""
    if article:
        article_meta = f"""
  <meta property="article:published_time" content="{article['date']}">
  <meta property="article:section" content="{html.escape(article['category'])}">
  <meta name="author" content="매물한장 편집부">"""
    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html.escape(title)}</title>
  <meta name="description" content="{html.escape(description)}">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="{canonical}">
  <meta property="og:type" content="{'article' if article else 'website'}">
  <meta property="og:locale" content="ko_KR">
  <meta property="og:site_name" content="매물한장">
  <meta property="og:title" content="{html.escape(title)}">
  <meta property="og:description" content="{html.escape(description)}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="{SITE}/{image}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{html.escape(title)}">
  <meta name="twitter:description" content="{html.escape(description)}">
  <meta name="twitter:image" content="{SITE}/{image}">
  <meta name="theme-color" content="#0e1a2b">{article_meta}
  <link rel="icon" href="../assets/img/favicon.svg" type="image/svg+xml">
  <link rel="preload" href="../assets/fonts/PretendardVariable.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;600;700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/css/site.css">
</head>"""


def cta_block() -> str:
    return f"""      <div class="post-cta">
        <div>
          <h2>오늘 매물, 오늘 홍보하세요.</h2>
          <p>매물 정보와 사진만 넣으면 카드뉴스·A4 전단지·문구를 만들 수 있습니다.</p>
        </div>
        <a class="btn btn-primary" href="../app.html">무료로 만들어보기 <span class="arrow">→</span></a>
      </div>"""


def build_index() -> str:
    cards = []
    for post in POSTS:
        cards.append(
            f"""        <a class="post-card" href="{post['slug']}.html">
          <div class="post-thumb">
            <img src="{blog_thumb(post)}" alt="{html.escape(post['title'])}" loading="lazy">
            <span class="badge badge--ink">{html.escape(post['category'])}</span>
          </div>
          <div class="post-body">
            <h2>{html.escape(post['title'])}</h2>
            <p>{html.escape(post['description'])}</p>
            <div class="post-meta"><span>{human_date(post['date'])}</span><i></i><span>{post['read']} 읽기</span></div>
          </div>
        </a>"""
        )
    structured = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "매물한장 블로그",
        "url": f"{SITE}/blog/",
        "description": "공인중개사를 위한 매물 홍보·전단지·카드뉴스·블로그 마케팅 가이드",
    }
    import json

    return f"""{head("블로그 | 매물한장 — 매물 홍보·전단지·카드뉴스 가이드", "공인중개사를 위한 매물 카드뉴스, A4 전단지, 블로그 글쓰기, 광고 표기 가이드를 정리합니다.", f"{SITE}/blog/", "assets/img/og.png")}
<body>
  <a class="skip-link" href="#main">본문으로 바로가기</a>
{header("blog")}
  <main id="main">
    <section class="page-hero">
      <div class="wrap">
        <nav class="breadcrumbs" aria-label="현재 위치"><a href="../index.html">홈</a><span>/</span><span>블로그</span></nav>
        <h1>매물 홍보,<br><em>현장에서 바로 쓰는 글.</em></h1>
        <p class="lead">카드뉴스 사이즈부터 A4 인쇄, 광고 표기, 블로그 글쓰기까지. 공인중개사의 매물 마케팅에 필요한 내용을 현장에 맞게 정리합니다.</p>
      </div>
    </section>
    <section class="section">
      <div class="wrap">
        <div class="post-grid">
{chr(10).join(cards)}
        </div>
      </div>
    </section>
    <section class="cta-band">
      <div class="wrap cta-inner">
        <div><h2>읽는 것에서 끝내지 말고,<br>오늘 바로 만들어보세요.</h2><p>샘플 매물로 결과물을 확인할 수 있습니다.</p></div>
        <div class="cta-actions"><a class="btn btn-primary btn-lg" href="../app.html">무료로 만들기 <span class="arrow">→</span></a><a class="btn btn-outline-light btn-lg" href="../pricing.html">요금 보기</a></div>
      </div>
    </section>
  </main>
{footer()}
  <script src="../assets/js/config.js"></script>
  <script src="../assets/js/common.js"></script>
  <script type="application/ld+json">{json.dumps(structured, ensure_ascii=False)}</script>
</body>
</html>"""


def extract_toc(body: str) -> str:
    matches = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', body)
    if not matches:
        return ""
    links = "\n".join(
        f'<a href="#{html.escape(anchor)}">{re.sub(r"<[^>]+>", "", title)}</a>' for anchor, title in matches
    )
    return f"""        <nav class="article-toc" aria-label="글 목차">
          <strong>이 글의 목차</strong>
          {links}
        </nav>"""


def build_post(post: dict) -> str:
    import json

    related = [p for p in POSTS if p["slug"] != post["slug"]]
    related = related[:2]
    related_cards = "\n".join(
        f"""          <a class="post-card" href="{p['slug']}.html">
            <div class="post-thumb"><img src="{blog_thumb(p)}" alt="{html.escape(p['title'])}" loading="lazy"><span class="badge badge--ink">{html.escape(p['category'])}</span></div>
            <div class="post-body"><h2>{html.escape(p['title'])}</h2><p>{html.escape(p['description'])}</p><div class="post-meta"><span>{human_date(p['date'])}</span><i></i><span>{p['read']} 읽기</span></div></div>
          </a>"""
        for p in related
    )
    canonical = f"{SITE}/blog/{post['slug']}.html"
    image = f"assets/img/samples/{post['thumb']}"
    article_ld = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post["title"],
        "description": post["description"],
        "image": f"{SITE}/{image}",
        "datePublished": post["date"],
        "dateModified": post["date"],
        "author": {"@type": "Organization", "name": "매물한장 편집부"},
        "publisher": {"@type": "Organization", "name": "매물한장", "logo": {"@type": "ImageObject", "url": f"{SITE}/assets/img/logo-mark.svg"}},
        "mainEntityOfPage": {"@type": "WebPage", "@id": canonical},
        "articleSection": post["category"],
        "inLanguage": "ko-KR",
    }
    breadcrumb_ld = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "홈", "item": f"{SITE}/"},
            {"@type": "ListItem", "position": 2, "name": "블로그", "item": f"{SITE}/blog/"},
            {"@type": "ListItem", "position": 3, "name": post["title"], "item": canonical},
        ],
    }
    toc = extract_toc(post["body"])
    return f"""{head(post['title'] + ' | 매물한장', post['description'], canonical, image, post)}
<body>
  <a class="skip-link" href="#main">본문으로 바로가기</a>
{header("blog")}
  <main id="main">
    <article>
      <div class="wrap">
        <header class="post-head">
          <nav class="breadcrumbs" aria-label="현재 위치"><a href="../index.html">홈</a><span>/</span><a href="index.html">블로그</a><span>/</span><span>{html.escape(post['category'])}</span></nav>
          <p class="kicker">{html.escape(post['category'])}</p>
          <h1>{html.escape(post['title'])}</h1>
          <p class="post-deck">{html.escape(post['deck'])}</p>
          <div class="post-meta-line"><span class="avatar">매</span><span>매물한장 편집부</span><span>·</span><time datetime="{post['date']}">{human_date(post['date'])}</time><span>·</span><span>{post['read']} 읽기</span></div>
        </header>
        <figure class="post-cover"><img src="{blog_thumb(post)}" alt="{html.escape(post['title'])}"></figure>
      </div>
      <div class="wrap post-content">
        <div class="prose">
{toc}
{post['body']}
        </div>
{cta_block()}
        <section class="post-related">
          <h2>이어서 읽기</h2>
          <div class="post-grid">
{related_cards}
          </div>
        </section>
      </div>
    </article>
  </main>
{footer()}
  <script src="../assets/js/config.js"></script>
  <script src="../assets/js/common.js"></script>
  <script type="application/ld+json">{json.dumps(article_ld, ensure_ascii=False)}</script>
  <script type="application/ld+json">{json.dumps(breadcrumb_ld, ensure_ascii=False)}</script>
</body>
</html>"""


def build_sitemap() -> str:
    static = [
        ("/", TODAY, "weekly", "1.0"),
        ("/app.html", TODAY, "monthly", "0.9"),
        ("/templates.html", TODAY, "monthly", "0.8"),
        ("/pricing.html", TODAY, "monthly", "0.9"),
        ("/guide.html", TODAY, "monthly", "0.8"),
        ("/blog/", TODAY, "weekly", "0.8"),
        ("/legal/terms.html", TODAY, "yearly", "0.2"),
        ("/legal/privacy.html", TODAY, "yearly", "0.2"),
    ]
    rows = [
        f"  <url><loc>{SITE}{path}</loc><lastmod>{mod}</lastmod><changefreq>{freq}</changefreq><priority>{prio}</priority></url>"
        for path, mod, freq, prio in static
    ]
    for post in POSTS:
        rows.append(
            f"  <url><loc>{SITE}/blog/{post['slug']}.html</loc><lastmod>{post['date']}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>"
        )
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(rows)}
</urlset>
"""


def build_rss() -> str:
    items = []
    for post in POSTS:
        link = f"{SITE}/blog/{post['slug']}.html"
        items.append(
            f"""    <item>
      <title>{xml_escape(post['title'])}</title>
      <link>{link}</link>
      <guid>{link}</guid>
      <pubDate>{dt.datetime.strptime(post['date'], '%Y-%m-%d').strftime('%a, %d %b %Y 00:00:00 +0900')}</pubDate>
      <description>{xml_escape(post['description'])}</description>
    </item>"""
        )
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>매물한장 블로그</title>
    <link>{SITE}/blog/</link>
    <description>공인중개사를 위한 매물 홍보·전단지·카드뉴스 가이드</description>
    <language>ko</language>
    <lastBuildDate>{dt.datetime.now().strftime('%a, %d %b %Y %H:%M:%S +0900')}</lastBuildDate>
{chr(10).join(items)}
  </channel>
</rss>
"""


def main() -> None:
    blog = BASE / "blog"
    blog.mkdir(exist_ok=True)
    (blog / "index.html").write_text(build_index(), encoding="utf-8")
    for post in POSTS:
        (blog / f"{post['slug']}.html").write_text(build_post(post), encoding="utf-8")
    (BASE / "sitemap.xml").write_text(build_sitemap(), encoding="utf-8")
    (BASE / "blog" / "feed.xml").write_text(build_rss(), encoding="utf-8")
    (BASE / "robots.txt").write_text(
        "User-agent: *\nAllow: /\n\nSitemap: https://maemulhanjang.com/sitemap.xml\n",
        encoding="utf-8",
    )
    print(f"Built {len(POSTS)} posts, blog index, sitemap.xml, robots.txt, feed.xml")


if __name__ == "__main__":
    main()
