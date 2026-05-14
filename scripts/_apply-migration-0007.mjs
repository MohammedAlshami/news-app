import { config } from "dotenv"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
config({ path: join(root, ".env.local") })

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
const databaseId = process.env.CLOUDFLARE_DATABASE_ID
const token = process.env.CLOUDFLARE_D1_TOKEN

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
    if (msg.includes("duplicate column") || msg.includes("already exists")) {
      console.log(`~ already applied: ${label}`)
    } else {
      throw new Error(`✗ ${label}\n  ${msg}`)
    }
  }
}

// SQLite D1 doesn't allow non-constant defaults in ALTER TABLE,
// so we add with DEFAULT 0 then backfill from created_at.
await run(`ALTER TABLE topics ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0`)
await run(`UPDATE topics SET updated_at = created_at WHERE updated_at = 0`)

await run(`CREATE TABLE IF NOT EXISTS generated_articles (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  cover_image_url TEXT,
  image_urls TEXT NOT NULL DEFAULT '[]',
  topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
  source_article_ids TEXT NOT NULL DEFAULT '[]',
  is_published INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
)`)

await run(`CREATE INDEX IF NOT EXISTS generated_articles_topic_idx ON generated_articles(topic_id)`)
await run(`CREATE INDEX IF NOT EXISTS generated_articles_created_idx ON generated_articles(created_at)`)

console.log("\nMigration 0007 done.")
