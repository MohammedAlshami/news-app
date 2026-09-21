import { runGenerationNow } from "@/lib/generation/run-now.server"

export const dynamic = "force-dynamic"

const MAX_PER_RUN = 4
const CONCURRENCY = 2
const TIMEOUT_MS = 200_000

function event(name: string, data: Record<string, unknown>) {
  return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`
}

/** Runs every 10 minutes: writes up to a few fresh articles through the shared generation loop. */
export async function GET(): Promise<Response> {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let finished = false
      const emit = (name: string, data: Record<string, unknown>) => {
        if (!finished) controller.enqueue(encoder.encode(event(name, data)))
      }
      const done = () => {
        if (finished) return
        finished = true
        controller.close()
      }

      const abortTimeout = setTimeout(() => {
        emit("error", { message: `Write pipeline timed out after ${TIMEOUT_MS / 1000}s` })
        emit("complete", { timedOut: true })
        done()
      }, TIMEOUT_MS)

      try {
        emit("start", { max: MAX_PER_RUN })
        const summary = await runGenerationNow({
          max: MAX_PER_RUN,
          concurrency: CONCURRENCY,
          onEvent: (e) => {
            if (e.type === "result") {
              const r = e.result
              if (r.outcome === "written") emit("written", { genId: r.generatedId, articleId: r.articleId, title: r.title })
              else emit("skipped", { topicId: r.topicId, outcome: r.outcome, reason: r.reason })
            }
          },
        })
        emit("complete", { summary })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`write-pipeline failed: ${msg}`)
        emit("error", { message: msg })
        emit("complete", { error: msg })
      } finally {
        clearTimeout(abortTimeout)
        done()
      }
    },
  })

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  })
}
