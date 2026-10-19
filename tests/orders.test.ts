import { describe, it, expect, vi } from "vitest";
import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import worker from "../worker/index";
import { acceptOrder, createQuote, orderStatus } from "../worker/orders";
import { dispatchOrders, pancakePayload } from "../worker/pancake";
import { retryOrder, reconcileOrder } from "../worker/admin";
import { integerVnd, money, totals } from "../worker/money";
import { customer, product, seed, testEnv } from "./helpers";
import type { OrderRow } from "../worker/types";

async function accepted() {
  const env = testEnv(); const input = await seed(env); const quote = await createQuote(env, input);
  const payload = { quoteId: quote.quoteId, customer, paymentMethod: "bank" };
  const key = crypto.randomUUID(); const order = await acceptOrder(env, payload, key);
  return { env, input, quote, payload, key, order };
}
const fake = (fn: (...args: any[]) => any) => vi.fn(fn) as unknown as typeof fetch;

describe("exact money", () => {
  it("keeps decimal arithmetic exact and rejects malformed amounts", () => {
    expect(totals([{ unitPrice: "0.10", quantity: 3 }])).toEqual({ total: "0.30", deposit: "0.15", remaining: "0.15" });
    expect(totals([{ unitPrice: "100001.00", quantity: 1 }]).deposit).toBe("50000.50");
    expect(integerVnd("100001.00")).toBe("100001");
    expect(() => integerVnd("0.10")).toThrow();
    for (const bad of [1, "-1", "1e2", "NaN", "01.00", "1.001"]) expect(() => money(bad)).toThrow();
  });
});
describe("durable checkout", () => {
  it("stores order and outbox, replays after expiry/gate closure, conflicts on changed payload", async () => {
    const { env, payload, key, order } = await accepted();
    expect(order.total).toBe("100001.00");
    expect(await env.DB.prepare("SELECT count(*) n FROM outbox").first("n")).toBe(1);
    env.CHECKOUT_ENABLED = "false";
    expect(await acceptOrder(env, payload, key, Date.now() + 86400000)).toEqual(order);
    await expect(acceptOrder(env, { ...payload, customer: { ...customer, name: "Different" } }, key)).rejects.toMatchObject({ code: "idempotency_conflict" });
    const status = await orderStatus(env, order.statusToken);
    expect(status).not.toHaveProperty("customer"); expect(status).not.toHaveProperty("statusToken");
    await expect(orderStatus(env, "0".repeat(64))).rejects.toMatchObject({ code: "order_not_found" });
  });
  it("ignores forged client totals and refuses new intake while gated", async () => {
    const env = testEnv(); const quote = await createQuote(env, await seed(env));
    const payload = { quoteId: quote.quoteId, customer, paymentMethod: "bank", total: "0.01", paid: true };
    env.CHECKOUT_ENABLED = "false";
    await expect(acceptOrder(env, payload, crypto.randomUUID())).rejects.toMatchObject({ code: "checkout_unavailable" });
    env.CHECKOUT_ENABLED = "true";
    const receipt = await acceptOrder(env, payload, crypto.randomUUID());
    expect(receipt.total).toBe("100001.00"); expect(receipt).not.toHaveProperty("paid");
  });
  it("accepts concurrent duplicate requests once", async () => {
    const env = testEnv(); const quote = await createQuote(env, await seed(env));
    const key = crypto.randomUUID(); const payload = { quoteId: quote.quoteId, customer, paymentMethod: "bank" };
    const result = await Promise.all(Array.from({ length: 5 }, () => acceptOrder(env, payload, key)));
    expect(new Set(result.map(x => x.websiteOrderId)).size).toBe(1);
    expect(await env.DB.prepare("SELECT count(*) n FROM orders").first("n")).toBe(1);
    expect(await env.DB.prepare("SELECT count(*) n FROM outbox").first("n")).toBe(1);
  });
  it("rolls back order insert when outbox insertion fails", async () => {
    const env = testEnv(); const quote = await createQuote(env, await seed(env));
    await env.DB.exec("CREATE TRIGGER reject_job BEFORE INSERT ON outbox BEGIN SELECT RAISE(ABORT, 'synthetic_failure'); END;");
    await expect(acceptOrder(env, { quoteId: quote.quoteId, customer, paymentMethod: "bank" }, crypto.randomUUID())).rejects.toThrow();
    expect(await env.DB.prepare("SELECT count(*) n FROM orders").first("n")).toBe(0);
  });
  it("rejects direct mutation of the immutable accepted price snapshot", async () => {
    const { env } = await accepted();
    await expect(env.DB.prepare("UPDATE orders SET total='1.00'").run()).rejects.toThrow("immutable_order_snapshot");
  });
  it("fails closed on stale catalog, changed snapshot, invalid variation/shop and tampered quote", async () => {
    const env = testEnv(); const input = await seed(env); const quote = await createQuote(env, input);
    await expect(createQuote(env, { ...input, snapshotId: "different" })).rejects.toMatchObject({ code: "catalog_changed" });
    await expect(createQuote(env, { ...input, items: [{ productId: product.id, variationId: "wrong", quantity: 1 }] })).rejects.toMatchObject({ code: "variation_unavailable" });
    env.PANCAKE_SHOP_ID = "456";
    await expect(createQuote(env, input)).rejects.toMatchObject({ code: "variation_unavailable" }); env.PANCAKE_SHOP_ID = "123";
    await expect(acceptOrder(env, { quoteId: quote.quoteId + "x", customer, paymentMethod: "bank" }, crypto.randomUUID())).rejects.toMatchObject({ code: "invalid_quote" });
    const changed = structuredClone(product); changed.variations[0].price = "200000.00";
    await env.DB.prepare("UPDATE catalog_products SET payload=?").bind(JSON.stringify(changed)).run();
    await expect(acceptOrder(env, { quoteId: quote.quoteId, customer, paymentMethod: "bank" }, crypto.randomUUID())).rejects.toMatchObject({ code: "price_changed" });
    await env.DB.prepare("UPDATE catalog_state SET last_successful_sync_at=1").run();
    await expect(createQuote(env, input)).rejects.toMatchObject({ code: "catalog_stale" });
  });
});
describe("Pancake outbox", () => {
  it("dispatches a single concurrent send and verifies confirmation identity", async () => {
    const { env, order } = await accepted();
    const transport = fake(async (_url: unknown, init: RequestInit) => {
      const request = new Request(String(_url), init);
      expect(request.redirect).toBe("manual");
      const payload = JSON.parse(init.body as string);
      expect(payload.custom_id).toBe(order.websiteOrderId); expect(payload.status).toBe(0);
      expect(payload).not.toHaveProperty("prepaid"); expect(payload).not.toHaveProperty("partner");
      expect(payload.items[0].variation_info.retail_price).toBe(100001);
      return Response.json({ id: 321, shop_id: 123, custom_id: order.websiteOrderId });
    });
    await Promise.all([dispatchOrders(env, transport), dispatchOrders(env, transport)]);
    expect(transport).toHaveBeenCalledTimes(1);
    expect((await orderStatus(env, order.statusToken)).status).toBe("synced");
  });
  it("requires exact response shop/reference before declaring synced", async () => {
    const { env, order } = await accepted();
    await dispatchOrders(env, fake(async () => Response.json({ id: 321, shop_id: 456, custom_id: order.websiteOrderId })));
    expect((await orderStatus(env, order.statusToken)).status).toBe("unknown");
  });
  it("does not retry rate-limit or server-error responses without documented non-creation proof", async () => {
    const { env, order } = await accepted();
    const transport = fake(async () => Response.json({ success: false }, { status: 429 }));
    await dispatchOrders(env, transport); await dispatchOrders(env, transport, Date.now() + 600000);
    expect(transport).toHaveBeenCalledTimes(1);
    expect((await orderStatus(env, order.statusToken)).status).toBe("unknown");
  });
  it("keeps ambiguous timeout unknown and never blindly retries", async () => {
    const { env, order } = await accepted(); const transport = fake(async () => { throw new Error("synthetic timeout with secret must not leak"); });
    await dispatchOrders(env, transport); await dispatchOrders(env, transport, Date.now() + 120000);
    expect(transport).toHaveBeenCalledTimes(1);
    expect((await orderStatus(env, order.statusToken)).status).toBe("unknown");
    await expect(retryOrder(env, order.websiteOrderId)).rejects.toMatchObject({ code: "unsafe_to_retry" });
    await expect(reconcileOrder({ ...env, PANCAKE_READ_ENABLED: "true", PANCAKE_READ_API_KEY: "synthetic" }, order.websiteOrderId, { pancakeOrderId: "321" }, fake(async () => Response.json({ id: 321, shop_id: 123, custom_id: "wrong" })))).rejects.toMatchObject({ code: "reconciliation_mismatch" });
  });
  it("recovers unsent leases but quarantines interrupted senders", async () => {
    const { env, order } = await accepted();
    await env.DB.prepare("UPDATE outbox SET state='sending',lease_token='old',lease_until=1").run();
    const transport = fake(async () => { throw new Error(); }); await dispatchOrders(env, transport);
    expect(transport).not.toHaveBeenCalled(); expect((await orderStatus(env, order.statusToken)).status).toBe("unknown");
  });
  it("reconciles unknown only with a verified shop/reference and can purge receiver PII", async () => {
    const { env, order } = await accepted();
    await dispatchOrders(env, fake(async () => { throw new Error("timeout"); }));
    const { purgeCustomer } = await import("../worker/admin");
    await expect(purgeCustomer(env, order.websiteOrderId)).rejects.toMatchObject({ code: "order_not_terminal" });
    const result = await reconcileOrder({ ...env, PANCAKE_READ_ENABLED: "true", PANCAKE_READ_API_KEY: "synthetic" }, order.websiteOrderId,
      { pancakeOrderId: "323" }, fake(async () => Response.json({ id: 323, shop_id: 123, custom_id: order.websiteOrderId })));
    expect(result.status).toBe("synced");
    await purgeCustomer(env, order.websiteOrderId);
    expect(await env.DB.prepare("SELECT customer_json FROM orders WHERE id=?").bind(order.websiteOrderId).first("customer_json")).toBeNull();
    expect((await orderStatus(env, order.statusToken)).total).toBe("100001.00");
  });
  it("recovers an expired pre-send lease without losing the durable job", async () => {
    const { env, order } = await accepted();
    await env.DB.prepare("UPDATE outbox SET state='leased',lease_token='old',lease_until=1").run();
    const transport = fake(async () => Response.json({ id: 322, shop_id: 123, custom_id: order.websiteOrderId }));
    await dispatchOrders(env, transport);
    expect(transport).toHaveBeenCalledTimes(1);
    expect((await orderStatus(env, order.statusToken)).status).toBe("synced");
  });
  it("never sends to a mismatched shop and retains exact numeric serialization", async () => {
    const { env, order } = await accepted(); const transport = fake(async () => Response.json({}));
    env.PANCAKE_SHOP_ID = "456"; await dispatchOrders(env, transport);
    expect(transport).not.toHaveBeenCalled(); expect((await orderStatus(env, order.statusToken)).status).toBe("manual");
    const row = await env.DB.prepare("SELECT * FROM orders").first<OrderRow>();
    expect(pancakePayload(row!)).toContain('"retail_price":100001');
  });
});
describe("API safety", () => {
  it("blocks cross-origin, oversized JSON, unauthenticated admin and unknown API fallback", async () => {
    const env = testEnv(); const ctx = createExecutionContext();
    const call = (path: string, init: RequestInit = {}) => worker.fetch(new Request(`https://almira.test${path}`, init), env, ctx);
    expect((await call("/api/orders", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://evil.test" }, body: "{}" })).status).toBe(403);
    expect((await call("/api/quote", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://almira.test" }, body: JSON.stringify({ text: "x".repeat(66000) }) })).status).toBe(413);
    expect((await call("/api/admin/sync", { method: "POST" })).status).toBe(401);
    const missing = await call("/api/not-found"); expect(missing.status).toBe(404); expect(missing.headers.get("Cache-Control")).toBe("no-store");
    await waitOnExecutionContext(ctx);
  });
  it("rate-limits status guessing without exposing customer data", async () => {
    const env = testEnv(); const ctx = createExecutionContext(); let result: Response;
    for (let i = 0; i < 21; i++) result = await worker.fetch(new Request("https://almira.test/api/orders/status", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://almira.test" }, body: JSON.stringify({ token: "0".repeat(64) }) }), env, ctx);
    expect(result!.status).toBe(429); expect(await result!.json()).toEqual({ error: "rate_limited" });
  });
});
