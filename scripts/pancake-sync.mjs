#!/usr/bin/env node
/**
 * Đồng bộ sản phẩm từ Pancake POS Open API vào website tĩnh.
 *
 * Cách dùng:
 *   PANCAKE_SHOP_ID=... PANCAKE_API_KEY=... node scripts/pancake-sync.mjs
 *   node scripts/pancake-sync.mjs --mock scripts/fixtures/pancake-products.sample.json
 *   node scripts/pancake-sync.mjs --dry-run
 *
 * Script chỉ ghi đè vùng giữa 2 marker PANCAKE_PRODUCTS_START / PANCAKE_PRODUCTS_END
 * trong index.html. Nếu API lỗi hoặc không có sản phẩm hợp lệ, script thoát với mã 1
 * và KHÔNG sửa file — website cũ vẫn nguyên vẹn.
 *
 * Tài liệu: https://docs.pancake.biz/pos/api/  (GET /shops/<SHOP_ID>/products)
 */
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

/* ---------------- args / env ---------------- */
const argv = process.argv.slice(2);
function arg(name, fallback) {
  const i = argv.indexOf("--" + name);
  if (i === -1) return fallback;
  const next = argv[i + 1];
  return next && !next.startsWith("--") ? next : true;
}
const CONFIG_PATH = path.resolve(ROOT, arg("config", "scripts/pancake.config.json"));
const OUT_PATH = path.resolve(ROOT, arg("out", "index.html"));
const SNAPSHOT_PATH = path.resolve(ROOT, arg("snapshot", "data/pancake-products.json"));
const MOCK_PATH = arg("mock", "");
const DRY_RUN = Boolean(arg("dry-run", false));
const LIMIT = Number(arg("limit", 0)) || 0;

const cfg = JSON.parse(await fs.readFile(CONFIG_PATH, "utf8"));
const SHOP_ID = process.env.PANCAKE_SHOP_ID || "";
const API_KEY = process.env.PANCAKE_API_KEY || "";
const BASE_URL = (process.env.PANCAKE_BASE_URL || cfg.baseUrl || "https://pos.pages.fm/api/v1").replace(/\/+$/, "");

const START_MARK = "/* PANCAKE_PRODUCTS_START";
const END_MARK = "/* PANCAKE_PRODUCTS_END */";

/* ---------------- helpers ---------------- */
const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();

const stripHtml = (s) =>
  String(s ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.error(...a);

function normalizeImage(url) {
  const u = String(url || "").trim();
  if (!u) return "";
  if (u.startsWith("//")) return "https:" + u;
  return u;
}

function collectImages(raw, variations, fallback) {
  const out = [];
  const push = (value) => {
    const items = Array.isArray(value) ? value : [value];
    for (const item of items) {
      const url = normalizeImage(typeof item === "string" ? item : item?.url || item?.src || item?.image);
      if (url && !out.includes(url)) out.push(url);
    }
  };
  push(fallback);
  push(raw.images);
  push(raw.image);
  for (const variation of variations) push(variation.images);
  return out.slice(0, Number(cfg.maxImages) || 8);
}

/* ---------------- Pancake API ---------------- */
async function fetchPage(pageNumber) {
  const url = new URL(`${BASE_URL}/shops/${encodeURIComponent(SHOP_ID)}/products`);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("page_size", String(cfg.pageSize || 100));
  url.searchParams.set("page_number", String(pageNumber));
  // chỉ lấy sản phẩm đang bán (API có thể bỏ qua filter nếu key không hỗ trợ)
  url.searchParams.set("is_published", "true");
  url.searchParams.set("is_hidden", "false");

  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          `Pancake API từ chối API key (HTTP ${res.status}). Kiểm tra lại PANCAKE_API_KEY / PANCAKE_SHOP_ID.`
        );
      }
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`Pancake API tạm lỗi HTTP ${res.status}`);
      }
      if (!res.ok) throw new Error(`Pancake API HTTP ${res.status}`);
      const json = await res.json();
      if (json && json.success === false) {
        throw new Error(`Pancake API báo lỗi: ${JSON.stringify(json.error || json.message || json)}`);
      }
      const data = Array.isArray(json) ? json : json.data;
      if (!Array.isArray(data)) throw new Error("Pancake API trả về dữ liệu không đúng định dạng (thiếu data[]).");
      return {
        data,
        totalPages: Number(json.total_pages) || 1,
        totalEntries: Number(json.total_entries) || data.length,
      };
    } catch (err) {
      lastErr = err;
      if (attempt < 3) {
        const wait = 1000 * 2 ** (attempt - 1);
        log(`  · lỗi lần ${attempt}: ${err.message} — thử lại sau ${wait}ms`);
        await sleep(wait);
      }
    }
  }
  throw lastErr;
}

async function loadRawProducts() {
  if (MOCK_PATH) {
    const file = path.resolve(ROOT, MOCK_PATH);
    const json = JSON.parse(await fs.readFile(file, "utf8"));
    const data = Array.isArray(json) ? json : json.data;
    if (!Array.isArray(data)) throw new Error(`File mock không có mảng data[]: ${file}`);
    log(`· Dùng dữ liệu mock: ${file} (${data.length} sản phẩm)`);
    return data;
  }

  if (!SHOP_ID || !API_KEY) {
    throw new Error(
      "Thiếu PANCAKE_SHOP_ID hoặc PANCAKE_API_KEY.\n" +
        "  Chạy local: PANCAKE_SHOP_ID=... PANCAKE_API_KEY=... node scripts/pancake-sync.mjs\n" +
        "  Trên GitHub Actions: thêm 2 repository secrets cùng tên."
    );
  }

  const all = [];
  let page = 1;
  let totalPages = 1;
  do {
    const r = await fetchPage(page);
    all.push(...r.data);
    totalPages = r.totalPages;
    log(`· Trang ${page}/${totalPages} — ${all.length}/${r.totalEntries} sản phẩm`);
    if (LIMIT && all.length >= LIMIT) break;
    page++;
  } while (page <= totalPages && page <= 100);

  log(`· Tổng tải về: ${all.length} sản phẩm`);
  return LIMIT ? all.slice(0, LIMIT) : all;
}

/* ---------------- mapping ---------------- */
function resolveCategory(raw) {
  const byId = cfg.categories?.byId || {};
  for (const id of (raw.category_ids || []).map(String)) {
    if (byId[id]) return byId[id];
  }
  const names = (raw.categories || []).map((c) => c.name || c).map(norm).filter(Boolean);
  const byName = cfg.categories?.byName || {};
  const keysByLength = Object.keys(byName).sort((a, b) => b.length - a.length);
  for (const n of names) {
    if (byName[n]) return byName[n];                  // khớp chính xác
    for (const key of keysByLength) {                 // khớp mềm: ưu tiên từ khoá dài nhất
      if (n === key || n.includes(key)) return byName[key];
    }
  }
  if (cfg.categories?.nameFallback !== false) return categoryFromName(raw.name);
  return null;
}

function categoryFromName(rawName) {
  const n = norm(rawName);
  if (!n) return null;
  const byName = cfg.categories?.byName || {};
  const keys = Object.keys(byName).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (key.includes(" ")) {
      if (n.includes(key)) return byName[key];
    } else {
      const re = new RegExp("(^|\\s)" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\s|$)");
      if (re.test(n)) return byName[key];
    }
  }
  return null;
}

function brandFromName(name) {
  if (cfg.name?.brandFromName === false) return "";
  const m = String(name || "").match(/^([A-Z0-9][A-Z0-9&.'_-]{2,})(?=\s)/);
  return m ? m[1] : "";
}

function resolveBrand(raw, nameBrand) {
  const map = cfg.brands || {};
  if (raw.brand && typeof raw.brand === "object" && raw.brand.name) return raw.brand.name;
  if (raw.brand && typeof raw.brand === "string") return raw.brand;
  if (typeof raw.brand_name === "string" && raw.brand_name) return raw.brand_name;
  if (raw.brand_id && map[String(raw.brand_id)]) return map[String(raw.brand_id)];
  if (nameBrand) return nameBrand;                     // vd "AOORAA", "ANNATTO", "4MUGGLE"
  const fromId = brandFromCustomId(raw);
  if (fromId) return fromId;
  return cfg.brandFallback || "ALMIRA";
}

function brandFromCustomId(raw) {
  if (cfg.brandFromCustomId === false) return "";
  const m = String(raw.custom_id || "").match(/^([A-Za-z]{4,})(?=\d|$)/);
  if (!m) return "";
  const token = m[1].toUpperCase();
  const blocked = new Set((cfg.brandBlocklist || []).map((x) => String(x).toUpperCase()));
  return blocked.has(token) ? "" : token;
}

/* Tên sản phẩm Pancake thường rất dài + kèm marketing. Rút gọn để card không vỡ layout. */
function cleanName(rawName, brandToken) {
  let s = String(rawName || "").trim();
  if (cfg.name?.stripBrackets !== false) {
    s = s.replace(/【[^】]*】/g, " ").replace(/\[[^\]]*\]/g, " ").replace(/（[^）]*）/g, " ").replace(/\([^)]*\)/g, " ");
  }
  if (cfg.name?.stripQuoted !== false) {
    s = s.replace(/["“”„«»]/g, " ");
  }
  if (brandToken && s.toUpperCase().startsWith(brandToken.toUpperCase())) {
    s = s.slice(brandToken.length);
  }
  s = s.replace(/\s+/g, " ").replace(/^[\s,.;:–—-]+|[\s,.;:–—-]+$/g, "");
  const max = Number(cfg.name?.maxLength) || 0;
  if (max && s.length > max) {
    s = s.slice(0, max).replace(/\s+\S*$/, "").replace(/[\s,.;:–—-]+$/g, "") + "…";
  }
  return s || String(rawName || "").trim();
}

const PALETTE = ["#E7DFD2", "#1d1a16", "#c9b896", "#9a958e", "#efe6d4", "#7a5c40", "#e3b7c4", "#7d8fa8"];

function colorInfo(name, index) {
  const key = norm(name);
  const colors = cfg.colors || {};
  const keysByLength = Object.keys(colors).sort((a, b) => b.length - a.length);
  let entry = colors[key];
  if (entry === undefined) {
    const hit = keysByLength.find((k) => key.includes(k));
    if (hit) entry = colors[hit];
  }
  if (entry && typeof entry === "object" && entry.hex) {
    return [String(name).trim(), entry.hex, entry.en || String(name).trim()];
  }
  if (typeof entry === "string") return [String(name).trim(), entry, String(name).trim()];
  return [String(name).trim(), PALETTE[index % PALETTE.length], String(name).trim()];
}

function attrMatch(name, kind) {
  const n = norm(name);
  if (kind === "color") return n.includes("mau") || n.includes("color") || n.includes("colour");
  return n.includes("size") || n === "kich thuoc" || n === "kich co";
}

function variantValues(raw, kind) {
  // Ưu tiên fields của variations: trên Pancake, product_attributes là danh sách
  // giá trị dùng chung của cả shop (có thể tới 50+ màu), không phải của riêng sản phẩm.
  const out = [];
  for (const v of raw.variations || []) {
    for (const f of v.fields || []) {
      if (attrMatch(f.name, kind)) {
        const val = String(f.value || f.keyValue || "").trim();
        if (val) out.push(val);
      }
    }
  }
  if (out.length) return [...new Set(out)];
  const attrs = Array.isArray(raw.product_attributes) ? raw.product_attributes : [];
  const attr = attrs.find((a) => attrMatch(a.name, kind));
  return attr && Array.isArray(attr.values)
    ? [...new Set(attr.values.map((v) => String(v).trim()).filter(Boolean))]
    : [];
}

function deriveTag(raw, isNew) {
  const tagMap = cfg.tags || {};
  for (const t of raw.tags || []) {
    const n = norm(t?.name || t);
    if (!n) continue;
    for (const [label, keys] of Object.entries(tagMap)) {
      if (keys.some((k) => n.includes(norm(k)))) return label;
    }
  }
  if (isNew && cfg.autoNewTag !== false) return "Mới";
  return "";
}

function mapProduct(raw) {
  if (!raw || typeof raw !== "object") return { skip: "invalid" };
  if (raw.is_hidden === true) return { skip: "hidden" };
  if (raw.is_published === false) return { skip: "unpublished" };
  const over = { ...((cfg.overrides || {})[String(raw.id)] || {}), ...((cfg.overrides || {})[String(raw.custom_id)] || {}) };

  const cat = over.cat || resolveCategory(raw);
  if (!cat) return { skip: "category-unmapped" };

  const variations = (raw.variations || []).filter((v) => v && v.is_hidden !== true && v.is_removed !== true);
  const prices = variations.map((v) => Number(v.retail_price) || 0).filter((n) => n > 0);
  const price = prices.length ? Math.min(...prices) : Number(raw.price) || Number(raw.retail_price) || 0;
  if (!price) return { skip: "no-price" };

  // Ảnh: Pancake có sản phẩm không có ảnh ở cấp product, ảnh nằm trong từng variation.
  // Giữ nhiều ảnh để trang chi tiết có thể trượt qua gallery.
  const images = collectImages(raw, variations, over.img);
  const img = images[0];
  if (!img) return { skip: "no-image" };

  const colorNames = variantValues(raw, "color").slice(0, Number(cfg.maxColors) || 16);
  const colors = colorNames.length
    ? colorNames.map((n, i) => colorInfo(n, i))
    : [["Mặc định", "#E7DFD2", "Default"]];

  const rawName = String(raw.name || "").trim();
  const nameBrand = brandFromName(rawName);
  const brand = over.brand || resolveBrand(raw, nameBrand);
  const displayName = over.name || cleanName(rawName, nameBrand) || "Sản phẩm";

  const sizes = variantValues(raw, "size").slice(0, Number(cfg.maxSizes) || 16);
  const inserted = raw.inserted_at ? new Date(raw.inserted_at) : null;
  const isNew = Boolean(inserted && !Number.isNaN(inserted.getTime()) && Date.now() - inserted.getTime() <= (cfg.newDays || 21) * 864e5);

  const desc = over.desc || stripHtml(raw.description || raw.note_product || "") || cfg.descFallback || "";
  const mapped = {
    id: String(raw.id),
    name: displayName,
    nameEn: over.nameEn || String(raw.name_en || displayName).trim() || "Product",
    brand,
    cat,
    price: Math.round(price),
    was: over.was != null ? Math.round(Number(over.was)) || null : null,
    img,
    images,
    tag: over.tag != null ? over.tag : deriveTag(raw, isNew),
    isNew,
    colors,
    sizes: sizes.length ? sizes : ["Freesize"],
    desc,
    descEn: over.descEn || stripHtml(raw.description_en || raw.description || raw.note_product || "") || cfg.descFallbackEn || desc,
  };
  return { product: mapped };
}

/* ---------------- render ---------------- */
function formatBlock(products) {
  const json = JSON.stringify(products, null, 2)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  return [
    `${START_MARK} — auto-generated by scripts/pancake-sync.mjs. Đừng sửa tay. */`,
    `const PRODUCTS = ${json};`,
    END_MARK,
  ].join("\n");
}

async function writeOutputs(products, rawCount) {
  const html = await fs.readFile(OUT_PATH, "utf8");
  const start = html.indexOf(START_MARK);
  const end = html.indexOf(END_MARK);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      `Không tìm thấy marker trong ${path.relative(ROOT, OUT_PATH)}. ` +
        `Cần có '${START_MARK} ... */' và '${END_MARK}' bao quanh const PRODUCTS.`
    );
  }
  const next = html.slice(0, start) + formatBlock(products) + html.slice(end + END_MARK.length);
  await fs.writeFile(OUT_PATH, next, "utf8");

  const snapshot = {
    syncedAt: new Date().toISOString(),
    source: MOCK_PATH ? "mock" : "pancake-pos",
    shopId: MOCK_PATH ? null : SHOP_ID,
    fetched: rawCount,
    mapped: products.length,
    products,
  };
  await fs.mkdir(path.dirname(SNAPSHOT_PATH), { recursive: true });
  await fs.writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
}

/* ---------------- main ---------------- */
try {
  log(`Pancake POS sync → ${path.relative(ROOT, OUT_PATH)}`);
  const raw = await loadRawProducts();
  if ((cfg.sortBy || "newest") === "newest") {
    raw.sort((a, b) => String(b.inserted_at || "").localeCompare(String(a.inserted_at || "")));
  }
  const products = [];
  const skipped = new Map();
  for (const item of raw) {
    const r = mapProduct(item);
    if (r.product) products.push(r.product);
    else skipped.set(r.skip, (skipped.get(r.skip) || 0) + 1);
  }

  log(`· Map được: ${products.length}/${raw.length} sản phẩm`);
  for (const [reason, n] of skipped) log(`  - bỏ qua ${n}: ${reason}`);
  if (skipped.get("category-unmapped")) {
    log("  ↳ Có danh mục Pancake chưa được map. Bổ sung vào scripts/pancake.config.json → categories.byName");
  }

  if (!products.length) {
    throw new Error("Không có sản phẩm hợp lệ nào để ghi — giữ nguyên website cũ.");
  }

  if (DRY_RUN) {
    log("· --dry-run: không ghi file. 3 sản phẩm đầu:");
    log(JSON.stringify(products.slice(0, 3), null, 2));
  } else {
    await writeOutputs(products, raw.length);
    log(`· Đã ghi ${products.length} sản phẩm vào ${path.relative(ROOT, OUT_PATH)} + snapshot ${path.relative(ROOT, SNAPSHOT_PATH)}`);
  }
} catch (err) {
  console.error("\n✖ Đồng bộ thất bại:", err.message);
  process.exit(1);
}
