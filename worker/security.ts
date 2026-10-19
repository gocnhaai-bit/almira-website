import type { Env } from "./types";

export class ApiError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}
export function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: {
    "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer"
  } });
}
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ApiError(400, "invalid_request");
  return value as Record<string, unknown>;
}
export function text(value: unknown, max: number, optional = false): string {
  if (typeof value !== "string" || value.length > max || (!optional && !value.trim()) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new ApiError(400, "invalid_request");
  return value.trim();
}
export async function body(request: Request) {
  if (request.headers.get("Content-Type")?.split(";")[0] !== "application/json") throw new ApiError(415, "json_required");
  if (!request.body || Number(request.headers.get("Content-Length") || 0) > 65536) throw new ApiError(413, "body_too_large");
  const reader = request.body.getReader(); let size = 0; const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > 65536) { await reader.cancel(); throw new ApiError(413, "body_too_large"); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return object(JSON.parse(new TextDecoder().decode(bytes))); } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "invalid_json");
  }
}
export function sameOrigin(request: Request) {
  if (request.headers.get("Origin") !== new URL(request.url).origin || request.headers.get("Sec-Fetch-Site") === "cross-site") throw new ApiError(403, "origin_denied");
}
export async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}
export async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map(b => b.toString(16).padStart(2, "0")).join("");
}
export async function equalSecret(a: string, b: string) { return await hash(a) === await hash(b); }
export async function admin(request: Request, env: Env) {
  const value = request.headers.get("Authorization") || "";
  if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 32 || !await equalSecret(value, `Bearer ${env.ADMIN_TOKEN}`)) throw new ApiError(401, "unauthorized");
}
export async function rateLimit(request: Request, env: Env, scope: string, limit: number, now = Date.now()) {
  if (!Number.isFinite(now)) throw new ApiError(503, "protection_unavailable");
  const ip = request.headers.get("CF-Connecting-IP") || (env.ENVIRONMENT === "local" ? "local" : "");
  if (!ip || !env.ORDER_TOKEN_SECRET) throw new ApiError(503, "protection_unavailable");
  const key = `${scope}:${await hmac(env.ORDER_TOKEN_SECRET, ip)}`;
  const start = Math.floor(now / 60000) * 60000;
  const row = await env.DB.prepare(`INSERT INTO rate_limits(key,window_start,hits) VALUES (?,?,1)
    ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN window_start=excluded.window_start THEN hits+1 ELSE 1 END,
    window_start=excluded.window_start RETURNING hits`).bind(key, start).first<{ hits: number }>();
  if (!row || row.hits > limit) throw new ApiError(429, "rate_limited");
}
export function catalogMaxAge(env: Env) {
  const seconds = Number(env.CATALOG_MAX_AGE_SECONDS);
  if (!Number.isFinite(seconds) || seconds < 1 || seconds > 86400) throw new ApiError(503, "invalid_catalog_policy");
  return seconds * 1000;
}
export function checkoutEnabled(env: Env) {
  return env.CHECKOUT_ENABLED === "true" && env.PANCAKE_WRITE_ENABLED === "true" &&
    /^\d+$/.test(env.PANCAKE_SHOP_ID || "") && !!env.PANCAKE_WAREHOUSE_ID && !!env.PANCAKE_WRITE_API_KEY && (env.ORDER_TOKEN_SECRET?.length || 0) >= 32;
}
