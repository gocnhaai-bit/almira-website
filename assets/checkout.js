/* Two-step checkout UI; classic script, loaded after the shop's globals.
   No order/payment API is called. Customer draft stays in memory only. */
(function () {
  "use strict";
  const state = { step: 1, payment: "bank", draft: { name: "", phone: "", address: "", note: "" }, errors: {} };
  const text = {
    vi: {
      title: "Hoàn thiện đơn hàng", eyebrow: "ALMIRA STUDIO · CHECKOUT", home: "Cửa hàng", checkout: "Thanh toán",
      intro: "Một vài thông tin, để Almira chăm chút đơn hàng của bạn.", one: "Thông tin mua hàng", two: "Phương thức thanh toán", step: "Bước",
      name: "Họ và tên", phone: "Số điện thoại", address: "Địa chỉ nhận hàng", note: "Ghi chú cho shop", optional: "không bắt buộc",
      namePh: "Tên người nhận", phonePh: "Số điện thoại liên hệ", addressPh: "Số nhà, đường, phường/xã, tỉnh/thành", notePh: "Chiều cao, cân nặng hoặc yêu cầu tư vấn size…",
      next: "Tiếp tục đến thanh toán", back: "Quay lại thông tin", summary: "Đơn hàng của bạn", subtotal: "Giá trị sản phẩm", shipping: "Vận chuyển", shippingValue: "Shop báo khi xác nhận", total: "Tổng sản phẩm", deposit: "Cọc 50% giá trị sản phẩm", remaining: "50% còn lại khi nhận hàng", depositNote: "Tiền cọc chưa gồm phí vận chuyển. Shop xác nhận tình trạng hàng, size và phí giao trước khi chốt đơn.",
      bank: "Chuyển khoản ngân hàng", bankSub: "Chuyển khoản cọc vào tài khoản của shop", paypal: "PayPal", paypalSub: "Thanh toán qua trang PayPal bảo mật", bankName: "Ngân hàng", beneficiary: "Chủ tài khoản", account: "Số tài khoản", notSet: "Chưa được cấu hình", missingBank: "Shop chưa cung cấp số tài khoản MB Bank. Chưa thể chuyển khoản từ trang này. Vui lòng liên hệ shop để xác nhận thông tin trước khi thanh toán.", missingPaypal: "Shop chưa cung cấp liên kết PayPal. Phương thức này hiện chưa khả dụng.", copy: "Sao chép số tài khoản", copied: "Đã sao chép số tài khoản", copyFail: "Không thể sao chép. Bạn có thể chọn và sao chép số tài khoản bên trên.", paypalGo: "Mở PayPal", paypalNote: "Liên kết mở trong tab mới. Hãy kiểm tra người nhận, tiền tệ và số tiền với shop. Trang này không tự điền số tiền hoặc xác nhận giao dịch PayPal.", unavailable: "Thanh toán chưa khả dụng", bankReady: "Chỉ chuyển khoản sau khi shop xác nhận đơn và hướng dẫn nội dung chuyển khoản.", transparency: "Đây là bước chọn phương thức thanh toán, chưa phải xác nhận đặt hàng. Website hiện chưa gửi đơn đến shop và không tự xác minh thanh toán. Giỏ hàng của bạn được giữ nguyên.", contact: "Liên hệ Almira để xác nhận đơn", privacy: "Thông tin nhập chỉ giữ trong bộ nhớ của trang, không lưu lâu dài trên thiết bị.", empty: "Giỏ hàng đang trống", emptyText: "Hãy chọn một món yêu thích trước khi tiếp tục thanh toán.", shopping: "Khám phá cửa hàng", required: "Vui lòng điền thông tin này.", invalidPhone: "Nhập số điện thoại hợp lệ (9–15 chữ số).", reviewErrors: "Vui lòng kiểm tra các trường được đánh dấu.", qty: "Số lượng", size: "Size", color: "Màu", secure: "Thông tin rõ ràng · Đặt riêng theo đơn"
    },
    en: {
      title: "Make it yours", eyebrow: "ALMIRA STUDIO · CHECKOUT", home: "Shop", checkout: "Checkout",
      intro: "A few details, so Almira can take care of your order.", one: "Your details", two: "Payment method", step: "Step",
      name: "Full name", phone: "Phone number", address: "Delivery address", note: "Note for the shop", optional: "optional",
      namePh: "Recipient’s name", phonePh: "Contact phone number", addressPh: "Street, district, city and postal code", notePh: "Height, weight or any size-advice requests…",
      next: "Continue to payment", back: "Back to your details", summary: "Your selection", subtotal: "Merchandise subtotal", shipping: "Shipping", shippingValue: "Confirmed by the shop", total: "Merchandise total", deposit: "50% merchandise deposit", remaining: "Remaining 50% on delivery", depositNote: "The deposit excludes shipping. The shop confirms availability, size and delivery fees before accepting your order.",
      bank: "Bank transfer", bankSub: "Transfer your deposit to the shop", paypal: "PayPal", paypalSub: "Pay on PayPal’s secure website", bankName: "Bank", beneficiary: "Account holder", account: "Account number", notSet: "Not configured", missingBank: "The shop has not supplied its MB Bank account number. Bank transfer is not available here yet. Contact the shop and verify the details before paying.", missingPaypal: "The shop has not supplied a PayPal link. This method is currently unavailable.", copy: "Copy account number", copied: "Account number copied", copyFail: "Copy failed. You can select and copy the account number above.", paypalGo: "Open PayPal", paypalNote: "Opens in a new tab. Verify the recipient, currency and amount with the shop. This page does not prefill the amount or confirm PayPal transactions.", unavailable: "Payment unavailable", bankReady: "Only transfer after the shop confirms your order and provides a transfer reference.", transparency: "This is a payment-method selection, not an order confirmation. The website has not sent your order to the shop and does not verify payments automatically. Your bag is kept intact.", contact: "Contact Almira to confirm your order", privacy: "Your details stay in page memory only and are not stored permanently on your device.", empty: "Your bag is empty", emptyText: "Choose something you love before continuing to checkout.", shopping: "Explore the shop", required: "Please complete this field.", invalidPhone: "Enter a valid phone number (9–15 digits).", reviewErrors: "Please review the marked fields.", qty: "Quantity", size: "Size", color: "Color", secure: "Thoughtful details · Made to order"
    }
  };
  const tr = (key) => text[typeof lang !== "undefined" && lang === "en" ? "en" : "vi"][key] || key;
  const escape = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function view() {
    let el = document.getElementById("checkoutView");
    if (!el) { el = document.createElement("section"); el.id = "checkoutView"; el.className = "view alm-checkout"; el.setAttribute("aria-label", "Checkout"); document.querySelector('footer.site').before(el); }
    return el;
  }
  function capture() {
    const form = document.getElementById("almCheckoutForm");
    if (form) Object.keys(state.draft).forEach(key => { if (form.elements[key]) state.draft[key] = form.elements[key].value; });
  }
  function items() {
    return (typeof cart !== "undefined" ? cart : []).map(item => ({ item, product: byId(item.id) })).filter(row => row.product);
  }
  function field(key, multiline) {
    const err = state.errors[key];
    const attrs = `id="alm-co-${key}" name="${key}" ${key === "note" ? "" : "required"} aria-invalid="${!!err}" ${err ? `aria-describedby="alm-co-${key}-error"` : ""}`;
    const control = multiline ? `<textarea ${attrs} ${key === "address" ? 'autocomplete="street-address"' : ''} rows="${key === "note" ? 3 : 2}" maxlength="${key === "note" ? 2000 : 1000}" placeholder="${escape(tr(key + "Ph"))}">${escape(state.draft[key])}</textarea>` : `<input ${attrs} type="${key === "phone" ? "tel" : "text"}" autocomplete="${key === "name" ? "name" : "tel"}" ${key === "phone" ? 'inputmode="tel" maxlength="30"' : 'maxlength="120"'} placeholder="${escape(tr(key + "Ph"))}" value="${escape(state.draft[key])}">`;
    return `<label class="alm-co-field ${multiline ? "alm-co-wide" : ""}" for="alm-co-${key}"><span>${tr(key)} ${key === "note" ? `<small>(${tr("optional")})</small>` : '<span aria-hidden="true">*</span>'}</span>${control}${err ? `<span class="alm-co-error" id="alm-co-${key}-error">${escape(tr(err))}</span>` : ""}</label>`;
  }
  function summary(rows) {
    const total = rows.reduce((sum, { item, product }) => sum + product.price * item.qty, 0);
    const deposit = Math.round(total / 2);
    return `<aside class="alm-co-panel alm-co-summary" aria-label="${tr("summary")}"><span class="alm-co-kicker">${tr("secure")}</span><h2>${tr("summary")}</h2><div class="alm-co-items">${rows.map(({ item, product }) => `<article class="alm-co-item"><img src="${escape(product.img)}" alt="" loading="lazy"><div><p>${escape((typeof lang !== "undefined" && lang === "en" ? product.nameEn : product.name) || product.name)}</p><small>${escape(product.brand)} · ${tr("size")} ${escape(item.size)} · ${tr("color")} ${escape(item.color)}</small><small>${tr("qty")}: ${escape(item.qty)}</small><strong>${fmt(product.price * item.qty)}</strong></div></article>`).join("")}</div><dl class="alm-co-totals"><div><dt>${tr("total")}</dt><dd>${fmt(total)}</dd></div><div><dt>${tr("shipping")}</dt><dd>${tr("shippingValue")}</dd></div><div class="alm-co-deposit"><dt>${tr("deposit")}</dt><dd>${fmt(deposit)}</dd></div><div><dt>${tr("remaining")}</dt><dd>${fmt(total - deposit)}</dd></div></dl><p class="alm-co-fine">${tr("depositNote")}</p></aside>`;
  }
  function payment() {
    const cfg = window.ALMIRA_PAYMENTS || {};
    const bank = cfg.bank || {};
    const account = String(bank.accountNumber || "").trim();
    let paypalUrl = "";
    try { const u = new URL((cfg.paypal || {}).url || ""); if (u.protocol === "https:" && /(^|\.)paypal\.(com|me)$/i.test(u.hostname)) paypalUrl = u.href; } catch (_) {}
    const ready = state.payment === "bank" ? !!account : !!paypalUrl;
    const detail = state.payment === "bank" ? `<dl class="alm-co-bank"><div><dt>${tr("bankName")}</dt><dd>${escape(bank.name || "MB Bank")}</dd></div><div><dt>${tr("beneficiary")}</dt><dd>${escape(bank.beneficiary || "Hộ kinh doanh Almira Studio")}</dd></div><div><dt>${tr("account")}</dt><dd class="alm-co-account">${escape(account || tr("notSet"))}</dd></div></dl><p class="alm-co-notice" role="status">${tr(account ? "bankReady" : "missingBank")}</p><button class="btn btn-gold full" id="almCopyAccount" type="button" ${account ? "" : "disabled"}>${tr(account ? "copy" : "unavailable")}</button>` : `<p class="alm-co-notice" role="status">${tr(paypalUrl ? "paypalNote" : "missingPaypal")}</p>${paypalUrl ? `<a class="btn btn-gold full" href="${escape(paypalUrl)}" target="_blank" rel="noopener noreferrer">${tr("paypalGo")} ↗</a>` : `<button class="btn btn-gold full" type="button" disabled>${tr("unavailable")}</button>`}`;
    return `<fieldset class="alm-co-methods"><legend class="alm-co-sr">${tr("two")}</legend>${["bank", "paypal"].map(key => `<label class="alm-co-method ${state.payment === key ? "is-selected" : ""}"><input type="radio" name="almPayment" value="${key}" ${state.payment === key ? "checked" : ""}><span><strong>${tr(key)}</strong><small>${tr(key + "Sub")}</small></span><span aria-hidden="true">${key === "bank" ? "↗" : "P"}</span></label>`).join("")}</fieldset><div class="alm-co-payment-detail" data-ready="${ready}">${detail}</div><p class="alm-co-fine alm-co-transparency">${tr("transparency")}</p><a class="alm-co-contact" href="https://www.facebook.com/almira.studiooo" target="_blank" rel="noopener noreferrer">${tr("contact")} ↗</a><div class="alm-co-actions"><button class="btn btn-ghost" id="almCoBack" type="button">← ${tr("back")}</button></div><p id="almCoStatus" class="alm-co-fine" role="status" aria-live="polite"></p>`;
  }
  function render(options) {
    capture();
    const el = view(); const rows = items();
    document.title = tr("checkout") + " — Almira Studio";
    el.innerHTML = `<div class="wrap"><nav class="crumb" aria-label="Breadcrumb"><a href="#/shop">${tr("home")}</a><span class="sep">/</span><span class="here">${tr("checkout")}</span></nav><header class="alm-co-heading"><span class="alm-co-kicker">${tr("eyebrow")}</span><h1>${tr("title")}</h1><p>${tr("intro")}</p></header>${rows.length ? `<ol class="alm-co-progress" aria-label="${tr("checkout")}">${[1, 2].map(n => `<li class="${state.step === n ? "is-current" : state.step > n ? "is-done" : ""}" ${state.step === n ? 'aria-current="step"' : ""}><span>${String(n).padStart(2, "0")}</span>${tr(n === 1 ? "one" : "two")}</li>`).join("")}</ol><div class="alm-co-layout"><section class="alm-co-panel alm-co-form-panel"><span class="alm-co-kicker">${tr("step")} ${state.step} / 2</span><h2 id="almCheckoutStepHeading" tabindex="-1">${tr(state.step === 1 ? "one" : "two")}</h2>${state.step === 1 ? `<form id="almCheckoutForm" novalidate><div class="alm-co-fields">${field("name")}${field("phone")}${field("address", true)}${field("note", true)}</div>${Object.keys(state.errors).length ? `<p class="alm-co-error" role="alert">${tr("reviewErrors")}</p>` : ""}<div class="alm-co-actions"><button type="submit" class="btn btn-gold full">${tr("next")} →</button></div><p class="alm-co-fine">${tr("privacy")}</p></form>` : payment()}</section>${summary(rows)}</div>` : `<section class="alm-co-panel alm-co-empty"><span aria-hidden="true">♡</span><h2 id="almCheckoutStepHeading" tabindex="-1">${tr("empty")}</h2><p>${tr("emptyText")}</p><a class="btn btn-gold" href="#/shop">${tr("shopping")} →</a></section>`}</div>`;
    const form = el.querySelector("form");
    if (form) {
      form.addEventListener("input", capture);
      form.addEventListener("submit", event => {
        event.preventDefault(); capture(); state.errors = {};
        ["name", "phone", "address"].forEach(key => { if (!state.draft[key].trim()) state.errors[key] = "required"; });
        const digits = state.draft.phone.replace(/\D/g, "");
        if (state.draft.phone.trim() && (digits.length < 9 || digits.length > 15)) state.errors.phone = "invalidPhone";
        if (Object.keys(state.errors).length) { render(); el.querySelector('[aria-invalid="true"]').focus(); return; }
        state.step = 2; render({ focus: true });
      });
    }
    el.querySelectorAll('input[name="almPayment"]').forEach(radio => radio.addEventListener("change", () => { state.payment = radio.value; render(); }));
    const back = el.querySelector("#almCoBack"); if (back) back.addEventListener("click", () => { state.step = 1; render({ focus: true }); });
    const copy = el.querySelector("#almCopyAccount"); if (copy && !copy.disabled) copy.addEventListener("click", async () => { try { await navigator.clipboard.writeText(String(window.ALMIRA_PAYMENTS.bank.accountNumber).trim()); el.querySelector("#almCoStatus").textContent = tr("copied"); } catch (_) { el.querySelector("#almCoStatus").textContent = tr("copyFail"); } });
    if (options && options.focus) { const heading = el.querySelector("#almCheckoutStepHeading"); if (heading) { heading.focus({ preventScroll: true }); heading.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); } }
  }
  window.AlmiraCheckout = { render, getStep: () => state.step, resetStep: () => { capture(); state.step = 1; state.errors = {}; } };
})();
