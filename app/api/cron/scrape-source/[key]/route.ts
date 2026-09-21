import { NextResponse } from "next/server"
import { getNewsSourceByKey, getLastScrapedAt, updateLastScrapedAt } from "@/lib/db-news-sources.server"
import { findKnownUrls, insertScrapedNewsRows } from "@/lib/db-scraped-news.server"
import { createNewsScraper, getSupportedCategories, type ScraperSourceKey } from "@/lib/news-scraper"

export const dynamic = "force-dynamic"

/**
 * Scrape one source. Clustering is NOT run here any more: `/api/cron/cluster` runs it once
 * per cycle for all sources (running it per source re-processed the same rows 12× an hour).
 */
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

  const results: { category: string; inserted: number; skipped: number; error?: string }[] = []
  const now = new Date()

  for (const category of categories) {
    // One failing category page must not abort the whole source.
    try {
      const result = await scraper.scrape({
        category,
        filterKnown: (urls) => findKnownUrls(key, urls),
      })
      if (result.items.length === 0) {
        results.push({ category, inserted: 0, skipped: 0 })
        continue
      }

      // Duplicates are handled by URL (unique index); no date filter here — a date filter
      // silently drops late-discovered items and mis-parses timezone-less dates.
      const filled = result.items.map((item) => ({
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
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`scrape ${key}/${category} failed: ${message}`)
      results.push({ category, inserted: 0, skipped: 0, error: message })
    }
  }

  const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0)
  const failedCategories = results.filter((r) => r.error).length
  const nowIso = now.toISOString()
  // Only advance lastScrapedAt when at least one category worked.
  if (failedCategories < results.length) await updateLastScrapedAt(key, nowIso)

  return NextResponse.json({
    ok: true,
    source: key,
    lastScrapedAt: nowIso,
    previousScrape: lastScrapedAt?.toISOString() ?? null,
    results,
    totalInserted,
    failedCategories,
  })
}
