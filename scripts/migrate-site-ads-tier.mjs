/**
 * One-shot migration: add `tier`, drop legacy `sort_order` on `site_ads`.
 * Run from project root: node scripts/migrate-site-ads-tier.mjs
 */
import { config } from "dotenv"
import { neon } from "@neondatabase/serverless"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
config({ path: resolve(root, ".env.local") })
config({ path: resolve(root, ".env") })

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL is not set.")
  process.exit(1)
}

const sql = neon(url)

await sql`ALTER TABLE site_ads ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'standard'`
await sql`ALTER TABLE site_ads DROP COLUMN IF EXISTS sort_order`
console.log("OK: site_ads.tier added, sort_order dropped if present.")
