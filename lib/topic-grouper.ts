/**
 * Uses OpenRouter (OpenAI-compatible) to group a batch of scraped news articles
 * by topic, then returns a list of topics with their assigned article IDs and
 * a generated Arabic title for each topic.
 *
 * The model receives:
 *  - The list of articles (id, title, excerpt, content, category, publishedAt)
 *  - Existing topic IDs + titles from the DB (so it can re-use them instead of
 *    creating duplicates for the same ongoing story)
 *
 * It responds with structured JSON only.
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

// GPT-5 nano — large context window, great for bulk clustering
const GROUPER_MODEL = "openai/gpt-5-nano"

export type ArticleInput = {
  id: string
  title: string
  excerpt?: string | null
  content?: string | null
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
- "articles": array of { id, title, excerpt, category, publishedAt }
- "existingTopics": array of { id, title } — topics already in the database

Your job:
1. Read the title and excerpt of each article carefully.
2. Group articles that cover the EXACT SAME specific real-world event or story.
   - "Same event" means: same incident, same people, same location, same development.
   - Articles about different events in the same country or region are NOT the same topic.
   - Articles about different political figures are NOT the same topic even if both are political.
   - When in doubt, keep articles in SEPARATE groups. Prefer more groups over fewer.
   - A group with a single article is perfectly fine.
3. For each group, decide whether it matches an existing topic (reuse its id) or is a new topic (topicId: null).
4. For new topics, generate a concise Arabic title (5–10 words) that names the specific event.
5. Every article must appear in exactly one group. Do not leave any article out.

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

/** Truncate content to avoid blowing the context window per article */
function truncate(text: string | null | undefined, maxChars = 400): string {
  if (!text) return ""
  return text.length > maxChars ? text.slice(0, maxChars) + "…" : text
}

export async function groupArticlesByTopic(
  articles: ArticleInput[],
  existingTopics: ExistingTopic[],
): Promise<GroupingResult> {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set — cannot run topic grouping.")
  }

  if (articles.length === 0) {
    return { groups: [] }
  }

  // Build a compact representation — title and full excerpt for grouping
  const articlesPayload = articles.map((a) => ({
    id: a.id,
    title: a.title,
    excerpt: a.excerpt ?? "",
    category: a.category,
    publishedAt: a.publishedAt ?? null,
  }))

  const userMessage = JSON.stringify({ articles: articlesPayload, existingTopics }, null, 2)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

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
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.1, // very low — we want deterministic clustering
      response_format: { type: "json_object" },
    }),
  })

  clearTimeout(timeout)

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
