import { config } from "dotenv"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
config({ path: join(root, ".env.local") })

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
const databaseId = process.env.CLOUDFLARE_DATABASE_ID
const token = process.env.CLOUDFLARE_D1_TOKEN

// D1 HTTP API executes one statement per request, so we run them separately
const statements = [
  `CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  )`,
  `ALTER TABLE scraped_news ADD COLUMN topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL`,
  `CREATE INDEX IF NOT EXISTS scraped_news_topic_idx ON scraped_news(topic_id)`,
]

for (const sql of statements) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/raw`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params: [], method: "run" }),
    },
  )
  const data = await res.json()
  const stmt = sql.trim().split("\n")[0].slice(0, 60)
  if (data.success) {
    console.log(`✓ ${stmt}`)
  } else {
    const msg = data.errors?.[0]?.message ?? JSON.stringify(data)
    // "duplicate column" is fine — means migration already ran
    if (msg.includes("duplicate column") || msg.includes("already exists")) {
      console.log(`~ already applied: ${stmt}`)
    } else {
      console.error(`✗ ${stmt}\n  ${msg}`)
      process.exit(1)
    }
  }
}

console.log("\nMigration 0005 done.")
