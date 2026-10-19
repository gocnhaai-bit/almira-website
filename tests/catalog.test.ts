import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { readCatalog, syncCatalogStep } from "../worker/catalog";
import type { Env } from "../worker/types";
import { product as savedProduct } from "./helpers";

const bindings = { ...env, PANCAKE_READ_ENABLED: "true", PANCAKE_READ_API_KEY: "synthetic-key", PANCAKE_SHOP_ID: "123", CATALOG_MAX_AGE_SECONDS: "3600" } as unknown as Env;
const product = (variationId: string, price = 125000) => ({
  id: variationId, product_id: "product-1", retail_price: price, images: ["https://content.pancake.vn/item.webp"],
  fields: [{ name: "Size", value: variationId }], product: { id: "product-1", name: "Test dress", is_published: true, image: "https://content.pancake.vn/item.webp", categories: [{ name: "Đầm" }] }
});
const response = (data: unknown[], page = 1, pages = 1, total = data.length) => new Response(JSON.stringify({ success: true, data, page_number: page, total_pages: pages, total_entries: total }), { status: 200 });
const request = (body: Response) => async (input: RequestInfo | URL) => {
  const url = new URL(String(input));
  expect(url.pathname).toBe("/api/v1/shops/123/products/variations");
  expect(url.searchParams.get("api_key")).toBe("synthetic-key");
  expect(url.searchParams.get("page_size")).toBe("90");
  return body;
};

beforeEach(async () => {
  await env.DB.prepare("DELETE FROM outbox WHERE order_id IN (SELECT id FROM orders)").run();
  await env.DB.prepare("DELETE FROM orders").run();
  await env.DB.prepare("DELETE FROM catalog_products").run();
  await env.DB.prepare("UPDATE catalog_state SET active_snapshot_id=NULL,last_successful_sync_at=NULL,last_error=NULL,lease_token=NULL,lease_until=NULL,next_page=1,total_pages=NULL,total_entries=NULL,received_entries=0,staging_snapshot_id=NULL,next_sync_at=0 WHERE id=1").run();
  await env.DB.prepare("DELETE FROM catalog_snapshots WHERE id NOT IN (SELECT active_snapshot_id FROM catalog_state WHERE active_snapshot_id IS NOT NULL) AND id NOT IN (SELECT staging_snapshot_id FROM catalog_state WHERE staging_snapshot_id IS NOT NULL)").run();
  await env.DB.prepare("INSERT OR IGNORE INTO catalog_snapshots(id,shop_id,created_at,status) VALUES('snapshot-test','123',0,'active')").run();
  await env.DB.prepare("INSERT OR REPLACE INTO catalog_products(snapshot_id,product_id,payload) VALUES('snapshot-test',?,?)").bind(savedProduct.id, JSON.stringify(savedProduct)).run();
  await env.DB.prepare("UPDATE catalog_state SET active_snapshot_id='snapshot-test',last_successful_sync_at=?,next_sync_at=0 WHERE id=1").bind(Date.now()).run();
});

describe("catalog snapshots", () => {
  it("stays disabled without explicit read enablement", async () => {
    const result = await syncCatalogStep({ ...bindings, PANCAKE_READ_ENABLED: "false" }, async () => { throw new Error("network should not run"); });
    expect(result).toEqual({ status: "disabled" });
  });

  it("maps approved fields and only activates a complete page", async () => {
    await env.DB.prepare("UPDATE catalog_state SET active_snapshot_id=NULL,last_successful_sync_at=NULL WHERE id=1").run();
    const result = await syncCatalogStep(bindings, request(response([product("v-1")])) as typeof fetch, 1_700_000_000_000);
    expect(result.status).toBe("complete");
    const catalog = await readCatalog(bindings);
    expect(catalog.products).toHaveLength(1);
    expect(catalog.products[0]).toMatchObject({ id: "product-1", cat: "dam", price: "125000.00", img: "https://content.pancake.vn/item.webp" });
    expect(catalog.products[0].variations[0]).toMatchObject({ id: "v-1", productId: "product-1", shopId: "123", size: "v-1" });
  });

  it("keeps the last good snapshot when a later page fails or counts change", async () => {
    const prior = await readCatalog(bindings);
    await syncCatalogStep(bindings, request(response([product("v-1")], 1, 2, 2)) as typeof fetch, 1_700_000_001_000);
    const failed = await syncCatalogStep(bindings, async () => { throw new Error("secret upstream failure"); }, 1_700_000_002_000);
    expect(failed.status).toBe("failed");
    expect((await readCatalog(bindings)).snapshotId).toBe(prior.snapshotId);
    expect((await readCatalog(bindings)).error).toBe("sync_failed");
  });
  it("allows a final page with only hidden variants while retaining earlier valid products", async () => {
    await syncCatalogStep(bindings, request(response([product("v-1")], 1, 2, 2)) as typeof fetch, 1_700_000_001_000);
    const hidden = { ...product("v-2"), is_hidden: true };
    const finished = await syncCatalogStep(bindings, request(response([hidden], 2, 2, 2)) as typeof fetch, 1_700_000_002_000);
    expect(finished.status).toBe("complete");
    expect((await readCatalog(bindings)).products[0].variations).toHaveLength(1);
  });
  it("never exposes internal notes, costs or supplier metadata", async () => {
    const raw = product("v-1");
    Object.assign(raw, { average_imported_price: 1, secret: "private" });
    Object.assign(raw.product, { note: "internal private note", note_product: "internal product note", supplier_product_ids: ["private"] });
    await syncCatalogStep(bindings, request(response([raw])) as typeof fetch);
    const publicData = JSON.stringify(await readCatalog(bindings));
    expect(publicData).not.toContain("private"); expect(publicData).not.toContain("note_product"); expect(publicData).not.toContain("imported_price");
  });
  it("rejects wrong-shop data and unsafe integer prices without publishing", async () => {
    const old = (await readCatalog(bindings)).snapshotId;
    const raw = { ...product("v-1"), shop_id: "456" };
    expect((await syncCatalogStep(bindings, request(response([raw])) as typeof fetch)).status).toBe("failed");
    expect((await readCatalog(bindings)).snapshotId).toBe(old);
    await env.DB.prepare("UPDATE catalog_state SET next_sync_at=0").run();
    expect((await syncCatalogStep(bindings, request(response([product("v-2", Number.MAX_SAFE_INTEGER + 1)])) as typeof fetch)).status).toBe("failed");
    expect((await readCatalog(bindings)).snapshotId).toBe(old);
  });
  it("rejects a generation when its shop changes between pages", async () => {
    const old = (await readCatalog(bindings)).snapshotId;
    await syncCatalogStep(bindings, request(response([product("v-1")], 1, 2, 2)) as typeof fetch, 1_700_000_001_000);
    const neverFetch = async () => { throw new Error("must not contact the changed shop"); };
    expect((await syncCatalogStep({ ...bindings, PANCAKE_SHOP_ID: "456" }, neverFetch, 1_700_000_002_000)).status).toBe("failed");
    expect((await readCatalog(bindings)).snapshotId).toBe(old);
  });
  it("does not allow a sender that lost its catalog lease to publish", async () => {
    const old = (await readCatalog(bindings)).snapshotId;
    const transport = async () => {
      await env.DB.prepare("UPDATE catalog_state SET lease_token='replacement',lease_until=?").bind(Date.now() + 60000).run();
      return response([product("v-1")]);
    };
    expect((await syncCatalogStep(bindings, transport as typeof fetch)).status).toBe("stale");
    expect((await readCatalog(bindings)).snapshotId).toBe(old);
  });
  it("merges a product across pages and rejects duplicate variations without replacing active data", async () => {
    const prior = await readCatalog(bindings);
    expect((await syncCatalogStep(bindings, request(response([product("v-2")], 1, 2, 2)) as typeof fetch, 1_700_000_001_000)).status).toBe("page");
    const finish = await syncCatalogStep(bindings, request(response([product("v-3")], 2, 2, 2)) as typeof fetch, 1_700_000_002_000);
    expect(finish.status).toBe("complete");
    const updated = await readCatalog(bindings);
    expect(updated.products[0].variations.map(v => v.id)).toEqual(["v-2", "v-3"]);
    expect(await env.DB.prepare("SELECT next_sync_at FROM catalog_state WHERE id=1").first("next_sync_at")).toBe(1_700_000_001_000 + 30 * 60000);
    await env.DB.prepare("UPDATE catalog_state SET next_sync_at=0").run();
    const failed = await syncCatalogStep(bindings, request(response([product("duplicate"), product("duplicate")])) as typeof fetch, 1_700_000_003_000);
    expect(failed).toEqual({ status: "failed", error: "duplicate_variation" });
    const stillActive = await readCatalog(bindings);
    expect(stillActive.snapshotId).toBe(updated.snapshotId);
    expect(stillActive.products[0].variations.map(v => v.id)).toEqual(["v-2", "v-3"]);
    expect(prior.products[0].variations).toHaveLength(1);
  });
});
