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
You are a news topic clustering assistant. You receive a JSON object with:
- "articles": array of { id, title, excerpt, category }
- "existingTopics": array of { id, title }
- "availableCategories": array of { id, name } — choose from these for each group

Your job:
1. Read titles and excerpts carefully.
2. Group articles that cover the EXACT SAME specific real-world event or story.
3. For each group, pick the best matching category from availableCategories.
4. To find if a matching topic already exists, use the \`search_topics\` tool.
   - Call it with Arabic keywords to search by.
   - You may call it multiple times with different keywords.
   - If you find an existing topic that matches, reuse its id.
   - If nothing matches, create a new topic (topicId: null).
5. For new topics, generate a concise Arabic title (5–10 words) naming the specific event.
6. Every article must belong to exactly one group. Single-article groups are fine.

Respond with valid JSON only:
{
  "groups": [
    {
      "topicId": "<existing id or null>",
      "title": "<Arabic title — required when topicId is null>",
      "categoryId": "<category id from availableCategories or null>",
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
        query: { type: "string", description: "Arabic search keywords" },
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
    category: a.category,
  }))

  const messages: any[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: JSON.stringify({ articles: articlesPayload, existingTopics: [], availableCategories: allCats }, null, 2),
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
