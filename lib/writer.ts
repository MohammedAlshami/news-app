import { getDb } from "@/db/client"
import { articles, generatedArticles, scrapedNews, topics } from "@/db/schema"
import { like, eq, desc, sql } from "drizzle-orm"
import { putR2Object } from "@/lib/r2.server"

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const MODEL = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini"

const SYSTEM_PROMPT = `
You are an Arabic news journalist. Your job is to decide what to write about and write one article per run.

You have these tools:

1. search_topics(query) — search the topics table by Arabic keyword. Returns topic id, title, article count.
   Call with empty string to browse all topics. Try different keywords to find topics worth writing about.

2. get_topic_summary(topicId) — returns the topic title, how many scraped articles it has,
   how many generated articles it already has, and the last time a generated article was created.

3. search_sources(topicId, keywords, limit) — search scraped articles within a topic.
   Returns {id, title, excerpt, source, publishedAt, imageUrl}[]

4. get_source_content(sourceId) — returns the FULL content of a scraped article so you can read it.

5. get_previous_articles(topicId) — returns the titles and excerpts of previously generated
   articles for this topic, so you don't repeat what's already been covered.

6. write_article(topicId, title, excerpt, paragraphs[], sourceIds[], coverImageUrl) —
   Save the article. paragraphs is an array of Arabic strings, each is one paragraph.
   sourceIds are the scraped article IDs you used as sources.
   coverImageUrl is optional.

Decision rules:
- Search topics first. Look for topics with scraped articles.
- If a topic has 0 generated articles → good candidate, write the first article.
- If a topic has generated articles → check get_previous_articles to see what was covered.
  Then check if there are NEW sources (scraped articles not used before) with new developments.
- Only write about topics that have enough material (at least 2 source articles).
- Write ONE article per run. If nothing worth writing → respond with { action: "skip", reason: "..." }.

Article quality rules:
- Title: concise Arabic headline, 8-15 words
- Excerpt: 2-3 sentence summary, 40-80 words
- Paragraphs: at least 4, each 50-120 words
- Write in Modern Standard Arabic (فصحى)
- Be objective and informative
- Synthesize multiple sources, don't just repeat one
- For follow-ups: focus on NEW developments only, don't repeat old content

Response format when writing:
{ "action": "write", "topicId": "...", "title": "...", "excerpt": "...", "paragraphs": ["...", ...], "sourceIds": ["...", ...], "coverImageUrl": "..." }

Response format when skipping:
{ "action": "skip", "reason": "..." }
`.trim()

export type WriterToolCall = {
  id: string
  function: { name: string; arguments: string }
}

async function searchTopics(query: string) {
  const db = getDb()
  const rows = await db
    .select({
      id: topics.id,
      title: topics.title,
      articleCount: topics.articleCount,
    })
    .from(topics)
    .where(query ? like(topics.title, `%${query}%`) : sql`1=1`)
    .orderBy(desc(topics.updatedAt))
    .limit(20)
  return rows
}

async function getTopicSummary(topicId: string) {
  const db = getDb()
  const [topic] = await db.select().from(topics).where(eq(topics.id, topicId)).limit(1)
  if (!topic) return { error: "Topic not found" }

  const sourceCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(scrapedNews)
    .where(eq(scrapedNews.topicId, topicId))

  const genArticles = await db
    .select({ id: generatedArticles.id, title: generatedArticles.title, createdAt: generatedArticles.createdAt })
    .from(generatedArticles)
    .where(eq(generatedArticles.topicId, topicId))
    .orderBy(desc(generatedArticles.createdAt))
    .limit(5)

  const newestSource = await db
    .select({ scrapedAt: scrapedNews.scrapedAt })
    .from(scrapedNews)
    .where(eq(scrapedNews.topicId, topicId))
    .orderBy(desc(scrapedNews.scrapedAt))
    .limit(1)

  return {
    title: topic.title,
    scrapedArticleCount: Number(sourceCount[0]?.count ?? 0),
    generatedArticleCount: genArticles.length,
    lastGenerated: genArticles[0]?.createdAt ?? null,
    lastScrapedAt: newestSource[0]?.scrapedAt ?? null,
    previousArticles: genArticles.map((a) => ({ id: a.id, title: a.title })),
  }
}

async function searchSources(topicId: string, keywords: string, limit = 10) {
  const db = getDb()
  const filter = keywords
    ? like(scrapedNews.title, `%${keywords}%`)
    : sql`1=1`
  const rows = await db
    .select({
      id: scrapedNews.id,
      title: scrapedNews.title,
      excerpt: scrapedNews.excerpt,
      source: scrapedNews.source,
      publishedAt: scrapedNews.publishedAt,
      imageUrl: scrapedNews.imageUrl,
      scrapedAt: scrapedNews.scrapedAt,
    })
    .from(scrapedNews)
    .where(sql`${scrapedNews.topicId} = ${topicId} AND ${filter}`)
    .orderBy(desc(scrapedNews.scrapedAt))
    .limit(limit)
  return rows
}

async function getSourceContent(sourceId: string) {
  const db = getDb()
  const [row] = await db
    .select({ id: scrapedNews.id, title: scrapedNews.title, content: scrapedNews.content, excerpt: scrapedNews.excerpt })
    .from(scrapedNews)
    .where(eq(scrapedNews.id, sourceId))
    .limit(1)
  if (!row) return { error: "Source not found" }
  return row
}

async function getPreviousArticles(topicId: string) {
  const db = getDb()
  const rows = await db
    .select({
      id: generatedArticles.id,
      title: generatedArticles.title,
      excerpt: generatedArticles.excerpt,
      sourceArticleIds: generatedArticles.sourceArticleIds,
      createdAt: generatedArticles.createdAt,
    })
    .from(generatedArticles)
    .where(eq(generatedArticles.topicId, topicId))
    .orderBy(desc(generatedArticles.createdAt))
    .limit(10)
  return rows
}

async function uploadImageToR2(url: string, articleId: string): Promise<string | null> {
  if (!url || !url.startsWith("http")) return null
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get("content-type") || "image/jpeg"
    const ext = contentType.split("/")[1] || "jpg"
    const key = `articles/${articleId}/cover.${ext}`
    const r2Url = await putR2Object({ key, body: buffer, contentType })
    return r2Url
  } catch {
    return null
  }
}

async function writeArticle(
  topicId: string,
  title: string,
  excerpt: string,
  paragraphs: string[],
  sourceIds: string[],
  coverImageUrl?: string,
) {
  const db = getDb()

  // Get the topic's categoryId
  const [topic] = await db
    .select({ categoryId: topics.categoryId })
    .from(topics)
    .where(eq(topics.id, topicId))
    .limit(1)
  const body = JSON.stringify({
    type: "doc",
    content: paragraphs.map((text) => ({
      type: "paragraph",
      content: [{ type: "text", text }],
    })),
  })

  const genId = crypto.randomUUID()
  const articleId = crypto.randomUUID()
  const now = new Date()
  const categoryId = topic?.categoryId ?? null

  // Download cover image and upload to R2; fall back to original URL
  let imageUrl = coverImageUrl ?? null
  if (imageUrl && !imageUrl.includes("r2.dev")) {
    const uploaded = await uploadImageToR2(imageUrl, articleId)
    if (uploaded) imageUrl = uploaded
    // If R2 upload failed, keep the original URL as fallback
  }

  await db.insert(generatedArticles).values({
    id: genId,
    title,
    excerpt,
    body,
    coverImageUrl: imageUrl,
    imageUrls: JSON.stringify(imageUrl ? [imageUrl] : []),
    topicId,
    sourceArticleIds: JSON.stringify(sourceIds),
    isPublished: true,
  })

  // Auto-publish to main articles table
  await db.insert(articles).values({
    id: articleId,
    title,
    excerpt,
    body,
    coverImageUrl: imageUrl,
    categoryId,
    isPublished: true,
    views: 0,
    createdAt: now,
    updatedAt: now,
  })

  await db
    .update(topics)
    .set({ updatedAt: now })
    .where(eq(topics.id, topicId))

  return { id: genId, articleId, title }
}

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "search_topics",
      description: "Search topics by Arabic keyword. Use empty string to browse all. Try different keywords to find topics worth writing about.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Arabic keywords or empty string for all" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_topic_summary",
      description: "Get detailed info about a topic: scraped article count, generated article count, last generated date.",
      parameters: {
        type: "object",
        properties: {
          topicId: { type: "string", description: "The topic ID" },
        },
        required: ["topicId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_sources",
      description: "Search scraped articles within a topic. Returns titles, excerpts, dates, and image URLs.",
      parameters: {
        type: "object",
        properties: {
          topicId: { type: "string", description: "The topic ID" },
          keywords: { type: "string", description: "Arabic keywords to filter" },
          limit: { type: "number", description: "Max results (default 10)" },
        },
        required: ["topicId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_source_content",
      description: "Get the full content of a scraped article so you can read it in detail.",
      parameters: {
        type: "object",
        properties: {
          sourceId: { type: "string", description: "The scraped article ID" },
        },
        required: ["sourceId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_previous_articles",
      description: "Get previously generated articles for a topic to avoid repeating content.",
      parameters: {
        type: "object",
        properties: {
          topicId: { type: "string", description: "The topic ID" },
        },
        required: ["topicId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "write_article",
      description: "Save the generated article. Call this when you're ready to publish.",
      parameters: {
        type: "object",
        properties: {
          topicId: { type: "string", description: "The topic ID" },
          title: { type: "string", description: "Arabic headline, 8-15 words" },
          excerpt: { type: "string", description: "2-3 sentence summary, 40-80 words" },
          paragraphs: { type: "array", items: { type: "string" }, description: "Array of paragraphs, at least 4, each 50-120 words" },
          sourceIds: { type: "array", items: { type: "string" }, description: "Scraped article IDs used as sources" },
          coverImageUrl: { type: "string", description: "Optional cover image URL from one of the sources" },
        },
        required: ["topicId", "title", "excerpt", "paragraphs", "sourceIds"],
      },
    },
  },
]

async function executeTool(tc: WriterToolCall): Promise<{ role: string; tool_call_id: string; name: string; content: string }> {
  const args = JSON.parse(tc.function.arguments)

  let result: unknown
  switch (tc.function.name) {
    case "search_topics":
      result = await searchTopics(args.query)
      break
    case "get_topic_summary":
      result = await getTopicSummary(args.topicId)
      break
    case "search_sources":
      result = await searchSources(args.topicId, args.keywords ?? "", args.limit ?? 10)
      break
    case "get_source_content":
      result = await getSourceContent(args.sourceId)
      break
    case "get_previous_articles":
      result = await getPreviousArticles(args.topicId)
      break
    default:
      result = { error: `Unknown tool: ${tc.function.name}` }
  }

  return {
    role: "tool",
    tool_call_id: tc.id,
    name: tc.function.name,
    content: JSON.stringify(result),
  }
}

export type WriterResult = {
  action: "write" | "skip"
  article?: { id: string; articleId: string; title: string }
  reason?: string
}

export async function runWriter(): Promise<WriterResult> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set")

  const messages: any[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: "Search for topics and write one article. Start by searching topics." },
  ]

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120000)

  try {
    while (true) {
      const res = await fetch(OPENROUTER_API_URL, {
        signal: controller.signal,
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "x-title": "News Article Writer",
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          tools: TOOLS,
          tool_choice: "auto",
          temperature: 0.6,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`OpenRouter request failed: ${res.status} ${text}`)
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string; tool_calls?: WriterToolCall[] } }[]
      }

      const msg = data.choices?.[0]?.message
      if (!msg) throw new Error("No response from OpenRouter")

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        messages.push({ role: "assistant", content: msg.content ?? "", tool_calls: msg.tool_calls })

        for (const tc of msg.tool_calls) {
          if (tc.function.name === "write_article") {
            // Execute write_article and return the result
            const args = JSON.parse(tc.function.arguments)
            const article = await writeArticle(
              args.topicId,
              args.title,
              args.excerpt,
              args.paragraphs,
              args.sourceIds,
              args.coverImageUrl,
            )
            return { action: "write", article }
          }
          const toolResult = await executeTool(tc)
          messages.push(toolResult)
        }
        continue
      }

      // No tool calls — check if it's a response with article or skip
      const raw = msg.content ?? ""
      try {
        const parsed = JSON.parse(raw)
        if (parsed.action === "write") {
          const article = await writeArticle(
            parsed.topicId,
            parsed.title,
            parsed.excerpt,
            parsed.paragraphs,
            parsed.sourceIds,
            parsed.coverImageUrl,
          )
          return { action: "write", article }
        }
        return { action: "skip", reason: parsed.reason ?? raw.slice(0, 200) }
      } catch {
        return { action: "skip", reason: `Unexpected response: ${raw.slice(0, 200)}` }
      }
    }
  } finally {
    clearTimeout(timeout)
  }
}
