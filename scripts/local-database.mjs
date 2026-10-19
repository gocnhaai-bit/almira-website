import { cp, mkdir, readdir, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import net from "node:net";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const state = path.join(root, ".wrangler/state");
const command = process.argv[2];
if (!["backup", "migrate"].includes(command)) throw new Error("Use backup or migrate");
const serverRunning = await new Promise(resolve => {
  const socket = net.connect({ host: "127.0.0.1", port: 8787 });
  socket.once("connect", () => { socket.destroy(); resolve(true); });
  socket.once("error", () => resolve(false));
});
if (serverRunning) throw new Error("Stop the local server on port 8787 before backup or migration.");
let exists = false;
try { exists = (await stat(state)).isDirectory() && (await readdir(state)).length > 0; } catch (error) { if (error.code !== "ENOENT") throw error; }
if (exists) {
  const destination = path.join(root, "backups", new Date().toISOString().replaceAll(":", "-"));
  await mkdir(destination, { recursive: true });
  await cp(state, path.join(destination, "state"), { recursive: true });
  console.log("Local database state backed up. Stop the local server before backup/migration for a consistent copy.");
} else console.log("No existing local database state to back up.");
if (command === "migrate") {
  const result = spawnSync(path.join(root, "node_modules/.bin/wrangler"), ["d1", "migrations", "apply", "DB", "--local"], { cwd: root, stdio: "inherit" });
  process.exitCode = result.status ?? 1;
}
