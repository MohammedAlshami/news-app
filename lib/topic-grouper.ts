const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const GROUPER_MODEL = "openai/gpt-4o-mini"

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
}

export type GroupingResult = {
  groups: TopicGroup[]
  skippedArticleIds: string[]
}

/**
 * Map from scraper source categories to site category IDs.
 * Unambiguous categories are hard-coded — no AI needed.
 * Categories marked as "mixed" may contain articles from multiple site categories.
 */
const SOURCE_TO_SITE_CATEGORY: Record<string, string | "mixed"> = {
  business: "economy",
  economy: "economy",
  finance: "economy",
  sport: "sports",
  sports: "sports",
  tech: "technology",
  technology: "technology",
  politics: "politics",
  health: "health",
  culture: "culture",
  arts: "culture",
  art: "culture",
  science: "science",
  environment: "environment",
  climate: "environment",
  middle_east: "mixed",
  world: "mixed",
  news: "mixed",
  arab: "mixed",
  "arab-world": "mixed",
  arab_and_world: "mixed",
  varieties: "mixed",
  misc: "mixed",
  egypt: "mixed",
  "news-egypt": "mixed",
  "news-gulf": "mixed",
  "news-iraq": "mixed",
  "news-palestine": "mixed",
  palestine: "mixed",
  local: "mixed",
  accidents: "mixed",
  russia: "politics",
  press: "politics",
  guide: "mixed",
  features: "mixed",
  docfilms: "culture",
  prg: "mixed",
  satelites: "science",
  opinions: "mixed",
  lifestyle: "mixed",
  event: "mixed",
}

/** Reverse lookup: site slug → category id (populated from DB at runtime). */
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

const CLASSIFY_PROMPT = `
You are a news classifier. Given an article's title and excerpt, determine its category.
Choose ONLY from the available categories. Respond with just the category slug name.

Categories:
- economy: business, finance, markets, trade
- sports: sports, athletics, matches, tournaments
- technology: tech, AI, gadgets, software
- politics: politics, diplomacy, government, international
- health: health, medicine, diseases, nutrition
- culture: arts, cinema, music, literature, theater
- science: science, space, research
- environment: environment, climate, weather, nature

Respond with ONLY the category slug (one word), nothing else.
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

async function classifyArticle(
  apiKey: string,
  title: string,
  excerpt: string,
): Promise<string> {
  const text = [title, excerpt].filter(Boolean).join(" — ").slice(0, 1000)
  if (!text.trim()) return "mixed"

  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROUPER_MODEL,
      messages: [
        { role: "system", content: CLASSIFY_PROMPT },
        { role: "user", content: text },
      ],
      temperature: 0.1,
      max_tokens: 20,
    }),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) return "mixed"
  const data = await res.json()
  const slug = (data.choices?.[0]?.message?.content ?? "").trim().toLowerCase()
  return slug || "mixed"
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

  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROUPER_MODEL,
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

  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content ?? "{}"
  const parsed = JSON.parse(raw) as { groups?: { title: string; articleIds: string[] }[] }
  return parsed.groups ?? []
}

export async function groupArticlesByTopic(
  articles: ArticleInput[],
  searchTopics: (query: string) => Promise<{ id: string; title: string }[]>,
  searchCategories: (query: string) => Promise<{ id: string; name: string; slug: string }[]>,
): Promise<GroupingResult> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set")
  if (articles.length === 0) return { groups: [], skippedArticleIds: [] }

  const catMap = await getCategoryMap(searchCategories)
  const skippedArticleIds: string[] = []

  // Step 1: Group articles by their source category
  const bySourceCategory: Record<string, ArticleInput[]> = {}
  for (const a of articles) {
    const key = a.category?.toLowerCase().trim() || "misc"
    if (!bySourceCategory[key]) bySourceCategory[key] = []
    bySourceCategory[key].push(a)
  }

  const allGroups: TopicGroup[] = []

  // Step 2: Process each source category
  for (const [sourceCat, catArticles] of Object.entries(bySourceCategory)) {
    if (catArticles.length === 0) continue

    // Determine site category slug
    let siteSlug = SOURCE_TO_SITE_CATEGORY[sourceCat] ?? "mixed"

    // For mixed categories, classify each article individually
    if (siteSlug === "mixed") {
      // Group by AI classification
      const bySiteSlug: Record<string, ArticleInput[]> = {}
      for (const a of catArticles) {
        const slug = await classifyArticle(apiKey, a.title, a.excerpt ?? "")
        const key = slug && catMap[slug] ? slug : "mixed"
        if (!bySiteSlug[key]) bySiteSlug[key] = []
        bySiteSlug[key].push(a)
      }

      // Process each resulting sub-group
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
          allGroups.push({
            topicId: null,
            title: g.title,
            categoryId,
            articleIds: g.articleIds,
          })
        }
      }
    } else {
      // Unambiguous source category — site category is pre-determined
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
        allGroups.push({
          topicId: null,
          title: g.title,
          categoryId,
          articleIds: g.articleIds,
        })
      }
    }
  }

  return { groups: allGroups, skippedArticleIds }
}
