const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const envFile = path.join(root, ".env");

if (!fs.existsSync(envFile)) {
  console.log("⏭  Root .env not found – skipping copy");
  process.exit(0);
}

const targets = ["apps/mobile/.env", "services/ai-worker/.env"];

for (const rel of targets) {
  const dest = path.join(root, rel);
  const dir = path.dirname(dest);

  if (!fs.existsSync(dir)) continue;

  fs.copyFileSync(envFile, dest);
  console.log(`✔  ${rel} copied from root .env`);
}
