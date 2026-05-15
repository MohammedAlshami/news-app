import { NextResponse } from "next/server"

import { saveScrapeResult } from "@/lib/db-scraped-news.server"
import { getEnabledSourceKeys } from "@/lib/db-news-sources.server"
import { runTopicGrouping } from "@/lib/db-topics.server"
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
    const result = await scraper.scrape({ category })
    // Trim items to whatever is left of the limit
    result.items = result.items.slice(0, remaining)
    const saved = await saveScrapeResult(result)
    summaries.push(saved)
    remaining -= saved.inserted
  }

  return summaries
}

export async function GET(request: Request) {
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

  const results = await Promise.all(
    enabledKeys.map(async (key) => ({
      key,
      summaries: await runSource(key, perSource === Infinity ? 999999 : perSource, categoryParam ?? undefined),
    })),
  )

  const sources = Object.fromEntries(results.map(({ key, summaries }) => [key, summaries]))

  // 2. Group freshly scraped articles into topics via AI
  const topicSummary = await runTopicGrouping()

  return NextResponse.json({ ok: true, sources, topics: topicSummary })
}
