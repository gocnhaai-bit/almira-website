import { readFile } from "node:fs/promises";
import vm from "node:vm";
import assert from "node:assert/strict";

const source = await readFile(new URL("../assets/catalog.js", import.meta.url), "utf8");
const fixture = JSON.parse(await readFile(new URL("./browser-catalog.json", import.meta.url), "utf8"));
const element = () => ({ before() {}, after() {}, append() {}, replaceChildren() {}, classList: { toggle() {} }, setAttribute() {}, addEventListener() {} });
const listeners = new Map();
const context = { console, URL, location: { origin: "https://almira.test" }, localStorage: { getItem() { return "en"; } },
  document: { createElement: element, querySelector: element, documentElement: { lang: "en" } },
  CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
  fetch: async () => ({ ok: true, json: async () => fixture }),
  window: { dispatchEvent(event) { listeners.get(event.type)?.(event); } }
};
vm.runInNewContext(source, context);
const initial = context.window.AlmiraCatalog.products;
await context.window.AlmiraCatalog.load();
assert.equal(context.window.AlmiraCatalog.products, initial, "catalog array must remain stable across asynchronous bootstrap");
assert.equal(initial[0].id, fixture.products[0].id);
assert.equal(context.window.AlmiraCatalog.snapshotId, fixture.snapshotId);
assert.equal(context.window.AlmiraCatalog.checkoutEnabled, false);
fixture.products = [];
fixture.snapshotId = null;
await context.window.AlmiraCatalog.load();
assert.equal(initial.length, 0, "refresh must update the existing array, not leave shop with stale products");
console.log("Catalog bootstrap and refresh invariants passed.");
