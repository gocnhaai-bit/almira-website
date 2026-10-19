import type { OrderRow } from "./types";

// POS has returned both numeric IDs and UUIDs in production. system_id is
// a separate display number and must never replace the API ID.
export function pancakeOrderId(value: unknown): string | null {
  if (typeof value === "number") return Number.isSafeInteger(value) && value > 0 ? String(value) : null;
  if (typeof value !== "string") return null;
  return /^(?:[1-9]\d{0,29}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/.test(value) ? value : null;
}

export function confirmedPancakeId(value: unknown, order: OrderRow): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const envelope = value as Record<string, unknown>;
  if (envelope.success === false) return null;
  const raw = envelope.data === undefined ? envelope : envelope.data;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const data = raw as Record<string, unknown>;
  const id = pancakeOrderId(data.id);
  if (!id || data.success === false || String(data.shop_id) !== order.shop_id) return null;
  // Some POS responses use the website UUID as id and omit custom_id.
  // Never infer identity from a note substring or the shop/display number alone.
  const hasReference = data.custom_id !== undefined && data.custom_id !== null && data.custom_id !== "";
  if (hasReference) return data.custom_id === order.id ? id : null;
  return id === order.id ? id : null;
}
