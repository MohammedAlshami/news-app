import { getDb } from "@/db/client"
import { generatedArticles, topics } from "@/db/schema"
import { generateAndSaveArticleForTopic } from "@/lib/db-generated-articles.server"
import { isNull, eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

function event(name: string, data: Record<string, unknown>) {
  return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const limit = Math.max(1, Number(url.searchParams.get("limit")) || 999999)
  const timeoutMs = Math.max(30000, Math.min(600000, limit * 30000))

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
        emit("error", { message: `Generation timed out after ${timeoutMs / 1000}s` })
        emit("complete", { timedOut: true })
        done()
      }, timeoutMs)

      try {
        const errors: string[] = []
        let articlesGenerated = 0
        let skipped = 0

        const db = getDb()
        const unprocessed = await db
          .select({
            id: topics.id,
            title: topics.title,
            articleCount: topics.articleCount,
          })
          .from(topics)
          .leftJoin(generatedArticles, eq(topics.id, generatedArticles.topicId))
          .where(isNull(generatedArticles.id))

        const target = Math.min(limit, unprocessed.length)
        emit("start", { total: unprocessed.length, target })

        if (unprocessed.length === 0) {
          emit("complete", { articlesGenerated: 0, errors, message: "No unprocessed topics." })
          return
        }

        for (const topic of unprocessed.slice(0, limit)) {
          emit("generating", { topic: topic.title })
          try {
            const result = await generateAndSaveArticleForTopic(topic.id)
            articlesGenerated++
            emit("generated", { topic: topic.title, articleTitle: result.title })
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            if (msg.includes("No scraped articles found")) {
              skipped++
              emit("skipped", { topic: topic.title, reason: msg })
            } else {
              errors.push(`Topic "${topic.title}": ${msg}`)
              emit("error", { topic: topic.title, message: msg })
            }
          }
        }

        emit("complete", { articlesGenerated, skipped, errors })
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
