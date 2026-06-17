import { getDb } from "@/db/client"
import { articles, categories, generatedArticles, scrapedNews, topics } from "@/db/schema"
import { eq, isNull, sql } from "drizzle-orm"
import { putR2Object } from "@/lib/r2.server"

export const dynamic = "force-dynamic"

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

  const apiKey = process.env.OPENROUTER_API_KEY

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
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

  const [topic] = await db.select().from(topics).where(eq(topics.id, topicId)).limit(1)
  if (!topic) return null

  const sourceRows = await db.select().from(scrapedNews).where(eq(scrapedNews.topicId, topicId))
  if (sourceRows.length === 0) return null

  const sources = sourceRows.map((r) => ({ id: r.id, title: r.title, content: r.content }))

  const apiKey = process.env.OPENROUTER_API_KEY

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: "Write a comprehensive Arabic news article. Respond JSON: { title, excerpt, paragraphs[] }" },
        { role: "user", content: JSON.stringify({ topic: topic.title, sources }) },
      ],
      temperature: 0.6,
      response_format: { type: "json_object" },
    }),
  })

  const data = await res.json() as any
  const raw = data.choices?.[0]?.message?.content ?? "{}"
  const parsed = JSON.parse(raw) as { title: string; excerpt: string; paragraphs: string[] }

  const body = JSON.stringify({
    type: "doc",
    content: (parsed.paragraphs ?? []).map((t: string) => ({ type: "paragraph", content: [{ type: "text", text: t }] })),
  })

  const imgSrc = sourceRows.find((r) => r.imageUrl)?.imageUrl ?? null
  let r2Url = imgSrc
  if (imgSrc && !imgSrc.includes("r2.dev")) {
    try {
      const ir = await fetch(imgSrc, { signal: AbortSignal.timeout(8000) })
      if (ir.ok) {
        const buf = Buffer.from(await ir.arrayBuffer())
        const ct = ir.headers.get("content-type") ?? "image/jpeg"
        const ext = ct.split("/")[1] ?? "jpg"
        const key = `articles/${crypto.randomUUID()}/cover.${ext}`
        r2Url = await putR2Object({ key, body: buf, contentType: ct })
      }
    } catch { /* ignore */ }
  }

  const genId = crypto.randomUUID()
  const articleId = crypto.randomUUID()
  const now = new Date()

  await db.insert(generatedArticles).values({
    id: genId, title: parsed.title, excerpt: parsed.excerpt ?? "", body,
    coverImageUrl: r2Url, imageUrls: JSON.stringify(r2Url ? [r2Url] : []),
    topicId, sourceArticleIds: JSON.stringify(sourceRows.map((r) => r.id)),
    isPublished: true,
  })

  await db.insert(articles).values({
    id: articleId, title: parsed.title, excerpt: parsed.excerpt ?? "", body,
    coverImageUrl: r2Url, categoryId: topic.categoryId,
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

      const timeout = setTimeout(() => { emit("error", { message: "Timed out" }); emit("complete", { timedOut: true }); done() }, 300000)

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

        for (const topic of unprocessed) {
          emit("generating", { topic: topic.title })
          try {
            const r = await generateArticleForTopic(topic.id)
            if (r) { generated++; emit("generated", { title: r.title }) }
            else { emit("skipped", { topic: topic.title }) }
          } catch (err: any) {
            emit("error", { topic: topic.title, message: err.message })
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
