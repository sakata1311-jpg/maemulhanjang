/* global MHCopy, qrcode */
(function () {
  "use strict";

  const C = window.MHCopy;

  const TEMPLATES = {
    city: {
      key: "city",
      name: "시티",
      desc: "깔끔한 네이비 · 신뢰감",
      layout: "photo",
      theme: "navy",
      serif: false,
      pro: false,
      defaultAccent: "#d9552a",
    },
    sunset: {
      key: "sunset",
      name: "선셋",
      desc: "따뜻한 크림 · 감성",
      layout: "split",
      theme: "warm",
      serif: true,
      pro: false,
      defaultAccent: "#c25b3a",
    },
    forest: {
      key: "forest",
      name: "포레스트",
      desc: "딥그린 · 고급스러움",
      layout: "frame",
      theme: "green",
      serif: true,
      pro: true,
      defaultAccent: "#c99a3e",
    },
    mono: {
      key: "mono",
      name: "모노",
      desc: "흑백 · 임팩트",
      layout: "editorial",
      theme: "mono",
      serif: false,
      pro: true,
      defaultAccent: "#d9552a",
    },
    sky: {
      key: "sky",
      name: "스카이",
      desc: "밝은 블루 · 친근함",
      layout: "split",
      theme: "blue",
      serif: false,
      pro: true,
      defaultAccent: "#2f5d8c",
    },
    cream: {
      key: "cream",
      name: "크림",
      desc: "미니멀 베이지 · 세련됨",
      layout: "frame",
      theme: "cream",
      serif: true,
      pro: true,
      defaultAccent: "#a98467",
    },
  };

  const qrCache = new Map();

  function qrDataUrl(text) {
    const value = String(text || "").trim();
    if (!value) return "";
    if (qrCache.has(value)) return qrCache.get(value);
    try {
      const qr = qrcode(0, "M");
      qr.addData(value);
      qr.make();
      const url = qr.createDataURL(8, 0);
      qrCache.set(value, url);
      return url;
    } catch (err) {
      return "";
    }
  }

  function safeLink(value) {
    const raw = String(value || "").trim();
    if (!raw) return "https://maemulhanjang.com";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^[\w.-]+\.[a-z]{2,}/i.test(raw)) return "https://" + raw;
    return "https://maemulhanjang.com";
  }

  function safeSrc(value) {
    const raw = String(value || "").trim();
    if (/^data:image\//i.test(raw)) return raw;
    if (/^assets\/img\//i.test(raw)) return raw;
    if (/^https?:\/\//i.test(raw)) return raw;
    return "";
  }

  function logoSvg() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 11 12 4l8.5 7"/><path d="M5.8 9.8V20h12.4V9.8"/><path d="M10 20v-5.2h4V20"/></svg>`;
  }

  function logo() {
    return `<span class="s-logo">${logoSvg()}매물한장</span>`;
  }

  function photo(listing, index, cls) {
    const photos = Array.isArray(listing.photos) ? listing.photos : [];
    const picked = photos[index] || photos[0] || "";
    const src = safeSrc(picked);
    if (!src) return `<div class="${cls} is-empty"></div>`;
    return `<div class="${cls}"><img src="${C.esc(src)}" alt=""></div>`;
  }

  function priceDisplay(listing) {
    const text = C.priceText(listing);
    return text === "가격 문의" ? text : text + "원";
  }

  function coverSpecs(listing) {
    const bits = [];
    if (C.pyeongText(listing)) bits.push(C.pyeongText(listing));
    if (C.floorText(listing)) bits.push(C.floorText(listing));
    if (C.clean(listing.rooms) || C.clean(listing.baths)) {
      bits.push(
        [C.clean(listing.rooms) ? `방 ${C.clean(listing.rooms)}` : "", C.clean(listing.baths) ? `욕실 ${C.clean(listing.baths)}` : ""]
          .filter(Boolean)
          .join(" · ")
      );
    }
    if (C.clean(listing.direction)) bits.push(C.clean(listing.direction));
    if (C.clean(listing.moveIn)) bits.push(C.clean(listing.moveIn));
    return bits
      .filter(Boolean)
      .slice(0, 4)
      .map((b) => `<span class="s-spec">${C.esc(b)}</span>`)
      .join("");
  }

  function detailSpecs(listing) {
    return C.specList(listing)
      .slice(0, 8)
      .map(
        (s) =>
          `<div class="s-spec-item"><span>${C.esc(s.label)}</span><strong>${C.esc(s.value)}</strong></div>`
      )
      .join("");
  }

  function chips(listing, cls) {
    const f = C.features(listing).slice(0, 5);
    if (!f.length) return "";
    return `<div class="${cls || "s-feature-chips"}">${f
      .map((x) => `<span class="${cls ? "a4-chip" : "s-chip"}">${C.esc(x)}</span>`)
      .join("")}</div>`;
  }

  function desc(listing) {
    const text = C.clean(listing.featureText);
    if (text) return C.nl2br(text);
    const f = C.features(listing);
    if (f.length) return `${C.esc(f.join(", "))} 조건을 갖춘 매물입니다. 자세한 사항은 문의 주세요.`;
    return "사진과 정보를 확인하시고, 방문 전 연락 주시면 자세히 안내해 드립니다.";
  }

  function top(listing) {
    return `<header class="s-top"><span class="s-badge">${C.esc(C.dealLabel(listing))}</span>${logo()}</header>`;
  }

  function foot(listing) {
    const b = listing.brand || {};
    const office = C.clean(b.office) || "중개사무소";
    const meta = [C.clean(b.name), C.clean(b.phone)].filter(Boolean).join(" · ");
    const regNo = C.clean(b.regNo);
    const right = [C.addressShort(listing), C.pyeongText(listing)].filter(Boolean).join(" · ");
    return `<footer class="s-foot"><div><strong>${C.esc(office)}</strong>${C.esc(
      meta
    )}${regNo ? `<span class="s-reg">등록번호 ${C.esc(regNo)}</span>` : ""}</div><span>${C.esc(right)}</span></footer>`;
  }

  function watermark(isPro) {
    if (isPro) return "";
    return `<div class="s-watermark"><span>매물한장</span><small>maemulhanjang.com</small></div>`;
  }

  function lockBadge(isPro, tpl) {
    if (isPro || !tpl.pro) return "";
    return `<div class="s-lock">유료 템플릿 · 미리보기</div>`;
  }

  function contactCard(listing) {
    const b = listing.brand || {};
    const office = C.clean(b.office) || "중개사무소 정보를 입력하세요";
    const name = C.clean(b.name);
    const regNo = C.clean(b.regNo);
    const phone = C.clean(b.phone) || "연락처를 입력하세요";
    const address = C.clean(b.address);
    const qr = qrDataUrl(safeLink(b.link));
    const meta = [name, regNo ? `등록번호 ${regNo}` : ""].filter(Boolean).join(" · ");
    return `<div class="s-contact-card">
      <div class="s-contact-info">
        <strong>${C.esc(office)}</strong>
        ${meta ? `<span>${C.esc(meta)}</span>` : ""}
        ${address ? `<span>${C.esc(address)}</span>` : ""}
      </div>
      <div class="s-phone">${C.esc(phone)}</div>
      ${qr ? `<img class="s-qr" src="${qr}" alt="문의 QR 코드">` : ""}
    </div>`;
  }

  function disclaimer(listing) {
    const b = listing.brand || {};
    const reg = C.clean(b.regNo);
    return `매물 정보는 현장 확인이 필요합니다. ${reg ? `중개사무소 등록번호 ${C.esc(reg)}. ` : ""}본 광고는 매물한장으로 제작했습니다.`;
  }

  function baseClass(tpl, type, extra) {
    return [
      "slide",
      `slide-${type}`,
      `layout-${tpl.layout}`,
      `theme-${tpl.theme}`,
      tpl.serif ? "font-serif" : "",
      extra || "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  function accentStyle(listing, tpl) {
    const accent = C.clean(listing.accent) || tpl.defaultAccent;
    return `style="--accent:${C.esc(accent)}"`;
  }

  function cover(listing, tpl, isPro, extraClass) {
    const h = listing.copy && listing.copy.headline ? listing.copy.headline : C.headline(listing);
    const sub = listing.copy && listing.copy.subhead ? listing.copy.subhead : C.subhead(listing);
    const price = priceDisplay(listing);
    const note = C.priceNote(listing);
    const longClass = price.length > 16 ? " is-long" : "";
    return `<div class="${baseClass(tpl, "cover", extraClass)}" data-slide="cover" ${accentStyle(listing, tpl)}>
      ${photo(listing, 0, "s-photo")}
      <div class="s-shade"></div>
      ${top(listing)}
      <div class="s-cover-body">
        <p class="s-eyebrow">${C.esc(C.eyebrow(listing))}</p>
        <h1 class="s-title">${C.nl2br(h)}</h1>
        <p class="s-sub">${C.nl2br(sub)}</p>
        <div class="s-price${longClass}">${C.esc(price)}${
          note ? `<small>${C.esc(note)}</small>` : ""
        }</div>
        <div class="s-specs">${coverSpecs(listing)}</div>
      </div>
      ${foot(listing)}
      ${watermark(isPro)}
      ${lockBadge(isPro, tpl)}
    </div>`;
  }

  function detail(listing, tpl, isPro) {
    const title = [C.clean(listing.complex) || C.addressShort(listing), C.pyeongText(listing)]
      .filter(Boolean)
      .join(" ");
    const price = priceDisplay(listing);
    const note = C.priceNote(listing);
    return `<div class="${baseClass(tpl, "detail")}" data-slide="detail" ${accentStyle(listing, tpl)}>
      ${photo(listing, 1, "s-detail-photo")}
      <div class="s-shade"></div>
      ${top(listing)}
      <div class="s-detail">
        <div class="s-detail-body">
          <p class="s-kicker">매물 정보</p>
          <h2 class="s-detail-title">${C.esc(title || "매물 정보")}</h2>
          <div class="s-price s-price--sm">${C.esc(price)}${note ? `<small>${C.esc(note)}</small>` : ""}</div>
          <div class="s-spec-grid">${detailSpecs(listing)}</div>
          ${chips(listing)}
          <p class="s-desc">${desc(listing)}</p>
        </div>
      </div>
      ${foot(listing)}
      ${watermark(isPro)}
      ${lockBadge(isPro, tpl)}
    </div>`;
  }

  function contact(listing, tpl, isPro) {
    const title = "이 집,\n직접 보시겠어요?";
    const sub = [C.addressShort(listing), C.clean(listing.complex)].filter(Boolean).join(" · ");
    return `<div class="${baseClass(tpl, "contact")}" data-slide="contact" ${accentStyle(listing, tpl)}>
      ${photo(listing, 2, "s-contact-photo")}
      <div class="s-shade"></div>
      ${top(listing)}
      <div class="s-contact-body">
        <p class="s-kicker">문의</p>
        <h2 class="s-contact-title">${C.nl2br(title)}</h2>
        <p class="s-contact-sub">${C.esc(sub || "방문 전 연락 주시면 자세히 안내해 드립니다.")}<br>방문 전 연락 주시면 자세히 안내해 드립니다.</p>
        ${contactCard(listing)}
        <p class="s-disclaimer">${disclaimer(listing)}</p>
      </div>
      ${watermark(isPro)}
      ${lockBadge(isPro, tpl)}
    </div>`;
  }

  function galleryImages(listing) {
    const photos = (Array.isArray(listing.photos) ? listing.photos : [])
      .map((src) => safeSrc(src))
      .filter(Boolean);
    const picks = photos.slice(1, 3);
    if (!picks.length && photos.length) picks.push(photos[0]);
    if (!picks.length) {
      return `<div class="a4-gallery-item is-empty"></div><div class="a4-gallery-item is-empty"></div>`;
    }
    while (picks.length < 2) picks.push(picks[0]);
    return picks
      .map((src) => `<div class="a4-gallery-item"><img src="${C.esc(src)}" alt="매물 상세 사진"></div>`)
      .join("");
  }

  function a4(listing, tpl, isPro) {
    const h = listing.copy && listing.copy.headline ? listing.copy.headline : C.headline(listing);
    const price = priceDisplay(listing);
    const note = C.priceNote(listing);
    const b = listing.brand || {};
    const office = C.clean(b.office) || "중개사무소";
    const name = C.clean(b.name);
    const regNo = C.clean(b.regNo);
    const phone = C.clean(b.phone);
    const address = C.clean(b.address);
    const qr = qrDataUrl(safeLink(b.link));
    const title = [C.clean(listing.complex) || C.addressShort(listing), C.pyeongText(listing)]
      .filter(Boolean)
      .join(" ");
    return `<div class="${baseClass(tpl, "a4")} slide-a4" data-slide="a4" ${accentStyle(listing, tpl)}>
      <header class="a4-head">
        <div class="a4-brand">${logoSvg()}매물한장</div>
        <span class="a4-label">매물 안내 · ${C.esc(C.dealLabel(listing))}</span>
      </header>
      <div class="a4-hero">
        ${photo(listing, 0, "s-photo")}
        <div class="a4-hero-copy">
          <span class="s-badge">${C.esc(C.dealLabel(listing))}</span>
          <p class="a4-eyebrow" style="margin-top:18px">${C.esc(C.eyebrow(listing))}</p>
          <h1 class="a4-title">${C.nl2br(h)}</h1>
          <div class="a4-price${price.length > 16 ? " is-long" : ""}">${C.esc(price)}${note ? `<small>${C.esc(note)}</small>` : ""}</div>
          <div class="a4-specs">${coverSpecs(listing)}</div>
        </div>
      </div>
      <div class="a4-body">
        <div class="a4-top">
          <div class="a4-left">
            <h2>매물 정보</h2>
            <div class="a4-spec-grid">${C.specList(listing)
              .slice(0, 6)
              .map(
                (s) =>
                  `<div class="a4-spec-item"><span>${C.esc(s.label)}</span><strong>${C.esc(
                    s.value
                  )}</strong></div>`
              )
              .join("")}</div>
            <h2>이 매물의 포인트</h2>
            ${chips(listing, "a4-features")}
            <p class="a4-desc">${desc(listing)}</p>
          </div>
          <aside class="a4-side">
            <h2>문의</h2>
            <div class="a4-contact">
              <p class="a4-contact-label">${C.esc(title || "매물 문의")}</p>
              <strong>${C.esc(office)}</strong>
              ${name ? `<span>대표 ${C.esc(name)}</span>` : ""}
              ${regNo ? `<span>등록번호 ${C.esc(regNo)}</span>` : ""}
              ${address ? `<span>${C.esc(address)}</span>` : ""}
              <div class="a4-phone">${C.esc(phone || "연락처를 입력하세요")}</div>
              ${qr ? `<img class="a4-qr" src="${qr}" alt="문의 QR 코드">` : ""}
            </div>
            <p class="a4-note"><strong>확인해 주세요.</strong> 매물 정보와 사진은 실제와 다를 수 있으며, 계약 전 현장 확인이 필요합니다. 광고 내용의 정확성과 법적 표기 의무는 중개사에게 있습니다.</p>
            <div class="a4-visit">
              <strong>방문 안내</strong>
              <p>방문 전 연락 주시면 매물 위치와 주차 안내를 도와드립니다. QR을 찍으면 매물 사진과 상세 정보를 확인할 수 있습니다.</p>
            </div>
          </aside>
        </div>

        <div class="a4-gallery">
          <div class="a4-section-head"><h2>상세 사진</h2><span>사진으로 보는 매물</span></div>
          <div class="a4-gallery-grid">${galleryImages(listing)}</div>
        </div>

        <div class="a4-bottom">
          <div class="a4-check">
            <h2>계약 전 확인하세요</h2>
            <ul>
              <li>등기부등본·건축물대장 확인</li>
              <li>관리비·공과금 정산 확인</li>
              <li>계약 조건과 특약 사항 확인</li>
              <li>현장 방문 후 최종 결정</li>
            </ul>
          </div>
          <div class="a4-cta">
            <span>방문 전 연락 주세요</span>
            <strong>${C.esc(phone || "연락처를 입력하세요")}</strong>
            <span>${C.esc([office, name].filter(Boolean).join(" · "))}</span>
          </div>
        </div>
      </div>
      <footer class="a4-foot">
        <span>${C.esc([office, name ? `대표 ${name}` : "", regNo ? `등록번호 ${regNo}` : "", phone].filter(Boolean).join(" · "))}</span>
        <span>${C.esc(address)}${address ? " · " : ""}매물한장 제작</span>
      </footer>
      ${watermark(isPro)}
      ${lockBadge(isPro, tpl)}
    </div>`;
  }

  function square(listing, tpl, isPro) {
    return cover(listing, tpl, isPro, "slide-square");
  }

  function story(listing, tpl, isPro) {
    return cover(listing, tpl, isPro, "slide-story");
  }

  function render(type, listing, tplKey, isPro) {
    const tpl = TEMPLATES[tplKey] || TEMPLATES.city;
    switch (type) {
      case "detail":
        return detail(listing, tpl, isPro);
      case "contact":
        return contact(listing, tpl, isPro);
      case "a4":
        return a4(listing, tpl, isPro);
      case "square":
        return square(listing, tpl, isPro);
      case "story":
        return story(listing, tpl, isPro);
      case "cover":
      default:
        return cover(listing, tpl, isPro);
    }
  }

  window.MHTemplates = {
    TEMPLATES,
    render,
    qrDataUrl,
    safeLink,
    priceDisplay,
  };
})();
