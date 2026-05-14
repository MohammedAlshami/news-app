import { config } from "dotenv"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
config({ path: join(root, ".env.local") })

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
const databaseId = process.env.CLOUDFLARE_DATABASE_ID
const token = process.env.CLOUDFLARE_D1_TOKEN

const statements = [
  `ALTER TABLE topics ADD COLUMN article_count INTEGER NOT NULL DEFAULT 0`,
  `UPDATE topics SET article_count = (SELECT COUNT(*) FROM scraped_news WHERE scraped_news.topic_id = topics.id)`,
]

for (const sql of statements) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/raw`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params: [], method: "run" }),
    },
  )
  const data = await res.json()
  const label = sql.trim().slice(0, 60)
  if (data.success) {
    const changes = data.result?.[0]?.meta?.changes ?? ""
    console.log(`✓ ${label}${changes !== "" ? ` (${changes} rows)` : ""}`)
  } else {
    const msg = data.errors?.[0]?.message ?? JSON.stringify(data)
    if (msg.includes("duplicate column") || msg.includes("already exists")) {
      console.log(`~ already applied: ${label}`)
    } else {
      console.error(`✗ ${label}\n  ${msg}`)
      process.exit(1)
    }
  }
}

console.log("\nMigration 0006 done.")
