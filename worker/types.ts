export interface Variation {
  id: string; productId: string; shopId: string; size: string; color: string; price: string;
}
export interface Product {
  id: string; name: string; nameEn: string; brand: string; cat: string;
  price: string; was: string | null; img: string; images: string[];
  tag: string; isNew: boolean; colors: [string, string, string][]; sizes: string[];
  desc: string; descEn: string; variations: Variation[];
}
export interface Env {
  DB: D1Database; ASSETS: Fetcher;
  ENVIRONMENT: string; CHECKOUT_ENABLED: string;
  PANCAKE_READ_ENABLED: string; PANCAKE_WRITE_ENABLED: string;
  CATALOG_MAX_AGE_SECONDS: string;
  PANCAKE_SHOP_ID?: string; PANCAKE_WAREHOUSE_ID?: string;
  PANCAKE_READ_API_KEY?: string; PANCAKE_WRITE_API_KEY?: string;
  ORDER_TOKEN_SECRET?: string; ADMIN_TOKEN?: string;
  CHECKOUT_TRIAL_ENABLED?: string; CHECKOUT_TRIAL_SECRET?: string;
}
export interface QuoteItem {
  productId: string; variationId: string; quantity: number;
  name: string; size: string; color: string; unitPrice: string; lineTotal: string;
}
export interface Quote {
  snapshotId: string; shopId: string; expiresAt: number;
  items: QuoteItem[]; total: string; deposit: string; remaining: string;
  shipping: "unconfirmed";
}
export interface OrderRow {
  id: string; idempotency_key: string; payload_hash: string; token_hash: string;
  status: string; shop_id: string; warehouse_id: string;
  customer_json: string | null; quote_json: string; payment_method: string;
  total: string; deposit: string; remaining: string; created_at: number;
  pancake_order_id: string | null; error_code: string | null;
}
