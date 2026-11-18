import "server-only"

import { desc, eq, like, or, sql } from "drizzle-orm"

import { getDb } from "@/db/client"
import { generatedArticles, scrapedNews, topics } from "@/db/schema"

export const ADMIN_GENERATED_PAGE_SIZE = 20

export type GeneratedArticleListItem = {
  id: string
  title: string
  excerpt: string
  coverImageUrl: string | null
  imageUrls: string[]
  highlights: string[]
  topicId: string | null
  topicTitle: string | null
  sourceArticleIds: string[]
  isPublished: boolean
  views: number
  createdAt: Date
  updatedAt: Date
}

export type GeneratedArticleWithSources = GeneratedArticleListItem & {
  body: string
  sources: {
    id: string
    title: string
    excerpt: string
    url: string
    source: string
    imageUrl: string | null
    publishedAt: string | null
    scrapedAt: Date
  }[]
}

function parseJsonArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function rowToListItem(
  r: typeof generatedArticles.$inferSelect,
  topicTitle: string | null,
): GeneratedArticleListItem {
  return {
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    coverImageUrl: r.coverImageUrl,
    imageUrls: parseJsonArray(r.imageUrls),
    highlights: parseJsonArray(r.highlights),
    topicId: r.topicId,
    topicTitle,
    sourceArticleIds: parseJsonArray(r.sourceArticleIds),
    isPublished: r.isPublished,
    views: r.views,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }
}

export async function getAdminGeneratedArticlesPage(input: {
  page: number
  pageSize?: number
  q?: string
}): Promise<{ rows: GeneratedArticleListItem[]; total: number }> {
  const pageSize = input.pageSize ?? ADMIN_GENERATED_PAGE_SIZE
  const page = Math.max(1, input.page)
  const offset = (page - 1) * pageSize
  const db = getDb()

  const filter = input.q
    ? or(like(generatedArticles.title, `%${input.q}%`), like(generatedArticles.excerpt, `%${input.q}%`))
    : undefined

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(generatedArticles)
    .where(filter)

  const rows = await db
    .select()
    .from(generatedArticles)
    .where(filter)
    .orderBy(desc(generatedArticles.createdAt))
    .limit(pageSize)
    .offset(offset)

  // Fetch topic titles for the page
  const topicIds = [...new Set(rows.map((r) => r.topicId).filter(Boolean))] as string[]
  const topicMap = new Map<string, string>()
  if (topicIds.length > 0) {
    const topicRows = await db
      .select({ id: topics.id, title: topics.title })
      .from(topics)
    for (const t of topicRows) topicMap.set(t.id, t.title)
  }

  return {
    total: Number(total ?? 0),
    rows: rows.map((r) => rowToListItem(r, r.topicId ? (topicMap.get(r.topicId) ?? null) : null)),
  }
}

export async function getGeneratedArticleWithSources(
  id: string,
): Promise<GeneratedArticleWithSources | null> {
  const db = getDb()
  const [row] = await db
    .select()
    .from(generatedArticles)
    .where(eq(generatedArticles.id, id))
    .limit(1)

  if (!row) return null

  const sourceIds = parseJsonArray(row.sourceArticleIds)
  let sources: GeneratedArticleWithSources["sources"] = []

  if (sourceIds.length > 0) {
    const sourceRows = await db
      .select({
        id: scrapedNews.id,
        title: scrapedNews.title,
        excerpt: scrapedNews.excerpt,
        url: scrapedNews.url,
        source: scrapedNews.source,
        imageUrl: scrapedNews.imageUrl,
        publishedAt: scrapedNews.publishedAt,
        scrapedAt: scrapedNews.scrapedAt,
      })
      .from(scrapedNews)

    const sourceMap = new Map(sourceRows.map((s) => [s.id, s]))
    sources = sourceIds
      .map((id) => sourceMap.get(id))
      .filter((s): s is NonNullable<typeof s> => s !== undefined)
  }

  let topicTitle: string | null = null
  if (row.topicId) {
    const [t] = await db
      .select({ title: topics.title })
      .from(topics)
      .where(eq(topics.id, row.topicId))
      .limit(1)
    topicTitle = t?.title ?? null
  }

  return {
    ...rowToListItem(row, topicTitle),
    body: row.body,
    sources,
  }
}

/**
 * Manual (admin) generation: writes an UNPUBLISHED draft for the topic through the same prompt, quality gates
 * and cover handling as the pipeline (lib/generation/core.ts). The old standalone generator was removed.
 */
export async function generateAndSaveArticleForTopic(topicId: string): Promise<{ id: string; title: string }> {
  const { generateDraftForTopic } = await import("@/lib/generation/core")
  const { openCodeJson } = await import("@/lib/llm-json")
  const { uploadCoverWithDedup } = await import("@/lib/upload-image-dedup.server")
  return generateDraftForTopic(
    { db: getDb(), llm: openCodeJson, uploadCover: uploadCoverWithDedup, deadlineAt: Date.now() + 120_000 },
    topicId,
  )
}

/** Paginated list of topics with article counts for the admin topics page */
export async function getAdminTopicsPage(input: {
  page: number
  pageSize?: number
  q?: string
}): Promise<{ rows: typeof topics.$inferSelect[]; total: number }> {
  const pageSize = input.pageSize ?? ADMIN_GENERATED_PAGE_SIZE
  const page = Math.max(1, input.page)
  const offset = (page - 1) * pageSize
  const db = getDb()

  const filter = input.q
    ? like(topics.title, `%${input.q}%`)
    : undefined

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(topics)
    .where(filter)

  const rows = await db
    .select()
    .from(topics)
    .where(filter)
    .orderBy(desc(topics.updatedAt))
    .limit(pageSize)
    .offset(offset)

  return { total: Number(total ?? 0), rows }
}

/** Get all scraped_news rows for a topic (for the sources modal) */
export async function getSourceArticlesForTopic(topicId: string) {
  return getDb()
    .select({
      id: scrapedNews.id,
      title: scrapedNews.title,
      excerpt: scrapedNews.excerpt,
      url: scrapedNews.url,
      source: scrapedNews.source,
      imageUrl: scrapedNews.imageUrl,
      publishedAt: scrapedNews.publishedAt,
      scrapedAt: scrapedNews.scrapedAt,
    })
    .from(scrapedNews)
    .where(eq(scrapedNews.topicId, topicId))
    .orderBy(desc(scrapedNews.scrapedAt))
}
