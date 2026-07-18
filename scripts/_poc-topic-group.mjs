import { config } from "dotenv"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
config({ path: join(root, ".env.local") })

const { CLOUDFLARE_ACCOUNT_ID: accountId, CLOUDFLARE_DATABASE_ID: databaseId, CLOUDFLARE_D1_TOKEN: token } = process.env
const apiKey = process.env.OPENCODE_GO_KEY
const OPENCODE_GO_URL = "https://opencode.ai/zen/go/v1/chat/completions"
const OPENCODE_GO_MODEL = process.env.OPENCODE_GO_MODEL ?? "deepseek-v4-flash"

if (!apiKey) { console.error("Missing OPENCODE_GO_KEY"); process.exit(1) }

async function d1Query(sql) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/raw`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params: [], method: "all" }),
    },
  )
  const data = await res.json()
  return data.result?.[0]?.results?.rows ?? []
}

// Step 1: Fetch last 10 scraped articles
const rows = await d1Query(
  `SELECT id, title, excerpt, content, category, published_at, image_url
   FROM scraped_news
   ORDER BY scraped_at DESC
   LIMIT 10`
)

console.log(`\n=== Scraped ${rows.length} articles ===\n`)

for (const r of rows) {
  console.log(`  ${String(r[0]).slice(0, 8)}... | ${String(r[2] || "").slice(0, 60)} | img: ${r[6] ? "yes" : "no"} | cat: ${r[4]}`)
}

// Step 2: Get available categories
const cats = await d1Query("SELECT id, name FROM categories")
const allCats = cats.map(c => ({ id: String(c[0]), name: String(c[1]) }))

console.log(`\n=== Categories (${allCats.length}): ===`)
for (const c of allCats) console.log(`  ${c.id.slice(0, 8)}... | ${c.name}`)

// Step 3: Build the AI request payload
const articles = rows.map(r => ({
  id: String(r[0]),
  title: String(r[2] || ""),
  excerpt: String(r[3] || "").slice(0, 300),
  content: String(r[4] || "").slice(0, 500),
  category: String(r[5] || ""),
}))

const systemPrompt = `You are a news categorization assistant. Categorize each article into the best category.

Categories:
${allCats.map(c => `  - ${c.id}: ${c.name}`).join("\n")}

Group articles covering the same event together. For each group, assign a category ID and a specific Arabic title.

Return JSON:
{
  "groups": [
    {
      "topicId": null,
      "title": "<specific Arabic title>",
      "categoryId": "<category id>",
      "articleIds": ["<id>", ...]
    }
  ],
  "skippedArticleIds": []
}`

const payload = { articles, availableCategories: allCats }

console.log(`\n=== Calling OpenCode Go with ${articles.length} articles... ===`)

const start = Date.now()

try {
  const res = await fetch(OPENCODE_GO_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENCODE_GO_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(payload) },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(120000),
  })

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  
  if (!res.ok) {
    const text = await res.text()
    console.error(`\nFAILED (${res.status} after ${elapsed}s): ${text.slice(0, 500)}`)
    process.exit(1)
  }

  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content ?? ""
  
  console.log(`\nResponse received in ${elapsed}s`)
  console.log(`\nRaw response (first 2000 chars):\n${raw.slice(0, 2000)}`)
  
  // Try to parse
  try {
    const parsed = JSON.parse(raw)
    console.log(`\n=== PARSED RESULT ===`)
    console.log(`Groups: ${parsed.groups?.length ?? 0}`)
    console.log(`Skipped: ${parsed.skippedArticleIds?.length ?? 0}`)
    
    if (parsed.groups) {
      for (const g of parsed.groups) {
        console.log(`\n  Topic: ${g.title || "(no title)"}`)
        console.log(`  Category: ${g.categoryId ? g.categoryId.slice(0,8) + "..." : "null"}`)
        console.log(`  Articles (${g.articleIds?.length ?? 0}): ${(g.articleIds ?? []).map(id => id.slice(0,8)).join(", ")}`)
      }
    }
  } catch (e) {
    console.log(`\nParse error: ${e.message}`)
  }
} catch (e) {
  console.error(`\nNETWORK ERROR: ${e.message}`)
}

console.log(`\nDone (${((Date.now() - start) / 1000).toFixed(1)}s total)`)
