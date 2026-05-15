import { config } from "dotenv"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
config({ path: join(root, ".env.local") })

const { CLOUDFLARE_ACCOUNT_ID: accountId, CLOUDFLARE_DATABASE_ID: databaseId, CLOUDFLARE_D1_TOKEN: token } = process.env

async function run(sql) {
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
    console.log(`✓ ${label}${changes != null ? ` (${changes} rows)` : ""}`)
  } else {
    const msg = data.errors?.[0]?.message ?? JSON.stringify(data)
    if (msg.includes("already exists") || msg.includes("UNIQUE constraint")) {
      console.log(`~ already applied: ${label}`)
    } else {
      throw new Error(`✗ ${label}\n  ${msg}`)
    }
  }
}

await run(`CREATE TABLE IF NOT EXISTS news_sources (
  key TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  url TEXT NOT NULL,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  metadata TEXT NOT NULL DEFAULT '{}'
)`)

await run(`INSERT OR IGNORE INTO news_sources (key, name, name_ar, url, is_enabled, metadata) VALUES (
  'rt', 'RT Arabic', 'RT عربي', 'https://arabic.rt.com', 1,
  '{"logoUrl":"https://upload.wikimedia.org/wikipedia/commons/a/a0/Russia-today-logo.svg","country":"روسيا","language":"العربية"}'
)`)

await run(`INSERT OR IGNORE INTO news_sources (key, name, name_ar, url, is_enabled, metadata) VALUES (
  'independent', 'Independent Arabia', 'إندبندنت عربية', 'https://www.independentarabia.com', 1,
  '{"logoUrl":"https://www.arabnews.com/sites/default/files/styles/n_670_395/public/main-image/2019/01/24/1440086-2029066319.png?itok=vorhEkyF","country":"المملكة المتحدة","language":"العربية"}'
)`)

console.log("\nMigration 0008 done.")
