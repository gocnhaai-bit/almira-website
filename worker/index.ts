import type { Env } from "./types";
import { readCatalog, syncCatalogStep } from "./catalog";
import { acceptOrder, createQuote, orderStatus } from "./orders";
import { dispatchOrders } from "./pancake";
import { adminOrder, purgeCustomer, reconcileOrder, retryOrder } from "./admin";
import { admin, ApiError, body, checkoutEnabled, json, rateLimit, sameOrigin } from "./security";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (!path.startsWith("/api/")) return env.ASSETS.fetch(request);
    try {
      if (path === "/api/catalog" && request.method === "GET") return json({ ...await readCatalog(env), checkoutEnabled: checkoutEnabled(env) });
      if (path.startsWith("/api/admin/")) {
        await admin(request, env); await rateLimit(request, env, "admin", 20);
        if (path === "/api/admin/sync" && request.method === "POST") {
          await syncCatalogStep(env); return json({ accepted: true });
        }
        const match = path.match(/^\/api\/admin\/orders\/([a-f0-9-]{36})(?:\/(retry|reconcile|purge-customer))?$/);
        if (match) {
          if (!match[2] && request.method === "GET") return json(await adminOrder(env, match[1]));
          if (request.method === "POST" && match[2] === "retry") return json(await retryOrder(env, match[1]));
          if (request.method === "POST" && match[2] === "reconcile") return json(await reconcileOrder(env, match[1], await body(request)));
          if (request.method === "POST" && match[2] === "purge-customer") return json(await purgeCustomer(env, match[1]));
        }
        throw new ApiError(404, "not_found");
      }
      if (request.method !== "POST" || !["/api/quote", "/api/orders", "/api/orders/status"].includes(path)) throw new ApiError(404, "not_found");
      sameOrigin(request);
      await rateLimit(request, env, path, path === "/api/orders/status" ? 20 : 10);
      const input = await body(request);
      if (path === "/api/quote") return json(await createQuote(env, input));
      if (path === "/api/orders/status") return json(await orderStatus(env, input.token));
      const order = await acceptOrder(env, input, request.headers.get("Idempotency-Key"));
      ctx.waitUntil(dispatchOrders(env).catch(() => {}));
      return json(order, 202);
    } catch (error) {
      if (error instanceof ApiError) return json({ error: error.code }, error.status);
      // Raw upstream/database errors can contain URLs, credentials or customer data.
      return json({ error: "service_unavailable" }, 503);
    }
  },
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(syncCatalogStep(env).catch(() => {}));
    ctx.waitUntil(dispatchOrders(env).catch(() => {}));
    ctx.waitUntil(env.DB.prepare("DELETE FROM rate_limits WHERE window_start<?").bind(Date.now() - 86400000).run().then(() => {}).catch(() => {}));
  }
} satisfies ExportedHandler<Env>;
