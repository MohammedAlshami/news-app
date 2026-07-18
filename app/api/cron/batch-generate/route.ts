import { getDb } from "@/db/client"
import { articles, categories, generatedArticles, scrapedNews, topics } from "@/db/schema"
import { eq, isNull, sql } from "drizzle-orm"
import { OPENCODE_GO_URL, OPENCODE_GO_MODEL, OPENCODE_GO_KEY } from "@/lib/opencode-go"
import { uploadCoverWithDedup } from "@/lib/upload-image-dedup.server"

export const dynamic = "force-dynamic"

const CONCURRENCY = 3

function event(name: string, data: Record<string, unknown>) {
  return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`
}

async function classifyAllTopics(): Promise<number> {
  const db = getDb()
  const allCats = await db.select({ id: categories.id, name: categories.name }).from(categories)
  const unclassified = await db
    .select({ id: topics.id, title: topics.title })
    .from(topics)
    .where(isNull(topics.categoryId))

  if (unclassified.length === 0) return 0

  const res = await fetch(OPENCODE_GO_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENCODE_GO_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OPENCODE_GO_MODEL,
      messages: [
        { role: "system", content: `Assign each topic to the best category. Respond JSON: { "assignments": [{ "topicId": "...", "categoryId": "..." }] }` },
        { role: "user", content: JSON.stringify({ categories: allCats, topics: unclassified }) },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  })

  const data = await res.json() as any
  const raw = data.choices?.[0]?.message?.content ?? "{}"
  const parsed = JSON.parse(raw) as { assignments: { topicId: string; categoryId: string }[] }

  let updated = 0
  for (const a of parsed.assignments ?? []) {
    if (a.categoryId && allCats.some((c) => c.id === a.categoryId)) {
      await db.update(topics).set({ categoryId: a.categoryId }).where(eq(topics.id, a.topicId))
      updated++
    }
  }
  return updated
}

async function generateArticleForTopic(topicId: string): Promise<{ title: string } | null> {
  const db = getDb()

  const existing = await db
    .select({ id: generatedArticles.id })
    .from(generatedArticles)
    .where(eq(generatedArticles.topicId, topicId))
    .limit(1)
  if (existing.length > 0) {
    return null
  }

  const [topic] = await db.select().from(topics).where(eq(topics.id, topicId)).limit(1)
  if (!topic) return null

  const sourceRows = await db.select().from(scrapedNews).where(eq(scrapedNews.topicId, topicId))
  if (sourceRows.length === 0) return null

  const sources = sourceRows.map((r) => ({ id: r.id, title: r.title, content: r.content }))

  const imageSource = sourceRows.find((r) => r.imageUrl)
  if (!imageSource) {
    console.log(`  SKIP (no image): ${topic.title}`)
    return null
  }

  const res = await fetch(OPENCODE_GO_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENCODE_GO_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OPENCODE_GO_MODEL,
      messages: [
        { role: "system", content: "Write a comprehensive Arabic news article. Respond JSON: { title, excerpt, highlights[], paragraphs[] } where highlights is 3-5 bullet points. CRITICAL: Do NOT include any 'أبرز النقاط', 'ملخص', bullet lists, or summary sections inside the paragraphs — only flowing prose. Highlights go ONLY in the highlights field." },
        { role: "user", content: JSON.stringify({ topic: topic.title, sources }) },
      ],
      temperature: 0.6,
      response_format: { type: "json_object" },
    }),
  })

  const data = await res.json() as any
  const raw = data.choices?.[0]?.message?.content ?? "{}"
  const parsed = JSON.parse(raw) as { title: string; excerpt: string; paragraphs: string[]; highlights?: string[] }

  const cleanParagraphs = (parsed.paragraphs ?? []).filter((p: string) => {
    const trimmed = p.trim()
    if (/^أبرز النقاط/.test(trimmed)) return false
    if (/^ملخص/.test(trimmed)) return false
    if (/^الخلاصة/.test(trimmed)) return false
    return true
  })

  const body = JSON.stringify({
    type: "doc",
    content: cleanParagraphs.map((t: string) => ({ type: "paragraph", content: [{ type: "text", text: t }] })),
  })

  const imgSrc = imageSource.imageUrl!
  const r2Url = await uploadCoverWithDedup(imgSrc, topicId)

  const genId = crypto.randomUUID()
  const articleId = crypto.randomUUID()
  const now = new Date()
  const highlights = Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 5) : []

  await db.insert(generatedArticles).values({
    id: genId, title: parsed.title, excerpt: parsed.excerpt ?? "", body,
    coverImageUrl: r2Url, originalCoverImageUrl: imgSrc,
    imageUrls: JSON.stringify(r2Url ? [r2Url] : []),
    highlights: JSON.stringify(highlights),
    topicId, sourceArticleIds: JSON.stringify(sourceRows.map((r) => r.id)),
    isPublished: true,
  })

  await db.insert(articles).values({
    id: articleId, title: parsed.title, excerpt: parsed.excerpt ?? "", body,
    coverImageUrl: r2Url, originalCoverImageUrl: imgSrc,
    highlights: JSON.stringify(highlights),
    categoryId: topic.categoryId,
    isPublished: true, views: 0, createdAt: now, updatedAt: now,
  })

  await db.update(topics).set({ updatedAt: now }).where(eq(topics.id, topicId))
  return { title: parsed.title }
}

export async function GET(): Promise<Response> {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let finished = false
      const emit = (n: string, d: Record<string, unknown>) => { if (!finished) controller.enqueue(encoder.encode(event(n, d))) }
      const done = () => { if (!finished) { finished = true; controller.close() } }

      const timeout = setTimeout(() => { emit("error", { message: "Timed out" }); emit("complete", { timedOut: true }); done() }, 600000)

      try {
        emit("classify", { status: "started" })
        const classified = await classifyAllTopics()
        emit("classify", { classified })

        const db = getDb()
        const unprocessed = await db
          .select({ id: topics.id, title: topics.title, categoryId: topics.categoryId })
          .from(topics)
          .leftJoin(generatedArticles, eq(topics.id, generatedArticles.topicId))
          .where(sql`${generatedArticles.id} IS NULL`)

        emit("generate", { total: unprocessed.length })
        let generated = 0

        for (let i = 0; i < unprocessed.length; i += CONCURRENCY) {
          const chunk = unprocessed.slice(i, i + CONCURRENCY)
          const results = await Promise.allSettled(
            chunk.map(async (topic) => {
              emit("generating", { topic: topic.title })
              const r = await generateArticleForTopic(topic.id)
              return { topic, result: r }
            }),
          )

          for (const r of results) {
            if (r.status === "fulfilled") {
              if (r.value.result) {
                generated++
                emit("generated", { title: r.value.result.title })
              } else {
                emit("skipped", { topic: r.value.topic.title })
              }
            } else {
              emit("error", { message: r.reason?.message ?? "Unknown error" })
            }
          }
        }

        emit("complete", { classified, generated })
      } finally { clearTimeout(timeout); done() }
    },
  })

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  })
}
