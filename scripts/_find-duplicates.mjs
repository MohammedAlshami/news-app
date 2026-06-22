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

// Find duplicate titles
const dups = await q("SELECT title, COUNT(*) as cnt FROM articles GROUP BY title HAVING cnt > 1 ORDER BY cnt DESC")
console.log(`=== ${dups.length} duplicate titles found ===\n`)
for (const d of dups.slice(0, 20)) {
  console.log(`  x${d[1]}  ${String(d[0]).slice(0, 100)}`)
}

// Check: articles per topic
const perTopic = await q("SELECT ga.topic_id, COUNT(*) as cnt, t.title FROM generated_articles ga JOIN topics t ON ga.topic_id = t.id GROUP BY ga.topic_id HAVING cnt > 1 ORDER BY cnt DESC")
console.log(`\n=== ${perTopic.length} topics with multiple generated articles ===\n`)
for (const p of perTopic.slice(0, 10)) {
  console.log(`  x${p[1]}  topic: ${String(p[2]).slice(0, 80)}`)
}

// Check: total count
const totalArts = await q("SELECT COUNT(*) as c FROM articles")
const totalGen = await q("SELECT COUNT(*) as c FROM generated_articles")
const totalTopics = await q("SELECT COUNT(*) as c FROM topics")
console.log(`\nArticles: ${totalArts[0]?.[0]}, Generated: ${totalGen[0]?.[0]}, Topics: ${totalTopics[0]?.[0]}`)

// Sample duplicate pairs
if (dups.length > 0) {
  const sampleTitle = String(dups[0][0])
  const sampleArts = await q(`SELECT id, title, category_id, cover_image_url FROM articles WHERE title = '${sampleTitle.replace(/'/g, "''")}'`)
  console.log(`\nSample duplicates for: ${sampleTitle.slice(0, 80)}`)
  for (const a of sampleArts) {
    console.log(`  ${String(a[0]).slice(0, 8)}... cat:${String(a[2] || "").slice(0, 8)}... img:${a[3] ? "yes" : "no"}`)
  }
}
