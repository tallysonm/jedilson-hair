import fs from "node:fs";
import path from "node:path";

const userAgent = process.env.npm_config_user_agent || "";

console.log("User Agent:", userAgent);

if (userAgent && !userAgent.includes("pnpm")) {
console.error("Use pnpm instead.");
process.exit(1);
}

for (const file of ["package-lock.json", "yarn.lock"]) {
const filePath = path.resolve(process.cwd(), file);

if (fs.existsSync(filePath)) {
fs.unlinkSync(filePath);
}
}
