import { NextResponse } from "next/server"
import { getNewsSourceByKey, getLastScrapedAt, updateLastScrapedAt } from "@/lib/db-news-sources.server"
import { saveScrapeResult, insertScrapedNewsRows } from "@/lib/db-scraped-news.server"
import { createNewsScraper, getSupportedCategories, type ScraperSourceKey } from "@/lib/news-scraper"
import { runTopicGrouping } from "@/lib/db-topics.server"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
): Promise<Response> {
  const { key } = await params
  const source = await getNewsSourceByKey(key)
  if (!source) {
    return NextResponse.json({ ok: false, error: `Source "${key}" not found` }, { status: 404 })
  }
  if (!source.isEnabled) {
    return NextResponse.json({ ok: false, error: `Source "${key}" is disabled` })
  }

  const lastScrapedAt = getLastScrapedAt(source)
  const scraper = createNewsScraper(key as ScraperSourceKey)
  const categories = getSupportedCategories(key as ScraperSourceKey)

  const results: { category: string; inserted: number; skipped: number }[] = []
  const now = new Date()

  for (const category of categories) {
    const result = await scraper.scrape({ category })
    if (result.items.length === 0) {
      results.push({ category, inserted: 0, skipped: 0 })
      continue
    }

    // Use lastScrapedAt to filter: only keep items with publishedAt >= lastScrapedAt.
    // If publishedAt is missing, fall back to current time (so freshly scraped items pass through).
    const filtered = lastScrapedAt
      ? result.items.filter((item) => {
          if (!item.publishedAt) return true // no date → include
          const d = new Date(item.publishedAt)
          return isNaN(d.getTime()) || d >= lastScrapedAt
        })
      : result.items

    if (filtered.length === 0) {
      results.push({ category, inserted: 0, skipped: 0 })
      continue
    }

    // Fill missing publishedAt with current scrape time
    const filled = filtered.map((item) => ({
      ...item,
      publishedAt: item.publishedAt || now.toISOString(),
    }))

    const inserted = await insertScrapedNewsRows({
      sourceKey: result.sourceKey,
      source: result.source,
      category: result.category,
      query: result.query,
      items: filled,
    })
    results.push({ category, inserted, skipped: filled.length - inserted })
  }

  const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0)
  const nowIso = now.toISOString()
  await updateLastScrapedAt(key, nowIso)

  // Run topic grouping if new articles were scraped
  let topicsGrouped = null
  if (totalInserted > 0) {
    try {
      topicsGrouped = await runTopicGrouping()
    } catch (err) {
      console.error(`Topic grouping after ${key}:`, err)
    }
  }

  return NextResponse.json({
    ok: true,
    source: key,
    lastScrapedAt: nowIso,
    previousScrape: lastScrapedAt?.toISOString() ?? null,
    results,
    totalInserted,
    topicsGrouped,
  })
}
