/* global MHCopy, MHTemplates, MHLicense, MH_CONFIG, htmlToImage, JSZip, qrcode */
(function () {
  "use strict";

  const C = window.MHCopy;
  const T = window.MHTemplates;
  const L = window.MHLicense;
  const CFG = window.MH_CONFIG || {};
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const STORE_KEY = "mh_studio_state_v1";
  const COPY_KEYS = ["headline", "subhead", "caption", "sms", "blog"];
  const SAMPLE_PHOTOS = [
    "assets/img/samples/apartment-1.jpg",
    "assets/img/samples/bedroom-1.jpg",
    "assets/img/samples/kitchen-1.jpg",
  ];
  const TEMPLATE_IMAGES = {
    city: "assets/img/samples/apartment-1.jpg",
    sunset: "assets/img/samples/house-1.jpg",
    forest: "assets/img/samples/bedroom-1.jpg",
    mono: "assets/img/samples/kitchen-1.jpg",
    sky: "assets/img/samples/living-1.jpg",
    cream: "assets/img/samples/city-1.jpg",
  };
  const FEATURES = [
    "역세권",
    "학군",
    "채광 좋음",
    "리모델링",
    "즉시 입주",
    "주차 편함",
    "조용한",
    "공원 근처",
    "엘리베이터",
    "신축",
    "고층",
    "뷰 좋음",
    "반려동물",
    "보안",
  ];
  const ACCENTS = ["#d9552a", "#c25b3a", "#c99a3e", "#2f5d50", "#2f5d8c", "#111111", "#a98467", "#7a5c3e"];
  const TEMPLATE_ORDER = ["city", "sunset", "forest", "mono", "sky", "cream"];
  const TYPE_META = {
    cover: { w: 1080, h: 1350, label: "표지", file: "표지", ext: "png" },
    detail: { w: 1080, h: 1350, label: "정보", file: "정보", ext: "png" },
    contact: { w: 1080, h: 1350, label: "연락처", file: "연락처", ext: "png" },
    a4: { w: 2480, h: 3508, label: "A4 전단지", file: "A4전단지", ext: "jpg" },
    square: { w: 1080, h: 1080, label: "1:1", file: "정사각", ext: "png" },
    story: { w: 1080, h: 1920, label: "스토리", file: "스토리", ext: "png" },
  };
  const PRO_TYPES = new Set(["a4", "square", "story"]);

  let state;
  let previewType = "cover";
  let saveTimer = null;
  let scaleRaf = null;
  let dbPromise = null;
  let fontCssPromise = null;
  let ready = false;

  /* ------------------------------------------------------------------------
     Utilities
     ------------------------------------------------------------------------ */

  const clone = (value) => JSON.parse(JSON.stringify(value));

  function getPath(obj, path) {
    return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
  }

  function setPath(obj, path, value) {
    const parts = path.split(".");
    let cursor = obj;
    for (let i = 0; i < parts.length - 1; i += 1) {
      if (!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
  }

  function allDirtyFalse() {
    return COPY_KEYS.reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {});
  }

  function safeName(value) {
    return String(value || "")
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 48);
  }

  function typeMeta(type) {
    return TYPE_META[type] || TYPE_META.cover;
  }

  function isPro() {
    return L && L.isPro();
  }

  function track(event, props) {
    if (window.MHTrack) window.MHTrack(event, props || {});
  }

  function toast(message, tone) {
    if (window.MHToast) window.MHToast(message, tone);
  }

  function setSaveState(mode) {
    const el = $("#saveState");
    if (!el) return;
    el.classList.remove("is-saved", "is-saving");
    if (mode === "saving") {
      el.textContent = "저장 중…";
      el.classList.add("is-saving");
    } else if (mode === "error") {
      el.textContent = "저장 실패";
    } else {
      el.textContent = "저장됨";
      el.classList.add("is-saved");
    }
  }

  /* ------------------------------------------------------------------------
     State
     ------------------------------------------------------------------------ */

  function defaultBrand() {
    return {
      office: "",
      name: "",
      regNo: "",
      phone: "",
      address: "",
      link: "",
    };
  }

  function baseListing(brand) {
    return {
      dealType: "매매",
      propertyType: "아파트",
      address: "",
      complex: "",
      price: "",
      deposit: "",
      rent: "",
      maintenance: "",
      area: "",
      pyeong: "",
      floor: "",
      totalFloor: "",
      rooms: "",
      baths: "",
      direction: "남향",
      builtYear: "",
      moveIn: "",
      features: [],
      featureText: "",
      photos: [],
      template: "city",
      accent: "#d9552a",
      brand: Object.assign(defaultBrand(), brand || {}),
      copy: { headline: "", subhead: "", caption: "", sms: "", blog: "" },
    };
  }

  function blankState(brand) {
    return {
      version: 1,
      demo: false,
      listing: baseListing(brand),
      copyDirty: allDirtyFalse(),
      accentTouched: false,
      previewType: "cover",
      updatedAt: Date.now(),
    };
  }

  function demoState() {
    const listing = baseListing({
      office: "한빛공인중개사사무소",
      name: "김민수",
      regNo: "12345-2026-0001",
      phone: "010-1234-5678",
      address: "서울 마포구 성산로 12",
      link: "https://maemulhanjang.com",
    });
    Object.assign(listing, {
      dealType: "매매",
      propertyType: "아파트",
      address: "서울 마포구 성산동",
      complex: "솔트리움",
      price: "85000",
      maintenance: "12",
      area: "59",
      pyeong: "24",
      floor: "3",
      totalFloor: "15",
      rooms: "2",
      baths: "1",
      direction: "남향",
      builtYear: "2018",
      moveIn: "즉시 입주",
      features: ["역세권", "학군", "채광 좋음", "즉시 입주"],
      featureText:
        "거실과 주방이 마주 보는 구조로 환기가 잘 됩니다. 수납공간이 많아 짐이 많은 분께 좋습니다.",
      photos: SAMPLE_PHOTOS.slice(),
      template: "city",
      accent: "#d9552a",
    });
    listing.copy = C.buildAll(listing);
    const out = blankState(listing.brand);
    out.demo = true;
    out.listing = listing;
    return out;
  }

  function normalizeState(saved) {
    const out = blankState(saved && saved.listing ? saved.listing.brand : null);
    if (!saved || typeof saved !== "object") return demoState();
    out.demo = Boolean(saved.demo);
    out.listing = Object.assign(out.listing, saved.listing || {});
    out.listing.brand = Object.assign(defaultBrand(), (saved.listing && saved.listing.brand) || {});
    out.listing.copy = Object.assign({ headline: "", subhead: "", caption: "", sms: "", blog: "" }, (saved.listing && saved.listing.copy) || {});
    out.listing.features = Array.isArray(out.listing.features) ? out.listing.features.filter(Boolean) : [];
    out.listing.photos = Array.isArray(out.listing.photos) ? out.listing.photos.filter(Boolean) : [];
    if (!T.TEMPLATES[out.listing.template]) out.listing.template = "city";
    if (!/^#[0-9a-f]{6}$/i.test(out.listing.accent || "")) {
      out.listing.accent = T.TEMPLATES[out.listing.template].defaultAccent;
    }
    out.copyDirty = Object.assign(allDirtyFalse(), saved.copyDirty || {});
    out.accentTouched = Boolean(saved.accentTouched);
    out.previewType = TYPE_META[saved.previewType] ? saved.previewType : "cover";
    return out;
  }

  /* ------------------------------------------------------------------------
     Persistence (localStorage + IndexedDB for photos)
     ------------------------------------------------------------------------ */

  function openDB() {
    if (!("indexedDB" in window)) return Promise.reject(new Error("IndexedDB unavailable"));
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("IndexedDB timeout")), 4000);
        const req = indexedDB.open("mh_studio", 1);
        req.onupgradeneeded = () => {
          if (!req.result.objectStoreNames.contains("kv")) req.result.createObjectStore("kv");
        };
        req.onsuccess = () => {
          clearTimeout(timer);
          resolve(req.result);
        };
        req.onerror = () => {
          clearTimeout(timer);
          reject(req.error || new Error("IndexedDB error"));
        };
        req.onblocked = () => {
          clearTimeout(timer);
          reject(new Error("IndexedDB blocked by another tab"));
        };
      });
    }
    return dbPromise;
  }

  function idbSet(key, value) {
    return openDB().then(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction("kv", "readwrite");
          tx.objectStore("kv").put(value, key);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject(tx.error || new Error("IndexedDB write error"));
        })
    );
  }

  function idbGet(key) {
    return openDB().then(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction("kv", "readonly");
          const req = tx.objectStore("kv").get(key);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error || new Error("IndexedDB read error"));
        })
    );
  }

  async function loadState() {
    let saved = null;
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch (err) {
      saved = null;
    }
    state = saved ? normalizeState(saved) : demoState();
    if (saved && (!state.listing.copy || COPY_KEYS.some((k) => !state.listing.copy[k]))) {
      state.listing.copy = C.buildAll(state.listing);
      state.copyDirty = allDirtyFalse();
    }
    if (saved) {
      try {
        const photos = await idbGet("photos");
        if (Array.isArray(photos)) {
          if (saved.photoMode === "idb") state.listing.photos = photos.filter(Boolean);
          else if (saved.photoMode === "inline") {
            /* Sample paths were stored inline; keep them. */
          } else if (photos.length || !state.listing.photos.length) {
            state.listing.photos = photos.filter(Boolean);
          }
        }
      } catch (err) {
        /* fall back to photos saved inline, if any */
      }
    }
    previewType = state.previewType || "cover";
  }

  async function persist() {
    const photos = Array.isArray(state.listing.photos) ? state.listing.photos : [];
    const hasUploaded = photos.some((src) => String(src).startsWith("data:"));
    const photoMode = hasUploaded ? "idb" : "inline";
    const payload = {
      version: 1,
      demo: state.demo,
      // Sample photo paths are tiny and safe to keep inline. Uploaded photos live in IndexedDB.
      listing: Object.assign({}, state.listing, { photos: hasUploaded ? [] : photos }),
      photoMode,
      copyDirty: state.copyDirty,
      accentTouched: state.accentTouched,
      previewType,
      updatedAt: Date.now(),
    };
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(payload));
    } catch (err) {
      setSaveState("error");
      return;
    }
    try {
      await idbSet("photos", photos);
    } catch (err) {
      /* text still saved; photos may not survive a reload */
    }
    setSaveState("saved");
  }

  function saveSoon() {
    setSaveState("saving");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      persist();
    }, 600);
  }

  /* ------------------------------------------------------------------------
     Copy generation
     ------------------------------------------------------------------------ */

  function syncCopyFields(force) {
    COPY_KEYS.forEach((key) => {
      const el = $(`[data-bind="copy.${key}"]`);
      if (!el) return;
      if (!force && document.activeElement === el) return;
      el.value = state.listing.copy[key] || "";
    });
  }

  function refreshCopy(force) {
    const generated = C.buildAll(state.listing);
    COPY_KEYS.forEach((key) => {
      if (force || !state.copyDirty[key]) state.listing.copy[key] = generated[key];
    });
    if (force) state.copyDirty = allDirtyFalse();
    syncCopyFields(force);
  }

  /* ------------------------------------------------------------------------
     Form / UI
     ------------------------------------------------------------------------ */

  function updateDemoBanner() {
    const el = $("#demoBanner");
    if (!el) return;
    el.classList.toggle("is-hidden", !state.demo);
  }

  function updateAddressHint() {
    const hint = $("#addressHint");
    if (!hint) return;
    const value = state.listing.address || "";
    const detailed = /(\d+\s*호|\d+\s*층|\d+\s*동\s*\d+)/.test(value);
    hint.classList.toggle("is-warn", detailed);
    hint.textContent = detailed
      ? "상세 주소(동·호수)는 노출되지 않도록 동 단위까지만 입력하세요."
      : "동 단위까지만 입력하세요.";
  }

  function updateDealUI() {
    const deal = state.listing.dealType || "매매";
    $$("#dealType [data-deal]").forEach((btn) => {
      const active = btn.dataset.deal === deal;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    const rent = deal === "월세" || deal === "임대";
    $$(".price-mode").forEach((el) => {
      el.hidden = el.dataset.mode !== (rent ? "rent" : "sale");
    });
    const preview = $("#pricePreview");
    if (preview) {
      const text = C.priceText(state.listing);
      preview.textContent = text && text !== "가격 문의" ? `미리보기: ${text}` : "예: 85000 → 8억 5,000만";
    }
  }

  function syncForm() {
    $$("[data-bind]").forEach((el) => {
      const path = el.getAttribute("data-bind");
      let value = getPath(state.listing, path);
      if (value == null) value = "";
      if (el.dataset.format === "manwon" && value !== "") {
        const n = C.num(value);
        value = n ? n.toLocaleString("ko-KR") : "";
      }
      if (el.tagName === "SELECT" && !Array.from(el.options).some((o) => o.value === String(value))) {
        el.value = el.options[0] ? el.options[0].value : "";
      } else {
        el.value = value;
      }
    });
    updateDealUI();
    updateAddressHint();
    const accentColor = $("#accentColor");
    if (accentColor) accentColor.value = /^#[0-9a-f]{6}$/i.test(state.listing.accent) ? state.listing.accent : "#d9552a";
    updateCounts();
    updateDemoBanner();
  }

  function updateCounts() {
    const photoCount = $("#photoCount");
    if (photoCount) {
      const max = isPro() ? 5 : 3;
      photoCount.textContent = `${state.listing.photos.length} / ${max}`;
    }
    const featureCount = $("#featureCount");
    if (featureCount) {
      featureCount.textContent = `${state.listing.features.length} / 6`;
    }
  }

  /* ------------------------------------------------------------------------
     Templates / accents / features / photos
     ------------------------------------------------------------------------ */

  function renderTemplateStrip() {
    const strip = $("#templateStrip");
    if (!strip) return;
    strip.innerHTML = TEMPLATE_ORDER.map((key) => {
      const tpl = T.TEMPLATES[key];
      const active = state.listing.template === key;
      const img = TEMPLATE_IMAGES[key] || TEMPLATE_IMAGES.city;
      return `<button class="template-mini${active ? " is-active" : ""}" type="button" data-template="${key}" aria-pressed="${active}" title="${C.esc(tpl.name)} · ${C.esc(tpl.desc)}">
        <span class="mini-thumb" style="background-image:url('${img}')">${tpl.pro && !isPro() ? '<span class="mini-lock">유료</span>' : ""}</span>
        <span class="mini-name">${C.esc(tpl.name)}</span>
      </button>`;
    }).join("");
  }

  function renderAccent() {
    const wrap = $("#accentSwatches");
    if (!wrap) return;
    wrap.innerHTML = ACCENTS.map(
      (color) =>
        `<button class="accent-swatch${color.toLowerCase() === String(state.listing.accent).toLowerCase() ? " is-active" : ""}" type="button" data-accent="${color}" style="--swatch:${color}" aria-label="${color}"></button>`
    ).join("");
  }

  function renderFeatures() {
    const wrap = $("#featureChips");
    if (!wrap) return;
    const selected = state.listing.features || [];
    const extras = selected.filter((x) => !FEATURES.includes(x));
    const all = FEATURES.concat(extras);
    wrap.innerHTML = all
      .map(
        (name) =>
          `<button class="chip-toggle${selected.includes(name) ? " is-active" : ""}" type="button" data-feature="${C.esc(name)}" aria-pressed="${selected.includes(name)}">${C.esc(name)}</button>`
      )
      .join("");
  }

  function renderPhotos() {
    const grid = $("#photoGrid");
    if (!grid) return;
    const photos = state.listing.photos || [];
    grid.innerHTML = photos
      .map(
        (src, index) => `<div class="photo-thumb${index === 0 ? " is-cover" : ""}">
          <img src="${C.esc(src)}" alt="매물 사진 ${index + 1}">
          ${index === 0 ? '<span class="cover-tag">대표</span>' : ""}
          <div class="thumb-actions">
            ${index > 0 ? `<button type="button" data-photo-action="cover" data-photo-index="${index}" title="대표로 지정">★</button>` : ""}
            ${index > 0 ? `<button type="button" data-photo-action="left" data-photo-index="${index}" title="앞으로">←</button>` : ""}
            ${index < photos.length - 1 ? `<button type="button" data-photo-action="right" data-photo-index="${index}" title="뒤로">→</button>` : ""}
            <button type="button" data-photo-action="remove" data-photo-index="${index}" title="삭제">×</button>
          </div>
        </div>`
      )
      .join("");
    const note = $("#photoNote");
    if (note) {
      note.textContent = photos.length
        ? isPro()
          ? "첫 번째 사진이 표지가 됩니다. 최대 5장까지 사용할 수 있습니다."
          : "첫 번째 사진이 표지가 됩니다. 무료는 3장까지, 유료 이용권은 5장까지 사용할 수 있습니다."
        : "사진을 추가하면 표지와 전단지가 훨씬 좋아집니다. 모든 사진은 브라우저에서만 처리됩니다.";
    }
    updateCounts();
  }

  /* ------------------------------------------------------------------------
     Preview
     ------------------------------------------------------------------------ */

  function updatePreviewMeta() {
    const meta = typeMeta(previewType);
    const metaEl = $("#previewMeta");
    if (metaEl) {
      metaEl.textContent = `${meta.w} × ${meta.h}px${previewType === "a4" ? " · 300dpi" : ""} · ${meta.ext.toUpperCase()}`;
    }
    const tpl = T.TEMPLATES[state.listing.template] || T.TEMPLATES.city;
    const locked = !isPro() && (tpl.pro || PRO_TYPES.has(previewType));
    const lockNote = $("#lockNote");
    if (lockNote) lockNote.classList.toggle("is-hidden", !locked);
    const pngLabel = $("#exportPng .label");
    if (pngLabel) pngLabel.textContent = locked ? "이용권으로 저장" : "이미지 저장";
  }

  function scalePreview() {
    cancelAnimationFrame(scaleRaf);
    scaleRaf = requestAnimationFrame(() => {
      const stage = $("#previewStage");
      const frame = $("#previewFrame");
      const slide = slideMountSlide();
      if (!stage || !frame || !slide) return;
      const mobile = window.matchMedia("(max-width: 980px)").matches;
      const slideW = slide.offsetWidth;
      const slideH = slide.offsetHeight;
      if (!slideW || !slideH) return;
      const availW = Math.max(180, stage.clientWidth - (mobile ? 28 : 64));
      const availH = Math.max(220, stage.clientHeight - (mobile ? 20 : 64));
      const scaleW = availW / slideW;
      const scaleH = availH / slideH;
      let scale;
      if (mobile) {
        scale = scaleW;
      } else {
        scale = Math.min(scaleW, scaleH, 0.9);
      }
      if (!Number.isFinite(scale) || scale <= 0.05) scale = 0.3;
      frame.style.width = Math.round(slideW * scale) + "px";
      frame.style.height = Math.round(slideH * scale) + "px";
      slide.style.transform = `scale(${scale})`;
    });
  }

  function slideMountSlide() {
    return $("#slideMount .slide") || $("#slideMount");
  }

  function renderPreview() {
    const mount = $("#slideMount");
    if (!mount) return;
    const tplKey = state.listing.template;
    try {
      mount.innerHTML = T.render(previewType, state.listing, tplKey, isPro());
    } catch (err) {
      console.error(err);
      mount.innerHTML = `<div class="preview-empty">미리보기를 만들 수 없습니다. 입력 값을 확인해 주세요.</div>`;
      return;
    }
    const frame = $("#previewFrame");
    if (frame) frame.classList.toggle("preview-frame--a4", previewType === "a4");
    scalePreview();
    updatePreviewMeta();
  }

  function setPreviewType(type) {
    if (!TYPE_META[type]) return;
    previewType = type;
    state.previewType = type;
    $$(".preview-tab").forEach((btn) => {
      const active = btn.dataset.preview === type;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
    const stage = $("#previewStage");
    if (stage) stage.scrollTop = 0;
    renderPreview();
    saveSoon();
  }

  /* ------------------------------------------------------------------------
     License UI
     ------------------------------------------------------------------------ */

  function updateProUI() {
    const pro = isPro();
    const proBtn = $("#proBtn");
    const proBtnLabel = $("#proBtnLabel");
    if (proBtn) proBtn.classList.toggle("is-pro", pro);
    if (proBtnLabel) {
      proBtnLabel.textContent = pro
        ? `${L.planName(L.getState().plan)} 사용 중`
        : "이용권 구매";
    }
    const upsell = $("#upsellCard");
    if (upsell) upsell.classList.toggle("is-hidden", pro);
    const demoBtn = $("#demoBtn");
    if (demoBtn) demoBtn.hidden = !L.isLocalHost() || pro;
    const deactivate = $("#deactivateBtn");
    if (deactivate) deactivate.hidden = !pro;
    const current = $("#licenseCurrent");
    const currentText = $("#licenseCurrentText");
    if (current && currentText) {
      const info = L.getState();
      if (pro) {
        current.hidden = false;
        currentText.textContent = info.demo
          ? "데모 이용권 · 로컬에서만 사용할 수 있습니다."
          : `${L.planName(info.plan)} 이용권 · ${info.email || "이메일 없음"}${info.exp ? " · " + info.exp + "까지" : ""}`;
      } else {
        current.hidden = true;
      }
    }
    updateCounts();
  }

  function updateProModal() {
    updateProUI();
  }

  function openProModal(reason) {
    openModal("proModal");
    const status = $("#licenseStatus");
    if (status) {
      status.textContent = reason || "";
      status.classList.remove("is-error", "is-ok");
    }
    const input = $("#licenseInput");
    if (input && !isPro()) input.value = input.value || "";
    updateProModal();
    track("open_pro_modal", { reason: reason || "" });
  }

  /* ------------------------------------------------------------------------
     Modals
     ------------------------------------------------------------------------ */

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
    const close = modal.querySelector("[data-close-modal]");
    if (close) close.focus({ preventScroll: true });
  }

  function closeModals() {
    $$(".modal.is-open").forEach((modal) => modal.classList.remove("is-open"));
    document.body.style.overflow = "";
  }

  function setupModals() {
    $$(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModals();
      });
    });
    $$("[data-close-modal]").forEach((btn) => btn.addEventListener("click", closeModals));
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModals();
    });
  }

  /* ------------------------------------------------------------------------
     Photo handling
     ------------------------------------------------------------------------ */

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      if (!file.type || !file.type.startsWith("image/")) {
        reject(new Error("이미지 파일만 올릴 수 있습니다."));
        return;
      }
      if (file.size > 30 * 1024 * 1024) {
        reject(new Error("사진 용량이 너무 큽니다. 30MB 이하 파일을 사용해 주세요."));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("이미지를 열지 못했습니다. JPG/PNG 파일을 사용해 주세요."));
        img.onload = () => {
          const max = 1600;
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          try {
            resolve(canvas.toDataURL("image/jpeg", 0.86));
          } catch (err) {
            reject(new Error("이미지를 처리하지 못했습니다."));
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function addFiles(fileList) {
    const files = Array.from(fileList || []).filter((file) => file && file.type && file.type.startsWith("image/"));
    if (!files.length) {
      toast("이미지 파일만 올릴 수 있습니다.", "error");
      return;
    }
    if (state.demo) {
      state.demo = false;
      state.listing.photos = [];
      updateDemoBanner();
    }
    const limit = isPro() ? 5 : 3;
    const current = state.listing.photos.length;
    if (current >= limit) {
      if (!isPro()) openProModal("무료는 사진 3장까지 사용할 수 있습니다. 유료 이용권에서는 5장까지 추가할 수 있습니다.");
      else toast("사진은 최대 5장까지 사용할 수 있습니다.", "error");
      return;
    }
    const allowed = Math.min(files.length, limit - current);
    if (files.length > allowed && !isPro()) {
      openProModal("무료는 사진 3장까지 사용할 수 있습니다. 유료 이용권에서는 5장까지 추가할 수 있습니다.");
    } else if (files.length > allowed) {
      toast("사진은 최대 5장까지 사용할 수 있습니다.", "error");
    }
    let added = 0;
    setSaveState("saving");
    for (let i = 0; i < allowed; i += 1) {
      try {
        const data = await compressImage(files[i]);
        state.listing.photos.push(data);
        added += 1;
      } catch (err) {
        toast(err.message || "사진을 추가하지 못했습니다.", "error");
      }
    }
    if (added) {
      renderPhotos();
      renderPreview();
      persist();
      toast(added === 1 ? "사진을 추가했습니다." : `사진 ${added}장을 추가했습니다.`);
      track("photo_add", { count: added });
    } else {
      setSaveState("saved");
    }
  }

  function handlePhotoAction(action, index) {
    const photos = state.listing.photos;
    if (!photos[index]) return;
    if (action === "remove") {
      photos.splice(index, 1);
    } else if (action === "left" && index > 0) {
      [photos[index - 1], photos[index]] = [photos[index], photos[index - 1]];
    } else if (action === "right" && index < photos.length - 1) {
      [photos[index + 1], photos[index]] = [photos[index], photos[index + 1]];
    } else if (action === "cover" && index > 0) {
      const [item] = photos.splice(index, 1);
      photos.unshift(item);
    } else {
      return;
    }
    renderPhotos();
    renderPreview();
    persist();
  }

  /* ------------------------------------------------------------------------
     Export
     ------------------------------------------------------------------------ */

  function exportPermission(type) {
    const tpl = T.TEMPLATES[state.listing.template] || T.TEMPLATES.city;
    if (!isPro() && tpl.pro) return { ok: false, reason: "이 템플릿은 유료 이용권에서 저장할 수 있습니다." };
    if (!isPro() && PRO_TYPES.has(type)) return { ok: false, reason: "이 출력 규격은 유료 이용권에서 저장할 수 있습니다." };
    return { ok: true };
  }

  function requirePro(reason) {
    openProModal(reason || "유료 이용권에서 사용할 수 있습니다.");
    track("pro_gate", { reason: reason || "" });
  }

  function showOverlay(text) {
    const overlay = $("#exportOverlay");
    const label = $("#exportText");
    if (label) label.textContent = text || "잠시만 기다려 주세요. 사진 수에 따라 몇 초 걸릴 수 있습니다.";
    if (overlay) overlay.classList.add("is-open");
  }

  function hideOverlay() {
    const overlay = $("#exportOverlay");
    if (overlay) overlay.classList.remove("is-open");
  }

  async function waitForNode(node) {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const imgs = Array.from(node.querySelectorAll("img"));
    await Promise.all(
      imgs.map(async (img) => {
        try {
          if (img.decode) await img.decode();
          else if (!img.complete) await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        } catch (err) {
          /* broken images still export with an empty area */
        }
      })
    );
    // setTimeout is intentional: rAF can be paused in a background tab and
    // would leave the export promise (and the progress overlay) hanging.
    await new Promise((resolve) => setTimeout(resolve, 80));
  }

  async function buildExportNode(type) {
    const mount = $("#exportMount");
    mount.innerHTML = T.render(type, state.listing, state.listing.template, isPro());
    const node = mount.querySelector(".slide");
    if (!node) throw new Error("출력 화면을 만들지 못했습니다.");
    await waitForNode(node);
    return node;
  }

  async function getFontEmbedCss() {
    if (!fontCssPromise) {
      fontCssPromise = htmlToImage
        .getFontEmbedCSS(document.body)
        .catch(() => "");
    }
    return fontCssPromise;
  }

  async function renderImageData(type, options) {
    const node = await buildExportNode(type);
    const fontEmbedCSS = await getFontEmbedCss();
    const common = {
      width: node.offsetWidth,
      height: node.offsetHeight,
      pixelRatio: 1,
      cacheBust: true,
      // Do not pass backgroundColor: html-to-image can paint over the slide's
      // own root background, which breaks the dark editorial template.
      fontEmbedCSS: fontEmbedCSS || undefined,
    };
    if (type === "a4" || (options && options.jpeg)) {
      const data = await htmlToImage.toJpeg(node, Object.assign({ quality: 0.93 }, common));
      return { data, ext: "jpg", mime: "image/jpeg" };
    }
    const data = await htmlToImage.toPng(node, common);
    return { data, ext: "png", mime: "image/png" };
  }

  function dataUrlToBlob(dataUrl) {
    const [head, body] = dataUrl.split(",");
    const mime = /data:(.*?);base64/.exec(head);
    const binary = atob(body);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime ? mime[1] : "image/png" });
  }

  function hasDesktopBridge() {
    return Boolean(
      window.pywebview &&
        window.pywebview.api &&
        typeof window.pywebview.api.save_file === "function"
    );
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("파일 변환 실패"));
      reader.readAsDataURL(blob);
    });
  }

  async function saveDataUrl(dataUrl, filename) {
    if (hasDesktopBridge()) {
      try {
        const result = await window.pywebview.api.save_file(dataUrl, filename);
        if (result && result.ok) {
          toast("파일을 저장했습니다: " + result.path);
          return true;
        }
      } catch (err) {
        /* fall through to browser download */
      }
    }
    const url = URL.createObjectURL(dataUrlToBlob(dataUrl));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
    return true;
  }

  async function downloadBlob(blob, filename) {
    if (hasDesktopBridge()) {
      try {
        const dataUrl = await blobToDataUrl(blob);
        return await saveDataUrl(dataUrl, filename);
      } catch (err) {
        /* fall through to browser download */
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
    return true;
  }

  async function downloadDataUrl(dataUrl, filename) {
    if (hasDesktopBridge()) return saveDataUrl(dataUrl, filename);
    return downloadBlob(dataUrlToBlob(dataUrl), filename);
  }

  function exportBaseName() {
    return `매물한장_${safeName(C.addressShort(state.listing)) || "매물"}`;
  }

  async function exportPng(type) {
    const target = type || previewType;
    const check = exportPermission(target);
    if (!check.ok) {
      requirePro(check.reason);
      return;
    }
    showOverlay("이미지를 만들고 있습니다. 잠시만 기다려 주세요.");
    try {
      const result = await renderImageData(target);
      const meta = typeMeta(target);
      await downloadDataUrl(result.data, `${exportBaseName()}_${meta.file}.${result.ext}`);
      toast("이미지를 저장했습니다.");
      track("export_png", { type: target });
    } catch (err) {
      console.error(err);
      toast("이미지 저장에 실패했습니다. 사진 수를 줄이거나 잠시 후 다시 시도해 주세요.", "error");
    } finally {
      $("#exportMount").innerHTML = "";
      hideOverlay();
    }
  }

  async function exportZip() {
    if (!isPro()) {
      requirePro("전체 ZIP 저장은 유료 이용권에서 사용할 수 있습니다.");
      return;
    }
    if (typeof JSZip === "undefined") {
      toast("ZIP 라이브러리를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.", "error");
      return;
    }
    const types = ["cover", "detail", "contact", "a4"];
    showOverlay("전체 이미지를 만들고 있습니다. (1/4)");
    try {
      const zip = new JSZip();
      for (let i = 0; i < types.length; i += 1) {
        const type = types[i];
        showOverlay(`${typeMeta(type).label} 이미지를 만드는 중입니다. (${i + 1}/${types.length})`);
        // Use JPEG inside the ZIP to keep the download lightweight. Individual
        // card saves still use lossless PNG.
        const result = await renderImageData(type, { jpeg: true });
        zip.file(
          `${String(i + 1).padStart(2, "0")}_${typeMeta(type).file}.${result.ext}`,
          result.data.split(",")[1],
          { base64: true }
        );
        $("#exportMount").innerHTML = "";
      }
      const copy = state.listing.copy || {};
      const text = [
        "매물한장 — 홍보 문구",
        "=".repeat(32),
        "",
        "[인스타 캡션]",
        copy.caption || "",
        "",
        "[문자 문구]",
        copy.sms || "",
        "",
        "[블로그 초안]",
        copy.blog || "",
        "",
        "제작: 매물한장 (maemulhanjang.com)",
      ].join("\n");
      zip.file("홍보문구.txt", text);
      showOverlay("ZIP 파일로 묶고 있습니다.");
      const blob = await zip.generateAsync({ type: "blob" });
      await downloadBlob(blob, `${exportBaseName()}_전체.zip`);
      toast("전체 파일을 ZIP으로 저장했습니다.");
      track("export_zip", { count: types.length });
    } catch (err) {
      console.error(err);
      toast("ZIP 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.", "error");
    } finally {
      $("#exportMount").innerHTML = "";
      hideOverlay();
    }
  }

  async function printA4() {
    if (!isPro()) {
      requirePro("A4 전단지 인쇄는 유료 이용권에서 사용할 수 있습니다.");
      return;
    }
    const desktop = hasDesktopBridge();
    let win = null;
    if (!desktop) {
      win = window.open("", "_blank");
      if (!win) {
        toast("팝업이 차단되었습니다. 브라우저의 팝업 차단을 해제해 주세요.", "error");
        return;
      }
      win.document.write("<!doctype html><html lang='ko'><head><meta charset='utf-8'><title>매물한장 A4 전단지</title><style>@page{size:A4;margin:0}html,body{margin:0;padding:0}img{display:block;width:100%}</style></head><body><p style='font-family:sans-serif;padding:24px'>전단지를 준비하고 있습니다…</p></body></html>");
      win.document.close();
    }
    showOverlay("A4 전단지를 준비하고 있습니다.");
    try {
      const result = await renderImageData("a4");
      const filename = `${exportBaseName()}_A4전단지.jpg`;
      if (desktop) {
        await saveDataUrl(result.data, filename);
        try {
          await window.pywebview.api.open_downloads();
        } catch (err) {
          /* ignore */
        }
        toast("A4 JPG를 다운로드 폴더에 저장했습니다. 파일을 열어 인쇄해 주세요.");
        track("print_a4_desktop", {});
        return;
      }
      const blob = dataUrlToBlob(result.data);
      const url = URL.createObjectURL(blob);
      win.document.open();
      win.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>매물한장 A4 전단지</title>
        <style>@page{size:A4;margin:0}html,body{margin:0;padding:0}img{display:block;width:100%}</style>
        </head><body><img src="${url}" alt="A4 매물 전단지" onload="setTimeout(function(){window.print()},350)"></body></html>`);
      win.document.close();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast("인쇄 창에서 ‘배경 그래픽’을 켜 주세요.");
      track("print_a4", {});
    } catch (err) {
      console.error(err);
      try {
        if (win) win.close();
      } catch (e2) {
        /* ignore */
      }
      toast("인쇄 준비에 실패했습니다. 잠시 후 다시 시도해 주세요.", "error");
    } finally {
      $("#exportMount").innerHTML = "";
      hideOverlay();
    }
  }

  /* ------------------------------------------------------------------------
     Actions
     ------------------------------------------------------------------------ */

  function startBlank(keepBrand) {
    const brand = keepBrand === false ? null : state.listing.brand;
    state = blankState(brand);
    refreshCopy(true);
    syncForm();
    renderTemplateStrip();
    renderAccent();
    renderFeatures();
    renderPhotos();
    renderPreview();
    updateProUI();
    saveSoon();
    setMobileView("edit");
    const address = $("#address");
    if (address) address.focus({ preventScroll: true });
    toast("내 매물 정보를 입력해 주세요.");
    track("start_blank", {});
  }

  function applyTemplate(key) {
    const tpl = T.TEMPLATES[key];
    if (!tpl) return;
    state.listing.template = key;
    if (!state.accentTouched) state.listing.accent = tpl.defaultAccent;
    renderTemplateStrip();
    renderAccent();
    renderPreview();
    saveSoon();
    if (tpl.pro && !isPro()) {
      toast("유료 템플릿입니다. 미리보기는 가능하지만 저장에는 유료 이용권이 필요합니다.");
    }
    track("template_select", { template: key });
  }

  function toggleFeature(name) {
    const selected = state.listing.features;
    const index = selected.indexOf(name);
    if (index >= 0) {
      selected.splice(index, 1);
    } else {
      if (selected.length >= 6) {
        toast("강조 포인트는 최대 6개까지 선택할 수 있습니다.", "error");
        return;
      }
      selected.push(name);
    }
    renderFeatures();
    refreshCopy(false);
    renderPreview();
    saveSoon();
  }

  function setMobileView(view) {
    const body = document.body;
    if (!body) return;
    body.dataset.view = view;
    $$(".mobile-tabs [data-view]").forEach((btn) => btn.classList.toggle("is-active", btn.dataset.view === view));
    if (view === "preview") {
      requestAnimationFrame(() => {
        scalePreview();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  function updateLicenseFromStore() {
    updateProUI();
    renderTemplateStrip();
    renderPreview();
    updateProModal();
  }

  /* ------------------------------------------------------------------------
     Events
     ------------------------------------------------------------------------ */

  function bindEvents() {
    const form = $("#listingForm");
    if (form) {
      $$("[data-bind]", form).forEach((el) => {
        const handler = () => {
          const path = el.getAttribute("data-bind");
          let value = el.value;
          if (path === "copy.headline" || path.startsWith("copy.")) {
            state.copyDirty[path.slice(5)] = true;
          }
          setPath(state.listing, path, value);
          if (!path.startsWith("copy.")) {
            refreshCopy(false);
            if (path === "address") updateAddressHint();
            if (path === "price" || path === "deposit" || path === "rent" || path === "maintenance") {
              updateDealUI();
            }
          }
          renderPreview();
          saveSoon();
        };
        el.addEventListener("input", handler);
        el.addEventListener("change", handler);
        if (el.dataset.format === "manwon") {
          el.addEventListener("blur", () => {
            const n = C.num(el.value);
            el.value = n ? n.toLocaleString("ko-KR") : "";
            setPath(state.listing, el.getAttribute("data-bind"), el.value);
            updateDealUI();
            saveSoon();
          });
        }
      });
    }

    const dealWrap = $("#dealType");
    if (dealWrap) {
      dealWrap.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-deal]");
        if (!btn) return;
        state.listing.dealType = btn.dataset.deal;
        updateDealUI();
        refreshCopy(false);
        renderPreview();
        saveSoon();
        track("deal_change", { deal: btn.dataset.deal });
      });
    }

    const strip = $("#templateStrip");
    if (strip) {
      strip.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-template]");
        if (!btn) return;
        applyTemplate(btn.dataset.template);
      });
    }

    const accents = $("#accentSwatches");
    if (accents) {
      accents.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-accent]");
        if (!btn) return;
        state.listing.accent = btn.dataset.accent;
        state.accentTouched = true;
        renderAccent();
        renderPreview();
        saveSoon();
        track("accent_select", { accent: btn.dataset.accent });
      });
    }

    const accentColor = $("#accentColor");
    if (accentColor) {
      accentColor.addEventListener("input", () => {
        state.listing.accent = accentColor.value;
        state.accentTouched = true;
        renderAccent();
        renderPreview();
        saveSoon();
      });
    }

    const featureWrap = $("#featureChips");
    if (featureWrap) {
      featureWrap.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-feature]");
        if (!btn) return;
        toggleFeature(btn.dataset.feature);
      });
    }

    const photoInput = $("#photoInput");
    if (photoInput) {
      photoInput.addEventListener("change", () => {
        addFiles(photoInput.files);
        photoInput.value = "";
      });
    }

    const drop = $("#photoDrop");
    if (drop) {
      ["dragenter", "dragover"].forEach((evt) =>
        drop.addEventListener(evt, (e) => {
          e.preventDefault();
          drop.classList.add("is-drag");
        })
      );
      ["dragleave", "drop"].forEach((evt) =>
        drop.addEventListener(evt, (e) => {
          e.preventDefault();
          drop.classList.remove("is-drag");
        })
      );
      drop.addEventListener("drop", (e) => {
        if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
      });
    }

    const photoGrid = $("#photoGrid");
    if (photoGrid) {
      photoGrid.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-photo-action]");
        if (!btn) return;
        handlePhotoAction(btn.dataset.photoAction, Number(btn.dataset.photoIndex));
      });
    }

    $$(".preview-tab").forEach((btn) => {
      btn.addEventListener("click", () => setPreviewType(btn.dataset.preview));
    });

    $$(".mobile-tabs [data-view]").forEach((btn) => {
      btn.addEventListener("click", () => setMobileView(btn.dataset.view));
    });

    const blankBtn = $("#startBlankBtn");
    if (blankBtn) blankBtn.addEventListener("click", () => startBlank(true));

    const regenerate = $("#regenerateCopy");
    if (regenerate) {
      regenerate.addEventListener("click", () => {
        refreshCopy(true);
        renderPreview();
        saveSoon();
        toast("매물 정보에 맞춰 문구를 다시 만들었습니다.");
        track("copy_regenerate", {});
      });
    }

    $$("[data-copy-target]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = document.getElementById(btn.dataset.copyTarget);
        if (target && window.MHCopyText) window.MHCopyText(target.value);
      });
    });

    const helpBtn = $("#helpBtn");
    if (helpBtn) helpBtn.addEventListener("click", () => openModal("helpModal"));

    const proBtn = $("#proBtn");
    if (proBtn) proBtn.addEventListener("click", () => openProModal(""));

    const upsellBtn = $("#upsellBtn");
    if (upsellBtn) upsellBtn.addEventListener("click", () => openProModal(""));

    const exportBtn = $("#exportPng");
    if (exportBtn) exportBtn.addEventListener("click", () => exportPng(previewType));

    const zipBtn = $("#exportZip");
    if (zipBtn) zipBtn.addEventListener("click", exportZip);

    const printBtn = $("#printBtn");
    if (printBtn) printBtn.addEventListener("click", printA4);

    const buyBtn = $("#buyBtn");
    if (buyBtn) {
      buyBtn.addEventListener("click", (e) => {
        if (CFG.checkoutUrl) {
          e.preventDefault();
          window.open(CFG.checkoutUrl, "_blank", "noopener");
          track("checkout_click", { source: "pro_modal" });
        }
      });
    }

    const activateBtn = $("#activateBtn");
    if (activateBtn) {
      activateBtn.addEventListener("click", async () => {
        const input = $("#licenseInput");
        const status = $("#licenseStatus");
        const key = input ? input.value.trim() : "";
        activateBtn.disabled = true;
        const original = activateBtn.textContent;
        activateBtn.textContent = "확인 중…";
        if (status) {
          status.textContent = "";
          status.classList.remove("is-error", "is-ok");
        }
        try {
          await L.activate(key);
          if (status) {
            status.textContent = "이용권이 활성화되었습니다.";
            status.classList.add("is-ok");
          }
          if (input) input.value = "";
          updateLicenseFromStore();
          toast("이용권이 활성화되었습니다.");
          track("license_activate", {});
        } catch (err) {
          if (status) {
            status.textContent = err.message || "라이선스를 확인할 수 없습니다.";
            status.classList.add("is-error");
          }
        } finally {
          activateBtn.disabled = false;
          activateBtn.textContent = original;
        }
      });
    }

    const demoBtn = $("#demoBtn");
    if (demoBtn) {
      demoBtn.addEventListener("click", async () => {
        try {
          await L.activate("DEMO");
          const status = $("#licenseStatus");
          if (status) {
            status.textContent = "데모 이용권이 활성화되었습니다. 이 브라우저에서만 유지됩니다.";
            status.classList.add("is-ok");
          }
          updateLicenseFromStore();
          toast("데모 이용권으로 전환했습니다.");
        } catch (err) {
          toast("데모 모드를 시작할 수 없습니다.", "error");
        }
      });
    }

    const deactivateBtn = $("#deactivateBtn");
    if (deactivateBtn) {
      deactivateBtn.addEventListener("click", () => {
        L.deactivate();
        updateLicenseFromStore();
        const status = $("#licenseStatus");
        if (status) {
          status.textContent = "라이선스를 해제했습니다. Free 모드로 돌아갑니다.";
          status.classList.add("is-ok");
        }
        toast("라이선스를 해제했습니다.");
      });
    }

    const licenseInput = $("#licenseInput");
    if (licenseInput) {
      licenseInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (activateBtn) activateBtn.click();
        }
      });
    }

    document.addEventListener("mh:license", updateLicenseFromStore);

    window.addEventListener("keydown", (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        exportPng(previewType);
      } else if (mod && e.key === "Enter") {
        e.preventDefault();
        const regen = $("#regenerateCopy");
        if (regen) regen.click();
      }
    });

    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(scalePreview, 120);
    });
    if ("ResizeObserver" in window) {
      const stage = $("#previewStage");
      if (stage) new ResizeObserver(() => scalePreview()).observe(stage);
    }
  }

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */

  function applyQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const template = params.get("template");
    if (template && T.TEMPLATES[template]) {
      state.listing.template = template;
      if (!state.accentTouched) state.listing.accent = T.TEMPLATES[template].defaultAccent;
    }
    if (params.get("blank") === "1") {
      state = blankState(state.listing.brand);
      refreshCopy(true);
    }
    if (params.get("preview") && TYPE_META[params.get("preview")]) {
      previewType = params.get("preview");
      state.previewType = previewType;
    }
  }

  async function boot() {
    await loadState();
    applyQueryParams();
    if (COPY_KEYS.some((key) => !state.listing.copy[key])) {
      refreshCopy(true);
    }
    await L.init();
    bindEvents();
    setupModals();
    syncForm();
    renderTemplateStrip();
    renderAccent();
    renderFeatures();
    renderPhotos();
    renderPreview();
    updateProUI();
    updateDemoBanner();
    updatePreviewMeta();
    $$(".preview-tab").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.preview === previewType);
      btn.setAttribute("aria-selected", String(btn.dataset.preview === previewType));
    });
    ready = true;

    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "1" && L.isLocalHost()) {
      try {
        await L.activate("DEMO");
        updateLicenseFromStore();
      } catch (err) {
        /* ignore */
      }
    }
    if (params.get("pro") === "1") {
      openProModal("");
    }

    if (L.isLocalHost()) {
      window.__MH = {
        getState: () => state,
        render: (type) => T.render(type, state.listing, state.listing.template, isPro()),
        renderImageData,
        buildExportNode,
      };
    }

    setTimeout(() => {
      scalePreview();
      if (!state.demo) setSaveState("saved");
    }, 60);
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
