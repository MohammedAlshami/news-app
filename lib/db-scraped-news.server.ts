import "server-only"

import { desc, eq, like, or, sql } from "drizzle-orm"

import { getDb } from "@/db/client"
import { scrapedNews } from "@/db/schema"
import type { ScrapeResult, ScrapedNewsItem, ScraperSourceKey } from "@/lib/news-scraper"

export const ADMIN_SCRAPED_PAGE_SIZE = 20

export type ScrapeJobRow = typeof scrapedNews.$inferSelect

export type AdminScrapedNewsListItem = {
  id: string
  source: string
  sourceKey: string
  category: string
  query?: string | null
  title: string
  excerpt: string
  content?: string | null
  url: string
  imageUrl?: string | null
  publishedAt?: string | null
  scrapedAt: Date
}

export async function insertScrapedNewsRows(input: {
  sourceKey: ScraperSourceKey
  source: string
  category: string
  query?: string
  items: ScrapedNewsItem[]
}) {
  if (input.items.length === 0) return 0
  const db = getDb()

  // Deduplicate within the batch itself first
  const uniqueItems = input.items.filter(
    (item, idx, arr) => arr.findIndex((i) => i.url === item.url) === idx,
  )

  // Skip any item without an image — no fallback images allowed
  const withImages = uniqueItems.filter((item) => !!item.imageUrl?.trim())

  // Fetch all existing URLs for this source in one query to avoid N round-trips
  const existingRows = await db
    .select({ url: scrapedNews.url })
    .from(scrapedNews)
    .where(eq(scrapedNews.sourceKey, input.sourceKey))

  const existingUrls = new Set(existingRows.map((r) => r.url))

  // Filter out anything already in the DB
  const newItems = withImages.filter((item) => !existingUrls.has(item.url))

  if (newItems.length === 0) return 0

  // Insert one row at a time to stay within D1 SQL variable limits
  for (const item of newItems) {
    await db.insert(scrapedNews).values({
      source: input.source,
      sourceKey: input.sourceKey,
      category: input.category,
      query: input.query ?? null,
      title: item.title,
      excerpt: item.excerpt,
      content: item.content ?? null,
      url: item.url,
      imageUrl: item.imageUrl ?? null,
      publishedAt: item.publishedAt ?? null,
      rawJson: JSON.stringify(item.rawJson),
    })
  }

  return newItems.length
}

export async function getRecentScrapedNews(limit = 20): Promise<ScrapeJobRow[]> {
  return getDb()
    .select()
    .from(scrapedNews)
    .orderBy(desc(scrapedNews.scrapedAt))
    .limit(limit)
}

export async function countScrapedNewsBySource(sourceKey: ScraperSourceKey): Promise<number> {
  const rows = await getDb()
    .select({ count: sql<number>`count(*)` })
    .from(scrapedNews)
    .where(eq(scrapedNews.sourceKey, sourceKey))
  return Number(rows[0]?.count ?? 0)
}

export type ScrapeRunSummary = {
  sourceKey: ScraperSourceKey
  source: string
  category: string
  inserted: number
  skipped: number
  sourcePage: string
  query?: string
}

export async function saveScrapeResult(result: ScrapeResult): Promise<ScrapeRunSummary> {
  const inserted = await insertScrapedNewsRows({
    sourceKey: result.sourceKey,
    source: result.source,
    category: result.category,
    query: result.query,
    items: result.items,
  })
  return {
    sourceKey: result.sourceKey,
    source: result.source,
    category: result.category,
    inserted,
    skipped: result.items.length - inserted,
    sourcePage: result.sourcePage,
    query: result.query,
  }
}

export async function getAdminScrapedNewsListPage(input: {
  page: number
  pageSize?: number
  q?: string
}): Promise<{ rows: AdminScrapedNewsListItem[]; total: number }> {
  const pageSize = input.pageSize ?? ADMIN_SCRAPED_PAGE_SIZE
  const page = Math.max(1, input.page)
  const offset = (page - 1) * pageSize
  const db = getDb()

  const filter = input.q
    ? or(
        like(scrapedNews.title, `%${input.q}%`),
        like(scrapedNews.excerpt, `%${input.q}%`),
        like(scrapedNews.source, `%${input.q}%`),
      )
    : undefined

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(scrapedNews)
    .where(filter)

  const rows = await db
    .select()
    .from(scrapedNews)
    .where(filter)
    .orderBy(desc(scrapedNews.scrapedAt))
    .limit(pageSize)
    .offset(offset)
  return {
    total: Number(total ?? 0),
    rows: rows.map((r) => ({
      id: r.id,
      source: r.source,
      sourceKey: r.sourceKey,
      category: r.category,
      query: r.query,
      title: r.title,
      excerpt: r.excerpt,
      content: r.content,
      url: r.url,
      imageUrl: r.imageUrl,
      publishedAt: r.publishedAt,
      scrapedAt: r.scrapedAt,
    })),
  }
}
