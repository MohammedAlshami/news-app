import { config } from "dotenv"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
config({ path: join(root, ".env.local") })
const { CLOUDFLARE_ACCOUNT_ID: a, CLOUDFLARE_DATABASE_ID: d, CLOUDFLARE_D1_TOKEN: t } = process.env

async function d1(sql) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${a}/d1/database/${d}/raw`, { method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify({ sql, params: [], method: "run" }) })
  const j = await r.json()
  console.log(j.success ? "OK" : "FAIL", sql.slice(0, 60))
}

// Reset metadata and re-enable all sources
await d1("UPDATE news_sources SET metadata = '{}', is_enabled = 1")
console.log("Done. Sources reset — next scrape will accept all articles.")
