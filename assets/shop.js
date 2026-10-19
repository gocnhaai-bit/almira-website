
"use strict";
const PRODUCTS = window.AlmiraCatalog.products;
const CAT_NAMES = { dam:"Đầm", ao:"Áo", set:"Set đồ", khoac:"Áo khoác", quan:"Quần", phukien:"Phụ kiện" };
const CAT_NAMES_EN = { dam:"Dresses", ao:"Tops", set:"Sets", khoac:"Outerwear", quan:"Trousers", phukien:"Accessories" };
let catalogSnapshotId = window.AlmiraCatalog.snapshotId;
let checkoutEnabled = window.AlmiraCatalog.checkoutEnabled;
const catalogStatus = document.getElementById("catalogStatus");
window.addEventListener("almira:catalog-ready", event => {
  catalogSnapshotId = event.detail.snapshotId;
  checkoutEnabled = event.detail.checkoutEnabled;
  cart = cart.filter(item => byId(item.id)?.variations.some(v => v.id === item.variationId && v.size === item.size && v.color === item.color));
  renderGrid(); renderBrandsPage(); renderCart(); route();
  window.AlmiraHome?.render();
  if (document.body.dataset.page === "checkout") window.AlmiraCheckout?.render();
});


/* ================= I18N (VI / EN) ================= */
let lang = "vi";
try { const saved = localStorage.getItem("almira-lang"); if (saved === "en" || saved === "vi") lang = saved; } catch(e){}
const I18N = {
vi:{ docTitle:"Almira.Studiooo — Thời trang nữ order cao cấp",
  ann1:"Order chính hãng", ann2:"Về hàng 7–14 ngày", ann3:"Cọc 50%", ann4:"Đổi size 3 ngày",
  brandSub:"Studiooo · Order cao cấp",
  navShop:"Cửa hàng", navBrands:"Thương hiệu", navCats:"Danh mục", navHow:"Cách đặt order", navAbout:"Về Almira", navContact:"Liên hệ",
  heroBsub:"Thời trang nữ order cao cấp.", heroOver:"Bộ sưu tập mới",
  heroL1:"Thanh lịch", heroL2:"trong từng", heroL3:"đường nét",
  heroSub:"Order cao cấp từ <em>OAKMOO, ANNATTO, Callmelater, Acestudios</em>.",
  chip1b:"Chính hãng 100%", chip1s:"Có bill order", chip2b:"Về hàng 7–14 ngày", chip2s:"Đặt riêng theo đơn",
  noteLabel:"Đặt order", noteBig:"Cọc chỉ 50%", noteSub:"Còn lại khi nhận hàng",
  btnShop:"Mua sắm ngay", btnHow:"Cách đặt order",
  perk1:"Chính hãng 100%", perk1s:"Có bill order", perk2:"Về hàng 7–14 ngày", perk2s:"Đặt riêng theo đơn",
  perk3:"Cọc 50%", perk3s:"Còn lại khi nhận hàng", perk4:"Đổi size 3 ngày", perk4s:"Hỗ trợ tận tâm",
  catsT:"Danh mục", brandsT:"Thương hiệu", brandsAll:"Tất cả thương hiệu →", brandsPageT:"Tất cả thương hiệu",
  brandsCountT:"{n} thương hiệu", brandCountT:"{n} sản phẩm", shopT:"Cửa hàng", shopLink:"Quy trình order →", fAll:"Tất cả",
  catDam:"Đầm", catAo:"Áo", catSet:"Set đồ", catKhoac:"Áo khoác", catQuan:"Quần", catPk:"Phụ kiện",
  sortFeatured:"Nổi bật", sortNew:"Mới nhất", sortAsc:"Giá: thấp → cao", sortDesc:"Giá: cao → thấp",
  shopCountT:"{a} / {b} sản phẩm",
  moreT:"Xem thêm — {n}/{total} sản phẩm",
  emptyGrid:"Không tìm thấy sản phẩm phù hợp. Thử từ khóa hoặc danh mục khác nhé.",
  cardAdd:"Xem & chọn size",
  crumbHome:"Trang chủ", relatedT:"Cùng thương hiệu", galleryCount:"{n} / {total}",
  brandMissing:"Không tìm thấy thương hiệu này.",
  howT:"Đặt order trong 4 bước",
  step1t:"Chọn mẫu & size", step1p:"Thêm vào giỏ, chọn size & màu.",
  step2t:"Đặt hàng & cọc 50%", step2p:"Điền thông tin, shop hướng dẫn cọc.",
  step3t:"Đặt mua từ hãng", step3p:"Đặt trong ngày, về sau 7–14 ngày.",
  step4t:"Nhận hàng", step4p:"Kiểm tra & thanh toán nốt 50%.",
  aboutT:"Về Almira Studio",
  aboutP:"Thời trang nữ order cao cấp — thiết kế thanh lịch, tối giản từ Hàn Quốc & quốc tế.",
  aboutMore:"Mỗi sản phẩm đều được đặt mua trực tiếp từ hãng theo đơn của khách, kiểm tra kỹ trước khi giao và đóng gói chỉn chu. Bạn cũng có thể theo dõi mẫu mới mỗi ngày trên Instagram, Threads và Facebook của shop.",
  polT:"Chính sách mua hàng", pol1T:"Đặt hàng & thanh toán",
  pol1a:"Hàng order, không có sẵn: thời gian về hàng 7–14 ngày làm việc kể từ khi hãng phát hàng.",
  pol1b:"Khách đặt cọc 50% giá trị đơn để Almira tiến hành đặt mua; phần còn lại thanh toán khi nhận hàng (COD) hoặc chuyển khoản.",
  pol1c:"Đơn chỉ được chốt sau khi shop xác nhận còn hàng và size với hãng.",
  pol2T:"Đổi trả",
  pol2a:"Hỗ trợ đổi size trong 3 ngày kể từ khi nhận hàng nếu sản phẩm bị lỗi từ nhà sản xuất (rách, lỗi đường may, sai mẫu).",
  pol2b:"Sản phẩm đổi trả cần còn nguyên tem mác, chưa qua sử dụng và giặt ủi.",
  pol2c:"Hàng order đặt theo yêu cầu nên shop không hỗ trợ đổi trả vì lý do thay đổi ý định — bạn cân nhắc kỹ size trước khi chốt đơn nhé.",
  contactT:"Liên hệ & mua sắm",
  ctIgD:"@almira.studiooo — mẫu mới & hậu trường mỗi ngày.",
  ctThD:"@almira.studiooo — mẫu mới mỗi ngày, chốt đơn nhanh.",
  ctFbD:"Almira.Studiooo — tin tức & ưu đãi từ shop.",
  footP:"Thời trang nữ order cao cấp.", footShopH:"Mua sắm", footChH:"Kênh của shop",
  footAll:"Tất cả sản phẩm", footPolicy:"Chính sách đổi trả",
  footPay:"Thanh toán: COD · Chuyển khoản · Cọc 50% khi order",
  cartT:"Giỏ hàng", cartSub:"Tạm tính", cartDep:"Cọc 50% đơn hàng (tạm tính)",
  cartShip:"Phí vận chuyển", cartShipV:"Shop báo khi xác nhận đơn", cartTotal:"Tổng đơn hàng",
  cartCheckout:"Đặt hàng", cartNote:"Shop xác nhận đơn & hướng dẫn cọc sau khi đặt.",
  cartEmpty:"Giỏ hàng đang trống.<br />Xem các mẫu mới nhất ở mục Cửa hàng nhé.",
  cartCountN:"({n} sản phẩm)", lineMeta:"{brand} · Size {size} · Màu {color}", rmText:"Xóa khỏi giỏ",
  pdColor:"Màu sắc", pdErr:"Vui lòng chọn size trước khi thêm vào giỏ.", pdAdd:"Thêm vào giỏ", pdBuy:"Mua ngay",
  pdNote:"Order 7–14 ngày · Cọc 50% · Inbox tư vấn size.",
  coT:"Thông tin đặt hàng", coSub:"Almira liên hệ xác nhận & hướng dẫn cọc 50%.",
  coName:"Họ và tên *", coPhone:"Số điện thoại *", coAddr:"Địa chỉ nhận hàng *",
  coAddrPh:"Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành",
  coPay:"Phương thức thanh toán",
  payOpt1:"Cọc chuyển khoản 50% + COD phần còn lại", payOpt2:"Chuyển khoản 100%", payOpt3:"COD toàn bộ (đơn có sẵn)",
  coNoteL:"Ghi chú cho shop", coNotePh:"Chiều cao/cân nặng để tư vấn size…",
  coErr:"Vui lòng điền đầy đủ họ tên, số điện thoại (ít nhất 9 chữ số) và địa chỉ.",
  coSubmit:"Xác nhận đặt hàng",
  okT:"Đặt hàng thành công!", okP1:"Mã đơn:", okP2:"Almira sẽ liên hệ xác nhận & hướng dẫn cọc 50%.", okBtn:"Tiếp tục mua sắm",
  searchPh:"Tìm đầm, áo kiểu, set đồ… (ví dụ: đầm lụa, blazer)",
  addedToast:"Đã thêm “{name}” (size {size}) vào giỏ",
  orderTotal:"Tổng đơn hàng", orderDeposit:"Cọc trước 50%", orderRest:"Còn lại khi nhận hàng",
  coLine:"{name} — size {size}, {color} × {qty}" },
en:{ docTitle:"Almira.Studiooo — Premium women's fashion orders",
  ann1:"Authentic orders", ann2:"Arrives in 7–14 days", ann3:"50% deposit", ann4:"Size exchange in 3 days",
  brandSub:"Studiooo · Premium Orders",
  navShop:"Shop", navBrands:"Brands", navCats:"Categories", navHow:"How to order", navAbout:"About Almira", navContact:"Contact",
  heroBsub:"Premium women's fashion, made to order.", heroOver:"New collection",
  heroL1:"Elegance", heroL2:"in every", heroL3:"detail",
  heroSub:"Premium orders from <em>OAKMOO, ANNATTO, Callmelater, Acestudios</em>.",
  chip1b:"100% authentic", chip1s:"Order receipt included", chip2b:"Arrives in 7–14 days", chip2s:"Made to order",
  noteLabel:"Pre-order", noteBig:"Only 50% deposit", noteSub:"The rest on delivery",
  btnShop:"Shop now", btnHow:"How to order",
  perk1:"100% authentic", perk1s:"Order receipt included", perk2:"Arrives in 7–14 days", perk2s:"Made to order",
  perk3:"50% deposit", perk3s:"The rest on delivery", perk4:"Size exchange in 3 days", perk4s:"Dedicated support",
  catsT:"Categories", brandsT:"Brands", brandsAll:"All brands →", brandsPageT:"All brands",
  brandsCountT:"{n} brands", brandCountT:"{n} products", shopT:"Shop", shopLink:"Ordering process →", fAll:"All",
  catDam:"Dresses", catAo:"Tops", catSet:"Sets", catKhoac:"Outerwear", catQuan:"Trousers", catPk:"Accessories",
  sortFeatured:"Featured", sortNew:"Newest", sortAsc:"Price: low → high", sortDesc:"Price: high → low",
  shopCountT:"{a} / {b} products",
  moreT:"Load more — {n}/{total} products",
  emptyGrid:"No matching products found. Try another keyword or category.",
  cardAdd:"View & select size",
  crumbHome:"Home", relatedT:"From this brand", galleryCount:"{n} / {total}",
  brandMissing:"This brand could not be found.",
  howT:"Order in 4 steps",
  step1t:"Choose style & size", step1p:"Add to bag, pick size & color.",
  step2t:"Order & 50% deposit", step2p:"Fill in your details; we guide the deposit.",
  step3t:"We buy from the brand", step3p:"Ordered the same day, arrives in 7–14 days.",
  step4t:"Receive your order", step4p:"Check your items & pay the remaining 50%.",
  aboutT:"About Almira Studio",
  aboutP:"Premium women's fashion orders — elegant, minimal designs from Korea & beyond.",
  aboutMore:"Every piece is purchased directly from the brand per customer order, carefully checked before delivery and beautifully packed. You can also follow new arrivals daily on the shop's Instagram, Threads and Facebook.",
  polT:"Shopping policy", pol1T:"Orders & payment",
  pol1a:"Pre-order items are not stocked: delivery takes 7–14 business days from the brand's dispatch date.",
  pol1b:"A 50% deposit is required for Almira to place your order; the remainder is paid on delivery (COD) or by bank transfer.",
  pol1c:"An order is confirmed only after the shop verifies stock and size with the brand.",
  pol2T:"Exchanges & returns",
  pol2a:"Size exchanges are supported within 3 days of delivery for manufacturer defects (tears, stitching faults, wrong item).",
  pol2b:"Returned items must keep their tags, unused and unwashed.",
  pol2c:"As items are ordered to request, we cannot accept returns for change of mind — please consider sizing carefully before confirming.",
  contactT:"Contact & shopping",
  ctIgD:"@almira.studiooo — new arrivals & behind the scenes, daily.",
  ctThD:"@almira.studiooo — new styles daily, fast ordering.",
  ctFbD:"Almira.Studiooo — news & offers from the shop.",
  footP:"Premium women's fashion orders.", footShopH:"Shopping", footChH:"Our channels",
  footAll:"All products", footPolicy:"Exchange policy",
  footPay:"Payment: COD · Bank transfer · 50% deposit on orders",
  cartT:"Your bag", cartSub:"Subtotal", cartDep:"50% order deposit (estimated)",
  cartShip:"Shipping", cartShipV:"Quoted when the shop confirms", cartTotal:"Order total",
  cartCheckout:"Place order", cartNote:"The shop confirms your order & deposit details after checkout.",
  cartEmpty:"Your bag is empty.<br />Discover the latest styles in the Shop.",
  cartCountN:"({n} items)", lineMeta:"{brand} · Size {size} · Color {color}", rmText:"Remove",
  pdColor:"Color", pdErr:"Please select a size before adding to bag.", pdAdd:"Add to bag", pdBuy:"Buy now",
  pdNote:"Arrives in 7–14 days · 50% deposit · Message us for size advice.",
  coT:"Order details", coSub:"Almira will contact you to confirm & guide the 50% deposit.",
  coName:"Full name *", coPhone:"Phone number *", coAddr:"Delivery address *",
  coAddrPh:"House number, street, ward, district, city/province",
  coPay:"Payment method",
  payOpt1:"50% bank-transfer deposit + COD for the rest", payOpt2:"100% bank transfer", payOpt3:"Full COD (in-stock orders)",
  coNoteL:"Note for the shop", coNotePh:"Height/weight for size advice…",
  coErr:"Please complete your name, phone number (at least 9 digits) and address.",
  coSubmit:"Confirm order",
  okT:"Order placed successfully!", okP1:"Order code:", okP2:"Almira will contact you to confirm & guide the 50% deposit.", okBtn:"Continue shopping",
  searchPh:"Search dresses, blouses, sets… (e.g. silk dress, blazer)",
  addedToast:"Added “{name}” (size {size}) to your bag",
  orderTotal:"Order total", orderDeposit:"Deposit upfront (50%)", orderRest:"Due on delivery",
  coLine:"{name} — size {size}, {color} × {qty}" }
};
function t(k, vars){
  let s = (I18N[lang] && I18N[lang][k]) || I18N.vi[k] || k;
  if (vars) Object.keys(vars).forEach(v => { s = s.split("{" + v + "}").join(vars[v]); });
  return s;
}
function catName(c){ return lang === "en" ? CAT_NAMES_EN[c] : CAT_NAMES[c]; }
function pName(p){ return lang === "en" ? p.nameEn : p.name; }
function pDesc(p){ return lang === "en" ? p.descEn : p.desc; }
function pTag(p){ if (!p.tag) return ""; if (lang === "en") return ({ "Bán chạy":"Best seller", "Mới":"New", "Sale":"Sale" })[p.tag] || p.tag; return p.tag; }
function colorName(p, i){ const c = p.colors[i]; return c ? (lang === "en" ? c[2] : c[0]) : ""; }

/* ================= STATE (in-memory only) ================= */
let cart = [];
try {
  const saved = JSON.parse(sessionStorage.getItem("almira-cart") || "[]");
  if (Array.isArray(saved)) cart = saved.flatMap(item => {
    if (!item || typeof item.id !== "string" || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 9 || typeof item.size !== "string" || typeof item.color !== "string") return [];
    const product = PRODUCTS.find(p => p.id === item.id);
    if (!product) return [];
    let variationId = item.variationId;
    if (!variationId) {
      const migrated = product.variations.filter(v => v.size === item.size && (v.color === item.color || colorName(product, product.colors.findIndex(c => c[0] === v.color)) === item.color));
      if (migrated.length !== 1) return [];
      variationId = migrated[0].id;
    }
    if (!item.variationId) item.color = product.variations.find(v => v.id === variationId)?.color || item.color;
    const variation = product.variations.find(v => v.id === variationId && v.size === item.size && v.color === item.color);
    return variation ? [{ id: product.id, variationId, size: variation.size, color: variation.color, qty: item.qty }] : [];
  });
} catch (_) {}
let activeFilter = "all";
let shownCount = 24;          // phân trang "Xem thêm"
const PAGE_SIZE = 24;
let activeBrand = "", brandShown = PAGE_SIZE, galleryIndex = 0;
let activeSort = "featured";
let query = "";
let current = null;
let selSize = null, selColor = 0, selQty = 1;

const $ = (s, r) => (r||document).querySelector(s);
const $$ = (s, r) => Array.from((r||document).querySelectorAll(s));
const moneyCents = value => { const parts = String(value).split("."); return BigInt(parts[0]) * 100n + BigInt(((parts[1] || "") + "00").slice(0, 2)); };
const formatCents = cents => { const separator = lang === "en" ? "," : "."; const whole = (cents / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator); const fraction = String(cents % 100n).padStart(2, "0"); return lang === "en" ? (fraction === "00" ? whole : whole + "." + fraction) + " ₫" : (fraction === "00" ? whole : whole + "," + fraction) + " ₫"; };
const fmt = value => formatCents(typeof value === "bigint" ? value : moneyCents(value));
const productPrice = p => moneyCents(p.price);
const selectedVariation = (p, size, color) => p.variations.find(v => v.size === size && v.color === color);
const selectedPrice = (p, size, color) => { const v = selectedVariation(p, size, color); return v ? moneyCents(v.price) : productPrice(p); };
const byId = id => PRODUCTS.find(p => p.id === id);

/* ================= TOAST ================= */
let toastTimer = null;
function toast(msg){
  const t = $("#toast"); t.textContent = msg; t.classList.add("on");
  clearTimeout(toastTimer); toastTimer = setTimeout(()=>t.classList.remove("on"), 2600);
}

/* ================= PRODUCT GRID ================= */
const escapeHTML = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const safeImage = value => { try { const url = new URL(value, location.origin); return url.protocol === "https:" ? url.href : ""; } catch (_) { return ""; } };
function productImages(p){
  const list = (Array.isArray(p.images) && p.images.length ? p.images : [p.img]).map(safeImage).filter(Boolean);
  return [...new Set(list)];
}
function brandSlug(name){ return encodeURIComponent(String(name || "").trim()); }
function brandList(){
  const map = new Map();
  PRODUCTS.forEach(p => map.set(p.brand, (map.get(p.brand) || 0) + 1));
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
function findBrand(slug){
  const wanted = decodeURIComponent(slug || "").trim().toLowerCase();
  return brandList().find(([name]) => name.toLowerCase() === wanted)?.[0] || "";
}
function cardHTML(p, i){
  const name = escapeHTML(pName(p)), brand = escapeHTML(p.brand), id = escapeHTML(p.id), image = escapeHTML(safeImage(p.img));
  return `<article class="card" data-id="${id}" style="animation-delay:${Math.min(i * 65, 420)}ms">
      <div class="ph" data-open="${id}">
        <img src="${image}" alt="${name} — ${brand}" loading="lazy" decoding="async" onerror="this.classList.add('img-broken');this.closest('.ph').classList.add('ph-broken')" />
        ${p.tag ? `<span class="tag-badge">${escapeHTML(pTag(p))}</span>` : ""}
      </div>
      <div class="body">
        <div class="brandline">${brand}</div>
        <h3 data-open="${id}" title="${name}">${name}</h3>
        <div class="price"><span class="now">${fmt(p.price)}</span>${p.was ? `<span class="was">${fmt(p.was)}</span>` : ""}</div>
        <button class="add" data-open="${id}">${t("cardAdd")}</button>
      </div>
    </article>`;
}
function paintCards(grid, list){
  const prevIds = new Set($$(".card", grid).map(c => c.dataset.id));
  const firstPaint = !grid.dataset.painted;
  grid.dataset.painted = "1";
  grid.innerHTML = list.length ? list.map(cardHTML).join("") : '<div class="empty">' + t("emptyGrid") + '</div>';
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  $$(".card", grid).forEach(el => { if (reduce || (!firstPaint && prevIds.has(el.dataset.id))) el.style.animation = "none"; });
  $$("[data-open]", grid).forEach(el => el.addEventListener("click", () => openProduct(el.dataset.open)));
}
function visibleProducts(){
  let list = PRODUCTS.filter(p =>
    (activeFilter === "all" || p.cat === activeFilter) &&
    (query === "" || (p.name + " " + p.nameEn + " " + p.brand + " " + CAT_NAMES[p.cat] + " " + CAT_NAMES_EN[p.cat]).toLowerCase().includes(query))
  );
  if (activeSort === "price-asc") list = list.slice().sort((a,b)=>productPrice(a)<productPrice(b)?-1:productPrice(a)>productPrice(b)?1:0);
  if (activeSort === "price-desc") list = list.slice().sort((a,b)=>productPrice(a)>productPrice(b)?-1:productPrice(a)<productPrice(b)?1:0);
  if (activeSort === "new") list = list.slice().sort((a,b)=>(b.isNew?1:0)-(a.isNew?1:0));
  return list;
}
/* renderGrid: superseded by the motion layer (bottom of this script) */

/* ================= FILTERS / SEARCH / SORT ================= */
$$(".chip[data-filter]").forEach(chip => chip.addEventListener("click", () => {
  $$(".chip[data-filter]").forEach(c => c.classList.remove("on"));
  chip.classList.add("on");
  activeFilter = chip.dataset.filter;
  shownCount = PAGE_SIZE;
  renderGrid();
}));
$$(".cat[data-cat]").forEach(c => c.addEventListener("click", () => {
  const cat = c.dataset.cat;
  $$(".chip[data-filter]").forEach(ch => ch.classList.toggle("on", ch.dataset.filter === cat));
  activeFilter = cat;
  shownCount = PAGE_SIZE;
  renderGrid();
  location.hash = "#/shop";
}));
/* Dropdown sắp xếp tùy chỉnh — panel kính mờ đồng bộ UI */
const sortBtn = $("#sortBtn"), sortPanel = $("#sortPanel");
function closeSort(){ sortPanel.classList.remove("open"); sortBtn.setAttribute("aria-expanded", "false"); }
sortBtn.addEventListener("click", e => {
  e.stopPropagation();
  const open = sortPanel.classList.toggle("open");
  sortBtn.setAttribute("aria-expanded", String(open));
});
$$(".sort-opt").forEach(o => o.addEventListener("click", () => {
  activeSort = o.dataset.sort;
  $$(".sort-opt").forEach(x => x.classList.toggle("on", x === o));
  $("#sortLabel").textContent = t(SORT_KEYS[activeSort]);
  closeSort();
  shownCount = PAGE_SIZE;
  renderGrid();
}));
document.addEventListener("click", e => { if (!e.target.closest(".sort-wrap")) closeSort(); });
$("#searchBtn").addEventListener("click", () => {
  const row = $("#searchRow"); row.classList.toggle("open");
  const open = row.classList.contains("open");
  $("#searchBtn").setAttribute("aria-expanded", String(open));
  if (open) $("#searchInput").focus();
  else { $("#searchInput").value = ""; if (query){ query = ""; renderGrid(); } }
});
function closeSearchRow(){
  const row = $("#searchRow");
  if (!row || !row.classList.contains("open")) return;
  clearTimeout(searchTimer);
  row.classList.remove("open");
  $("#searchBtn").setAttribute("aria-expanded", "false");
  if (document.activeElement === $("#searchInput")) $("#searchBtn").focus({ preventScroll: true });
}
/* search: debounced so typing never re-animates the whole grid */
let searchTimer = null;
$("#searchInput").addEventListener("input", e => {
  const val = e.target.value.trim().toLowerCase();
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    query = val;
    shownCount = PAGE_SIZE;
    renderGrid();
    if (query && location.hash !== "#/shop") location.hash = "#/shop";
  }, 130);
});

/* ================= PRODUCT DETAIL ================= */
function openProduct(id){
  const product = byId(id);
  if (!product) return;
  location.hash = "#/product/" + encodeURIComponent(id);
}
const colorCanonical = (p, i) => p.colors[i][0];
function renderPageOptions(){
  $("#pageColorName").textContent = colorName(current, selColor);
  $("#pageColors").innerHTML = current.colors.map((c, i) =>
    `<button class="swatch ${i === selColor ? "on" : ""}" data-color="${i}" aria-label="${escapeHTML(colorName(current, i))}"><i style="background:${escapeHTML(c[1])}"></i></button>`).join("");
  $$("#pageColors .swatch").forEach(b => b.addEventListener("click", () => { selColor = +b.dataset.color; renderPageOptions(); renderProductPrice(); }));
  $("#pageSizes").innerHTML = current.sizes.map(s =>
    `<button class="size-btn ${s === selSize ? "on" : ""}" data-size="${escapeHTML(s)}">${escapeHTML(s)}</button>`).join("");
  $$("#pageSizes .size-btn").forEach(b => b.addEventListener("click", () => { selSize = b.dataset.size; $("#pageErr").classList.add("hidden"); renderPageOptions(); renderProductPrice(); }));
}
function renderProductPrice(){
  if (!current) return;
  const variation = selectedVariation(current, selSize, colorCanonical(current, selColor));
  $("#pagePrice").textContent = fmt(variation ? variation.price : current.price);
  $("#pdPrice").textContent = fmt(variation ? variation.price : current.price);
}
function renderGallery(){
  const images = productImages(current);
  if (!images.length) return;
  galleryIndex = Math.max(0, Math.min(galleryIndex, images.length - 1));
  const img = $("#galleryImg");
  img.classList.remove("img-broken");
  img.src = images[galleryIndex];
  img.alt = pName(current) + " — " + (galleryIndex + 1);
  $("#galleryCount").textContent = t("galleryCount", { n: galleryIndex + 1, total: images.length });
  $("#galleryPrev").disabled = galleryIndex === 0;
  $("#galleryNext").disabled = galleryIndex === images.length - 1;
  $("#galleryThumbs").innerHTML = images.map((src, i) =>
    `<button class="thumb ${i === galleryIndex ? "on" : ""}" type="button" data-image="${i}" aria-label="${i + 1}"><img src="${escapeHTML(src)}" alt=""></button>`).join("");
  $$("#galleryThumbs .thumb").forEach(b => b.addEventListener("click", () => { galleryIndex = +b.dataset.image; renderGallery(); }));
}
function renderProductPage(){
  if (!current) return;
  $("#productCrumb").textContent = pName(current);
  $("#pageBrand").innerHTML = `<button type="button" data-brand="${escapeHTML(current.brand)}">${escapeHTML(current.brand)}</button> · ${escapeHTML(catName(current.cat))}`;
  $("#pageBrand button").addEventListener("click", () => { location.hash = "#/brand/" + brandSlug(current.brand); });
  $("#pageName").textContent = pName(current);
  renderProductPrice();
  $("#pageWas").textContent = current.was ? fmt(current.was) : "";
  $("#pageDesc").textContent = pDesc(current);
  $("#pageQty").textContent = selQty;
  $("#pageErr").classList.add("hidden");
  renderPageOptions();
  renderGallery();
  const related = PRODUCTS.filter(p => p.brand === current.brand && p.id !== current.id).slice(0, 4);
  paintCards($("#relatedGrid"), related);
  document.title = pName(current) + " — Almira Studio";
}
function renderBrandsPage(){
  const brands = brandList();
  $("#brandsCount").textContent = t("brandsCountT", { n: brands.length });
  $("#brandDirectory").innerHTML = brands.map(([name, count], i) => {
    const encoded = encodeURIComponent(name);
    return `<a class="brand-card" href="#/brand/${encoded}" style="animation-delay:${Math.min(i * 35, 280)}ms"><small>${t("brandCountT", { n: count })}</small><b>${escapeHTML(name)}</b></a>`;
  }).join("");
  document.title = t("brandsPageT") + " — Almira Studio";
}
function renderBrandPage(){
  const products = PRODUCTS.filter(p => p.brand === activeBrand);
  const shown = products.slice(0, brandShown);
  $("#brandCrumb").textContent = activeBrand || t("brandMissing");
  $("#brandTitle").textContent = activeBrand || t("brandMissing");
  $("#brandCount").textContent = activeBrand ? t("brandCountT", { n: products.length }) : "";
  paintCards($("#brandGrid"), shown);
  const more = products.length > shown.length;
  $("#brandMoreWrap").classList.toggle("hidden", !more);
  if (more) $("#brandMoreBtn").textContent = t("moreT", { n: shown.length, total: products.length });
  document.title = (activeBrand || t("navBrands")) + " — Almira Studio";
}
function showRoute(name){
  [...document.body.classList].filter(c => c.startsWith("route-")).forEach(c => document.body.classList.remove(c));
  document.body.dataset.page = name || "home";
  if (name) document.body.classList.add("route-" + name);
}
function route(){
  let hash = location.hash || "";
  try { hash = decodeURI(hash); } catch (_) { hash = "#/home"; }
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  $$("#menuPanel a").forEach(a => {
    if (a.hash === location.hash) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  if (window.AlmiraPages) window.AlmiraPages.handle("");
  if (parts[0] === "checkout" && window.AlmiraCheckout){
    showRoute("checkout"); window.AlmiraCheckout.render();
    document.title = (lang === "en" ? "Checkout" : "Thanh toán") + " — Almira Studio";
  } else if (window.AlmiraPages && window.AlmiraPages.handle(parts[0])){
    // Dedicated section page mounted by pages.js.
  } else if (parts[0] === "product" && byId(parts[1])){
    current = byId(parts[1]);
    selSize = current.sizes.length === 1 ? current.sizes[0] : null;
    selColor = 0; selQty = 1; galleryIndex = 0;
    showRoute("product"); renderProductPage();
  } else if (parts[0] === "brands"){
    showRoute("brands"); renderBrandsPage();
  } else if (parts[0] === "brand"){
    activeBrand = findBrand(parts.slice(1).join("/"));
    brandShown = PAGE_SIZE;
    showRoute("brand"); renderBrandPage();
  } else {
    showRoute("");
    document.title = t("docTitle");
  }
  if (typeof closeMenu === "function") closeMenu();
  document.body.style.overflow = "";
  window.scrollTo({ top: 0, behavior: "instant" });
}
$("#galleryPrev").addEventListener("click", () => { galleryIndex--; renderGallery(); });
$("#galleryNext").addEventListener("click", () => { galleryIndex++; renderGallery(); });
$("#pageMinus").addEventListener("click", () => { selQty = Math.max(1, selQty - 1); $("#pageQty").textContent = selQty; });
$("#pagePlus").addEventListener("click", () => { selQty = Math.min(9, selQty + 1); $("#pageQty").textContent = selQty; });
$("#pageAdd").addEventListener("click", () => { if (addCurrentToCart()) flyToCart($("#galleryImg")); });
$("#pageBuy").addEventListener("click", () => { if (addCurrentToCart()){ window.AlmiraCheckout?.resetStep(); location.hash = "#/checkout"; } });
$("#brandMoreBtn").addEventListener("click", () => { brandShown += PAGE_SIZE; renderBrandPage(); });
let touchX = 0;
$("#galleryImg").addEventListener("touchstart", e => { touchX = e.changedTouches[0].clientX; }, { passive: true });
$("#galleryImg").addEventListener("touchend", e => {
  const delta = e.changedTouches[0].clientX - touchX;
  if (Math.abs(delta) < 42) return;
  galleryIndex += delta < 0 ? 1 : -1;
  renderGallery();
}, { passive: true });
window.addEventListener("hashchange", route);
function renderPdOpts(){
  $("#pdColorName").textContent = colorName(current, selColor);
  $("#pdColors").innerHTML = current.colors.map((c,i) =>
    `<button class="swatch ${i===selColor?"on":""}" data-color="${i}" aria-label="${escapeHTML(colorName(current, i))}"><i style="background:${escapeHTML(c[1])}"></i></button>`).join("");
  $$("#pdColors .swatch").forEach(b => b.addEventListener("click", () => { selColor = +b.dataset.color; renderPdOpts(); renderProductPrice(); }));
  $("#pdSizes").innerHTML = current.sizes.map(s =>
    `<button class="size-btn ${s===selSize?"on":""}" data-size="${escapeHTML(s)}">${escapeHTML(s)}</button>`).join("");
  $$("#pdSizes .size-btn").forEach(b => b.addEventListener("click", () => { selSize = b.dataset.size; $("#pdErr").classList.add("hidden"); renderPdOpts(); renderProductPrice(); }));
}
function refreshPdText(){
  if (document.body.classList.contains("route-product")) renderProductPage();
  else if (document.body.classList.contains("route-brands")) renderBrandsPage();
  else if (document.body.classList.contains("route-brand")) renderBrandPage();
}
$("#pdMinus").addEventListener("click", () => { selQty = Math.max(1, selQty-1); $("#pdQty").textContent = selQty; });
$("#pdPlus").addEventListener("click", () => { selQty = Math.min(9, selQty+1); $("#pdQty").textContent = selQty; });
function addCurrentToCart(){
  if (!selSize){ $("#pageErr").classList.remove("hidden"); $("#pageSizes .size-btn")?.focus(); return false; }
  const canonicalColor = colorCanonical(current, selColor);
  const variation = selectedVariation(current, selSize, canonicalColor);
  if (!variation) { $("#pageErr").classList.remove("hidden"); return false; }
  const found = cart.find(i => i.id === current.id && i.variationId === variation.id);
  if (found) found.qty = Math.min(9, found.qty + selQty);
  else cart.push({ id: current.id, variationId: variation.id, size: selSize, color: canonicalColor, qty: selQty });
  renderCart();
  toast(t("addedToast", { name: pName(current), size: selSize }));
  return true;
}
$("#pdAdd").addEventListener("click", () => {});
$("#pdBuy").addEventListener("click", () => {});

/* ================= CART ================= */
function cartCount(){ return cart.reduce((s,i)=>s+i.qty,0); }
function cartTotal(){ return cart.reduce((sum,item)=>{const product=byId(item.id),variation=product&&product.variations.find(v=>v.id===item.variationId);return sum+(variation?moneyCents(variation.price)*BigInt(item.qty):0n);},0n); }
function renderCart(){
  try { sessionStorage.setItem("almira-cart", JSON.stringify(cart)); } catch (_) {}
  if (document.body.dataset.page === "checkout") window.AlmiraCheckout?.render();
  const n = cartCount(), total = cartTotal();
  const badge = $("#cartCount");
  badge.textContent = n; badge.classList.toggle("hidden", n === 0);
  $("#drawerCount").textContent = n ? t("cartCountN", { n }) : "";
  const box = $("#cartItems");
  if (!cart.length){
    box.innerHTML = '<div class="empty-cart">' + t("cartEmpty") + '</div>';
  } else {
    box.innerHTML = cart.map((i, idx) => { const p = byId(i.id), variation = p.variations.find(v=>v.id===i.variationId); return `
      <div class="line-item">
        <img src="${escapeHTML(safeImage(p.img))}" alt="${escapeHTML(pName(p))}" onerror="this.classList.add(&apos;img-broken&apos;)" />
        <div class="info">
          <div class="nm">${escapeHTML(pName(p))}</div>
          <div class="vr">${escapeHTML(t("lineMeta", { brand:p.brand,size:i.size,color:colorName(p,p.colors.findIndex(c=>c[0]===i.color))||i.color }))}</div>
          <span class="qty">
            <button data-dec="${idx}" aria-label="Giảm">−</button><output>${i.qty}</output><button data-inc="${idx}" aria-label="Tăng">+</button>
          </span>
          <br /><button class="rm" data-rm="${idx}">${t("rmText")}</button>
        </div>
        <div class="lp">${fmt(moneyCents(variation.price)*BigInt(i.qty))}</div>
      </div>`; }).join("");
    $$("[data-inc]", box).forEach(b => b.addEventListener("click", () => { cart[+b.dataset.inc].qty = Math.min(9, cart[+b.dataset.inc].qty+1); renderCart(); }));
    $$("[data-dec]", box).forEach(b => b.addEventListener("click", () => { const it = cart[+b.dataset.dec]; it.qty--; if (it.qty<=0) cart.splice(+b.dataset.dec,1); renderCart(); }));
    $$("[data-rm]", box).forEach(b => b.addEventListener("click", () => { cart.splice(+b.dataset.rm,1); renderCart(); }));
  }
  $("#subTotal").textContent = fmt(total);
  $("#deposit").textContent = fmt(total/2n+total%2n);
  $("#grandTotal").textContent = fmt(total);
  $("#checkoutBtn").disabled = !cart.length;
}
function openCart(){ renderCart(); $("#cartDrawer").classList.add("on"); $("#scrim").classList.add("on"); document.body.style.overflow = "hidden"; }
function closeCart(){ $("#cartDrawer").classList.remove("on"); $("#scrim").classList.remove("on"); document.body.style.overflow = ""; }
/* wrap in arrows so the focus-management wrappers (assigned later) are used at call time */
$("#cartBtn").addEventListener("click", () => openCart());
$("#closeCart").addEventListener("click", () => closeCart());
$("#scrim").addEventListener("click", () => closeCart());

/* ================= MODALS ================= */
function closeModal(m){ m.classList.remove("on"); document.body.style.overflow = ""; }
$$(".modal").forEach(m => {
  m.addEventListener("click", e => { if (e.target === m) closeModal(m); });
  $$("[data-close]", m).forEach(b => b.addEventListener("click", () => closeModal(m)));
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape"){ $$(".modal.on").forEach(closeModal); closeCart(); closeMenu(); closeSort(); closeSearchRow(); }
});

/* ================= CHECKOUT ================= */
$("#checkoutBtn").addEventListener("click", () => {
  if (!cart.length) return;
  closeCart();
  window.AlmiraCheckout?.resetStep();
  location.hash = "#/checkout";
});

/* ================= SCROLL FX (chỉ back-to-top — topbar giữ nguyên, không biến hình) ================= */
const toTopBtn = $("#toTop");
window.addEventListener("scroll", () => {
  toTopBtn.classList.toggle("show", window.scrollY > 600);
}, { passive:true });
toTopBtn.addEventListener("click", () => window.scrollTo({ top:0, behavior:"smooth" }));

/* ================= MENU BURGER ================= */
const menuBtn = $("#menuBtn"), menuPanel = $("#menuPanel");
function closeMenu(){ menuPanel.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }
menuBtn.addEventListener("click", e => {
  e.stopPropagation();
  const open = menuPanel.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(open));
});
$$("a", menuPanel).forEach(a => a.addEventListener("click", closeMenu));
document.addEventListener("click", e => { if (!e.target.closest("header.site")) closeMenu(); });

/* ================= NGÔN NGỮ VI / EN ================= */
const SORT_KEYS = { featured:"sortFeatured", new:"sortNew", "price-asc":"sortAsc", "price-desc":"sortDesc" };
function applyLang(l){
  lang = l;
  try { localStorage.setItem("almira-lang", l); } catch(e){}
  document.documentElement.lang = l === "en" ? "en" : "vi";
  document.title = t("docTitle");
  $("#langVi").classList.toggle("on", l === "vi");
  $("#langEn").classList.toggle("on", l === "en");
  $$("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$("[data-i18n-html]").forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  $$("[data-i18n-ph]").forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  $("#sortLabel").textContent = t(SORT_KEYS[activeSort]);
  renderGrid();
  renderCart();
  refreshPdText();
  window.AlmiraOrderGuide?.render(document.getElementById("how"));
  window.AlmiraHome?.render();
  window.AlmiraPages?.refresh();
  if (document.body.dataset.page === "checkout") window.AlmiraCheckout?.render();
}
$("#langVi").addEventListener("click", () => { if (lang !== "vi") applyLang("vi"); });
$("#langEn").addEventListener("click", () => { if (lang !== "en") applyLang("en"); });

/* ================= CON TRỎ KÍNH MỜ TÙY CHỈNH ================= */
if (window.matchMedia("(hover:hover) and (pointer:fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches){
  const cDot = $("#cursorDot"), cRing = $("#cursorRing");
  let mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;
  window.addEventListener("mousemove", e => {
    mx = e.clientX; my = e.clientY;
    cDot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
  }, { passive:true });
  (function cursorLoop(){
    rx += (mx - rx) * .2; ry += (my - ry) * .2;
    cRing.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
    requestAnimationFrame(cursorLoop);
  })();
  const hotSel = "a,button,input,select,textarea,label,[data-open]";
  document.addEventListener("mouseover", e => { if (e.target.closest(hotSel)) cRing.classList.add("big"); });
  document.addEventListener("mouseout", e => { if (e.target.closest(hotSel)) cRing.classList.remove("big"); });
}

/* ================= HIỆU ỨNG XUẤT HIỆN KHI CUỘN ================= */
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches){
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); }
  }), { threshold:.1 });
  $$(".reveal").forEach(el => io.observe(el));
} else {
  $$(".reveal").forEach(el => el.classList.add("in"));
}

/* ================= INIT ================= */
applyLang(lang);
route();


/* ============================================================
   PREMIUM MOTION LAYER — Almira.Studiooo (pass 2)
   Boot choreography, scroll system, cursor labels, word reveals,
   card choreography, cart feedback, focus management.
   ============================================================ */
function reduceMotion(){ return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
const MOTION_REDUCE = reduceMotion();
const MOTION_FINE = window.matchMedia("(hover:hover) and (pointer:fine)").matches;

/* fly-to-cart clone (hoisted for addCurrentToCart) */
function flyToCart(src){
  if (reduceMotion() || !MOTION_FINE || window.innerWidth <= 760) return;
  if (!src || !src.getBoundingClientRect) return;
  const target = document.getElementById("cartBtn");
  if (!target) return;
  const s = src.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  if (!s.width || !s.height) return;
  window.__flyInProgress = true;
  const w = Math.min(s.width, 96), h = Math.min(s.height, 124);
  const clone = document.createElement("div");
  clone.className = "fly-img";
  clone.style.cssText = "position:fixed;left:" + s.left + "px;top:" + s.top + "px;width:" + w + "px;height:" + h +
    "px;border-radius:12px;overflow:hidden;z-index:250;pointer-events:none;box-shadow:0 16px 34px rgba(28,28,30,.22)";
  const img = document.createElement("img");
  img.src = src.currentSrc || src.src;
  img.style.cssText = "width:100%;height:100%;object-fit:cover";
  clone.appendChild(img);
  document.body.appendChild(clone);
  const dx = (t.left + t.width / 2) - (s.left + w / 2);
  const dy = (t.top + t.height / 2) - (s.top + h / 2);
  const anim = clone.animate([
    { transform: "translate(0,0) scale(1)", opacity: 1, borderRadius: "12px" },
    { transform: "translate(" + (dx * .55) + "px," + (dy * .55 - 42) + "px) scale(.46)", opacity: .92, borderRadius: "14px", offset: .6 },
    { transform: "translate(" + dx + "px," + dy + "px) scale(.2)", opacity: .18, borderRadius: "38%" }
  ], { duration: 560, easing: "cubic-bezier(.3,.7,.3,1)" });
  anim.onfinish = () => { clone.remove(); window.__flyInProgress = false; popCartBadge(); };
  anim.oncancel = () => { clone.remove(); window.__flyInProgress = false; };
}
function popCartBadge(){
  const b = document.getElementById("cartCount");
  if (!b) return;
  b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
}

(function motionLayer(){
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const root = document.documentElement;

  /* ---------------- 1. BOOT / OPENING CURTAIN ----------------
     The hero comes alive immediately BEHIND the curtain, then the veil lifts
     (~1.5s). So the reveal shows an already-breathing stage, never an empty
     glass panel, and nothing is still animating after the curtain is gone. */
  const intro = document.getElementById("intro");
  let heroStarted = false, curtainLifted = false;
  function startHero(){
    if (heroStarted) return; heroStarted = true;
    document.body.classList.add("ready");
  }
  function liftCurtain(){
    if (curtainLifted) return; curtainLifted = true;
    document.body.classList.remove("intro-lock");
    if (intro && !intro.classList.contains("done")){
      intro.classList.add("done");
      try { sessionStorage.setItem("almira-intro", "1"); } catch (e) {}
      setTimeout(() => { if (intro.parentNode) intro.remove(); }, 1000);
    }
  }
  function settle(){ startHero(); liftCurtain(); }
  try {
    if (MOTION_REDUCE || !intro || root.classList.contains("no-intro")){
      if (intro) intro.remove();
      settle();
    } else {
      document.body.classList.add("intro-lock");
      startHero();                              // choreography runs behind the veil
      setTimeout(liftCurtain, 560);             // brand beat, then lift
      setTimeout(settle, 2400);                 // failsafe
      intro.addEventListener("click", settle);
      window.addEventListener("keydown", settle, { once: true });
    }
  } catch (e) { settle(); }

  /* ---------------- 2. SPLIT HEADINGS (word masks, i18n-safe) ---------------- */
  function initSplit(){
    $$(".sec-head h2, .about-txt h2").forEach(h => {
      const text = (h.textContent || "").replace(/\s+/g, " ").trim();
      if (!text) return;
      h.classList.add("split");
      h.innerHTML = text.split(" ").map((w, i) =>
        '<span class="w"><span class="wi" style="--i:' + Math.min(i, 7) + '">' + esc(w) + "</span></span>").join(" ");
    });
  }

  /* ---------------- 3. REVEAL OBSERVER ---------------- */
  function addRevealClasses(){
    $$(".sec-head, .filters").forEach(el => el.classList.add("m-reveal"));
    const fp = $(".foot-panel"); if (fp) fp.classList.add("m-reveal");
    $$(".foot > div").forEach(el => el.classList.add("m-reveal"));
  }
  let io = null;
  if ("IntersectionObserver" in window && !MOTION_REDUCE){
    io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        io.unobserve(en.target);
      });
    }, { threshold: .12, rootMargin: "0px 0px -6% 0px" });
  }
  function observeReveals(){
    $$(".reveal, .m-reveal, .split, .policy .box").forEach(el => {
      if (el.classList.contains("in")) return;
      if (io) io.observe(el); else el.classList.add("in");
    });
  }

  /* ---------------- 5. SCROLL SYSTEM ---------------- */
  const header = $("header.site");
  const progress = $(".scroll-progress i");
  const toTopBtn = document.getElementById("toTop");
  const aboutImg = $(".about-frame img");
  let scrollRaf = 0;

  function applyScroll(){
    scrollRaf = 0;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? clamp(y / max, 0, 1) : 0;
    if (progress) progress.style.transform = "scaleX(" + p.toFixed(4) + ")";
    if (toTopBtn) toTopBtn.style.setProperty("--p", p.toFixed(3));
    if (header) header.classList.toggle("elev", y > 24);
    if (toTopBtn) toTopBtn.classList.toggle("show", y > 600);
    if (aboutImg && !reduceMotion()){
      const r = aboutImg.getBoundingClientRect();
      if (r.bottom > -80 && r.top < window.innerHeight + 80){
        const mid = r.top + r.height / 2 - window.innerHeight / 2;
        aboutImg.style.setProperty("--py", (-mid * 0.05).toFixed(1) + "px");
      }
    }
  }
  window.addEventListener("scroll", () => {
    if (!scrollRaf) scrollRaf = requestAnimationFrame(applyScroll);
  }, { passive: true });
  applyScroll();

  /* ---------------- 6. HERO TILT + MAGNETIC CTAs ---------------- */
  const heroGrid = $(".hero-grid");
  const heroPanel = $(".hero-panel");
  if (MOTION_FINE && !MOTION_REDUCE && heroGrid && heroPanel){
    heroGrid.addEventListener("pointermove", e => {
      const r = heroGrid.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      heroPanel.style.setProperty("--ry", (x * 3).toFixed(2) + "deg");
      heroPanel.style.setProperty("--rx", (-y * 2.4).toFixed(2) + "deg");
      heroPanel.style.setProperty("--mx", ((x + .5) * 100).toFixed(1) + "%");
      heroPanel.style.setProperty("--my", ((y + .5) * 100).toFixed(1) + "%");
    }, { passive: true });
    heroGrid.addEventListener("pointerleave", () => {
      heroPanel.style.setProperty("--rx", "0deg");
      heroPanel.style.setProperty("--ry", "0deg");
    });
  }
  if (MOTION_FINE && !MOTION_REDUCE){
    $$(".hero-btns .btn").forEach(btn => {
      let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0, active = false;
      const loop = () => {
        cx += (tx - cx) * .2; cy += (ty - cy) * .2;
        btn.style.transform = "translate(" + cx.toFixed(2) + "px," + cy.toFixed(2) + "px)";
        if (active || Math.abs(tx - cx) > .05 || Math.abs(ty - cy) > .05){ raf = requestAnimationFrame(loop); }
        else { raf = 0; btn.style.transform = ""; }
      };
      btn.addEventListener("pointermove", e => {
        const r = btn.getBoundingClientRect();
        tx = clamp((e.clientX - (r.left + r.width / 2)) * .22, -9, 9);
        ty = clamp((e.clientY - (r.top + r.height / 2)) * .26, -7, 7);
        active = true;
        if (!raf) raf = requestAnimationFrame(loop);
      }, { passive: true });
      btn.addEventListener("pointerleave", () => { tx = 0; ty = 0; active = false; if (!raf) raf = requestAnimationFrame(loop); });
    });
  }

  /* ---------------- 7. CARD TILT + GLOSS ---------------- */
  const grid = document.getElementById("grid");
  if (grid && MOTION_FINE && !MOTION_REDUCE){
    let activeCard = null, tiltRaf = 0, pending = null;
    const clear = el => {
      if (!el || !el.classList) return;
      el.style.transform = ""; el.classList.remove("tilting");
      if (activeCard === el) activeCard = null;
    };
    const applyTilt = () => {
      tiltRaf = 0;
      if (!pending) return;
      const card = pending.card;
      card.style.transform = "perspective(1000px) rotateX(" + ((.5 - pending.y) * 3.2).toFixed(2) +
        "deg) rotateY(" + ((pending.x - .5) * 3.8).toFixed(2) + "deg) translateY(-3px)";
      card.style.setProperty("--mx", (pending.x * 100).toFixed(1) + "%");
      card.style.setProperty("--my", (pending.y * 100).toFixed(1) + "%");
      pending = null;
    };
    grid.addEventListener("pointermove", e => {
      const card = e.target.closest(".card");
      if (!card) return;
      if (activeCard && activeCard !== card) clear(activeCard);
      activeCard = card;
      if (!card.classList.contains("tilting")) card.classList.add("tilting");
      const r = card.getBoundingClientRect();
      pending = {
        card: card,
        x: clamp((e.clientX - r.left) / r.width, 0, 1),
        y: clamp((e.clientY - r.top) / r.height, 0, 1)
      };
      if (!tiltRaf) tiltRaf = requestAnimationFrame(applyTilt);
    }, { passive: true });
    grid.addEventListener("pointerleave", () => clear(activeCard));
    grid.addEventListener("pointerout", e => {
      const card = e.target.closest(".card");
      if (card && !card.contains(e.relatedTarget)) clear(card);
    });
  }

  /* ---------------- 8. CURSOR LABELS + TEXT-FIELD CURSOR FIX ---------------- */
  if (MOTION_FINE && !MOTION_REDUCE){
    const label = document.getElementById("cursorLabel");
    const setLabel = on => {
      if (!label) return;
      if (on) label.textContent = (typeof lang !== "undefined" && lang === "en") ? "VIEW" : "XEM";
      label.classList.toggle("on", on);
      document.body.classList.toggle("cursor-label-on", on);
    };
    document.addEventListener("pointermove", e => {
      if (!label) return;
      if (!document.body.classList.contains("cursor-ready")) document.body.classList.add("cursor-ready");
      const on = label.classList.contains("on");
      label.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px) translate(-50%,-50%) scale(" + (on ? 1 : .72) + ")";
    }, { passive: true });
    document.addEventListener("mouseover", e => {
      setLabel(!!e.target.closest("[data-open], .cat"));
      document.body.classList.toggle("field", !!e.target.closest("input, textarea, select"));
    });
    document.addEventListener("mouseout", e => {
      if (!e.relatedTarget){ setLabel(false); document.body.classList.remove("field"); }
    });
    document.addEventListener("mouseleave", () => { setLabel(false); document.body.classList.remove("field"); });
  }

  /* ---------------- 9. LANGUAGE-AWARE RE-SPLIT ---------------- */
  if (typeof applyLang === "function"){
    const _applyLang = applyLang;
    applyLang = function(l){
      _applyLang(l);
      initSplit();
      observeReveals();
    };
  }

  /* ---------------- 10. INIT ---------------- */
  function init(){
    addRevealClasses();
    initSplit();
    observeReveals();
    setTimeout(() => {
      $$(".reveal, .m-reveal, .split").forEach(el => {
        if (el.classList.contains("in")) return;
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("in");
      });
    }, 1500);
  }
  try { init(); } catch (e) { settle(); }
  setTimeout(settle, 3200);
})();

/* ================= CART BADGE ACK ================= */
(function(){
  const _renderCart = renderCart;
  renderCart = function(){
    const badge = $("#cartCount");
    const before = +(badge.dataset.prev || 0);
    _renderCart();
    const n = cartCount();
    if (n > before && !window.__flyInProgress){
      badge.classList.remove("pop"); void badge.offsetWidth; badge.classList.add("pop");
    }
    badge.dataset.prev = n;
  };
})();

/* ================= FOCUS MANAGEMENT (drawer / modals) ================= */
(function(){
  let lastFocus = null;
  const _openCart = openCart, _closeCart = closeCart;
  const _openProduct = openProduct, _closeModal = closeModal;
  const restore = () => {
    if (lastFocus && document.contains(lastFocus)){
      try { lastFocus.focus({ preventScroll: true }); } catch (e) { lastFocus.focus(); }
    }
  };
  openCart = function(){
    lastFocus = document.activeElement;
    _openCart();
    setTimeout(() => { const b = $("#closeCart"); if (b) b.focus({ preventScroll: true }); }, 80);
  };
  closeCart = function(){
    const wasOpen = $("#cartDrawer").classList.contains("on");
    _closeCart();
    if (wasOpen) setTimeout(restore, 40);
  };
  openProduct = function(id){
    if (!byId(id)) return;
    lastFocus = document.activeElement;
    _openProduct(id);
  };
  closeModal = function(m){
    const wasOpen = m.classList.contains("on");
    _closeModal(m);
    if (wasOpen) setTimeout(restore, 40);
  };
})();

/* ================= FOCUS TRAP (drawer & modals) ================= */
(function(){
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  document.addEventListener("keydown", e => {
    if (e.key !== "Tab") return;
    const container = document.querySelector(".modal.on") || document.querySelector(".drawer.on");
    if (!container) return;
    const items = Array.from(container.querySelectorAll(FOCUSABLE)).filter(el => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey){
      if (active === first || !container.contains(active)){ e.preventDefault(); last.focus(); }
    } else if (active === last || !container.contains(active)){
      e.preventDefault(); first.focus();
    }
  });
})();

/* ================= PRODUCT -> CART FEEDBACK ================= */
(function(){
  const _addCurrentToCart = addCurrentToCart;
  addCurrentToCart = function(){
    const fly = MOTION_FINE && !reduceMotion() && window.innerWidth > 760;
    if (fly) window.__flyInProgress = true;
    const ok = _addCurrentToCart.apply(this, arguments);
    if (!ok) window.__flyInProgress = false;
    return ok;
  };
})();

/* ================= GRID RE-FLOW (only new cards animate) ================= */
function renderGrid(){
  const grid = $("#grid");
  const all = visibleProducts();
  const shown = Math.min(shownCount, all.length);
  const list = all.slice(0, shown);
  const moreWrap = $("#moreWrap"), moreBtn = $("#moreBtn");
  if (moreWrap && moreBtn){
    const hasMore = all.length > shown;
    moreWrap.classList.toggle("hidden", !hasMore);
    if (hasMore) moreBtn.textContent = t("moreT", { n: shown, total: all.length });
  }
  $("#shopCount").textContent = t("shopCountT", { a: all.length, b: PRODUCTS.length });
  paintCards(grid, list);
  const reduce = reduceMotion();
  if (!reduce && grid.dataset.painted === "1" && list.length){
    grid.classList.remove("reflow"); void grid.offsetWidth; grid.classList.add("reflow");
    grid.addEventListener("animationend", () => grid.classList.remove("reflow"), { once: true });
  }
}
$("#moreBtn").addEventListener("click", () => {
  shownCount += PAGE_SIZE;
  renderGrid();
});



