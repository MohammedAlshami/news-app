const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const GROUPER_MODEL = "openai/gpt-5-nano"

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
}

const SYSTEM_PROMPT = `
You are a news categorization and topic clustering assistant.

You receive:
- "articles": array of { id, title, excerpt, content, category }
- "availableCategories": array of { id, name } — pick from these

Your job in order:
1. Read the title, excerpt, and FULL content of each article carefully.
2. For EACH article, assign it to the best matching category from availableCategories.
   - Use the FULL content to understand what the article is really about.
   - Group articles into their assigned categories first.
3. Within each category, group articles that cover the EXACT SAME specific event.
   - A group with a single article is perfectly fine.
   - Prefer more specific groups over broad ones.
4. For each group, use the \`search_topics\` tool to check if a matching topic already exists.
   - Call it with different Arabic keywords.
   - If found, reuse its id and categoryId.
   - If not found, create a new topic.

Respond with valid JSON only:
{
  "groups": [
    {
      "topicId": "<existing id or null>",
      "title": "<Arabic title for new topics>",
      "categoryId": "<category id from availableCategories>",
      "articleIds": ["<id>", ...]
    }
  ]
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
  if (articles.length === 0) return { groups: [] }

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
