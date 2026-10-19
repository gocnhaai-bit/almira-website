import type { Env, OrderRow } from "./types";
import { ApiError, object, text } from "./security";

export async function adminOrder(env: Env, id: string) {
  const order = await env.DB.prepare("SELECT * FROM orders WHERE id=?").bind(id).first<OrderRow>();
  if (!order) throw new ApiError(404, "order_not_found");
  return { websiteOrderId: order.id, status: order.status, pancakeOrderId: order.pancake_order_id, error: order.error_code,
    createdAt: new Date(order.created_at).toISOString(), total: order.total };
}
export async function retryOrder(env: Env, id: string) {
  const result = await env.DB.batch([
    env.DB.prepare(`UPDATE outbox SET state='pending',next_attempt_at=?,error_code=NULL WHERE order_id=? AND state='pending'
      AND EXISTS(SELECT 1 FROM orders WHERE id=? AND status IN ('pending','retryable')) RETURNING order_id`).bind(Date.now(), id, id),
    env.DB.prepare(`UPDATE orders SET status='pending',error_code=NULL WHERE id=? AND status IN ('pending','retryable')`).bind(id)
  ]);
  if (!result[0].results.length) throw new ApiError(409, "unsafe_to_retry");
  return { websiteOrderId: id, status: "pending" };
}
export async function reconcileOrder(env: Env, id: string, input: Record<string, unknown>, transport: typeof fetch = fetch) {
  const order = await env.DB.prepare("SELECT * FROM orders WHERE id=?").bind(id).first<OrderRow>();
  if (!order || !["unknown", "manual"].includes(order.status)) throw new ApiError(409, "not_reconcilable");
  const pancakeId = text(input.pancakeOrderId, 30);
  if (!/^\d+$/.test(pancakeId) || order.shop_id !== env.PANCAKE_SHOP_ID || env.PANCAKE_READ_ENABLED !== "true" || !env.PANCAKE_READ_API_KEY) throw new ApiError(409, "reconciliation_unavailable");
  const url = new URL(`https://pos.pages.fm/api/v1/shops/${encodeURIComponent(order.shop_id)}/orders/${pancakeId}`);
  url.searchParams.set("api_key", env.PANCAKE_READ_API_KEY);
  let data: Record<string, unknown>;
  try {
    const response = await transport(url, { redirect: "error", signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error();
    const value = object(await response.json()); data = value.data ? object(value.data) : value;
    if (value.success === false) throw new Error();
  } catch { throw new ApiError(502, "reconciliation_failed"); }
  if (String(data.id) !== pancakeId || String(data.shop_id) !== order.shop_id || data.custom_id !== id) throw new ApiError(409, "reconciliation_mismatch");
  await env.DB.batch([
    env.DB.prepare("INSERT INTO admin_audit(id,order_id,action,created_at) VALUES (?,?,'reconcile',?)").bind(crypto.randomUUID(), id, Date.now()),
    env.DB.prepare("UPDATE orders SET status='synced',pancake_order_id=?,error_code=NULL WHERE id=? AND status IN ('unknown','manual')").bind(pancakeId, id),
    env.DB.prepare("UPDATE outbox SET state='done',error_code=NULL WHERE order_id=? AND state IN ('unknown','manual')").bind(id)
  ]);
  return { websiteOrderId: id, status: "synced" };
}
export async function purgeCustomer(env: Env, id: string) {
  const result = await env.DB.batch([
    env.DB.prepare("INSERT INTO admin_audit(id,order_id,action,created_at) SELECT ?,id,'purge_customer',? FROM orders WHERE id=? AND status='synced'").bind(crypto.randomUUID(), Date.now(), id),
    env.DB.prepare("UPDATE orders SET customer_json=NULL WHERE id=? AND status='synced' RETURNING id").bind(id)
  ]);
  if (!result[1].results.length) throw new ApiError(409, "order_not_terminal");
  return { websiteOrderId: id, customerDeleted: true };
}
