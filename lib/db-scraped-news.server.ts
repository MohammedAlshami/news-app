import "server-only"

import { desc, eq, sql } from "drizzle-orm"

import { getDb } from "@/db/client"
import { scrapedNews } from "@/db/schema"
import type { ScrapeResult, ScrapedNewsItem, ScraperSourceKey } from "@/lib/news-scraper"

export type ScrapeJobRow = typeof scrapedNews.$inferSelect

export async function insertScrapedNewsRows(input: {
  sourceKey: ScraperSourceKey
  source: string
  category: string
  query?: string
  items: ScrapedNewsItem[]
}) {
  if (input.items.length === 0) return 0
  const db = getDb()
  await db.insert(scrapedNews).values(
    input.items.map((item) => ({
      source: input.source,
      sourceKey: input.sourceKey,
      category: input.category,
      query: input.query ?? null,
      title: item.title,
      excerpt: item.excerpt,
      url: item.url,
      imageUrl: item.imageUrl ?? null,
      publishedAt: item.publishedAt ?? null,
      rawJson: JSON.stringify(item.rawJson),
    })),
  )
  return input.items.length
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
    sourcePage: result.sourcePage,
    query: result.query,
  }
}
