import { config } from "dotenv"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
config({ path: join(root, ".env.local") })
const { CLOUDFLARE_ACCOUNT_ID: a, CLOUDFLARE_DATABASE_ID: d, CLOUDFLARE_D1_TOKEN: t } = process.env

async function d1(sql) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${a}/d1/database/${d}/raw`, { method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify({ sql, params: [], method: "run" }) })
  const j = await r.json()
  if (!j.success) console.log("FAIL:", j.errors?.[0]?.message)
  return j.result?.[0]?.meta?.changes ?? 0
}

async function q(sql) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${a}/d1/database/${d}/raw`, { method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify({ sql, params: [], method: "all" }) })
  const j = await r.json()
  return j.result?.[0]?.results?.rows ?? []
}

// Strategy: keep the first generated_article per topic, delete the rest and their articles
// First, find all duplicate gen IDs (keep the one with lowest rowid or created_at)
console.log("Deleting duplicate generated articles (keeping 1 per topic)...")

// Step 1: Delete articles that belong to duplicate generated_articles (keeping the first per topic)
const removedArts = await d1(`
  DELETE FROM articles WHERE id IN (
    SELECT a.id FROM articles a
    JOIN generated_articles ga ON a.title = ga.title
    WHERE ga.id NOT IN (
      SELECT MIN(g2.id) FROM generated_articles g2
      JOIN generated_articles g3 ON g2.topic_id = g3.topic_id
      GROUP BY g2.topic_id
    )
  )
`)
console.log(`Removed ${removedArts} duplicate articles`)

// Step 2: Delete duplicate generated_articles (keeping the first per topic)
const removedGen = await d1(`
  DELETE FROM generated_articles WHERE id NOT IN (
    SELECT MIN(id) FROM generated_articles GROUP BY topic_id
  )
`)
console.log(`Removed ${removedGen} duplicate generated_articles`)

// Verify
const genCount = await q("SELECT COUNT(*) as c FROM generated_articles")
const artCount = await q("SELECT COUNT(*) as c FROM articles")
const topicCount = await q("SELECT COUNT(*) as c FROM topics")
const dupCount = await q("SELECT COUNT(*) as c FROM (SELECT topic_id FROM generated_articles GROUP BY topic_id HAVING COUNT(*) > 1)")

console.log(`\nAfter cleanup:`)
console.log(`  Topics: ${topicCount[0]?.[0]}`)
console.log(`  Generated: ${genCount[0]?.[0]}`)
console.log(`  Articles: ${artCount[0]?.[0]}`)
console.log(`  Topics with duplicates: ${dupCount[0]?.[0]}`)
