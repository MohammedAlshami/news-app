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

const SYSTEM_PROMPT = `
You are a news categorization and topic clustering assistant. Your job is to accurately categorize and group articles. Be confident but not reckless.

You receive:
- "articles": array of { id, title, excerpt, content, category }
- "availableCategories": array of { id, name }

RULES:
1. Read title + excerpt + content of EACH article carefully.
2. Assign each article to the BEST matching category from availableCategories:
   - الاقتصاد: economy, business, finance, markets, trade, currencies, stocks
   - رياضة: sports, football, tournaments, athletics, matches
   - تكنولوجيا: technology, AI, gadgets, software, hardware, cybersecurity
   - سياسة: politics, diplomacy, elections, government, international relations
   - صحة: health, medicine, diseases, nutrition, fitness, medical research
   - ثقافة وفنون: culture, arts, cinema, music, literature, theater, exhibitions
   - علوم: science, space, physics, biology, chemistry, scientific research
   - بيئة: environment, climate, weather, nature, pollution, conservation
3. If you truly CANNOT determine the category (article is generic or has no clear topic), put it in skippedArticleIds.
   - But if there IS a clear main topic, assign it confidently — don't skip unnecessarily.
4. Group articles covering the EXACT SAME specific event together.
   - Different aspects of gold prices → SAME group
   - Same football match from different sources → SAME group
   - Different events → DIFFERENT groups
5. For each group, use search_topics tool with Arabic keywords to check for existing topics.
   - If found → reuse its id and categoryId.
   - If not found → create a new topic with a specific Arabic title.
6. A group with a single article is perfectly fine.

Return valid JSON:
{
  "groups": [
    {
      "topicId": "<existing topic id or null>",
      "title": "<specific Arabic title>",
      "categoryId": "<category id from availableCategories>",
      "articleIds": ["<id>", ...]
    }
  ],
  "skippedArticleIds": ["<id>", ...]
}
`.trim()

const SEARCH_TOPICS_TOOL = {
  type: "function" as const,
  function: {
    name: "search_topics",
    description: "Search existing topics by Arabic keyword to find if a similar topic already exists.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Arabic keywords" },
      },
      required: ["query"],
    },
  },
}

export async function groupArticlesByTopic(
  articles: ArticleInput[],
  searchTopics: (query: string) => Promise<{ id: string; title: string }[]>,
  searchCategories: (query: string) => Promise<{ id: string; name: string }[]>,
): Promise<GroupingResult> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set")
  if (articles.length === 0) return { groups: [], skippedArticleIds: [] }

  const allCats = await searchCategories("")

  const articlesPayload = articles.map((a) => ({
    id: a.id,
    title: a.title,
    excerpt: a.excerpt ?? "",
    content: (a.content ?? "").slice(0, 1000),
    category: a.category,
  }))

  const messages: any[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: JSON.stringify({ articles: articlesPayload, availableCategories: allCats }, null, 2),
    },
  ]

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 180000)

  try {
    while (true) {
      const res = await fetch(OPENROUTER_API_URL, {
        signal: controller.signal,
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "x-title": "News Topic Grouper",
        },
        body: JSON.stringify({
          model: GROUPER_MODEL,
          messages,
          tools: [SEARCH_TOPICS_TOOL],
          tool_choice: "auto",
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`OpenRouter request failed: ${res.status} ${text}`)
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string; tool_calls?: any[] } }[]
      }

      const msg = data.choices?.[0]?.message
      if (!msg) throw new Error("No response from OpenRouter")

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        messages.push({ role: "assistant", content: msg.content ?? "", tool_calls: msg.tool_calls as any })

        for (const tc of msg.tool_calls) {
          if (tc.function.name === "search_topics") {
            const args = JSON.parse(tc.function.arguments)
            const results = await searchTopics(args.query)
            messages.push({
              role: "tool",
              tool_call_id: tc.id,
              name: "search_topics",
              content: JSON.stringify(results.length > 0 ? results : { message: "No matching topics found." }),
            })
          }
        }
        continue
      }

      const raw = msg.content ?? ""
      let parsed: GroupingResult
      try {
        parsed = JSON.parse(raw) as GroupingResult
      } catch {
        throw new Error(`Topic grouper returned invalid JSON: ${raw.slice(0, 300)}`)
      }
      if (!Array.isArray(parsed.groups)) {
        throw new Error(`Topic grouper response missing 'groups' array: ${raw.slice(0, 300)}`)
      }
      return parsed
    }
  } finally {
    clearTimeout(timeout)
  }
}
