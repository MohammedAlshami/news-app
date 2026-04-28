/**
 * One-shot migration for the Cloudflare D1 version of this project.
 * Run from project root: node scripts/migrate-site-ads-tier.mjs
 */
import { execFileSync } from "node:child_process"

const commands = [
  "ALTER TABLE site_ads ADD COLUMN tier TEXT NOT NULL DEFAULT 'standard'",
  "ALTER TABLE site_ads DROP COLUMN sort_order",
]

for (const command of commands) {
  execFileSync("npx", ["wrangler", "d1", "execute", "DB", "--command", command], {
    stdio: "inherit",
  })
}

console.log("OK: site_ads.tier added, sort_order dropped if present.")
