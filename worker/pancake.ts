import type { Env, OrderRow, Quote } from "./types";
import { integerVnd } from "./money";

export function pancakePayload(order: OrderRow) {
  if (!/^\d+$/.test(order.shop_id)) throw new Error("invalid_shop");
  const quote = JSON.parse(order.quote_json) as Quote;
  const customer = JSON.parse(order.customer_json || "null");
  if (!customer || quote.shopId !== order.shop_id) throw new Error("invalid_order_snapshot");
  const items = quote.items.map(item => {
    const fields = { product_id: item.productId, variation_id: item.variationId, quantity: item.quantity,
      variation_info: { name: item.name, product_id: item.productId, id: item.variationId } };
    const variation = JSON.stringify(fields.variation_info).slice(0, -1) + `,"retail_price":${integerVnd(item.unitPrice)}}`;
    return JSON.stringify({ ...fields, variation_info: null }).replace('"variation_info":null', `"variation_info":${variation}`);
  });
  const fields = { warehouse_id: order.warehouse_id, status: 0, custom_id: order.id,
    bill_full_name: customer.name, bill_phone_number: customer.phone,
    shipping_address: { full_name: customer.name, phone_number: customer.phone, address: customer.address },
    note: `Website ${order.id}\nPayment preference: ${order.payment_method}; payment NOT verified. Shipping fee requires shop confirmation.\n${customer.note}` };
  return `{${JSON.stringify(fields).slice(1, -1)},"shop_id":${order.shop_id},"items":[${items.join(",")}]}`;
}

async function finish(env: Env, id: string, lease: string, state: string, status: string, error: string | null, pancakeId: string | null = null) {
  await env.DB.batch([
    env.DB.prepare(`UPDATE orders SET status=?,error_code=?,pancake_order_id=? WHERE id=?
      AND EXISTS(SELECT 1 FROM outbox WHERE order_id=? AND lease_token=? AND state IN ('leased','sending'))`).bind(status, error, pancakeId, id, id, lease),
    env.DB.prepare(`UPDATE outbox SET state=?,error_code=?,lease_token=NULL,lease_until=NULL WHERE order_id=? AND lease_token=? AND state IN ('leased','sending')`).bind(state, error, id, lease)
  ]);
}
export async function dispatchOrders(env: Env, transport: typeof fetch = fetch, now = Date.now()) {
  // A crashed sender may already have created an order. Expired sending leases are never retried.
  await env.DB.batch([
    env.DB.prepare(`UPDATE orders SET status='unknown',error_code='sender_interrupted' WHERE id IN
      (SELECT order_id FROM outbox WHERE state='sending' AND lease_until<?)`).bind(now),
    env.DB.prepare(`UPDATE outbox SET state='unknown',error_code='sender_interrupted',lease_token=NULL,lease_until=NULL WHERE state='sending' AND lease_until<?`).bind(now),
    env.DB.prepare(`UPDATE orders SET status='pending',error_code=NULL WHERE id IN
      (SELECT order_id FROM outbox WHERE state='leased' AND lease_until<?)`).bind(now),
    env.DB.prepare(`UPDATE outbox SET state='pending',lease_token=NULL,lease_until=NULL WHERE state='leased' AND lease_until<?`).bind(now)
  ]);
  if (env.PANCAKE_WRITE_ENABLED !== "true" || !env.PANCAKE_WRITE_API_KEY || !env.PANCAKE_SHOP_ID || !env.PANCAKE_WAREHOUSE_ID) return;
  const due = await env.DB.prepare("SELECT order_id FROM outbox WHERE state='pending' AND next_attempt_at<=? ORDER BY next_attempt_at LIMIT 1").bind(now).first<{order_id: string}>();
  if (!due) return;
  const lease = crypto.randomUUID();
  const claimed = await env.DB.prepare(`UPDATE outbox SET state='leased',lease_token=?,lease_until=?,attempts=attempts+1
    WHERE order_id=? AND state='pending' AND next_attempt_at<=? RETURNING order_id`).bind(lease, now + 60000, due.order_id, now).first();
  if (!claimed) return;
  const order = await env.DB.prepare("SELECT * FROM orders WHERE id=?").bind(due.order_id).first<OrderRow>();
  if (!order) return;
  if (order.shop_id !== env.PANCAKE_SHOP_ID || order.warehouse_id !== env.PANCAKE_WAREHOUSE_ID) {
    await finish(env, order.id, lease, "manual", "manual", "shop_or_warehouse_mismatch"); return;
  }
  let payload: string;
  try { payload = pancakePayload(order); } catch { await finish(env, order.id, lease, "manual", "manual", "invalid_order_snapshot"); return; }
  const claimedAt = Date.now();
  const marked = await env.DB.batch([
    env.DB.prepare(`UPDATE orders SET status='sending' WHERE id=? AND EXISTS
      (SELECT 1 FROM outbox WHERE order_id=? AND state='leased' AND lease_token=? AND lease_until>?)`).bind(order.id, order.id, lease, claimedAt),
    env.DB.prepare(`UPDATE outbox SET state='sending' WHERE order_id=? AND state='leased' AND lease_token=? AND lease_until>? RETURNING order_id`).bind(order.id, lease, claimedAt)
  ]);
  if (!marked[1].results.length) return;
  const url = new URL(`https://pos.pages.fm/api/v1/shops/${encodeURIComponent(order.shop_id)}/orders`);
  url.searchParams.set("api_key", env.PANCAKE_WRITE_API_KEY);
  try {
    const response = await transport(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload,
      redirect: "manual", signal: AbortSignal.timeout(20000) });
    // Never follow redirects carrying order data or credentials to another destination.
    if (response.status >= 300 && response.status < 400) {
      await finish(env, order.id, lease, "unknown", "unknown", "create_redirect_unconfirmed"); return;
    }
    // The API has no documented create idempotency. Any non-confirmation needs reconciliation, including 5xx/429.
    const value = await response.json() as Record<string, unknown>;
    const data = value.data && typeof value.data === "object" ? value.data as Record<string, unknown> : value;
    if (!response.ok || value.success === false || (typeof data.id === "number" && !Number.isSafeInteger(data.id)) || !["string", "number"].includes(typeof data.id) || !/^\d+$/.test(String(data.id)) || String(data.shop_id) !== order.shop_id || data.custom_id !== order.id) {
      await finish(env, order.id, lease, "unknown", "unknown", "create_not_confirmed"); return;
    }
    await finish(env, order.id, lease, "done", "synced", null, String(data.id));
  } catch {
    await finish(env, order.id, lease, "unknown", "unknown", "create_result_unknown");
  }
}
