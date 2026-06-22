import { getEnabledSourceKeys } from "@/lib/db-news-sources.server"
import { saveScrapeResult } from "@/lib/db-scraped-news.server"
import { createNewsScraper, getSupportedCategories } from "@/lib/news-scraper"

export const dynamic = "force-dynamic"

function event(name: string, data: Record<string, unknown>) {
  return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const targetLimit = Math.max(1, Number(url.searchParams.get("limit")) || 2)
  const timeoutMs = Math.max(120000, Math.min(900000, targetLimit * 3000))

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let finished = false
      const emit = (name: string, data: Record<string, unknown>) => {
        if (finished) return
        controller.enqueue(encoder.encode(event(name, data)))
      }
      const done = () => {
        if (finished) return
        finished = true
        controller.close()
      }

      const abortTimeout = setTimeout(() => {
        emit("error", { message: `Scrape pipeline timed out after ${timeoutMs / 1000}s` })
        emit("complete", { timedOut: true })
        done()
      }, timeoutMs)

      try {
        const errors: string[] = []
        let totalInserted = 0

        const enabledKeys = await getEnabledSourceKeys()
        emit("start", { sources: enabledKeys, target: targetLimit })

        if (enabledKeys.length === 0) {
          emit("complete", { inserted: 0, errors, message: "No sources enabled." })
          return
        }

        let remaining = targetLimit
        for (const sourceKey of enabledKeys) {
          if (remaining <= 0) break
          const scraper = createNewsScraper(sourceKey)
          const categories = getSupportedCategories(sourceKey)

          for (const category of categories) {
            if (remaining <= 0) break
            emit("scrape", { source: sourceKey, category, status: "scraping" })
            try {
              const result = await scraper.scrape({ category })
              result.items = result.items.slice(0, remaining)
              const saved = await saveScrapeResult(result)
              totalInserted += saved.inserted
              remaining -= saved.inserted + saved.skipped
              emit("scrape", {
                source: sourceKey,
                category,
                inserted: saved.inserted,
                skipped: saved.skipped,
              })
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err)
              errors.push(`Scrape ${sourceKey}/${category}: ${msg}`)
              emit("error", { source: sourceKey, category, message: msg })
            }
          }
        }

        emit("complete", { inserted: totalInserted, errors })
      } finally {
        clearTimeout(abortTimeout)
        done()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
