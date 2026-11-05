/* global */
(function () {
  "use strict";

  const num = (value) => {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const cleaned = String(value == null ? "" : value).replace(/[^\d.-]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  const clean = (value) => String(value == null ? "" : value).trim();

  const esc = (value) =>
    String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const nl2br = (value) => esc(value).replace(/\n/g, "<br>");

  function formatManwon(value) {
    const n = Math.round(num(value));
    if (!n) return "가격 문의";
    if (n >= 10000) {
      const eok = Math.floor(n / 10000);
      const man = n % 10000;
      return man ? `${eok}억 ${man.toLocaleString("ko-KR")}만` : `${eok}억`;
    }
    return `${n.toLocaleString("ko-KR")}만`;
  }

  function dealLabel(listing) {
    return clean(listing.dealType) || "매매";
  }

  function pyeongOf(listing) {
    const p = num(listing.pyeong);
    if (p) return p;
    const area = num(listing.area);
    return area ? Math.round((area / 3.3058) * 10) / 10 : 0;
  }

  function pyeongText(listing) {
    const p = pyeongOf(listing);
    if (!p) return "";
    return `${Number.isInteger(p) ? p : p.toFixed(1)}평`;
  }

  function areaText(listing) {
    const area = num(listing.area);
    return area ? `전용 ${area}㎡` : "";
  }

  function priceText(listing) {
    const deal = dealLabel(listing);
    if (deal === "월세" || deal === "임대") {
      const deposit = num(listing.deposit);
      const rent = num(listing.rent);
      if (!deposit && !rent) return "가격 문의";
      if (!deposit) return `월 ${formatManwon(rent)}`;
      return `보증금 ${formatManwon(deposit)} / 월 ${formatManwon(rent)}`;
    }
    return formatManwon(listing.price);
  }

  function priceNote(listing) {
    const maintenance = num(listing.maintenance);
    if (maintenance) return `관리비 ${formatManwon(maintenance)}`;
    return "";
  }

  function floorText(listing) {
    const floor = clean(listing.floor);
    const total = clean(listing.totalFloor);
    if (floor && total) return `${floor}층/${total}층`;
    if (floor) return `${floor}층`;
    if (total) return `전체 ${total}층`;
    return "";
  }

  function addressShort(listing) {
    const parts = clean(listing.address).split(/\s+/).filter(Boolean);
    if (!parts.length) return "우리 동네";
    return parts.slice(0, 3).join(" ");
  }

  function features(listing) {
    const list = Array.isArray(listing.features) ? listing.features.filter(Boolean) : [];
    return Array.from(new Set(list.map(clean).filter(Boolean))).slice(0, 6);
  }

  function specList(listing) {
    const out = [];
    const area = areaText(listing);
    const pyeong = pyeongText(listing);
    if (area) out.push({ label: "전용면적", value: area.replace("전용 ", "") });
    if (pyeong) out.push({ label: "평형", value: pyeong });
    if (floorText(listing)) out.push({ label: "층", value: floorText(listing) });
    if (clean(listing.rooms) || clean(listing.baths)) {
      const bits = [];
      if (clean(listing.rooms)) bits.push(`방 ${clean(listing.rooms)}`);
      if (clean(listing.baths)) bits.push(`욕실 ${clean(listing.baths)}`);
      out.push({ label: "구조", value: bits.join(" · ") });
    }
    if (clean(listing.direction)) out.push({ label: "방향", value: clean(listing.direction) });
    if (clean(listing.builtYear)) out.push({ label: "준공", value: `${clean(listing.builtYear)}년` });
    if (clean(listing.moveIn)) out.push({ label: "입주", value: clean(listing.moveIn) });
    if (num(listing.maintenance)) {
      out.push({ label: "관리비", value: formatManwon(listing.maintenance) });
    }
    return out;
  }

  function hook(listing) {
    const f = features(listing);
    const has = (keyword) => f.some((x) => x.includes(keyword));
    const map = [
      ["역세권", "역세권"],
      ["학군", "학군 좋은"],
      ["채광", "채광 좋은"],
      ["리모델링", "새로 단장한"],
      ["즉시입주", "바로 입주하는"],
      ["주차", "주차 편한"],
      ["조용", "조용한"],
      ["공원", "공원 가까운"],
      ["엘리베이터", "엘리베이터 있는"],
      ["신축", "신축"],
      ["고층", "고층"],
      ["뷰", "뷰 좋은"],
    ];
    for (const [key, label] of map) {
      if (has(key)) return label;
    }
    return "";
  }

  function headline(listing) {
    const pyeong = pyeongText(listing);
    const deal = dealLabel(listing);
    const floor = clean(listing.floor);
    const direction = clean(listing.direction);
    const complex = clean(listing.complex);
    const h = hook(listing);
    const first = [h, pyeong].filter(Boolean).join(" ");
    const second = [direction, floor ? `${floor}층` : "", deal].filter(Boolean).join(" ");
    if (first && second) return `${first},\n${second}`;
    if (first) return `${first},\n${deal} 매물`;
    return `${addressShort(listing)}\n${deal} 매물`;
  }

  function subhead(listing) {
    const f = features(listing);
    const moveIn = clean(listing.moveIn);
    const bits = f.slice(0, 3);
    if (moveIn && !bits.some((x) => x.includes("입주"))) bits.push(moveIn);
    if (bits.length) return bits.join(" · ");
    return [addressShort(listing), clean(listing.propertyType), dealLabel(listing)]
      .filter(Boolean)
      .join(" · ");
  }

  function eyebrow(listing) {
    const complex = clean(listing.complex);
    const pyeong = pyeongText(listing);
    const direction = clean(listing.direction);
    const type = clean(listing.propertyType);
    const bits = [complex || addressShort(listing), pyeong, direction || type].filter(Boolean);
    return bits.join(" · ");
  }

  function hashtags(listing) {
    const tokens = [];
    const address = addressShort(listing).split(/\s+/);
    const complex = clean(listing.complex);
    const type = clean(listing.propertyType);
    const deal = dealLabel(listing);
    tokens.push(...address);
    if (complex) tokens.push(complex);
    if (type) tokens.push(type);
    tokens.push(deal, "부동산", "매물");
    const seen = new Set();
    return tokens
      .map((t) => t.replace(/[^\w가-힣]/g, ""))
      .filter((t) => t.length > 0 && !seen.has(t) && seen.add(t))
      .slice(0, 10)
      .map((t) => `#${t}`)
      .join(" ");
  }

  function caption(listing) {
    const f = features(listing);
    const deal = dealLabel(listing);
    const price = priceText(listing);
    const area = [pyeongText(listing), areaText(listing)].filter(Boolean).join(" · ");
    const specs = specList(listing)
      .slice(0, 4)
      .map((s) => `${s.label} ${s.value}`)
      .join(" | ");
    const lines = [];
    lines.push(`📍 ${addressShort(listing)}${clean(listing.complex) ? " · " + clean(listing.complex) : ""}`);
    lines.push(`🏠 ${deal} ${price}${num(listing.maintenance) ? ` (관리비 ${formatManwon(listing.maintenance)})` : ""}`);
    if (area) lines.push(`📐 ${area}`);
    if (f.length) lines.push(f.map((x) => `✅ ${x}`).join("\n"));
    if (clean(listing.moveIn)) lines.push(`🗓️ ${clean(listing.moveIn)}`);
    if (clean(listing.featureText)) {
      lines.push("");
      lines.push(clean(listing.featureText));
    }
    lines.push("");
    const office = clean(listing.brand && listing.brand.office);
    const phone = clean(listing.brand && listing.brand.phone);
    if (office || phone) lines.push(`📞 ${[office, phone].filter(Boolean).join(" ")}`);
    lines.push("");
    lines.push(hashtags(listing));
    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  function sms(listing) {
    const office = clean(listing.brand && listing.brand.office) || "매물한장";
    const phone = clean(listing.brand && listing.brand.phone);
    const name = clean(listing.complex) || addressShort(listing);
    const bits = [
      `[${office}]`,
      `${name} ${pyeongText(listing)} ${dealLabel(listing)} ${priceText(listing)}`,
    ];
    const h = hook(listing);
    if (h) bits.push(h);
    if (clean(listing.moveIn)) bits.push(clean(listing.moveIn));
    let text = bits.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    if (phone) text += ` 문의 ${phone}`;
    return text;
  }

  function blog(listing) {
    const office = clean(listing.brand && listing.brand.office) || "매물한장";
    const name = clean(listing.complex) || addressShort(listing);
    const deal = dealLabel(listing);
    const bits = [
      `${addressShort(listing)} ${name} ${pyeongText(listing)} ${deal} 매물을 소개합니다.`,
    ];
    bits.push(
      `${priceText(listing)}${num(listing.maintenance) ? `, 관리비 ${formatManwon(listing.maintenance)}` : ""}입니다.`
    );
    const specs = specList(listing)
      .map((s) => `${s.label} ${s.value}`)
      .join(", ");
    if (specs) bits.push(`기본 정보는 ${specs}입니다.`);
    const f = features(listing);
    if (f.length) bits.push(`이 매물의 포인트는 ${f.join(", ")}입니다.`);
    if (clean(listing.featureText)) bits.push(clean(listing.featureText));
    bits.push(
      `현장 확인을 원하시면 ${office}${clean(listing.brand && listing.brand.name) ? " " + clean(listing.brand.name) : ""} ${
        clean(listing.brand && listing.brand.phone) || ""
      }로 연락 주세요. 매물 정보는 실제와 다를 수 있으니 방문 전 꼭 확인해 주세요.`
    );
    return bits.filter(Boolean).join("\n\n") + "\n\n" + hashtags(listing);
  }

  function buildAll(listing) {
    return {
      headline: headline(listing),
      subhead: subhead(listing),
      caption: caption(listing),
      sms: sms(listing),
      blog: blog(listing),
    };
  }

  window.MHCopy = {
    esc,
    nl2br,
    num,
    formatManwon,
    priceText,
    priceNote,
    pyeongText,
    areaText,
    floorText,
    addressShort,
    features,
    specList,
    headline,
    subhead,
    eyebrow,
    caption,
    sms,
    blog,
    hashtags,
    buildAll,
    hook,
    dealLabel,
    clean,
  };
})();
