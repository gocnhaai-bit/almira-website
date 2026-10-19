#!/usr/bin/env node
// Catalog synchronization now runs in worker/catalog.ts against D1, never writes source files.
console.error("Catalog sync moved to the Cloudflare Worker. Use the authenticated /api/admin/sync endpoint or Cron Trigger. See docs/operations.md.");
process.exitCode = 1;
