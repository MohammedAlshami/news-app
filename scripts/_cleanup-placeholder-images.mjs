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
    const changes = data.result?.[0]?.meta?.changes
    console.log(`\u2713 ${label}${changes != null ? ` (${changes} rows)` : ""}`)
  } else {
    const msg = data.errors?.[0]?.message ?? JSON.stringify(data)
    console.log(`\u2717 ${label}: ${msg}`)
  }
}

async function count(sql) {
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

// Clear placeholder images from articles
await d1("UPDATE articles SET cover_image_url = NULL WHERE cover_image_url LIKE '%0f8e1a7b62c7f5cc2a650b40d8cd2168%'")

// Clear placeholder images from site_ads
await d1("UPDATE site_ads SET image_url = NULL WHERE image_url LIKE '%0f8e1a7b62c7f5cc2a650b40d8cd2168%'")

// Verify
const articles = await count("SELECT COUNT(*) as cnt FROM articles WHERE cover_image_url LIKE '%0f8e1a7b62c7f5cc2a650b40d8cd2168%'")
console.log("Remaining placeholder articles:", articles[0]?.[0] ?? 0)

const ads = await count("SELECT COUNT(*) as cnt FROM site_ads WHERE image_url LIKE '%0f8e1a7b62c7f5cc2a650b40d8cd2168%'")
console.log("Remaining placeholder ads:", ads[0]?.[0] ?? 0)

console.log("\nDone.")
