import { getDb } from "@/db/client"
import { articles, generatedArticles, scrapedNews, topics } from "@/db/schema"
import { desc, eq, sql } from "drizzle-orm"
import { OPENROUTER_URL, OPENROUTER_MODEL, OPENROUTER_API_KEY } from "@/lib/openrouter"
import { uploadCoverWithDedup } from "@/lib/upload-image-dedup.server"
import { isDuplicateTitle } from "@/lib/article-dedup.server"
import { getCategoryQuotas } from "@/lib/db-generation-quota.server"

const WRITE_PROMPT = `
You are a professional Arabic news journalist. Write a comprehensive news article.

You will receive:
- "topic": the topic title in Arabic
- "sources": array of { id, title, excerpt, content, url, source, imageUrl }
- "previousArticles": array of { title, excerpt } from previously generated articles on this topic

Your job:
1. Write a well-structured Arabic news article that synthesises all the source material.
2. The article should be objective, informative, and written in Modern Standard Arabic (فصحى).
3. Structure the body as multiple paragraphs covering different angles of the story.
4. Generate 3-5 bullet-point highlights that summarize the most important takeaways.

STRICT RULES:
- If the SAME story is already covered in previousArticles → respond with { "action": "skip", "reason": "..." }
- If less than 2 sources have content → skip
- Title must be 8-15 words, MUST differ from any previous article title
- Write ONLY about this topic. DO NOT introduce unrelated subjects.
- Paragraphs must contain ONLY flowing prose — no bullet lists, no "أبرز النقاط", "ملخص", "الخلاصة" inside paragraphs.

Respond with valid JSON:
{
  "action": "write" | "skip",
  "title": "<Arabic headline>",
  "excerpt": "<2-3 sentence summary>",
  "paragraphs": ["<paragraph 1>", "<paragraph 2>", ...],
  "highlights": ["<highlight 1>", "<highlight 2>", ...],
  "sourceIds": ["<source id 1>", ...],
  "coverImageUrl": "<first source image URL>",
  "reason": "<reason if skipped>"
}
`.trim()

export type WriterResult = {
  action: "write" | "skip"
  article?: { id: string; articleId: string; title: string }
  reason?: string
}

type CandidateTopic = {
  id: string
  title: string
  articleCount: number
  categoryId: string | null
  parentId: string | null
  type: "persistent" | "event"
}

type SourceRow = {
  id: string
  title: string
  excerpt: string
  content: string | null
  url: string
  source: string
  imageUrl: string | null
}

export async function runWriter(): Promise<WriterResult> {
  if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not set")

  const db = getDb()

  const candidates = await db
    .select({
      id: topics.id,
      title: topics.title,
      articleCount: topics.articleCount,
      categoryId: topics.categoryId,
      parentId: topics.parentId,
      type: topics.type,
    })
    .from(topics)
    .leftJoin(generatedArticles, eq(topics.id, generatedArticles.topicId))
    .where(sql`${generatedArticles.id} IS NULL AND ${topics.isActive} = 1 AND ${topics.categoryId} IS NOT NULL`)
    .orderBy(desc(topics.articleCount))
    .limit(200)

  if (candidates.length === 0) {
    return { action: "skip", reason: "No candidate topics without generated articles" }
  }

  // Category-balanced: prefer categories that still have daily quota left,
  // so low-volume categories (technology, science, environment) aren't starved
  // by high-volume ones (sports, politics, economy).
  const quotas = await getCategoryQuotas()
  const remainingByCat = new Map(quotas.map((q) => [q.id, q.remaining]))
  const byCategory = new Map<string, CandidateTopic[]>()
  for (const c of candidates) {
    if (!c.categoryId) continue
    const arr = byCategory.get(c.categoryId) ?? []
    arr.push(c)
    byCategory.set(c.categoryId, arr)
  }
  const orderedCandidates = [...byCategory.values()]
    .sort(
      (a, b) =>
        (remainingByCat.get(b[0].categoryId ?? "") ?? 0) -
        (remainingByCat.get(a[0].categoryId ?? "") ?? 0),
    )
    .flat()

  for (const candidate of orderedCandidates) {
    if ((remainingByCat.get(candidate.categoryId ?? "") ?? 0) <= 0) continue

    const sources = await loadSources(candidate.id)
    const withContent = sources.filter((s) => s.content)
    const withImages = sources.filter((s) => s.imageUrl)

    // Single-source topics are allowed (technology/science often have only one
    // outlet covering an event); an image is still required.
    if (withContent.length < 1 || withImages.length === 0) continue

    const previous = await loadPrevious(candidate.id)
    const coverImageUrl = withImages[0].imageUrl!

    const result = await generateSingle(candidate, withContent, previous)
    if (!result || result.action === "skip") continue
    if (!result.title || !result.excerpt || !result.paragraphs) continue

    if (await isDuplicateTitle(result.title)) {
      console.log(`  SKIP (duplicate title): ${result.title}`)
      continue
    }

    const r2Url = await uploadCoverWithDedup(coverImageUrl, candidate.id)

    const genId = crypto.randomUUID()
    const articleId = crypto.randomUUID()
    const now = new Date()

    const body = JSON.stringify({
      type: "doc",
      content: result.paragraphs.map((text: string) => ({
        type: "paragraph",
        content: [{ type: "text", text }],
      })),
    })

    const highlights = JSON.stringify(Array.isArray(result.highlights) ? result.highlights.slice(0, 5) : [])
    const sourceIds = JSON.stringify(result.sourceIds ?? withContent.map((s) => s.id))

    await db.insert(generatedArticles).values({
      id: genId,
      title: result.title,
      excerpt: result.excerpt,
      body,
      coverImageUrl: r2Url,
      originalCoverImageUrl: coverImageUrl,
      imageUrls: JSON.stringify([r2Url]),
      highlights,
      topicId: candidate.id,
      sourceArticleIds: sourceIds,
      isPublished: true,
    })

    await db.insert(articles).values({
      id: articleId,
      title: result.title,
      excerpt: result.excerpt,
      body,
      coverImageUrl: r2Url,
      originalCoverImageUrl: coverImageUrl,
      highlights,
      categoryId: candidate.categoryId,
      isPublished: true,
      views: 0,
      createdAt: now,
      updatedAt: now,
    })

    await db
      .update(topics)
      .set({ updatedAt: now })
      .where(eq(topics.id, candidate.id))

    return { action: "write", article: { id: genId, articleId, title: result.title } }
  }

  return { action: "skip", reason: "No suitable topic found after checking all candidates" }
}

async function loadSources(topicId: string): Promise<SourceRow[]> {
  const db = getDb()
  return db
    .select({
      id: scrapedNews.id,
      title: scrapedNews.title,
      excerpt: scrapedNews.excerpt,
      content: scrapedNews.content,
      url: scrapedNews.url,
      source: scrapedNews.source,
      imageUrl: scrapedNews.imageUrl,
    })
    .from(scrapedNews)
    .where(eq(scrapedNews.topicId, topicId))
    .orderBy(desc(scrapedNews.scrapedAt))
}

async function loadPrevious(topicId: string) {
  const db = getDb()
  const rows = await db
    .select({ title: generatedArticles.title, excerpt: generatedArticles.excerpt })
    .from(generatedArticles)
    .where(eq(generatedArticles.topicId, topicId))
    .orderBy(desc(generatedArticles.createdAt))
    .limit(10)
  return rows
}

async function generateSingle(
  candidate: CandidateTopic,
  sources: SourceRow[],
  previous: { title: string; excerpt: string }[],
): Promise<{
  action: string
  title?: string
  excerpt?: string
  paragraphs?: string[]
  highlights?: string[]
  sourceIds?: string[]
  reason?: string
} | null> {
  const userMessage = JSON.stringify({
    topic: candidate.title,
    sources: sources.map((s) => ({
      id: s.id,
      title: s.title,
      excerpt: s.excerpt,
      content: s.content,
      url: s.url,
      source: s.source,
      imageUrl: s.imageUrl,
    })),
    previousArticles: previous,
  })

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: "system", content: WRITE_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.6,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`OpenRouter write request failed: ${res.status} ${text}`)
      return null
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }

    const raw = data.choices?.[0]?.message?.content ?? "{}"
    const parsed = JSON.parse(raw) as {
      action?: string
      title?: string
      excerpt?: string
      paragraphs?: string[]
      highlights?: string[]
      sourceIds?: string[]
      reason?: string
    }

    if (parsed.action === "skip") {
      console.log(`  SKIP (AI): ${parsed.reason ?? "No reason"}`)
      return null
    }

    if (
      !parsed.title ||
      !parsed.excerpt ||
      !Array.isArray(parsed.paragraphs) ||
      parsed.paragraphs.length < 2
    ) {
      console.error(`  SKIP (invalid): missing required fields in response`)
      return null
    }

    const cleanParagraphs = parsed.paragraphs.filter((p: string) => {
      const t = p.trim()
      return !/^(أبرز النقاط|ملخص|الخلاصة)/.test(t)
    })

    return {
      action: "write",
      title: parsed.title,
      excerpt: parsed.excerpt,
      paragraphs: cleanParagraphs,
      highlights: (parsed.highlights ?? []).slice(0, 5),
      sourceIds: parsed.sourceIds ?? sources.map((s) => s.id),
    }
  } catch (err) {
    console.error(`  ERROR generating article: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}
