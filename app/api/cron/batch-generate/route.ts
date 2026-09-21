import { getDb } from "@/db/client"
import { articles, categories, generatedArticles, scrapedNews, topics } from "@/db/schema"
import { eq, isNull, sql } from "drizzle-orm"
import { OPENROUTER_URL, OPENROUTER_MODEL, OPENROUTER_API_KEY } from "@/lib/openrouter"
import { uploadCoverWithDedup } from "@/lib/upload-image-dedup.server"
import { isDuplicateTitle } from "@/lib/article-dedup.server"
import { getCategoryQuotas } from "@/lib/db-generation-quota.server"

export const dynamic = "force-dynamic"

const CONCURRENCY = 4
const DEFAULT_LIMIT = 60

function event(name: string, data: Record<string, unknown>) {
  return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`
}

const CATEGORY_HINTS: Record<string, string> = {
  economy: "business, finance, markets, trade, money",
  sports: "sports, athletics, matches, tournaments",
  technology: "tech, AI, gadgets, software, internet",
  politics: "politics, diplomacy, government, international, conflicts, war",
  health: "health, medicine, diseases, nutrition",
  culture: "arts, cinema, music, literature, theater, celebrities",
  science: "science, space, research, discoveries",
  environment: "environment, climate, weather, nature, water, agriculture",
}

async function classifyAllTopics(): Promise<number> {
  const db = getDb()
  const allCats = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
  const idBySlug = Object.fromEntries(allCats.map((c) => [c.slug, c.id]))
  const unclassified = await db
    .select({ id: topics.id, title: topics.title })
    .from(topics)
    .where(isNull(topics.categoryId))

  if (unclassified.length === 0) return 0

  const catLines = allCats
    .map((c) => `- ${c.slug}: ${CATEGORY_HINTS[c.slug] ?? c.name}`)
    .join("\n")
  const systemPrompt = `You are a news classifier. Given articles with titles, assign each to the best category slug from the list below.\nCategories:\n${catLines}\nRespond with valid JSON only: {"classifications":[{"id":"<id>","category":"<slug>"}]}`

  // Classify in small chunks — one giant request can hang or exceed limits.
  const CHUNK = 25
  let updated = 0
  for (let i = 0; i < unclassified.length; i += CHUNK) {
    const chunk = unclassified.slice(i, i + CHUNK)
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify({ articles: chunk.map((t) => ({ id: t.id, title: t.title, excerpt: "" })) }) },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(45000),
      })
      if (!res.ok) continue
      const data = await res.json() as any
      const raw = data.choices?.[0]?.message?.content ?? "{}"
      const parsed = JSON.parse(raw) as { classifications?: { id: string; category: string }[] }
      for (const c of parsed.classifications ?? []) {
        const slug = String(c.category ?? "").trim().toLowerCase()
        const catId = idBySlug[slug]
        if (catId) {
          await db.update(topics).set({ categoryId: catId }).where(eq(topics.id, c.id))
          updated++
        }
      }
    } catch {
      // skip chunk on timeout/parse error
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

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: "system", content: "Write a comprehensive Arabic news article. Respond JSON: { title, excerpt, highlights[], paragraphs[] } where highlights is 3-5 bullet points. CRITICAL: Do NOT include any 'أبرز النقاط', 'ملخص', bullet lists, or summary sections inside the paragraphs — only flowing prose. Highlights go ONLY in the highlights field." },
        { role: "user", content: JSON.stringify({ topic: topic.title, sources }) },
      ],
      temperature: 0.6,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(90000),
  })

  const data = await res.json() as any
  const raw = data.choices?.[0]?.message?.content ?? "{}"
  const parsed = JSON.parse(raw) as { title: string; excerpt: string; paragraphs: string[]; highlights?: string[] }

  if (parsed.title && await isDuplicateTitle(parsed.title)) {
    console.log(`  SKIP (duplicate title): ${parsed.title}`)
    return null
  }

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

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const parsedLimit = Number.parseInt(url.searchParams.get("limit") ?? "", 10)
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : DEFAULT_LIMIT

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let finished = false
      const emit = (n: string, d: Record<string, unknown>) => { if (!finished) controller.enqueue(encoder.encode(event(n, d))) }
      const done = () => { if (!finished) { finished = true; controller.close() } }

      const timeout = setTimeout(() => { emit("error", { message: "Timed out" }); emit("complete", { timedOut: true }); done() }, 900000)

      try {
        emit("classify", { status: "started" })
        let classified = 0
        try {
          classified = await classifyAllTopics()
        } catch (err) {
          emit("error", { message: `classify failed: ${err instanceof Error ? err.message : String(err)}` })
        }
        emit("classify", { classified })

        const quotas = await getCategoryQuotas()
        const quotaById = new Map(quotas.map((q) => [q.id, q]))
        const usedThisRun = new Map<string, number>()

        const db = getDb()
        const unprocessed = await db
          .select({
            id: topics.id,
            title: topics.title,
            categoryId: topics.categoryId,
          })
          .from(topics)
          .leftJoin(generatedArticles, eq(topics.id, generatedArticles.topicId))
          .where(sql`${generatedArticles.id} IS NULL AND ${topics.isActive} = 1 AND ${topics.categoryId} IS NOT NULL`)
          .orderBy(sql`${topics.articleCount} DESC`)

        const queues = new Map<string, { id: string; title: string }[]>()
        for (const t of unprocessed) {
          if (!t.categoryId || !quotaById.has(t.categoryId)) continue
          const arr = queues.get(t.categoryId) ?? []
          arr.push({ id: t.id, title: t.title })
          queues.set(t.categoryId, arr)
        }

        const remaining = (catId: string) => {
          const q = quotaById.get(catId)
          if (!q) return 0
          return Math.max(0, q.dailyQuota - q.generatedToday - (usedThisRun.get(catId) ?? 0))
        }

        emit("plan", {
          limit,
          categories: quotas.map((q) => ({ slug: q.slug, quota: q.dailyQuota, generatedToday: q.generatedToday, remaining: q.remaining, queued: queues.get(q.id)?.length ?? 0 })),
        })

        const catOrder = [...queues.keys()]
        let rr = 0
        const pickNext = (): { id: string; title: string; catId: string } | null => {
          for (let i = 0; i < catOrder.length; i++) {
            const catId = catOrder[(rr + i) % catOrder.length]
            if (remaining(catId) <= 0) continue
            const q = queues.get(catId)
            if (!q || q.length === 0) continue
            rr = (rr + i + 1) % catOrder.length
            const t = q.shift()!
            usedThisRun.set(catId, (usedThisRun.get(catId) ?? 0) + 1)
            return { ...t, catId }
          }
          return null
        }

        let generated = 0
        let attempted = 0
        const inFlight = new Set<Promise<void>>()

        while (generated + inFlight.size < limit) {
          const next = pickNext()
          if (!next) break
          attempted++
          let p: Promise<void>
          p = (async () => {
            emit("generating", { topic: next.title, category: next.catId })
            let result: { title: string } | null = null
            try {
              result = await generateArticleForTopic(next.id)
            } catch (err) {
              emit("error", { message: err instanceof Error ? err.message : String(err) })
            }
            if (result) {
              generated++
              emit("generated", { title: result.title, category: next.catId })
            } else {
              emit("skipped", { topic: next.title, category: next.catId })
            }
          })().finally(() => { inFlight.delete(p) })
          inFlight.add(p)
          if (inFlight.size >= CONCURRENCY) await Promise.race(inFlight)
        }

        await Promise.all(inFlight)
        emit("complete", { classified, generated, attempted, limit })
      } finally {
        clearTimeout(timeout)
        done()
      }
    },
  })

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  })
}