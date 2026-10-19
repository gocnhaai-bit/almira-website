(function () {
  "use strict";
  const state = { products: [], snapshotId: null, checkoutEnabled: false, stale: false, loaded: false };
  const status = document.createElement("div");
  status.id = "catalogStatus";
  status.className = "catalog-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  document.querySelector("main").before(status);
  const labels = {
    vi: { loading: "Đang tải danh mục sản phẩm…", error: "Không thể tải danh mục sản phẩm. Vui lòng thử lại.", retry: "Thử lại", stale: "Danh mục đang dùng bản đồng bộ thành công gần nhất." },
    en: { loading: "Loading the product collection…", error: "The product collection could not be loaded. Please try again.", retry: "Try again", stale: "Showing the most recently synced collection." }
  };
  function language() {
    try { return localStorage.getItem("almira-lang") === "en" ? "en" : "vi"; } catch (_) { return document.documentElement.lang === "en" ? "en" : "vi"; }
  }
  function message(kind) { return labels[language()][kind]; }
  function show(kind) {
    status.replaceChildren();
    const heading = document.createElement("span");
    heading.textContent = message(kind);
    status.append(heading);
    if (kind === "error") {
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "catalog-retry";
      retry.textContent = message("retry");
      retry.addEventListener("click", () => load().catch(() => {}));
      status.append(retry);
    }
    status.hidden = false;
    status.classList.toggle("is-error", kind === "error");
  }
  function validMoney(value, nullable) {
    return (nullable && value === null) || (typeof value === "string" && /^\d+(?:\.\d{1,2})?$/.test(value));
  }
  function validImage(value) {
    if (typeof value !== "string") return false;
    try { return new URL(value, location.origin).protocol === "https:"; } catch (_) { return false; }
  }
  function validProduct(p) {
    return p && typeof p.id === "string" && typeof p.name === "string" && typeof p.nameEn === "string" &&
      typeof p.brand === "string" && typeof p.cat === "string" && validMoney(p.price, false) && validMoney(p.was, true) &&
      validImage(p.img) && Array.isArray(p.images) && p.images.every(validImage) && Array.isArray(p.colors) &&
      p.colors.every(c => Array.isArray(c) && c.length === 3 && c.every(value => typeof value === "string") && /^#[a-f0-9]{6}$/i.test(c[1])) &&
      Array.isArray(p.sizes) && p.sizes.every(size => typeof size === "string") && Array.isArray(p.variations) &&
      p.variations.every(v => v && typeof v.id === "string" && v.productId === p.id && typeof v.shopId === "string" &&
        p.sizes.includes(v.size) && p.colors.some(color => color[0] === v.color) && validMoney(v.price, false));
  }
  function validate(payload) {
    if (!payload || (payload.snapshotId !== null && typeof payload.snapshotId !== "string") || !Array.isArray(payload.products) || !payload.products.every(validProduct) || typeof payload.checkoutEnabled !== "boolean" || typeof payload.stale !== "boolean") {
      throw new Error("Invalid catalog response");
    }
    return payload;
  }
  async function load() {
    show("loading");
    try {
      const response = await fetch("/api/catalog", { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!response.ok) throw new Error("Catalog request failed");
      const payload = validate(await response.json());
      state.products.splice(0, state.products.length, ...payload.products);
      state.snapshotId = payload.snapshotId;
      state.checkoutEnabled = payload.checkoutEnabled;
      state.checkoutTrial = payload.checkoutTrial === true;
      state.stale = payload.stale;
      state.loaded = true;
      status.replaceChildren();
      status.hidden = !state.stale;
      if (!state.snapshotId) show("error");
      else if (state.stale) status.textContent = message("stale");
      window.dispatchEvent(new CustomEvent("almira:catalog-ready", { detail: state }));
    } catch (error) {
      console.error("Catalog load failed");
      show("error");
      if (!state.loaded) {
        state.loaded = true;
        window.dispatchEvent(new CustomEvent("almira:catalog-ready", { detail: state }));
      }
      throw error;
    }
  }
  window.AlmiraCatalog = {
    get products() { return state.products; },
    get snapshotId() { return state.snapshotId; },
    get checkoutEnabled() { return state.checkoutEnabled; },
    get checkoutTrial() { return state.checkoutTrial === true; },
    load
  };
  show("loading");
})();
