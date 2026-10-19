import { cp, mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const publicFiles = ["_headers", "index.html", "assets/almira-emblem.webp", "assets/checkout.css", "assets/checkout.js", "assets/payment-config.js", "assets/editorial.css", "assets/home.css", "assets/home.js", "assets/order-guide.css", "assets/order-guide.js", "assets/pages.js", "assets/catalog.js", "assets/shop.js", "assets/editorial/about-almira.webp", "assets/editorial/category-ao.webp", "assets/editorial/category-dam.webp", "assets/editorial/category-khoac.webp", "assets/editorial/category-set.webp"];
const dist = path.join(root, "dist");
// Refuse unknown stale output instead of deploying files outside the allowlist.
async function walk(dir, prefix = "") {
  let entries; try { entries = await readdir(dir, { withFileTypes: true }); } catch (error) { if (error.code === "ENOENT") return []; throw error; }
  const result = [];
  for (const entry of entries) result.push(...(entry.isDirectory() ? await walk(path.join(dir, entry.name), prefix + entry.name + "/") : [prefix + entry.name]));
  return result;
}
for (const file of await walk(dist)) if (!publicFiles.includes(file)) throw new Error(`Unexpected build output: ${file}; inspect before removing it.`);
for (const file of publicFiles) {
  const source = path.join(root, file === "_headers" ? "assets/_headers" : file); const target = path.join(dist, file);
  const content = await readFile(source);
  if (file.endsWith(".js")) new vm.Script(content.toString(), { filename: file });
  if (file === "index.html") {
    const html = content.toString();
    if (html.includes("PANCAKE_PRODUCTS_START") || /const PRODUCTS\s*=\s*\[/.test(html)) throw new Error("Embedded catalog must not be deployed");
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) if (match[1].trim()) new vm.Script(match[1], { filename: "index.html" });
  }
  await mkdir(path.dirname(target), { recursive: true }); await cp(source, target);
}
console.log(`Built ${publicFiles.length} allowlisted public files.`);
