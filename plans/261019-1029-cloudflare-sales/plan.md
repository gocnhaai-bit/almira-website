---
title: Cloudflare sales local implementation
status: completed
priority: P1
effort: large
branch: feat/cloudflare-sales
tags: [cloudflare, checkout, pancake]
created: 2026-10-19
---
# Cloudflare sales implementation

Scope completed: approved local implementation of [requirements](../../docs/prompt-1.md). Live credentials, infrastructure, DNS, real Pancake orders and production activation remain separately gated, not delivered or verified.

## Acceptance evidence
- Bilingual/mobile storefront and sparse variation selection verified in local browser; preserved existing hash routes, focus and reduced-motion path.
- Allowlisted Static Assets build and same-origin Worker API; staging uses separate placeholder D1 binding with all live/checkout gates off.
- Atomic valid catalog snapshots, freshness and sanitized errors; failed last page retains published version.
- Exact decimal-string server pricing, durable order + outbox, idempotency and lease recovery tested in local Workers/D1 runtime.
- Ambiguous sends quarantined, not blindly retried; private status and admin reconciliation verified with synthetic transport.
- Typecheck, 26 tests, bootstrap check, build, staging dry-run, dependency audit and independent read-only reviews completed. See [verification](../reports/implementation-261019-1055-cloudflare-sales.md).

## Progress
- [x] Read repository and official API/runtime contracts; reviewed plan approved.
- [x] Add Worker/D1 schema, package/tooling, isolated config and safe local backup/migration.
- [x] Implement order intake, pricing, dispatcher, authentication and private status API.
- [x] Integrate bounded catalog sync and tests.
- [x] Integrate frontend bootstrap/variant/checkout changes.
- [x] Run complete tests/build/browser checks and independent review.
- [x] Reconcile docs and report evidence versus live gates.

No separate phase files exist; all plan items reconciled here. AgentKit `ak` binary unavailable, so status updated directly rather than via CLI.

## Decisions
D1 outbox + Cron, no Queues/R2/Hono or frontend rewrite. Credential-enabled create remains disabled until separately approved. Pancake `custom_id` is a reference, not a proven idempotency guarantee. Official product-list route is variations; legacy GET products is not relied upon.

Operating authority: [docs/operations.md](../../docs/operations.md). Executable owners: `worker/`, `migrations/`, `scripts/build.mjs`, `wrangler.jsonc`.

## Remaining live gates
Approve resources/cost, real credential scopes/shop/warehouse, staging integration and measured CPU budget, controlled real-order validation, PII retention policy, origin/DNS cutover and production enablement separately. No production readiness claim from local test success.
