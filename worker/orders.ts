import type { Env, OrderRow, Quote, QuoteItem } from "./types";
import { readCatalog } from "./catalog";
import { ApiError, catalogMaxAge, checkoutEnabled, hash, hmac, object, text } from "./security";
import { lineTotal, totals } from "./money";

function secret(env: Env) {
  if (!env.ORDER_TOKEN_SECRET || env.ORDER_TOKEN_SECRET.length < 32) throw new ApiError(503, "checkout_unavailable");
  return env.ORDER_TOKEN_SECRET;
}
function encode(value: unknown) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value)))).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
async function signQuote(env: Env, quote: Quote) {
  const encoded = encode(quote); return `${encoded}.${await hmac(secret(env), `quote:${encoded}`)}`;
}
async function decodeQuote(env: Env, token: unknown): Promise<Quote> {
  const value = text(token, 50000); const [encoded, signature, extra] = value.split(".");
  if (extra || !encoded || signature !== await hmac(secret(env), `quote:${encoded}`)) throw new ApiError(400, "invalid_quote");
  try {
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded.replaceAll("-", "+").replaceAll("_", "/")), c => c.charCodeAt(0))));
  } catch { throw new ApiError(400, "invalid_quote"); }
}
export async function createQuote(env: Env, input: Record<string, unknown>, now = Date.now()) {
  if (!checkoutEnabled(env)) throw new ApiError(503, "checkout_unavailable");
  const maxAge = catalogMaxAge(env);
  const snapshotId = text(input.snapshotId, 100);
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 30) throw new ApiError(400, "invalid_items");
  const catalog = await readCatalog(env);
  if (catalog.stale || !catalog.snapshotId || !catalog.lastSuccessfulSyncAt || now - Date.parse(catalog.lastSuccessfulSyncAt) > maxAge) throw new ApiError(409, "catalog_stale");
  if (snapshotId !== catalog.snapshotId) throw new ApiError(409, "catalog_changed");
  const seen = new Set<string>(); const items: QuoteItem[] = [];
  for (const raw of input.items) {
    const row = object(raw); const productId = text(row.productId, 100); const variationId = text(row.variationId, 100);
    if (!Number.isInteger(row.quantity) || (row.quantity as number) < 1 || (row.quantity as number) > 9 || seen.has(variationId)) throw new ApiError(400, "invalid_items");
    seen.add(variationId);
    const product = catalog.products.find(p => p.id === productId);
    const variation = product?.variations.find(v => v.id === variationId && v.productId === productId && v.shopId === env.PANCAKE_SHOP_ID);
    if (!product || !variation) throw new ApiError(409, "variation_unavailable");
    items.push({ productId, variationId, quantity: row.quantity as number, name: product.name, size: variation.size,
      color: variation.color, unitPrice: variation.price, lineTotal: lineTotal(variation.price, row.quantity as number) });
  }
  items.sort((a, b) => a.variationId.localeCompare(b.variationId));
  const quote: Quote = { snapshotId, shopId: env.PANCAKE_SHOP_ID!, expiresAt: now + 10 * 60000, items, ...totals(items), shipping: "unconfirmed" };
  return { ...quote, quoteId: await signQuote(env, quote) };
}
async function receipt(env: Env, row: OrderRow) {
  return { websiteOrderId: row.id, status: row.status, statusToken: await hmac(secret(env), `status:${row.id}`),
    total: row.total, deposit: row.deposit, remaining: row.remaining };
}
export async function acceptOrder(env: Env, input: Record<string, unknown>, key: string | null, now = Date.now()) {
  secret(env);
  if (!key || !/^[a-f0-9-]{36}$/i.test(key)) throw new ApiError(400, "invalid_idempotency_key");
  const customer = object(input.customer);
  const normalized = { quoteId: text(input.quoteId, 50000), customer: {
    name: text(customer.name, 120), phone: text(customer.phone, 30), address: text(customer.address, 1000), note: text(customer.note ?? "", 2000, true)
  }, paymentMethod: input.paymentMethod };
  if (!/^\+?[\d\s().-]+$/.test(normalized.customer.phone) || !/^\d{9,15}$/.test(normalized.customer.phone.replace(/\D/g, "")) || !["bank", "paypal"].includes(String(input.paymentMethod))) throw new ApiError(400, "invalid_request");
  const payloadHash = await hash(JSON.stringify(normalized));
  const prior = await env.DB.prepare("SELECT * FROM orders WHERE idempotency_key=?").bind(key).first<OrderRow>();
  if (prior) {
    if (prior.payload_hash !== payloadHash) throw new ApiError(409, "idempotency_conflict");
    return receipt(env, prior);
  }
  if (!checkoutEnabled(env)) throw new ApiError(503, "checkout_unavailable");
  const quote = await decodeQuote(env, normalized.quoteId);
  if (quote.expiresAt < now || quote.shopId !== env.PANCAKE_SHOP_ID) throw new ApiError(409, "quote_expired");
  const fresh = await createQuote(env, { snapshotId: quote.snapshotId, items: quote.items }, now);
  if (JSON.stringify(fresh.items) !== JSON.stringify(quote.items) || fresh.total !== quote.total) throw new ApiError(409, "price_changed");
  const id = crypto.randomUUID(); const token = await hmac(secret(env), `status:${id}`);
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO orders(id,idempotency_key,payload_hash,token_hash,status,shop_id,warehouse_id,customer_json,quote_json,payment_method,total,deposit,remaining,created_at)
      SELECT ?,?,?,?,'pending',?,?,?,?,?,?,?,?,? FROM catalog_state
      WHERE id=1 AND active_snapshot_id=? AND last_successful_sync_at>=?
      AND (?!='true' OR NOT EXISTS(SELECT 1 FROM orders))
      ON CONFLICT(idempotency_key) DO NOTHING`).bind(id, key, payloadHash, await hash(token), quote.shopId, env.PANCAKE_WAREHOUSE_ID!,
      JSON.stringify(normalized.customer), JSON.stringify(quote), normalized.paymentMethod as string, quote.total, quote.deposit, quote.remaining, now,
      quote.snapshotId, now - catalogMaxAge(env), env.CHECKOUT_TRIAL_ENABLED || "false"),
    env.DB.prepare(`INSERT INTO outbox(order_id,state,next_attempt_at) SELECT id,'pending',? FROM orders WHERE id=?`).bind(now, id)
  ]);
  const saved = await env.DB.prepare("SELECT * FROM orders WHERE idempotency_key=?").bind(key).first<OrderRow>();
  if (!saved) throw new ApiError(409, env.CHECKOUT_TRIAL_ENABLED === "true" ? "trial_slot_unavailable" : "catalog_changed");
  if (saved.payload_hash !== payloadHash) throw new ApiError(409, "idempotency_conflict");
  return receipt(env, saved);
}
export async function orderStatus(env: Env, value: unknown) {
  const token = text(value, 64);
  if (!/^[a-f0-9]{64}$/.test(token)) throw new ApiError(404, "order_not_found");
  const row = await env.DB.prepare("SELECT id,status,total,deposit,remaining,created_at FROM orders WHERE token_hash=?").bind(await hash(token)).first<OrderRow>();
  if (!row) throw new ApiError(404, "order_not_found");
  return { websiteOrderId: row.id, status: row.status, total: row.total, deposit: row.deposit, remaining: row.remaining, createdAt: new Date(row.created_at).toISOString() };
}
