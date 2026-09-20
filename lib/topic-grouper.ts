import { OPENROUTER_URL, OPENROUTER_MODEL, OPENROUTER_API_KEY, OPENROUTER_PROVIDER } from "@/lib/openrouter"

export type ArticleInput = {
  id: string
  title: string
  excerpt?: string | null
  content?: string | null
  category: string
  publishedAt?: string | null
}

export type TopicGroup = {
  topicId: string | null
  title: string
  categoryId: string | null
  articleIds: string[]
  parentId?: string | null
}

export type GroupingResult = {
  groups: TopicGroup[]
  skippedArticleIds: string[]
}

const SOURCE_TO_SITE_CATEGORY: Record<string, string | "mixed"> = {
  business: "economy", economy: "economy", finance: "economy",
  sport: "sports", sports: "sports",
  tech: "technology", technology: "technology",
  politics: "politics",
  health: "health",
  culture: "culture", arts: "culture", art: "culture",
  science: "science",
  environment: "environment", climate: "environment",
  middle_east: "mixed", world: "mixed", news: "mixed",
  arab: "mixed", "arab-world": "mixed", arab_and_world: "mixed",
  varieties: "mixed", misc: "mixed", egypt: "mixed",
  "news-egypt": "mixed", "news-gulf": "mixed", "news-iraq": "mixed",
  "news-palestine": "mixed", palestine: "mixed",
  local: "mixed", accidents: "mixed",
  russia: "politics", press: "politics",
  guide: "mixed", features: "mixed",
  docfilms: "culture", prg: "mixed",
  satelites: "science", opinions: "mixed",
  lifestyle: "mixed", event: "mixed",
}

let slugToId: Record<string, string> = {}

async function getCategoryMap(
  searchCategories: (query: string) => Promise<{ id: string; name: string; slug: string }[]>,
): Promise<Record<string, string>> {
  if (Object.keys(slugToId).length > 0) return slugToId
  const all = await searchCategories("")
  slugToId = {}
  for (const c of all) {
    slugToId[c.slug] = c.id
  }
  return slugToId
}

async function findParentTopic(
  searchTopics: (query: string) => Promise<{ id: string; title: string }[]>,
  title: string,
): Promise<string | null> {
  const words = title.split(/\s+/).filter((w) => w.length > 3)
  if (words.length === 0) return null

  const candidates = await searchTopics(words.slice(0, 3).join(" "))
  for (const c of candidates) {
    const shared = words.filter((w) => c.title.includes(w)).length
    if (shared >= 2) return c.id
  }
  return null
}

const BATCH_CLASSIFY_PROMPT = `
You are a news classifier. Given a list of articles with their titles and excerpts,
assign each to the best category slug from the list below.

Categories:
- economy: business, finance, markets, trade
- sports: sports, athletics, matches, tournaments
- technology: tech, AI, gadgets, software
- politics: politics, diplomacy, government, international
- health: health, medicine, diseases, nutrition
- culture: arts, cinema, music, literature, theater
- science: science, space, research
- environment: environment, climate, weather, nature

Respond with valid JSON only:
{
  "classifications": [
    { "id": "<article id>", "category": "<category slug>" }
  ]
}
`

const GROUP_PROMPT = `
You are a news topic clustering assistant. You receive articles that are ALL from the same category.

Your ONLY job: group articles that cover the EXACT SAME specific event together.

Rules:
- Same football match from different sources → SAME group
- Different reports about the same political development → SAME group
- Different gold price reports on different days → DIFFERENT groups
- A single article that has no related articles → its own group (single article is fine)
- If you cannot tell if two articles cover the same event → put them in SEPARATE groups

For each group, give it a specific Arabic title (5-10 words).

Return valid JSON:
{
  "groups": [
    {
      "title": "<specific Arabic title>",
      "articleIds": ["<id>", ...]
    }
  ]
}
`

async function batchClassifyArticles(
  apiKey: string,
  articles: { id: string; title: string; excerpt: string }[],
): Promise<Record<string, string>> {
  if (articles.length === 0) return {}
  if (articles.length === 1) {
    const slug = await classifySingle(apiKey, articles[0].title, articles[0].excerpt)
    return { [articles[0].id]: slug }
  }

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        provider: OPENROUTER_PROVIDER,
        messages: [
          { role: "system", content: BATCH_CLASSIFY_PROMPT },
          { role: "user", content: JSON.stringify({
            articles: articles.map((a) => ({ id: a.id, title: a.title, excerpt: (a.excerpt || "").slice(0, 300) })),
          })},
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) return {}

    const data = await res.json() as any
    const raw = data.choices?.[0]?.message?.content ?? "{}"
    const parsed = JSON.parse(raw) as { classifications?: { id: string; category: string }[] }

    const result: Record<string, string> = {}
    for (const c of parsed.classifications ?? []) {
      result[c.id] = c.category.trim().toLowerCase()
    }
    return result
  } catch {
    return {}
  }
}

async function classifySingle(
  apiKey: string,
  title: string,
  excerpt: string,
): Promise<string> {
  const text = [title, excerpt].filter(Boolean).join(" — ").slice(0, 1000)
  if (!text.trim()) return "mixed"

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        provider: OPENROUTER_PROVIDER,
        messages: [
          { role: "system", content: "Classify this article into a category: economy, sports, technology, politics, health, culture, science, environment. Respond with ONLY the category slug." },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        max_tokens: 20,
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) return "mixed"
    const data = await res.json() as any
    return (data.choices?.[0]?.message?.content ?? "").trim().toLowerCase() || "mixed"
  } catch {
    return "mixed"
  }
}

async function groupArticles(
  apiKey: string,
  articles: { id: string; title: string; excerpt: string }[],
): Promise<{ title: string; articleIds: string[] }[]> {
  if (articles.length === 0) return []
  if (articles.length === 1) {
    return [{ title: articles[0].title.slice(0, 100), articleIds: [articles[0].id] }]
  }

  const payload = articles.map(a => ({
    id: a.id,
    title: a.title,
    excerpt: (a.excerpt || "").slice(0, 300),
  }))

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        provider: OPENROUTER_PROVIDER,
        messages: [
          { role: "system", content: GROUP_PROMPT },
          { role: "user", content: JSON.stringify({ articles: payload }) },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Grouping failed: ${res.status} ${text.slice(0, 200)}`)
    }

    const data = await res.json() as any
    const raw = data.choices?.[0]?.message?.content ?? "{}"
    const parsed = JSON.parse(raw) as { groups?: { title: string; articleIds: string[] }[] }
    return parsed.groups ?? []
  } catch {
    return []
  }
}

export async function groupArticlesByTopic(
  articles: ArticleInput[],
  searchTopics: (query: string) => Promise<{ id: string; title: string }[]>,
  searchCategories: (query: string) => Promise<{ id: string; name: string; slug: string }[]>,
): Promise<GroupingResult> {
  const apiKey = OPENROUTER_API_KEY
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set")
  if (articles.length === 0) return { groups: [], skippedArticleIds: [] }

  const catMap = await getCategoryMap(searchCategories)
  const skippedArticleIds: string[] = []

  const bySourceCategory: Record<string, ArticleInput[]> = {}
  for (const a of articles) {
    const key = a.category?.toLowerCase().trim() || "misc"
    if (!bySourceCategory[key]) bySourceCategory[key] = []
    bySourceCategory[key].push(a)
  }

  const allGroups: TopicGroup[] = []

  for (const [sourceCat, catArticles] of Object.entries(bySourceCategory)) {
    if (catArticles.length === 0) continue

    let siteSlug = SOURCE_TO_SITE_CATEGORY[sourceCat] ?? "mixed"

    if (siteSlug === "mixed") {
      const classifications = await batchClassifyArticles(
        apiKey,
        catArticles.map((a) => ({ id: a.id, title: a.title, excerpt: a.excerpt ?? "" })),
      )

      const bySiteSlug: Record<string, ArticleInput[]> = {}
      for (const a of catArticles) {
        const slug = classifications[a.id] ?? "mixed"
        const key = slug && catMap[slug] ? slug : "mixed"
        if (!bySiteSlug[key]) bySiteSlug[key] = []
        bySiteSlug[key].push(a)
      }

      for (const [subSlug, subArticles] of Object.entries(bySiteSlug)) {
        const categoryId = catMap[subSlug] ?? null
        if (!categoryId) {
          skippedArticleIds.push(...subArticles.map(a => a.id))
          continue
        }

        const groups = await groupArticles(apiKey, subArticles.map(a => ({
          id: a.id,
          title: a.title,
          excerpt: a.excerpt ?? "",
        })))

        for (const g of groups) {
          const parentId = await findParentTopic(searchTopics, g.title)
          allGroups.push({
            topicId: null,
            title: g.title,
            categoryId,
            articleIds: g.articleIds,
            parentId,
          })
        }
      }
    } else {
      const categoryId = catMap[siteSlug]
      if (!categoryId) {
        skippedArticleIds.push(...catArticles.map(a => a.id))
        continue
      }

      const groups = await groupArticles(apiKey, catArticles.map(a => ({
        id: a.id,
        title: a.title,
        excerpt: a.excerpt ?? "",
      })))

      for (const g of groups) {
        const parentId = await findParentTopic(searchTopics, g.title)
        allGroups.push({
          topicId: null,
          title: g.title,
          categoryId,
          articleIds: g.articleIds,
          parentId,
        })
      }
    }
  }

  return { groups: allGroups, skippedArticleIds }
}
