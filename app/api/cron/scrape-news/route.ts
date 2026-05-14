import { NextResponse } from "next/server"

import { saveScrapeResult } from "@/lib/db-scraped-news.server"
import { runTopicGrouping } from "@/lib/db-topics.server"
import { createNewsScraper, getSupportedCategories, type ScraperSourceKey } from "@/lib/news-scraper"

export const dynamic = "force-dynamic"

type CronSummary = {
  sourceKey: ScraperSourceKey
  category: string
  inserted: number
  sourcePage: string
  query?: string
}

async function runSource(sourceKey: ScraperSourceKey): Promise<CronSummary[]> {
  const scraper = createNewsScraper(sourceKey)
  const categories = getSupportedCategories(sourceKey)
  const summaries: CronSummary[] = []

  for (const category of categories) {
    const result = await scraper.scrape({ category })
    const saved = await saveScrapeResult(result)
    summaries.push(saved)
  }

  return summaries
}

export async function GET() {
  // 1. Scrape all sources in parallel
  const [rt, independent] = await Promise.all([runSource("rt"), runSource("independent")])

  // 2. Group the freshly scraped articles into topics via AI
  const topicSummary = await runTopicGrouping()

  return NextResponse.json({
    ok: true,
    sources: { rt, independent },
    topics: topicSummary,
  })
}
