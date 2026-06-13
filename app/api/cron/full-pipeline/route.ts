import { getDb } from "@/db/client"
import { generatedArticles, topics } from "@/db/schema"
import { getEnabledSourceKeys } from "@/lib/db-news-sources.server"
import { generateAndSaveArticleForTopic } from "@/lib/db-generated-articles.server"
import { saveScrapeResult } from "@/lib/db-scraped-news.server"
import { runTopicGrouping } from "@/lib/db-topics.server"
import {
  createNewsScraper,
  getSupportedCategories,
  type ScraperSourceKey,
} from "@/lib/news-scraper"
import { isNull, eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

function event(name: string, data: Record<string, unknown>) {
  return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`
}

async function runScrape(
  totalLimit: number,
  emit: (name: string, data: Record<string, unknown>) => void,
): Promise<number> {
  const enabledKeys = await getEnabledSourceKeys()
  if (enabledKeys.length === 0) {
    emit("scrape-done", { inserted: 0, message: "No sources enabled." })
    return 0
  }

  emit("scrape-start", { sources: enabledKeys, limit: totalLimit })
  const perSource = totalLimit === Infinity ? 999999 : Math.ceil(totalLimit / enabledKeys.length)
  let totalInserted = 0

  for (const sourceKey of enabledKeys) {
    const scraper = createNewsScraper(sourceKey)
    const categories = getSupportedCategories(sourceKey)
    let remaining = perSource

    for (const category of categories) {
      if (remaining <= 0) break
      emit("scrape-progress", { source: sourceKey, category, status: "scraping" })
      const result = await scraper.scrape({ category })
      result.items = result.items.slice(0, remaining)
      const saved = await saveScrapeResult(result)
      totalInserted += saved.inserted
      remaining -= saved.inserted
      emit("scrape-progress", {
        source: sourceKey,
        category,
        inserted: saved.inserted,
        skipped: saved.skipped,
        totalInsertedSoFar: totalInserted,
      })
    }
  }

  emit("scrape-done", { inserted: totalInserted })
  return totalInserted
}

async function getUnprocessedTopics() {
  const db = getDb()
  const rows = await db
    .select({
      id: topics.id,
      title: topics.title,
      articleCount: topics.articleCount,
    })
    .from(topics)
    .leftJoin(generatedArticles, eq(topics.id, generatedArticles.topicId))
    .where(isNull(generatedArticles.id))
  return rows
}

export async function GET(): Promise<Response> {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const emit = (name: string, data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(event(name, data)))
      }

      const errors: string[] = []
      let scraped = 0
      let topicsGrouped = null
      let articlesGenerated = 0

      // Step 1: Scrape
      try {
        scraped = await runScrape(10, emit)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`Scrape failed: ${msg}`)
        emit("error", { step: "scrape", message: msg })
      }

      // Step 2: Topic grouping
      emit("topic-grouping-start", {})
      try {
        topicsGrouped = await runTopicGrouping()
        emit("topic-grouping-done", topicsGrouped ?? {})
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`Topic grouping failed: ${msg}`)
        emit("error", { step: "topic-grouping", message: msg })
      }

      // Step 3: Generate articles
      emit("generate-start", {})
      try {
        const unprocessed = await getUnprocessedTopics()
        emit("generate-progress", {
          total: unprocessed.length,
          message: `Found ${unprocessed.length} unprocessed topics.`,
        })

        for (const topic of unprocessed) {
          emit("generate-progress", {
            topic: topic.title,
            status: "generating",
          })
          try {
            const result = await generateAndSaveArticleForTopic(topic.id)
            articlesGenerated++
            emit("generate-progress", {
              topic: topic.title,
              status: "done",
              articleTitle: result.title,
            })
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            errors.push(`Generate article for topic "${topic.title}": ${msg}`)
            emit("error", { step: "generate", topic: topic.title, message: msg })
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`Finding unprocessed topics failed: ${msg}`)
        emit("error", { step: "find-topics", message: msg })
      }

      emit("complete", {
        scraped,
        topicsGrouped,
        articlesGenerated,
        errors,
      })

      controller.close()
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
