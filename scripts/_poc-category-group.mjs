import { config } from "dotenv"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
config({ path: join(root, ".env.local") })
const { CLOUDFLARE_ACCOUNT_ID: a, CLOUDFLARE_DATABASE_ID: d, CLOUDFLARE_D1_TOKEN: t } = process.env
const apiKey = process.env.OPENCODE_GO_KEY
const OPENCODE_GO_URL = "https://opencode.ai/zen/go/v1/chat/completions"
const OPENCODE_GO_MODEL = process.env.OPENCODE_GO_MODEL ?? "deepseek-v4-flash"

async function q(sql) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${a}/d1/database/${d}/raw`, { method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify({ sql, params: [], method: "all" }) })
  const j = await r.json()
  return j.result?.[0]?.results?.rows ?? []
}

// Get categories
const cats = await q("SELECT id, name, slug FROM categories")
console.log("=== Categories ===")
for (const c of cats) console.log(`  ${c[2]} → ${c[1]} (${String(c[0]).slice(0,8)}...)`)

// Map slugs to IDs
const slugToId = {}
for (const c of cats) slugToId[c[2]] = c[0]

// Source → site category mapping (same as topic-grouper.ts)
const SOURCE_TO_SITE = {
  business: "economy", economy: "economy", finance: "economy",
  sport: "sports", sports: "sports",
  tech: "technology", technology: "technology",
  politics: "politics",
  health: "health",
  culture: "culture", arts: "culture", art: "culture",
  science: "science",
  environment: "environment", climate: "environment",
  // Mixed categories
  middle_east: "mixed", world: "mixed", news: "mixed",
  arab: "mixed", "arab-world": "mixed", arab_and_world: "mixed",
  varieties: "mixed", misc: "mixed", egypt: "mixed",
  russia: "politics", press: "politics",
}

// Get scraped articles
const rows = await q(`SELECT id, title, excerpt, category, image_url FROM scraped_news ORDER BY scraped_at DESC LIMIT 40`)

console.log(`\n=== ${rows.length} scraped articles ===`)

// Group by source category
const byCat = {}
for (const r of rows) {
  const cat = (r[3] || "misc").toLowerCase()
  if (!byCat[cat]) byCat[cat] = []
  byCat[cat].push({ id: r[0], title: r[1], excerpt: r[2] || "", category: cat, hasImage: !!r[4] })
}

console.log("\n=== By source category ===")
let totalUnambiguous = 0
let totalMixed = 0

for (const [cat, arts] of Object.entries(byCat)) {
  const siteSlug = SOURCE_TO_SITE[cat] || "mixed"
  const isMixed = siteSlug === "mixed"
  const siteName = isMixed ? "MIXED" : (cats.find(c => c[2] === siteSlug)?.[1] || siteSlug)
  if (isMixed) totalMixed += arts.length; else totalUnambiguous += arts.length
  console.log(`  ${cat.padEnd(15)} → ${siteName.padEnd(15)} (${arts.length} articles)`)
  for (const a of arts.slice(0, 2)) {
    console.log(`    ${String(a.id).slice(0,8)}... ${a.title.slice(0, 60)} img:${a.hasImage ? "yes" : "no"}`)
  }
}

console.log(`\n  Total unambiguous: ${totalUnambiguous}`)
console.log(`  Total mixed: ${totalMixed} (needs AI classification)`)

// For unambiguous categories, test grouping via AI
console.log(`\n=== Testing AI grouping for 'sport' category ===`)
const sportArts = byCat["sport"] || byCat["sports"] || []
if (sportArts.length > 0) {
  const res = await fetch(OPENCODE_GO_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OPENCODE_GO_MODEL,
      messages: [
        { role: "system", content: "Group articles covering the SAME specific event together. Return JSON: { groups: [{ title: \"...\", articleIds: [\"...\"] }] }" },
        { role: "user", content: JSON.stringify({ articles: sportArts.map(a => ({ id: a.id, title: a.title, excerpt: a.excerpt.slice(0, 200) })) }) },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(30000),
  })
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content ?? "{}"
  console.log(`Response: ${raw.slice(0, 500)}`)
}

console.log("\nDone.")
