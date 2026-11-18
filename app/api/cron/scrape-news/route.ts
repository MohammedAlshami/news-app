import { NextResponse } from "next/server"

import { requireCronOrAdmin } from "@/lib/admin-guard.server"

import { saveScrapeResult } from "@/lib/db-scraped-news.server"
import { getEnabledSourceKeys } from "@/lib/db-news-sources.server"
import { findKnownUrls } from "@/lib/db-scraped-news.server"
import { runClusteringNow } from "@/lib/clustering/run-now.server"
import { createNewsScraper, getSupportedCategories, type ScraperSourceKey } from "@/lib/news-scraper"

export const dynamic = "force-dynamic"

type CronSummary = {
  sourceKey: ScraperSourceKey
  category: string
  inserted: number
  skipped: number
  sourcePage: string
  query?: string
}

async function runSource(
  sourceKey: ScraperSourceKey,
  totalLimit: number,
  singleCategory?: string,
): Promise<CronSummary[]> {
  const scraper = createNewsScraper(sourceKey)
  const allCategories = getSupportedCategories(sourceKey)
  const categories = singleCategory
    ? allCategories.filter((c) => c.toLowerCase() === singleCategory.toLowerCase())
    : allCategories
  
  if (categories.length === 0) {
    return []
  }
  
  const summaries: CronSummary[] = []
  let remaining = totalLimit

  for (const category of categories) {
    if (remaining <= 0) break
    const result = await scraper.scrape({ category, filterKnown: (urls) => findKnownUrls(sourceKey, urls) })
    // Trim items to whatever is left of the limit
    result.items = result.items.slice(0, remaining)
    const saved = await saveScrapeResult(result)
    summaries.push(saved)
    remaining -= saved.inserted
  }

  return summaries
}

export async function GET(request: Request) {
  const denied = await requireCronOrAdmin(request)
  if (denied) return denied
  const url = new URL(request.url)
  // ?limit=N caps total articles inserted across all sources (default: unlimited)
  const limitParam = url.searchParams.get("limit")
  const limit = limitParam ? Math.max(1, Number(limitParam) || 10) : Infinity
  
  // ?category=X to scrape only a specific category
  const categoryParam = url.searchParams.get("category")

  // 1. Only scrape sources that are enabled in the DB
  const enabledKeys = await getEnabledSourceKeys()

  if (enabledKeys.length === 0) {
    return NextResponse.json({ ok: true, message: "No sources enabled.", sources: {}, topics: null })
  }

  // Split limit evenly across sources
  const perSource = limit === Infinity ? Infinity : Math.ceil(limit / enabledKeys.length)

  // sequential: bounded concurrency/subrequests; one failing source must not lose the others
  const results: { key: ScraperSourceKey; summaries: CronSummary[] }[] = []
  for (const key of enabledKeys) {
    try {
      results.push({ key, summaries: await runSource(key, perSource === Infinity ? 999999 : perSource, categoryParam ?? undefined) })
    } catch (err) {
      console.error(`scrape-news ${key} failed: ${err instanceof Error ? err.message : String(err)}`)
      results.push({ key, summaries: [] })
    }
  }

  const sources = Object.fromEntries(results.map(({ key, summaries }) => [key, summaries]))

  // 2. Cluster freshly scraped articles into topics
  const clustered = await runClusteringNow({ budgetMs: 120_000 })
  const topicSummary = clustered.busy ? { busy: true } : clustered.stats

  return NextResponse.json({ ok: true, sources, topics: topicSummary })
}
