/* 매물한장 site config — edit these values before launch. */
window.MH_CONFIG = {
  brand: "매물한장",
  siteUrl: "https://sakata1311-jpg.github.io/maemulhanjang",
  contactEmail: "sakata1311@gmail.com",
  // Set this to the Kmong product URL after approval.
  checkoutUrl: "",
  // Optional: a Lemon Squeezy license validation endpoint, if you prefer server-side keys.
  licenseApi: "",
  plans: [
    { key: "standard", label: "STANDARD", days: 30, price: 9000 },
    { key: "deluxe", label: "DELUXE", days: 60, price: 17000 },
    { key: "premium", label: "PREMIUM", days: 90, price: 24000 },
  ],
  // Legacy fields kept so older pages/components do not break.
  launchPrice: 9000,
  regularPrice: 24000,
  launchEnds: "2026-12-31",
  freeTemplates: ["city", "sunset"],
  analytics: {
    // "plausible" or "" (off). No cookies, no personal data.
    provider: "",
    domain: "sakata1311-jpg.github.io",
  },
  social: {
    instagram: "",
    youtube: "",
    blog: "",
  },
};
