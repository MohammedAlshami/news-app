import "server-only"

import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm"

import { getDb, type AppDb } from "@/db/client"
import { scrapedNews } from "@/db/schema"
import type { ScrapeResult, ScrapedNewsItem, ScraperSourceKey } from "@/lib/news-scraper"
import { parsePublishedTs } from "@/lib/published-ts"
import { canonicalizeUrl } from "@/lib/url-canonical"

export const ADMIN_SCRAPED_PAGE_SIZE = 20

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

/** Which of these canonical URLs are already stored for the source (chunked, uses the unique index). */
export async function findKnownUrls(sourceKey: string, urls: string[], db: AppDb = getDb()): Promise<Set<string>> {
  const known = new Set<string>()
  for (let i = 0; i < urls.length; i += 80) {
    const part = urls.slice(i, i + 80)
    const rows = await db
      .select({ url: scrapedNews.url })
      .from(scrapedNews)
      .where(and(eq(scrapedNews.sourceKey, sourceKey), inArray(scrapedNews.url, part)))
    for (const r of rows) known.add(r.url)
  }
  return known
}

export async function insertScrapedNewsRows(
  input: {
    sourceKey: ScraperSourceKey
    source: string
    category: string
    query?: string
    items: ScrapedNewsItem[]
  },
  db: AppDb = getDb(),
  now: number = Date.now(),
) {
  if (input.items.length === 0) return 0

  // Canonicalize + dedupe inside the batch
  const seen = new Set<string>()
  const unique = input.items
    .map((item) => ({ ...item, url: canonicalizeUrl(item.url) }))
    .filter((item) => (seen.has(item.url) ? false : (seen.add(item.url), true)))

  // Skip any item without an image — no fallback images allowed
  const withImages = unique.filter((item) => !!item.imageUrl?.trim())
  if (withImages.length === 0) return 0

  const known = await findKnownUrls(input.sourceKey, withImages.map((i) => i.url), db)
  const newItems = withImages.filter((item) => !known.has(item.url))
  if (newItems.length === 0) return 0

  // One row at a time (D1 statement size); the unique (source_key, url) index makes races harmless.
  let inserted = 0
  for (const item of newItems) {
    const rows = await db
      .insert(scrapedNews)
      .values({
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
        publishedTs: parsePublishedTs(item.publishedAt, now) ?? now,
        status: "pending",
        rawJson: JSON.stringify(item.rawJson),
      })
      .onConflictDoNothing()
      .returning({ id: scrapedNews.id })
    inserted += rows.length
  }

  return inserted
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
