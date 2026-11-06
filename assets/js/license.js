/* global MH_LICENSE_PUBLIC_KEY */
(function () {
  "use strict";

  const STORE_KEY = "mh_license_key";
  const STORE_DEMO = "mh_demo_mode";
  const PRO_PLANS = new Set(["pro", "beta", "team", "standard", "deluxe", "premium"]);
  const TIER_DAYS = { standard: 30, deluxe: 60, premium: 90 };
  const PLAN_NAMES = {
    standard: "STANDARD",
    deluxe: "DELUXE",
    premium: "PREMIUM",
    pro: "PRO",
    beta: "BETA",
    team: "TEAM",
  };

  const state = {
    status: "free",
    plan: "free",
    email: "",
    name: "",
    order: "",
    exp: null,
    key: "",
    demo: false,
    reason: "",
  };

  const desktopMode = new URLSearchParams(window.location.search).get("desktop") === "1";
  const isLocalHost = () =>
    !desktopMode &&
    (["localhost", "127.0.0.1", "::1"].includes(window.location.hostname) ||
      window.location.protocol === "file:");

  function b64urlToBytes(value) {
    const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function b64ToBytes(value) {
    const binary = atob(String(value));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function derToRaw(der) {
    let offset = 0;
    if (der[offset++] !== 0x30) throw new Error("Invalid signature");
    let len = der[offset++];
    if (len & 0x80) {
      const count = len & 0x7f;
      len = 0;
      for (let i = 0; i < count; i += 1) len = (len << 8) | der[offset++];
    }
    if (der[offset++] !== 0x02) throw new Error("Invalid signature");
    let rLen = der[offset++];
    if (rLen & 0x80) {
      const count = rLen & 0x7f;
      rLen = 0;
      for (let i = 0; i < count; i += 1) rLen = (rLen << 8) | der[offset++];
    }
    const r = der.slice(offset, offset + rLen);
    offset += rLen;
    if (der[offset++] !== 0x02) throw new Error("Invalid signature");
    let sLen = der[offset++];
    if (sLen & 0x80) {
      const count = sLen & 0x7f;
      sLen = 0;
      for (let i = 0; i < count; i += 1) sLen = (sLen << 8) | der[offset++];
    }
    const s = der.slice(offset, offset + sLen);
    const strip = (bytes) => {
      let i = 0;
      while (i < bytes.length - 1 && bytes[i] === 0) i += 1;
      return bytes.slice(i);
    };
    const rOut = new Uint8Array(32);
    const sOut = new Uint8Array(32);
    const rTrim = strip(r);
    const sTrim = strip(s);
    if (rTrim.length > 32 || sTrim.length > 32) throw new Error("Invalid signature size");
    rOut.set(rTrim, 32 - rTrim.length);
    sOut.set(sTrim, 32 - sTrim.length);
    const raw = new Uint8Array(64);
    raw.set(rOut, 0);
    raw.set(sOut, 32);
    return raw;
  }

  async function verifyToken(token) {
    const key = String(token || "").trim();
    const parts = key.split(".");
    if (parts.length !== 3 || parts[0] !== "MH1") throw new Error("라이선스 키 형식이 올바르지 않습니다.");
    const payloadBytes = b64urlToBytes(parts[1]);
    const signature = b64urlToBytes(parts[2]);
    const rawSig = derToRaw(signature);
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error("이 브라우저에서는 라이선스 확인을 지원하지 않습니다. 최신 Chrome을 사용해 주세요.");
    }
    const spki = b64ToBytes(MH_LICENSE_PUBLIC_KEY);
    const cryptoKey = await window.crypto.subtle.importKey(
      "spki",
      spki,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    );
    const ok = await window.crypto.subtle.verify(
      { name: "ECDSA", hash: { name: "SHA-256" } },
      cryptoKey,
      rawSig,
      payloadBytes
    );
    if (!ok) throw new Error("라이선스 서명이 유효하지 않습니다.");
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
    if (payload.v !== 1) throw new Error("지원하지 않는 라이선스 버전입니다.");
    if (!PRO_PLANS.has(payload.plan)) throw new Error("유료 이용권이 아닙니다.");
    if (TIER_DAYS[payload.plan] && !payload.exp) {
      throw new Error("이용권 기간 정보가 없습니다.");
    }
    if (payload.exp) {
      const end = new Date(payload.exp + "T23:59:59");
      if (Number.isNaN(end.getTime()) || end.getTime() < Date.now()) {
        throw new Error("이용권 기간이 만료되었습니다. 새 이용권을 구매해 주세요.");
      }
    }
    return payload;
  }

  function isActive() {
    if (state.status !== "pro") return false;
    if (!state.exp) return true;
    const end = new Date(state.exp + "T23:59:59");
    return !Number.isNaN(end.getTime()) && end.getTime() >= Date.now();
  }

  function apply() {
    document.body.classList.toggle("is-pro", isActive());
    document.dispatchEvent(
      new CustomEvent("mh:license", {
        detail: {
          isPro: isActive(),
          plan: state.plan,
          email: state.email,
          name: state.name,
          exp: state.exp,
          demo: state.demo,
          status: state.status,
        },
      })
    );
  }

  function reset(reason) {
    state.status = "free";
    state.plan = "free";
    state.email = "";
    state.name = "";
    state.order = "";
    state.exp = null;
    state.demo = false;
    state.reason = reason || "";
    apply();
  }

  async function activate(key) {
    const trimmed = String(key || "").trim();
    if (!trimmed) throw new Error("라이선스 키를 입력해 주세요.");
    if (isLocalHost() && /^DEMO$/i.test(trimmed)) {
      state.status = "pro";
      state.plan = "pro";
      state.email = "demo@maemulhanjang.com";
      state.name = "데모 이용권";
      state.exp = null;
      state.key = "DEMO";
      state.demo = true;
      state.reason = "";
      localStorage.setItem(STORE_DEMO, "1");
      apply();
      return { ...state };
    }
    const payload = await verifyToken(trimmed);
    state.status = "pro";
    state.plan = payload.plan;
    state.email = payload.email || "";
    state.name = payload.name || "";
    state.order = payload.order || "";
    state.exp = payload.exp || null;
    state.key = trimmed;
    state.demo = false;
    state.reason = "";
    localStorage.setItem(STORE_KEY, trimmed);
    localStorage.removeItem(STORE_DEMO);
    apply();
    return { ...state };
  }

  async function init() {
    try {
      const stored = localStorage.getItem(STORE_KEY);
      if (stored) {
        const payload = await verifyToken(stored);
        state.status = "pro";
        state.plan = payload.plan;
        state.email = payload.email || "";
        state.name = payload.name || "";
        state.order = payload.order || "";
        state.exp = payload.exp || null;
        state.key = stored;
        state.demo = false;
        apply();
        return { ...state };
      }
      if (isLocalHost() && localStorage.getItem(STORE_DEMO) === "1") {
        state.status = "pro";
        state.plan = "pro";
        state.email = "demo@maemulhanjang.com";
        state.name = "데모 이용권";
        state.key = "DEMO";
        state.demo = true;
        apply();
        return { ...state };
      }
      reset();
      return { ...state };
    } catch (err) {
      reset(err && err.message ? err.message : "라이선스를 확인할 수 없습니다.");
      return { ...state };
    }
  }

  function deactivate() {
    localStorage.removeItem(STORE_KEY);
    localStorage.removeItem(STORE_DEMO);
    reset("라이선스를 해제했습니다.");
  }

  window.MHLicense = {
    init,
    activate,
    deactivate,
    verifyToken,
    isPro: () => isActive(),
    getState: () => ({ ...state }),
    isLocalHost,
    planName: (plan) => PLAN_NAMES[plan] || String(plan || "PRO").toUpperCase(),
    tierDays: (plan) => TIER_DAYS[plan] || null,
  };
})();
