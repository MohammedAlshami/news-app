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

console.log("--- Articles by site category ---")
const arts = await q(`SELECT c.name, COUNT(*) as cnt FROM articles LEFT JOIN categories c ON articles.category_id = c.id GROUP BY articles.category_id ORDER BY cnt DESC`)
for (const r of arts) console.log(`  ${String(r[0] || "(uncategorized)").padEnd(20)} ${r[1]}`)

const total = await q("SELECT COUNT(*) as c FROM articles")
console.log(`\nTotal published: ${total[0]?.[0] ?? 0}`)

const gen = await q("SELECT COUNT(*) as c FROM generated_articles")
console.log(`Total generated: ${gen[0]?.[0] ?? 0}`)

const scraped = await q("SELECT COUNT(*) as c FROM scraped_news")
console.log(`Total scraped: ${scraped[0]?.[0] ?? 0}`)

console.log("\n--- Sample generated article titles ---")
const titles = await q("SELECT title FROM generated_articles LIMIT 10")
for (const t of titles) console.log(`  ${String(t[0]).slice(0, 80)}`)

console.log("\n--- Sample article titles ---")
const pubTitles = await q("SELECT title FROM articles LIMIT 10")
for (const t of pubTitles) console.log(`  ${String(t[0]).slice(0, 80)}`)
