/**
 * Uses OpenRouter (OpenAI-compatible) to group a batch of scraped news articles
 * by topic, then returns a list of topics with their assigned article IDs and
 * a generated Arabic title for each topic.
 *
 * The model receives:
 *  - The list of articles (id, title, category, publishedAt)
 *  - Existing topic IDs + titles from the DB (so it can re-use them instead of
 *    creating duplicates for the same ongoing story)
 *
 * It responds with structured JSON only.
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

export type ArticleInput = {
  id: string
  title: string
  category: string
  publishedAt?: string | null
}

export type ExistingTopic = {
  id: string
  title: string
  articleCount?: number
}

export type TopicGroup = {
  /** null = create a new topic; non-null = reuse an existing topic id */
  topicId: string | null
  /** Arabic title describing the topic (used when topicId is null) */
  title: string
  articleIds: string[]
}

export type GroupingResult = {
  groups: TopicGroup[]
}

const SYSTEM_PROMPT = `
You are a news topic clustering assistant. You will receive a JSON object with:
- "articles": array of { id, title, category, publishedAt }
- "existingTopics": array of { id, title } — topics already in the database

Your job:
1. Group the articles by topic. Articles covering the same event or story belong in the same group.
2. For each group, decide whether it matches an existing topic (reuse its id) or is a new topic (topicId: null).
3. For new topics, generate a concise Arabic title (5–10 words) that describes the story.
4. Every article must appear in exactly one group.

Respond with ONLY valid JSON matching this exact shape — no markdown, no explanation:
{
  "groups": [
    {
      "topicId": "<existing id or null>",
      "title": "<Arabic title — required when topicId is null, ignored otherwise>",
      "articleIds": ["<id>", ...]
    }
  ]
}
`.trim()

export async function groupArticlesByTopic(
  articles: ArticleInput[],
  existingTopics: ExistingTopic[],
): Promise<GroupingResult> {
  const apiKey = process.env.OPENROUTER_API_KEY
  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini"

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set — cannot run topic grouping.")
  }

  if (articles.length === 0) {
    return { groups: [] }
  }

  const userMessage = JSON.stringify({ articles, existingTopics }, null, 2)

  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "x-title": "News Topic Grouper",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2, // low temp for consistent structured output
      response_format: { type: "json_object" },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter topic grouping failed: ${res.status} ${text}`)
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }

  const raw = data.choices?.[0]?.message?.content ?? ""

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
