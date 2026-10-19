/* Two-step checkout and website order submission; customer data stays in memory. */
(function () {
  "use strict";
  const state = {
    step: 1, payment: "bank", draft: { name: "", phone: "", address: "", note: "" }, errors: {},
    quote: null, quoteReviewed: false, idempotencyKey: null, orderPayload: null, submitting: false, result: null
  };
  const text = {
    vi: {
      title:"Hoàn thiện đơn hàng",eyebrow:"ALMIRA STUDIO · CHECKOUT",home:"Cửa hàng",checkout:"Thanh toán",intro:"Một vài thông tin, để Almira chăm chút đơn hàng của bạn.",one:"Thông tin mua hàng",two:"Phương thức thanh toán",step:"Bước",name:"Họ và tên",phone:"Số điện thoại",address:"Địa chỉ nhận hàng",note:"Ghi chú cho shop",optional:"không bắt buộc",namePh:"Tên người nhận",phonePh:"Số điện thoại liên hệ",addressPh:"Số nhà, đường, phường/xã, tỉnh/thành",notePh:"Chiều cao, cân nặng hoặc yêu cầu tư vấn size…",next:"Tiếp tục đến thanh toán",back:"Quay lại thông tin",summary:"Đơn hàng của bạn",subtotal:"Tạm tính theo giỏ hàng",discount:"Giảm giá / chiết khấu bổ sung",discountValue:"Chưa áp dụng",shipping:"Vận chuyển",shippingUnknown:"Chưa xác nhận",total:"Tổng đơn hàng",deposit:"Cọc 50% giá trị đơn hàng",remaining:"Còn lại sau khi trừ tiền cọc",depositNote:"Tiền cọc được tính bằng 50% giá trị đơn hàng sau giảm giá/chiết khấu (nếu có). Almira sẽ xác nhận ưu đãi, phí giao hàng và giá trị đơn cuối cùng trước khi hướng dẫn thanh toán.",bank:"Chuyển khoản ngân hàng",bankSub:"Chuyển khoản cọc vào tài khoản của shop",paypal:"PayPal",paypalSub:"Thanh toán qua trang PayPal bảo mật",bankName:"Ngân hàng",beneficiary:"Chủ tài khoản",account:"Số tài khoản",notSet:"Chưa được cấu hình",missingBank:"Shop chưa cung cấp số tài khoản MB Bank. Vui lòng liên hệ shop để xác nhận trước khi thanh toán.",missingPaypal:"Shop chưa cung cấp liên kết PayPal. Phương thức này hiện chưa khả dụng.",copy:"Sao chép số tài khoản",copied:"Đã sao chép số tài khoản",copyFail:"Không thể sao chép số tài khoản.",paypalGo:"Mở PayPal",paypalNote:"Hãy kiểm tra người nhận, tiền tệ và số tiền với shop. Trang này không xác minh giao dịch PayPal.",unavailable:"Thanh toán chưa khả dụng",bankReady:"Chỉ chuyển khoản sau khi shop xác nhận đơn và hướng dẫn nội dung chuyển khoản.",transparency:"Đây là bước chọn phương thức thanh toán, chưa phải xác nhận thanh toán. Website chỉ gửi yêu cầu đặt hàng khi bạn xác nhận báo giá bên dưới. Website không xác minh giao dịch.",contact:"Liên hệ Almira",privacy:"Thông tin chỉ giữ trong bộ nhớ trang và không lưu lâu dài trên thiết bị.",empty:"Giỏ hàng đang trống",emptyText:"Hãy chọn một món yêu thích trước khi tiếp tục.",shopping:"Khám phá cửa hàng",required:"Vui lòng điền thông tin này.",invalidPhone:"Nhập số điện thoại hợp lệ (9–15 chữ số).",reviewErrors:"Vui lòng kiểm tra các trường được đánh dấu.",qty:"Số lượng",size:"Size",color:"Màu",secure:"Thông tin rõ ràng · Đặt riêng theo đơn",submit:"Lấy báo giá",confirmQuote:"Xác nhận báo giá và gửi đơn",retryOrder:"Gửi lại yêu cầu",statusTokenLabel:"Mã tra cứu",lookupHelp:"Nhập mã tra cứu đã lưu trước đó. Mã không được lưu trên thiết bị này.",unitPrice:"Đơn giá",submitting:"Đang gửi…",submitUnavailable:"Tạm thời chưa thể nhận đơn qua website.",orderReceived:"Almira đã nhận yêu cầu đặt hàng.",synced:"Đơn đã được chuyển sang Pancake.",pending:"Yêu cầu đã được tiếp nhận; shop sẽ kiểm tra và cập nhật.",manual:"Kết quả chưa xác định. Vui lòng liên hệ shop để kiểm tra; không gửi lại yêu cầu.",code:"Mã yêu cầu",copyToken:"Sao chép mã tra cứu",lookup:"Tra cứu trạng thái",lookupFail:"Không tìm thấy trạng thái hoặc mã không hợp lệ.",lookupLoading:"Đang tra cứu…",orderFail:"Chưa gửi được yêu cầu. Có thể thử lại cùng yêu cầu.",priceChanged:"Giá hoặc lựa chọn sản phẩm thay đổi. Vui lòng tải báo giá mới.",staleCatalog:"Catalog đã cũ hoặc thay đổi. Vui lòng tải lại báo giá.",quoteReady:"Vui lòng kiểm tra báo giá do máy chủ xác nhận. Bấm xác nhận để gửi yêu cầu đặt hàng.",price:"Đơn giá",shippingNote:"Phí vận chuyển chưa được xác nhận.",lookupHelp:"Nhập mã tra cứu đã lưu trước đó. Mã không được lưu trên thiết bị này."
    },
    en: {
      title:"Make it yours",eyebrow:"ALMIRA STUDIO · CHECKOUT",home:"Shop",checkout:"Checkout",intro:"A few details, so Almira can take care of your order.",one:"Your details",two:"Payment method",step:"Step",name:"Full name",phone:"Phone number",address:"Delivery address",note:"Note for the shop",optional:"optional",namePh:"Recipient’s name",phonePh:"Contact phone number",addressPh:"Street, district, city and postal code",notePh:"Height, weight or size-advice requests…",next:"Continue to payment",back:"Back to your details",summary:"Your order",subtotal:"Bag subtotal",discount:"Additional discount",discountValue:"Not applied",shipping:"Shipping",shippingUnknown:"Unconfirmed",total:"Order total",deposit:"50% order deposit",remaining:"Balance after the deposit",depositNote:"Your deposit is 50% of the order total after any discounts. Almira confirms discounts, delivery fees and the final order total before providing payment instructions.",bank:"Bank transfer",bankSub:"Transfer your deposit to the shop",paypal:"PayPal",paypalSub:"Pay on PayPal’s secure website",bankName:"Bank",beneficiary:"Account holder",account:"Account number",notSet:"Not configured",missingBank:"The shop has not supplied bank details. Verify them with the shop before paying.",missingPaypal:"The shop has not supplied a PayPal link.",copy:"Copy account number",copied:"Account number copied",copyFail:"Could not copy the account number.",paypalGo:"Open PayPal",paypalNote:"Verify the recipient, currency and amount with the shop. This page does not verify PayPal transactions.",unavailable:"Payment unavailable",bankReady:"Transfer only after the shop confirms your order and provides instructions.",transparency:"Choosing a payment method does not confirm payment. The website submits an order request only when you confirm the quote below. It does not verify transactions.",contact:"Contact Almira",privacy:"Your details stay in page memory only and are not stored permanently.",empty:"Your bag is empty",emptyText:"Choose something before continuing.",shopping:"Explore the shop",required:"Please complete this field.",invalidPhone:"Enter a valid phone number (9–15 digits).",reviewErrors:"Please review the marked fields.",qty:"Quantity",size:"Size",color:"Color",secure:"Thoughtful details · Made to order",submit:"Get quote",confirmQuote:"Confirm quote and submit order",retryOrder:"Retry the same request",statusTokenLabel:"Lookup token",lookupHelp:"Enter a saved lookup token. It is not stored on this device.",unitPrice:"Unit price",submitting:"Submitting…",submitUnavailable:"Website order submission is temporarily unavailable.",orderReceived:"Almira has received your order request.",synced:"The order has been sent to Pancake.",pending:"Request received; the shop will review and update it.",manual:"The result is unknown. Contact the shop to check; do not retry.",code:"Request ID",copyToken:"Copy lookup token",lookup:"Check status",lookupFail:"Status unavailable or token is invalid.",lookupLoading:"Checking…",orderFail:"The request was not confirmed. The same request may be retried.",priceChanged:"A price or option changed. Please request a fresh quote.",staleCatalog:"The catalog changed. Please request a fresh quote.",quoteReady:"Review the server-confirmed quote. Confirm below to submit the order request.",price:"Unit price",shippingNote:"Shipping is not confirmed.",lookupHelp:"Enter a previously saved lookup token. Tokens are not stored on this device."
    }
  };
  const tr = key => text[typeof lang !== "undefined" && lang === "en" ? "en" : "vi"][key] || key;
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const cents = value => { const [whole, fraction=""] = String(value).split("."); return BigInt(whole) * 100n + BigInt((fraction + "00").slice(0, 2)); };
  const half = value => value / 2n + value % 2n;
  const cartItems = () => typeof cart === "undefined" ? [] : cart;
  function view() {
    let el = document.getElementById("checkoutView");
    if (!el) { el = document.createElement("section"); el.id = "checkoutView"; el.className = "view alm-checkout"; el.setAttribute("aria-label", "Checkout"); document.querySelector("footer.site").before(el); }
    return el;
  }
  function capture() {
    const form = document.getElementById("almCheckoutForm");
    if (form) Object.keys(state.draft).forEach(key => { if (form.elements[key]) state.draft[key] = form.elements[key].value; });
  }
  function rows() {
    return cartItems().map(item => ({ item, product: byId(item.id), variation: byId(item.id)?.variations.find(v => v.id === item.variationId) })).filter(row => row.product && row.variation);
  }
  function totals() {
    const total = rows().reduce((sum, row) => sum + cents(row.variation.price) * BigInt(row.item.qty), 0n);
    const deposit = half(total);
    return { total, deposit, remaining: total - deposit };
  }
  function quoteRows() {
    if (!state.quote || !Array.isArray(state.quote.items)) return [];
    return state.quote.items.map(item => ({ ...item, quantity: item.quantity ?? item.qty }));
  }
  function field(key, multiline) {
    const err = state.errors[key];
    const attrs = `id="alm-co-${key}" name="${key}" ${key === "note" ? "" : "required"} aria-invalid="${!!err}" ${err ? `aria-describedby="alm-co-${key}-error"` : ""}`;
    const control = multiline ? `<textarea ${attrs} ${key === "address" ? 'autocomplete="street-address"' : ""} rows="${key === "note" ? 3 : 2}" maxlength="${key === "note" ? 2000 : 1000}" placeholder="${esc(tr(key + "Ph"))}">${esc(state.draft[key])}</textarea>` : `<input ${attrs} type="${key === "phone" ? "tel" : "text"}" autocomplete="${key === "name" ? "name" : "tel"}" ${key === "phone" ? 'inputmode="tel" maxlength="30"' : 'maxlength="120"'} placeholder="${esc(tr(key + "Ph"))}" value="${esc(state.draft[key])}">`;
    return `<label class="alm-co-field ${multiline ? "alm-co-wide" : ""}" for="alm-co-${key}"><span>${tr(key)} ${key === "note" ? `<small>(${tr("optional")})</small>` : '<span aria-hidden="true">*</span>'}</span>${control}${err ? `<span class="alm-co-error" id="alm-co-${key}-error">${esc(tr(err))}</span>` : ""}</label>`;
  }
  function quoteSummary() {
    const quote = state.quote;
    const lines = quoteRows();
    const total = cents(quote.total);
    const deposit = cents(quote.deposit);
    const remaining = cents(quote.remaining);
    return `<aside class="alm-co-panel alm-co-summary" aria-label="${tr("summary")}" aria-live="polite"><span class="alm-co-kicker">${tr("secure")}</span><h2>${tr("summary")}</h2><div class="alm-co-items">${lines.map(item => `<article class="alm-co-item"><div><p>${esc(item.name)}</p><small>${tr("size")} ${esc(item.size)} · ${tr("color")} ${esc(item.color)} · ${tr("qty")}: ${esc(item.quantity)}</small><small>${tr("price")}: ${fmt(cents(item.unitPrice))}</small><strong>${fmt(cents(item.lineTotal))}</strong></div></article>`).join("")}</div><dl class="alm-co-totals"><div><dt>${tr("total")}</dt><dd>${fmt(total)}</dd></div><div class="alm-co-deposit"><dt>${tr("deposit")}</dt><dd>${fmt(deposit)}</dd></div><div><dt>${tr("remaining")}</dt><dd>${fmt(remaining)}</dd></div></dl><p class="alm-co-fine">${tr("shippingNote")}</p><p class="alm-co-fine" role="status">${tr("quoteReady")}</p></aside>`;
  }
  function cartSummary(data) {
    return `<aside class="alm-co-panel alm-co-summary" aria-label="${tr("summary")}"><span class="alm-co-kicker">${tr("secure")}</span><h2>${tr("summary")}</h2><div class="alm-co-items">${rows().map(({item, product, variation}) => `<article class="alm-co-item"><img src="${esc(product.img)}" alt="" loading="lazy"><div><p>${esc(lang === "en" ? product.nameEn : product.name)}</p><small>${esc(product.brand)} · ${tr("size")} ${esc(item.size)} · ${tr("color")} ${esc(product.colors.find(c => c[0] === item.color)?.[lang === "en" ? 2 : 0] || item.color)}</small><small>${tr("qty")}: ${item.qty}</small><strong>${fmt(cents(variation.price) * BigInt(item.qty))}</strong></div></article>`).join("")}</div><dl class="alm-co-totals"><div><dt>${tr("subtotal")}</dt><dd>${fmt(data.total)}</dd></div><div><dt>${tr("discount")}</dt><dd>${tr("discountValue")}</dd></div><div><dt>${tr("shipping")}</dt><dd>${tr("shippingUnknown")}</dd></div><div><dt>${tr("total")}</dt><dd>${fmt(data.total)}</dd></div><div class="alm-co-deposit"><dt>${tr("deposit")}</dt><dd>${fmt(data.deposit)}</dd></div><div><dt>${tr("remaining")}</dt><dd>${fmt(data.remaining)}</dd></div></dl><p class="alm-co-fine">${tr("depositNote")}</p></aside>`;
  }
  function payment() {
    const cfg = window.ALMIRA_PAYMENTS || {}, bank = cfg.bank || {}, account = String(bank.accountNumber || "").trim();
    let paypalUrl = "";
    try { const url = new URL((cfg.paypal || {}).url || ""); if (url.protocol === "https:" && /(^|\.)paypal\.(com|me)$/i.test(url.hostname)) paypalUrl = url.href; } catch (_) {}
    const detail = state.payment === "bank" ? `<dl class="alm-co-bank"><div><dt>${tr("bankName")}</dt><dd>${esc(bank.name || "MB Bank")}</dd></div><div><dt>${tr("beneficiary")}</dt><dd>${esc(bank.beneficiary || "Hộ kinh doanh Almira Studio")}</dd></div><div><dt>${tr("account")}</dt><dd class="alm-co-account">${esc(account || tr("notSet"))}</dd></div></dl><p class="alm-co-notice" role="status">${tr(account ? "bankReady" : "missingBank")}</p><button class="btn btn-gold full" id="almCopyAccount" type="button" ${account ? "" : "disabled"}>${tr(account ? "copy" : "unavailable")}</button>` : `<p class="alm-co-notice" role="status">${tr(paypalUrl ? "paypalNote" : "missingPaypal")}</p>${paypalUrl ? `<a class="btn btn-gold full" href="${esc(paypalUrl)}" target="_blank" rel="noopener noreferrer">${tr("paypalGo")} ↗</a>` : `<button class="btn btn-gold full" type="button" disabled>${tr("unavailable")}</button>`}`;
    return `<fieldset class="alm-co-methods"><legend class="alm-co-sr">${tr("two")}</legend>${["bank", "paypal"].map(key => `<label class="alm-co-method ${state.payment === key ? "is-selected" : ""}"><input type="radio" name="almPayment" value="${key}" ${state.payment === key ? "checked" : ""}><span><strong>${tr(key)}</strong><small>${tr(key + "Sub")}</small></span><span aria-hidden="true">${key === "bank" ? "↗" : "P"}</span></label>`).join("")}</fieldset><div class="alm-co-payment-detail">${detail}</div><p class="alm-co-fine alm-co-transparency">${tr("transparency")}</p><a class="alm-co-contact" href="https://www.facebook.com/almira.studiooo" target="_blank" rel="noopener noreferrer">${tr("contact")} ↗</a><div class="alm-co-actions"><button class="btn btn-ghost" id="almCoBack" type="button">← ${tr("back")}</button>${state.quote ? `<button class="btn btn-gold" id="almSubmitOrder" type="button" ${state.submitting || !window.AlmiraCatalog.checkoutEnabled ? "disabled" : ""}>${state.submitting ? tr("submitting") : state.orderPayload ? tr("retryOrder") : tr("confirmQuote")}</button>` : `<button class="btn btn-gold" id="almSubmitOrder" type="button" ${state.submitting || !window.AlmiraCatalog.checkoutEnabled || state.orderPayload ? "disabled" : ""}>${state.submitting ? tr("submitting") : tr("submit")}</button>`}</div>${!window.AlmiraCatalog.checkoutEnabled ? `<p class="alm-co-error" role="status">${tr("unavailableSubmit")}</p>` : ""}<p id="almCoStatus" class="alm-co-fine" role="status" aria-live="polite"></p>`;
  }
  function trialAccess() {
    if (!window.AlmiraCatalog.checkoutTrial) return "";
    const en = lang === "en";
    const notice = en ? "Private verification: one real order only. Recipient details are sent to the shop and Pancake to process this purchase. No payment is verified." : "Kiểm chứng riêng: chỉ một đơn mua thật. Thông tin nhận hàng được gửi cho shop và Pancake để xử lý đơn này. Website không xác minh thanh toán.";
    return `<section class="alm-co-panel"><p>${notice}</p>${window.AlmiraCatalog.checkoutEnabled ? "" : `<form id="almTrialAccess"><label class="alm-co-field">${en ? "Private access code" : "Mã truy cập riêng"}<input name="code" type="password" autocomplete="off" required maxlength="128"></label><button class="btn btn-ghost" type="submit">${en ? "Unlock verification" : "Mở quyền kiểm chứng"}</button><p id="almTrialStatus" role="status"></p></form>`}</section>`;
  }
  function statusLookup() {
    return `<section class="alm-co-panel alm-co-lookup"><h2>${tr("lookup")}</h2><p>${tr("lookupHelp")}</p><form id="almStatusLookup"><label class="alm-co-field">${tr("statusTokenLabel")}<input name="token" type="password" autocomplete="off" maxlength="4096"></label><button class="btn btn-ghost" type="submit">${tr("lookup")}</button></form><p id="almStatusResult" role="status" aria-live="polite"></p></section>`;
  }
  function resultView() {
    const result = state.result, synced = result.status === "synced", unknown = result.status === "unknown" || result.status === "manual";
    return `<section class="alm-co-panel alm-co-result"><h2>${tr("orderReceived")}</h2><p>${tr(synced ? "synced" : unknown ? "manual" : "pending")}</p><p>${tr("code")}: <strong>${esc(result.websiteOrderId || "")}</strong></p>${result.statusToken ? `<button type="button" class="btn btn-ghost" id="almCopyToken">${tr("copyToken")}</button>` : ""}</section>`;
  }
  function render(options) {
    capture();
    const el = view(), data = totals();
    document.title = tr("checkout") + " — Almira Studio";
    const result = state.result ? resultView() : rows().length ? `<ol class="alm-co-progress" aria-label="${tr("checkout")}">${[1, 2].map(n => `<li class="${state.step === n ? "is-current" : state.step > n ? "is-done" : ""}" ${state.step === n ? 'aria-current="step"' : ""}><span>${String(n).padStart(2, "0")}</span>${tr(n === 1 ? "one" : "two")}</li>`).join("")}</ol><div class="alm-co-layout"><section class="alm-co-panel alm-co-form-panel"><span class="alm-co-kicker">${tr("step")} ${state.step} / 2</span><h2 id="almCheckoutStepHeading" tabindex="-1">${tr(state.step === 1 ? "one" : "two")}</h2>${state.step === 1 ? `<form id="almCheckoutForm" novalidate><div class="alm-co-fields">${field("name")}${field("phone")}${field("address", true)}${field("note", true)}</div>${Object.keys(state.errors).length ? `<p class="alm-co-error" role="alert">${tr("reviewErrors")}</p>` : ""}<div class="alm-co-actions"><button type="submit" class="btn btn-gold full">${tr("next")} →</button></div><p class="alm-co-fine">${tr("privacy")}</p></form>` : payment()}</section>${state.quote ? quoteSummary() : cartSummary(data)}</div>` : `<section class="alm-co-panel alm-co-empty"><span aria-hidden="true">♡</span><h2 id="almCheckoutStepHeading" tabindex="-1">${tr("empty")}</h2><p>${tr("emptyText")}</p><a class="btn btn-gold" href="#/shop">${tr("shopping")} →</a></section>`;
    el.innerHTML = `<div class="wrap"><nav class="crumb" aria-label="Breadcrumb"><a href="#/shop">${tr("home")}</a><span class="sep">/</span><span class="here">${tr("checkout")}</span></nav><header class="alm-co-heading"><span class="alm-co-kicker">${tr("eyebrow")}</span><h1>${tr("title")}</h1><p>${tr("intro")}</p></header>${trialAccess()}${result}${statusLookup()}</div>`;
    el.querySelector("#almTrialAccess")?.addEventListener("submit", async event => {
      event.preventDefault(); const form = event.currentTarget; const code = form.elements.code.value;
      form.elements.code.value = "";
      try { await postJson("/api/checkout/trial", { code }); await window.AlmiraCatalog.load(); render(); }
      catch (_) { const output = document.getElementById("almTrialStatus"); if (output) output.textContent = lang === "en" ? "Access denied or temporarily unavailable." : "Mã chưa đúng hoặc quyền kiểm chứng chưa sẵn sàng."; }
    });
    const form = el.querySelector("#almCheckoutForm");
    if (form) {
      form.addEventListener("input", capture);
      form.addEventListener("submit", event => {
        event.preventDefault(); capture(); state.errors = {};
        ["name", "phone", "address"].forEach(key => { if (!state.draft[key].trim()) state.errors[key] = "required"; });
        const digits = state.draft.phone.replace(/\D/g, "");
        if (state.draft.phone.trim() && (digits.length < 9 || digits.length > 15)) state.errors.phone = "invalidPhone";
        if (Object.keys(state.errors).length) { render(); el.querySelector('[aria-invalid="true"]')?.focus(); return; }
        state.step = 2; render({ focus: true });
      });
    }
    const transparency = el.querySelector(".alm-co-transparency");
    if (transparency && !window.AlmiraCatalog.checkoutEnabled) transparency.textContent = tr("submitUnavailable");
    el.querySelectorAll('input[name="almPayment"]').forEach(radio => radio.addEventListener("change", () => { state.payment = radio.value; render(); }));
    el.querySelector("#almCoBack")?.addEventListener("click", () => { if (!state.orderPayload) { state.quote = null; state.quoteReviewed = false; } state.step = 1; render({ focus: true }); });
    el.querySelector("#almCopyAccount")?.addEventListener("click", async () => { try { await navigator.clipboard.writeText(String((window.ALMIRA_PAYMENTS || {}).bank?.accountNumber || "").trim()); el.querySelector("#almCoStatus").textContent = tr("copied"); } catch (_) { el.querySelector("#almCoStatus").textContent = tr("copyFail"); } });
    el.querySelector("#almSubmitOrder")?.addEventListener("click", submitOrder);
    el.querySelector("#almCopyToken")?.addEventListener("click", async () => { try { await navigator.clipboard.writeText(state.result.statusToken); } catch (_) {} });
    el.querySelector("#almStatusLookup")?.addEventListener("submit", lookupStatus);
    if (options?.focus) { const heading = el.querySelector("#almCheckoutStepHeading"); if (heading) { heading.focus({ preventScroll: true }); heading.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); } }
  }
  async function postJson(path, body, headers) {
    const response = await fetch(path, { method:"POST", headers:{"Content-Type":"application/json",Accept:"application/json",...(headers || {})}, body:JSON.stringify(body), cache:"no-store" });
    let data; try { data = await response.json(); } catch (_) { throw new Error("Invalid API response"); }
    if (!response.ok) { const error = new Error(data?.error || "Request failed"); error.status = response.status; throw error; }
    return data;
  }
  async function submitOrder() {
    if (state.submitting || state.result || !window.AlmiraCatalog.checkoutEnabled) return;
    state.submitting = true; render();
    try {
      if (state.orderPayload) {
        const result = await postJson("/api/orders", state.orderPayload, { "Idempotency-Key": state.idempotencyKey });
        if (typeof result.websiteOrderId !== "string" || typeof result.status !== "string" || typeof result.statusToken !== "string") throw new Error("Invalid order response");
        state.result = result; state.orderPayload = null; state.idempotencyKey = null; state.submitting = false; render(); return;
      }
      if (!state.quote) {
        const quote = await postJson("/api/quote", { snapshotId:window.AlmiraCatalog.snapshotId, items:rows().map(({item})=>({productId:item.id,variationId:item.variationId,quantity:item.qty})) });
        if (typeof quote.quoteId !== "string" || quote.snapshotId !== window.AlmiraCatalog.snapshotId || !Array.isArray(quote.items) || !quote.items.length || !["total","deposit","remaining"].every(key=>typeof quote[key]==="string")) throw new Error("Invalid quote response");
        quote.items.forEach(item=>{if(typeof item.productId!=="string"||typeof item.variationId!=="string"||!Number.isInteger(item.quantity)||typeof item.name!=="string"||typeof item.size!=="string"||typeof item.color!=="string"||typeof item.unitPrice!=="string"||typeof item.lineTotal!=="string")throw new Error("Invalid quote item");});
        state.quote = quote; state.quoteReviewed = false; state.submitting = false; render(); return;
      }
      capture();
      state.idempotencyKey = crypto.randomUUID();
      state.orderPayload = { quoteId:state.quote.quoteId, customer:{...state.draft}, paymentMethod:state.payment };
      const result = await postJson("/api/orders", state.orderPayload, { "Idempotency-Key":state.idempotencyKey });
      if (typeof result.websiteOrderId !== "string" || typeof result.status !== "string" || typeof result.statusToken !== "string") throw new Error("Invalid order response");
      state.result = result; state.orderPayload = null; state.idempotencyKey = null; state.quote = null; state.submitting = false; render();
    } catch (error) {
      state.submitting = false;
      if (error.status === 409 && error.message !== "idempotency_conflict" && state.orderPayload) { state.orderPayload = null; state.idempotencyKey = null; state.quote = null; state.quoteReviewed = false; }
      render();
      const status = document.getElementById("almCoStatus");
      if (status) status.textContent = error.status === 409 ? tr(state.orderPayload ? "staleCatalog" : "priceChanged") : tr("orderFail");
    }
  }
  async function lookupStatus(event) {
    event.preventDefault();
    const token = String(new FormData(event.currentTarget).get("token") || "").trim(), output = document.getElementById("almStatusResult");
    if (!token || token.length > 4096) { output.textContent = tr("lookupFail"); return; }
    output.textContent = tr("lookupLoading");
    try {
      const result = await postJson("/api/orders/status", { token });
      const message = result.status === "synced" ? "synced" : ["unknown", "manual"].includes(result.status) ? "manual" : "pending";
      output.textContent = `${tr("code")}: ${result.websiteOrderId} — ${tr(message)}`;
    }
    catch (_) { output.textContent = tr("lookupFail"); }
  }
  window.AlmiraCheckout = { render, getStep:() => state.step, resetStep:() => { capture(); if (state.result || state.orderPayload || state.submitting) return; state.step=1; state.errors={}; state.quote=null; } };
})();
