import { config } from "dotenv"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
config({ path: join(root, ".env.local") })
const { CLOUDFLARE_ACCOUNT_ID: a, CLOUDFLARE_DATABASE_ID: d, CLOUDFLARE_D1_TOKEN: t } = process.env

async function q(sql) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${a}/d1/database/${d}/raw`, { method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify({ sql, params: [], method: "all" }) })
  const j = await r.json()
  return j.result?.[0]?.results?.rows ?? []
}

console.log("--- Scraped news by source category ---")
const byCat = await q("SELECT category, COUNT(*) as cnt FROM scraped_news GROUP BY category ORDER BY cnt DESC")
for (const r of byCat) console.log(`  ${String(r[0]).padEnd(20)} ${r[1]}`)

const total = await q("SELECT COUNT(*) as c FROM scraped_news")
console.log(`\nTotal scraped: ${total[0]?.[0] ?? 0}`)

console.log("\n--- Topics by site category ---")
const topics = await q("SELECT COALESCE(c.name, '(uncategorized)') as cat, COUNT(*) as cnt FROM topics LEFT JOIN categories c ON topics.category_id = c.id GROUP BY topics.category_id ORDER BY cnt DESC")
for (const r of topics) console.log(`  ${String(r[0]).padEnd(20)} ${r[1]}`)

console.log("\n--- Site categories ---")
const cats = await q("SELECT id, name FROM categories")
for (const c of cats) console.log(`  ${String(c[0]).slice(0,8)}... ${c[1]}`)

const gen = await q("SELECT COUNT(*) as c FROM generated_articles")
const pub = await q("SELECT COUNT(*) as c FROM articles")
console.log(`\nGenerated: ${gen[0]?.[0] ?? 0}, Published: ${pub[0]?.[0] ?? 0}`)
