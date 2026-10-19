PRAGMA foreign_keys = ON;

CREATE TABLE catalog_snapshots (
  id TEXT PRIMARY KEY, shop_id TEXT NOT NULL, created_at INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('staging','active','retired','failed'))
);
CREATE TABLE catalog_products (
  snapshot_id TEXT NOT NULL REFERENCES catalog_snapshots(id),
  product_id TEXT NOT NULL, payload TEXT NOT NULL CHECK (json_valid(payload)),
  PRIMARY KEY (snapshot_id, product_id)
);
CREATE TABLE catalog_state (
  id INTEGER PRIMARY KEY CHECK (id = 1), active_snapshot_id TEXT REFERENCES catalog_snapshots(id),
  last_successful_sync_at INTEGER, last_error TEXT,
  lease_token TEXT, lease_until INTEGER, next_page INTEGER NOT NULL DEFAULT 1,
  total_pages INTEGER, total_entries INTEGER, received_entries INTEGER NOT NULL DEFAULT 0,
  staging_snapshot_id TEXT REFERENCES catalog_snapshots(id), next_sync_at INTEGER NOT NULL DEFAULT 0
);
INSERT INTO catalog_state(id) VALUES (1);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE, payload_hash TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('received','pending','sending','synced','retryable','unknown','manual')),
  shop_id TEXT NOT NULL, warehouse_id TEXT NOT NULL,
  customer_json TEXT CHECK (customer_json IS NULL OR json_valid(customer_json)),
  quote_json TEXT NOT NULL CHECK (json_valid(quote_json)),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bank','paypal')),
  total TEXT NOT NULL CHECK (total NOT GLOB '*[^0-9.]*' AND total GLOB '[0-9]*.[0-9][0-9]'),
  deposit TEXT NOT NULL CHECK (deposit NOT GLOB '*[^0-9.]*' AND deposit GLOB '[0-9]*.[0-9][0-9]'),
  remaining TEXT NOT NULL CHECK (remaining NOT GLOB '*[^0-9.]*' AND remaining GLOB '[0-9]*.[0-9][0-9]'),
  created_at INTEGER NOT NULL, pancake_order_id TEXT, error_code TEXT
);
CREATE INDEX orders_status ON orders(status, created_at);
CREATE UNIQUE INDEX orders_pancake_id ON orders(shop_id,pancake_order_id) WHERE pancake_order_id IS NOT NULL;
CREATE TABLE outbox (
  order_id TEXT PRIMARY KEY REFERENCES orders(id),
  state TEXT NOT NULL CHECK (state IN ('pending','leased','sending','done','unknown','manual')),
  lease_token TEXT, lease_until INTEGER, attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL, error_code TEXT
);
CREATE INDEX outbox_due ON outbox(state,next_attempt_at);
CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY, window_start INTEGER NOT NULL, hits INTEGER NOT NULL
);
CREATE TABLE admin_audit (
  id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id),
  action TEXT NOT NULL, created_at INTEGER NOT NULL
);
