import { execSync } from "node:child_process";
import { cpSync, rmSync, existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
console.log("[build] cwd:", ROOT);

function run(cmd) {
  console.log("[build] $", cmd);
  execSync(cmd, { stdio: "inherit", cwd: ROOT });
}

// 1. Install dependencies
run("pnpm install");

// 2. Build frontend
run("pnpm --filter @workspace/barbershop run build");

// 3. Find where Vite put the output (search for index.html)
const candidates = [
  resolve(ROOT, "artifacts/barbershop/dist"),
  resolve(ROOT, "artifacts/api-server/dist"),
  resolve(ROOT, "dist"),
];

let src = null;
for (const c of candidates) {
  if (existsSync(`${c}/index.html`)) {
    console.log("[build] Found dist at:", c);
    src = c;
    break;
  }
}

if (!src) {
  // List all dirs to help debug
  console.error("[build] ERROR: Could not find index.html. Checking artifacts/:");
  try { console.error(readdirSync(resolve(ROOT, "artifacts"))); } catch {}
  process.exit(1);
}

// 4. Copy to root dist/
const dest = resolve(ROOT, "dist");
if (src !== dest) {
  rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, { recursive: true });
  console.log("[build] Copied to", dest);
}

console.log("[build] dist/ contents:", readdirSync(dest));
