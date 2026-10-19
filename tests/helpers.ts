import { env } from "cloudflare:test";
import type { Env, Product } from "../worker/types";

export function testEnv(): Env {
  return { ...env, ENVIRONMENT: "local", CHECKOUT_ENABLED: "true", PANCAKE_WRITE_ENABLED: "true", PANCAKE_READ_ENABLED: "false",
    PANCAKE_SHOP_ID: "123", PANCAKE_WAREHOUSE_ID: "warehouse-test", PANCAKE_WRITE_API_KEY: "synthetic-local-only",
    ORDER_TOKEN_SECRET: "synthetic-local-token-secret-at-least-32-characters", ADMIN_TOKEN: "synthetic-local-admin-secret-at-least-32-characters", CATALOG_MAX_AGE_SECONDS: "3600" } as unknown as Env;
}
export const product: Product = {
  id: "product-test", name: "Test dress", nameEn: "Test dress", brand: "TEST", cat: "dam", price: "100001.00", was: null,
  img: "https://example.com/dress.webp", images: ["https://example.com/dress.webp"], tag: "", isNew: false,
  colors: [["Trắng", "#ffffff", "White"]], sizes: ["M"], desc: "", descEn: "",
  variations: [{ id: "variation-test", productId: "product-test", shopId: "123", size: "M", color: "Trắng", price: "100001.00" }]
};
export async function seed(env: Env) {
  const id = "snapshot-test"; const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO catalog_snapshots(id,shop_id,created_at,status) VALUES (?,?,?,'active')").bind(id, "123", now),
    env.DB.prepare("INSERT INTO catalog_products VALUES (?,?,?)").bind(id, product.id, JSON.stringify(product)),
    env.DB.prepare("UPDATE catalog_state SET active_snapshot_id=?,last_successful_sync_at=? WHERE id=1").bind(id, now)
  ]);
  return { snapshotId: id, items: [{ productId: product.id, variationId: "variation-test", quantity: 1 }] };
}
export const customer = { name: "Synthetic Customer", phone: "0900000000", address: "Synthetic local test address", note: "" };
