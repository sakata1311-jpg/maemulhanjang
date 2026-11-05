/* global MH_CONFIG */
(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* Header state ---------------------------------------------------------- */
  const header = $(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Mobile menu ----------------------------------------------------------- */
  const toggle = $(".nav-toggle");
  const mobileMenu = $(".mobile-menu");
  if (toggle && mobileMenu) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      mobileMenu.classList.toggle("is-open", open);
      document.body.classList.toggle("no-scroll", open);
    };
    toggle.addEventListener("click", () => {
      setOpen(!mobileMenu.classList.contains("is-open"));
    });
    $$("a", mobileMenu).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) setOpen(false);
    });
  }

  /* Reveal on scroll ------------------------------------------------------ */
  const revealEls = $$(".reveal");
  if (revealEls.length) {
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      revealEls.forEach((el) => io.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add("is-in"));
    }
  }

  /* Analytics ------------------------------------------------------------- */
  function track(event, props) {
    const payload = Object.assign({ event }, props || {});
    try {
      if (MH_CONFIG.analytics && MH_CONFIG.analytics.provider === "plausible" && window.plausible) {
        window.plausible(event, { props: props || {} });
      } else if (typeof window.gtag === "function") {
        window.gtag("event", event, props || {});
      }
    } catch (err) {
      /* analytics must never break the app */
    }
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      console.debug("[track]", payload);
    }
  }
  window.MHTrack = track;

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-track]");
    if (!el) return;
    track(el.getAttribute("data-track"), {
      label: el.getAttribute("data-track-label") || el.textContent.trim().slice(0, 60),
      location: el.getAttribute("data-track-location") || "",
    });
  });

  /* Toasts ---------------------------------------------------------------- */
  let toastTimer = null;
  function toast(message, tone) {
    let host = $("#toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "toast-host";
      host.className = "toast-host";
      host.setAttribute("role", "status");
      host.setAttribute("aria-live", "polite");
      document.body.appendChild(host);
    }
    host.innerHTML = "";
    const item = document.createElement("div");
    item.className = "toast" + (tone === "error" ? " toast--error" : "");
    item.textContent = message;
    host.appendChild(item);
    requestAnimationFrame(() => item.classList.add("is-in"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      item.classList.remove("is-in");
      setTimeout(() => item.remove(), 220);
    }, 2600);
  }
  window.MHToast = toast;

  /* Clipboard ------------------------------------------------------------- */
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast("복사했습니다.");
      return true;
    } catch (err) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        toast("복사했습니다.");
        return true;
      } catch (e2) {
        toast("복사에 실패했습니다. 직접 선택해 주세요.", "error");
        return false;
      } finally {
        ta.remove();
      }
    }
  }
  window.MHCopyText = copyText;

  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => copyText(btn.getAttribute("data-copy")));
  });

  /* Year ------------------------------------------------------------------ */
  $$("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  /* Pricing labels -------------------------------------------------------- */
  const won = (n) => Number(n).toLocaleString("ko-KR");
  $$("[data-price='launch']").forEach((el) => {
    el.textContent = won(MH_CONFIG.launchPrice);
  });
  $$("[data-price='regular']").forEach((el) => {
    el.textContent = won(MH_CONFIG.regularPrice);
  });

  /* Contact / checkout links --------------------------------------------- */
  $$("[data-contact-email]").forEach((el) => {
    el.setAttribute("href", "mailto:" + MH_CONFIG.contactEmail);
    if (el.hasAttribute("data-contact-text")) el.textContent = MH_CONFIG.contactEmail;
  });

  $$("[data-checkout]").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (MH_CONFIG.checkoutUrl) {
        el.setAttribute("href", MH_CONFIG.checkoutUrl);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener");
        track("checkout_click", { label: el.textContent.trim() });
        return;
      }
      e.preventDefault();
      track("checkout_unconfigured", { label: el.textContent.trim() });
      toast("결제 연결 준비 중입니다. " + MH_CONFIG.contactEmail + "로 문의해 주세요.", "error");
    });
  });
})();
