import { config } from "dotenv"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
config({ path: join(root, ".env.local") })

const { CLOUDFLARE_ACCOUNT_ID: accountId, CLOUDFLARE_DATABASE_ID: databaseId, CLOUDFLARE_D1_TOKEN: token } = process.env

async function d1(sql) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/raw`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params: [], method: "run" }),
    },
  )
  const data = await res.json()
  const label = sql.trim().replace(/\s+/g, " ").slice(0, 80)
  if (data.success) {
    console.log(`\u2713 ${label} (${data.result?.[0]?.meta?.changes ?? "?"} rows)`)
  } else {
    console.log(`\u2717 ${label}: ${data.errors?.[0]?.message ?? ""}`)
  }
}

async function query(sql) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/raw`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params: [], method: "all" }),
    },
  )
  const data = await res.json()
  return data.result?.[0]?.results?.rows ?? []
}

console.log("=== Step 1: Re-enable independent source and reset lastScrapedAt ===\n")

// Enable all sources
await d1("UPDATE news_sources SET is_enabled = 1")

// Reset metadata: remove lastScrapedAt so all articles will be accepted
await d1(`UPDATE news_sources SET metadata = '{}'`)

// Clear any remaining scraped data
await d1("DELETE FROM scraped_news")

// Verify
const sources = await query("SELECT key, name FROM news_sources WHERE is_enabled = 1")
console.log(`\nEnabled sources (${sources.length}):`)
for (const s of sources) {
  console.log(`  - ${s[0]} (${s[1]})`)
}

console.log(`\n=== Step 2: Now run the scrape pipeline ===`)
console.log(`Run: curl http://localhost:3000/api/cron/scrape-pipeline?limit=500`)
console.log(`Or visit: http://localhost:3000/api/cron/scrape-pipeline?limit=500`)
