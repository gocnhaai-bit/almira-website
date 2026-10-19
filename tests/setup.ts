import { env, applyD1Migrations } from "cloudflare:test";
import { beforeEach } from "vitest";
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
beforeEach(async () => {
  // Only the throwaway test binding is cleared; never local/staging/production state.
  await env.DB.exec("DROP TRIGGER IF EXISTS reject_job;");
  await env.DB.batch([
    env.DB.prepare("DELETE FROM admin_audit"), env.DB.prepare("DELETE FROM outbox"), env.DB.prepare("DELETE FROM orders"),
    env.DB.prepare("DELETE FROM catalog_products"), env.DB.prepare("DELETE FROM catalog_state"),
    env.DB.prepare("DELETE FROM catalog_snapshots"), env.DB.prepare("INSERT INTO catalog_state(id) VALUES (1)"),
    env.DB.prepare("DELETE FROM rate_limits")
  ]);
});
