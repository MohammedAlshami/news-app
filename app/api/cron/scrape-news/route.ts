import { NextResponse } from "next/server"

import { createNewsScraper, getSupportedCategories, type ScraperSourceKey } from "@/lib/news-scraper"
import { saveScrapeResult } from "@/lib/db-scraped-news.server"

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
  const [rt, independent] = await Promise.all([runSource("rt"), runSource("independent")])
  return NextResponse.json({
    ok: true,
    sources: {
      rt,
      independent,
    },
  })
}
