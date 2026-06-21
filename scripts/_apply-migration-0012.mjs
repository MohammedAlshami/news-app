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
    console.log(`\u2713 ${label}${changes != null ? ` (${changes} rows)` : ""}`)
  } else {
    const msg = data.errors?.[0]?.message ?? JSON.stringify(data)
    if (msg.includes("already exists") || msg.includes("UNIQUE constraint") || msg.includes("Duplicate column")) {
      console.log(`~ already applied: ${label}`)
    } else {
      throw new Error(`\u2717 ${label}\n  ${msg}`)
    }
  }
}

await run(`INSERT OR IGNORE INTO categories (id, name, slug, description, created_at) VALUES
  ('55555555-5555-5555-5555-555555555555', '\u0635\u062d\u0629', 'health', '\u0623\u062e\u0628\u0627\u0631 \u0627\u0644\u0635\u062d\u0629 \u0648\u0627\u0644\u0637\u0628 \u0648\u0627\u0644\u0648\u0642\u0627\u064a\u0629', 1745888400000),
  ('66666666-6666-6666-6666-666666666666', '\u062b\u0642\u0627\u0641\u0629 \u0648\u0641\u0646\u0648\u0646', 'culture', '\u0623\u062e\u0628\u0627\u0631 \u0627\u0644\u062b\u0642\u0627\u0641\u0629 \u0648\u0627\u0644\u0641\u0646\u0648\u0646 \u0648\u0627\u0644\u0633\u064a\u0646\u0645\u0627 \u0648\u0627\u0644\u0623\u062f\u0628', 1745888400000),
  ('77777777-7777-7777-7777-777777777777', '\u0639\u0644\u0648\u0645', 'science', '\u0623\u062e\u0628\u0627\u0631 \u0627\u0644\u0639\u0644\u0648\u0645 \u0648\u0627\u0644\u0628\u062d\u0648\u062b \u0648\u0627\u0644\u0641\u0636\u0627\u0621', 1745888400000),
  ('88888888-8888-8888-8888-888888888888', '\u0628\u064a\u0626\u0629', 'environment', '\u0623\u062e\u0628\u0627\u0631 \u0627\u0644\u0628\u064a\u0626\u0629 \u0648\u0627\u0644\u0645\u0646\u0627\u062e \u0648\u0627\u0644\u0637\u0628\u064a\u0639\u0629', 1745888400000)`)

await run(`ALTER TABLE articles ADD COLUMN highlights TEXT NOT NULL DEFAULT '[]'`)
await run(`ALTER TABLE generated_articles ADD COLUMN highlights TEXT NOT NULL DEFAULT '[]'`)
await run(`ALTER TABLE articles ADD COLUMN original_cover_image_url TEXT`)
await run(`ALTER TABLE articles ADD COLUMN cover_image_hash TEXT`)
await run(`ALTER TABLE generated_articles ADD COLUMN original_cover_image_url TEXT`)

console.log("\nMigration 0012 done.")
