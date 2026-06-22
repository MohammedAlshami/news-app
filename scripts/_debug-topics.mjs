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

const totalTopics = await q("SELECT COUNT(*) as c FROM topics")
console.log("Topics:", totalTopics[0]?.[0])

const withCat = await q("SELECT COUNT(*) as c FROM topics WHERE category_id IS NOT NULL")
console.log("With categoryId:", withCat[0]?.[0])

const withoutGen = await q("SELECT COUNT(*) as c FROM topics t LEFT JOIN generated_articles ga ON t.id = ga.topic_id WHERE ga.id IS NULL")
console.log("Without generated article:", withoutGen[0]?.[0])

const genTotal = await q("SELECT COUNT(*) as c FROM generated_articles")
console.log("Generated articles:", genTotal[0]?.[0])

const cats = await q("SELECT c.name, COUNT(*) as cnt FROM topics t JOIN categories c ON t.category_id = c.id GROUP BY t.category_id ORDER BY cnt DESC")
console.log("\nBy category:")
for (const c of cats) console.log(`  ${String(c[0]).padEnd(15)} ${c[1]}`)
