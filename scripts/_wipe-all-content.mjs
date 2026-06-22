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

console.log("Wiping all content...\n")

await d1("DELETE FROM generated_articles")
await d1("DELETE FROM articles")
await d1("DELETE FROM scraped_news")
await d1("DELETE FROM topics")

console.log("\nDone.")
