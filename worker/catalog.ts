import type { Env, Product, Variation } from "./types";
import { Decimal } from "decimal.js";
import { catalogMaxAge } from "./security";
import config from "../scripts/pancake.config.json";

type Row = Record<string, unknown>;
type State = {
  active_snapshot_id: string | null; last_successful_sync_at: number | null; last_error: string | null;
  lease_token: string | null; lease_until: number | null; next_page: number; total_pages: number | null;
  total_entries: number | null; received_entries: number; staging_snapshot_id: string | null; next_sync_at: number;
};
const INTERVAL = 30 * 60_000;
const LEASE = 60_000;
const PAGE_SIZE = 90;
const PALETTE = ["#E7DFD2", "#1d1a16", "#c9b896", "#9a958e", "#efe6d4", "#7a5c40", "#e3b7c4", "#7d8fa8"];
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/\s+/g, " ").trim();
const str = (v: unknown) => typeof v === "string" || typeof v === "number" ? String(v).trim() : "";
const safeText = (v: unknown, max = 500) => str(v).replace(/<[^>]*>/g, " ").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const safeColor = (v: unknown) => /^#[\da-f]{6}$/i.test(str(v)) ? str(v) : PALETTE[0];
const safeImage = (v: unknown): string | null => {
  try {
    const url = new URL(str(v).startsWith("//") ? `https:${str(v)}` : str(v));
    if (url.username || url.password || url.search || url.hash) return null;
    return url.protocol === "https:" && ["content.pancake.vn", "statics.pancake.vn", "img.alicdn.com", "gw.alicdn.com", "img.ltwebstatic.com", "img.kwcdn.com"].includes(url.hostname) ? url.toString() : null;
  } catch { return null; }
};
const money = (v: unknown): string | null => {
  if (!(typeof v === "string" || typeof v === "number") || (typeof v === "number" && !Number.isSafeInteger(v)) || !/^(0|[1-9]\d{0,12})(?:\.0{1,2})?$/.test(String(v))) return null;
  try { const value = new Decimal(String(v)); return value.isPositive() && value.isFinite() && value.isInteger() ? value.toFixed(2) : null; }
  catch { return null; }
};
const overrides = config.overrides as unknown as Record<string, Row>;
const brandFromName = (name: string) => config.name?.brandFromName === false ? "" : name.match(/^([A-Z0-9][A-Z0-9&.'_-]{2,})(?=\s)/)?.[1] || "";
function mapPage(rows: unknown[], shopId: string, now: number): Product[] {
  const grouped = new Map<string, { raw: Row; vars: Row[] }>();
  for (const value of rows) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_page");
    const row = value as Row; const raw = row.product;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("invalid_page");
    const product = raw as Row; const id = str(product.id) || str(row.product_id);
    if (!id || !str(row.id) || str(row.product_id) !== id || (row.shop_id != null && str(row.shop_id) !== shopId) || (product.shop_id != null && str(product.shop_id) !== shopId)) throw new Error("invalid_page");
    if (product.is_published !== true || product.is_hidden === true || product.is_locked === true || row.is_hidden === true || row.is_locked === true || row.is_removed === true) continue;
    const existing = grouped.get(id);
    if (existing) existing.vars.push(row); else grouped.set(id, { raw: product, vars: [row] });
  }
  const output: Product[] = [];
  for (const [id, { raw, vars }] of grouped) {
    const override = { ...(overrides[id] || {}), ...(overrides[str(raw.custom_id)] || {}) };
    const categories = Array.isArray(raw.categories) ? raw.categories.map(c => typeof c === "object" && c ? str((c as Row).name) : str(c)) : [];
    const categoryIds = Array.isArray(raw.category_ids) ? raw.category_ids.map(str) : [];
    const byName = (config.categories?.byName || {}) as Record<string, string>;
    const byId = (config.categories?.byId || {}) as Record<string, string>;
    let cat = str(override.cat) || categoryIds.map(key => byId[key]).find(Boolean) || "";
    if (!cat) for (const value of categories) {
      const n = norm(value); const key = Object.keys(byName).sort((a, b) => b.length - a.length).find(item => n === item || n.includes(item));
      if (key) { cat = byName[key]; break; }
    }
    if (!cat && config.categories?.nameFallback !== false) {
      const n = norm(str(raw.name)); const key = Object.keys(byName).sort((a, b) => b.length - a.length).find(item => n.includes(item));
      if (key) cat = byName[key];
    }
    if (!cat) continue;
    const mapped = vars.map(v => {
      const price = money(v.retail_price); if (!price) throw new Error("invalid_price");
      const fields = Array.isArray(v.fields) ? v.fields as Row[] : [];
      const field = (kind: "size" | "color") => safeText(fields.find(f => {
        const name = norm(str(f.name)); return kind === "size" ? name.includes("size") || name.includes("kich co") || name.includes("kich thuoc") : name.includes("mau") || name.includes("color") || name.includes("colour");
      })?.value, 80);
      return { raw: v, price, size: field("size"), color: field("color"), image: Array.isArray(v.images) ? v.images.map(safeImage).find(Boolean) || null : null };
    });
    const rawName = safeText(raw.name, 300); const brandToken = brandFromName(rawName);
    const brands = config.brands as Record<string, string>;
    const customBrand = str(raw.custom_id).match(/^([A-Za-z]{4,})(?=\d|$)/)?.[1]?.toUpperCase() || "";
    const inferredBrand = config.brandFromCustomId !== false && !config.brandBlocklist.includes(customBrand) ? customBrand : "";
    const brand = safeText(override.brand || (raw.brand && typeof raw.brand === "object" ? str((raw.brand as Row).name) : str(raw.brand)) || str(raw.brand_name) || brands[str(raw.brand_id)] || brandToken || inferredBrand || config.brandFallback || "ALMIRA", 80);
    let name = str(override.name) || rawName;
    if (config.name?.stripBrackets !== false) name = name.replace(/【[^】]*】|\[[^\]]*\]|（[^）]*）|\([^)]*\)/g, " ");
    if (config.name?.stripQuoted !== false) name = name.replace(/[“”„«»\"]/g, " ");
    if (brandToken && name.toUpperCase().startsWith(brandToken.toUpperCase())) name = name.slice(brandToken.length);
    name = safeText(name.replace(/\s+/g, " ").trim(), Number(config.name?.maxLength) || 78) || rawName;
    const nameEn = safeText(override.nameEn || raw.name_en || name, 120);
    const images = [...new Set([safeImage(override.img), safeImage(raw.image), ...mapped.map(v => v.image)].filter((url): url is string => Boolean(url)))].slice(0, Number(config.maxImages) || 8);
    if (!images.length || !name || !mapped.length) continue;
    const colorMap = config.colors as Record<string, string | { hex: string; en?: string }>;
    const colors: Product["colors"] = [...new Set(mapped.map(v => v.color || "Mặc định"))].map((color, i) => {
      const key = Object.keys(colorMap).sort((a, b) => b.length - a.length).find(item => norm(color).includes(item)); const info = key ? colorMap[key] : undefined;
      return [color, safeColor(typeof info === "object" ? info.hex : info || PALETTE[i % PALETTE.length]), typeof info === "object" ? safeText(info.en || color, 80) : color];
    });
    if (!colors.length) colors.push(["Mặc định", PALETTE[0], "Default"]);
    const variations: Variation[] = mapped.map(v => ({ id: str(v.raw.id), productId: id, shopId, size: v.size || "Freesize", color: v.color || "Mặc định", price: v.price }));
    const price = variations.map(v => new Decimal(v.price)).reduce((a, b) => a.lessThan(b) ? a : b).toFixed(2);
    const was = override.was == null ? null : money(override.was); if (override.was != null && !was) throw new Error("invalid_price");
    const inserted = Date.parse(str(raw.inserted_at)); const isNew = Number.isFinite(inserted) && now - inserted <= (Number(config.newDays) || 21) * 864e5;
    const tagMap = config.tags as Record<string, string[]>; let tag = "";
    for (const entry of Array.isArray(raw.tags) ? raw.tags : []) {
      const text = norm(typeof entry === "object" && entry ? str((entry as Row).name) : str(entry));
      const match = Object.entries(tagMap).find(([, words]) => words.some(word => text.includes(norm(word))));
      if (match) { tag = match[0]; break; }
    }
    if (!tag && isNew && config.autoNewTag) tag = "Mới";
    const desc = safeText(override.desc || config.descFallback || "", 1000);
    const descEn = safeText(override.descEn || config.descFallbackEn || desc, 1000);
    output.push({ id, name, nameEn, brand, cat, price, was, img: images[0], images, tag: safeText(override.tag ?? tag, 80), isNew, colors, sizes: [...new Set(variations.map(v => v.size))], desc, descEn, variations });
  }
  return output;
}

async function state(env: Env) {
  const value = await env.DB.prepare("SELECT * FROM catalog_state WHERE id=1").first<State>();
  if (!value) throw new Error("catalog_state_missing");
  return value;
}
export async function readCatalog(env: Env) {
  const current = await state(env);
  const products = current.active_snapshot_id
    ? await env.DB.prepare("SELECT payload FROM catalog_products WHERE snapshot_id=? ORDER BY product_id").bind(current.active_snapshot_id).all<{ payload: string }>()
    : { results: [] as { payload: string }[] };
  const maxAge = catalogMaxAge(env);
  return { snapshotId: current.active_snapshot_id, lastSuccessfulSyncAt: current.last_successful_sync_at == null ? null : new Date(current.last_successful_sync_at).toISOString(), stale: current.last_successful_sync_at == null || Date.now() - current.last_successful_sync_at > maxAge, error: current.last_error, products: products.results.map(row => JSON.parse(row.payload) as Product) };
}

export async function syncCatalogStep(env: Env, transport: typeof fetch = fetch, now = Date.now()) {
  if (env.PANCAKE_READ_ENABLED !== "true" || !env.PANCAKE_READ_API_KEY || !env.PANCAKE_SHOP_ID || !/^[0-9]+$/.test(env.PANCAKE_SHOP_ID)) return { status: "disabled" as const };
  const startedAt = Date.now();
  const shop = env.PANCAKE_SHOP_ID; const token = crypto.randomUUID();
  const acquired = await env.DB.prepare("UPDATE catalog_state SET lease_token=?,lease_until=? WHERE id=1 AND (lease_until IS NULL OR lease_until<?)").bind(token, now + LEASE, now).run();
  if (!acquired.meta.changes) return { status: "busy" as const };
  let current = await state(env);
  if (current.next_sync_at > now && !current.staging_snapshot_id) {
    await env.DB.prepare("UPDATE catalog_state SET lease_token=NULL,lease_until=NULL WHERE id=1 AND lease_token=?").bind(token).run();
    return { status: "not_due" as const };
  }
  if (!current.staging_snapshot_id) {
    const id = crypto.randomUUID();
    await env.DB.batch([
      env.DB.prepare("INSERT INTO catalog_snapshots(id,shop_id,created_at,status) VALUES(?,?,?,'staging')").bind(id, shop, now),
      env.DB.prepare("UPDATE catalog_state SET staging_snapshot_id=?,next_page=1,total_pages=NULL,total_entries=NULL,received_entries=0,last_error=NULL WHERE id=1 AND lease_token=?").bind(id, token)
    ]);
    current = await state(env);
  }
  const snapshot = current.staging_snapshot_id;
  if (!snapshot || current.lease_token !== token || current.lease_until == null || current.lease_until <= now) return { status: "stale" as const };
  const generation = await env.DB.prepare("SELECT shop_id,created_at FROM catalog_snapshots WHERE id=?").bind(snapshot).first<{shop_id: string; created_at: number}>();
  const snapshotShop = generation?.shop_id;
  try {
    if (snapshotShop !== shop) throw new Error("invalid_page");
    const url = new URL(`https://pos.pages.fm/api/v1/shops/${shop}/products/variations`);
    url.searchParams.set("api_key", env.PANCAKE_READ_API_KEY); url.searchParams.set("page_size", String(PAGE_SIZE)); url.searchParams.set("page_number", String(current.next_page));
    const response = await transport(url, { redirect: "manual", signal: AbortSignal.timeout(20000) });
    if (response.status >= 300 && response.status < 400) throw new Error("upstream_redirect");
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "auth" : "upstream");
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("invalid_page");
    const data = body as Row;
    if ((data.shop_id != null && str(data.shop_id) !== shop) || data.success !== true || !Array.isArray(data.data) || !Number.isInteger(data.total_pages) || (data.total_pages as number) < 1 || !Number.isInteger(data.total_entries) || (data.total_entries as number) < 0 || (data.total_pages as number) < current.next_page || (data.total_pages as number) > 10000 || data.page_number !== current.next_page || (current.total_pages != null && (current.total_pages !== data.total_pages || current.total_entries !== data.total_entries))) {
      console.warn("catalog_page_metadata", JSON.stringify({page: data.page_number, totalPages: data.total_pages, totalEntries: data.total_entries, count: Array.isArray(data.data) ? data.data.length : null, success: data.success === true, expectedPage: current.next_page}));
      throw new Error("invalid_page");
    }
    const received = current.received_entries + data.data.length;
    if (data.data.length > PAGE_SIZE || received > (data.total_entries as number) || (current.next_page < (data.total_pages as number) && data.data.length === 0)) throw new Error("invalid_page");
    const products = mapPage(data.data, shop, now); const seen = new Set<string>();
    for (const item of data.data) { const id = str((item as Row).id); if (!id || seen.has(id)) throw new Error("duplicate_variation"); seen.add(id); }
    const statements: D1PreparedStatement[] = [];
    let publishedProducts = 0;
    const priorRows = products.length ? await env.DB.prepare(`SELECT product_id,payload FROM catalog_products WHERE snapshot_id=? AND product_id IN (${products.map(() => "?").join(",")})`).bind(snapshot, ...products.map(p => p.id)).all<{product_id: string; payload: string}>() : {results: []};
    const priorById = new Map(priorRows.results.map(row => [row.product_id, row]));
    for (const product of products) {
      const priorRow = priorById.get(product.id);
      if (priorRow) {
        const prior = JSON.parse(priorRow.payload) as Product; const ids = new Set(prior.variations.map(v => v.id));
        if (product.variations.some(v => ids.has(v.id))) throw new Error("duplicate_variation");
        product.name = prior.name; product.nameEn = prior.nameEn; product.brand = prior.brand; product.cat = prior.cat; product.was = prior.was;
        product.tag = prior.tag; product.isNew = prior.isNew; product.desc = prior.desc; product.descEn = prior.descEn;
        product.variations = [...prior.variations, ...product.variations]; product.sizes = [...new Set([...prior.sizes, ...product.sizes])];
        product.colors = [...prior.colors, ...product.colors.filter(c => !prior.colors.some(x => x[0] === c[0]))];
        product.price = product.variations.map(v => new Decimal(v.price)).reduce((a, b) => a.lessThan(b) ? a : b).toFixed(2);
        product.img = prior.img; product.images = [...new Set([...prior.images, ...product.images])].slice(0, Number(config.maxImages) || 8);
      }
      statements.push(env.DB.prepare("INSERT INTO catalog_products(snapshot_id,product_id,payload) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM catalog_state WHERE id=1 AND lease_token=? AND staging_snapshot_id=?) ON CONFLICT(snapshot_id,product_id) DO UPDATE SET payload=excluded.payload").bind(snapshot, product.id, JSON.stringify(product), token, snapshot));
      publishedProducts++;
    }
    const done = current.next_page === data.total_pages;
    if (done && (current.received_entries + data.data.length !== data.total_entries || (publishedProducts === 0 && !await env.DB.prepare("SELECT 1 FROM catalog_products WHERE snapshot_id=? LIMIT 1").bind(snapshot).first()))) throw new Error("incomplete_catalog");
    statements.push(env.DB.prepare("UPDATE catalog_state SET next_page=next_page+1,total_pages=?,total_entries=?,received_entries=received_entries+?,lease_token=?,lease_until=? WHERE id=1 AND lease_token=? AND staging_snapshot_id=?").bind(data.total_pages, data.total_entries, data.data.length, done ? token : null, done ? now + LEASE : null, token, snapshot));
    if (done) {
      statements.push(env.DB.prepare("UPDATE catalog_snapshots SET status='retired' WHERE id=(SELECT active_snapshot_id FROM catalog_state WHERE id=1 AND lease_token=? AND staging_snapshot_id=?)").bind(token, snapshot));
      statements.push(env.DB.prepare("UPDATE catalog_snapshots SET status='active' WHERE id=? AND EXISTS(SELECT 1 FROM catalog_state WHERE id=1 AND lease_token=? AND staging_snapshot_id=?)").bind(snapshot, token, snapshot));
      statements.push(env.DB.prepare("UPDATE catalog_state SET active_snapshot_id=?,last_successful_sync_at=?,last_error=NULL,staging_snapshot_id=NULL,next_sync_at=?,lease_token=NULL,lease_until=NULL WHERE id=1 AND lease_token=? AND staging_snapshot_id=?").bind(snapshot, now, (generation?.created_at ?? now) + INTERVAL, token, snapshot));
    }
    if (Date.now() - startedAt >= LEASE || await env.DB.prepare("SELECT lease_token FROM catalog_state WHERE id=1").first("lease_token") !== token) return { status: "stale" as const };
    await env.DB.batch(statements);
    return { status: done ? "complete" as const : "page" as const, page: current.next_page };
  } catch (error) {
    const transportCode = error instanceof TypeError && /fetch.*context|illegal invocation/i.test(error.message) ? "transport_context" : error instanceof TypeError && /header|character/i.test(error.message) ? "invalid_credential_format" : "transport_failed";
    const code = error instanceof TypeError ? transportCode : error instanceof SyntaxError ? "invalid_json" : error instanceof Error && error.message.startsWith("D1_") ? "database_failed" : error instanceof Error && ["auth", "upstream", "upstream_redirect", "invalid_page", "invalid_price", "duplicate_variation", "incomplete_catalog"].includes(error.message) ? error.message : "sync_failed";
    await env.DB.batch([
      env.DB.prepare("UPDATE catalog_snapshots SET status='failed' WHERE id=(SELECT staging_snapshot_id FROM catalog_state WHERE id=1 AND lease_token=?)").bind(token),
      env.DB.prepare("UPDATE catalog_state SET last_error=?,staging_snapshot_id=NULL,next_sync_at=?,lease_token=NULL,lease_until=NULL,next_page=1,total_pages=NULL,total_entries=NULL,received_entries=0 WHERE id=1 AND lease_token=?").bind(code, now + INTERVAL, token)
    ]);
    return { status: "failed" as const, error: code };
  }
}
