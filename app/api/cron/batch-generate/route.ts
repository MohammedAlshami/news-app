import { runGenerationNow } from "@/lib/generation/run-now.server"

export const dynamic = "force-dynamic"

const CONCURRENCY = 4
const DEFAULT_LIMIT = 60
const TIMEOUT_MS = 900_000

function event(name: string, data: Record<string, unknown>) {
  return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`
}

/**
 * Manual bulk generation (`?limit=N`). Uses exactly the same loop as the 10-minute
 * write-pipeline (claiming, freshness, quota, duplicate checks) — only with a bigger budget.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const parsedLimit = Number.parseInt(url.searchParams.get("limit") ?? "", 10)
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : DEFAULT_LIMIT

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let finished = false
      const emit = (n: string, d: Record<string, unknown>) => { if (!finished) controller.enqueue(encoder.encode(event(n, d))) }
      const done = () => { if (!finished) { finished = true; controller.close() } }
      const timeout = setTimeout(() => { emit("error", { message: "Timed out" }); emit("complete", { timedOut: true }); done() }, TIMEOUT_MS)

      try {
        const summary = await runGenerationNow({
          max: limit,
          concurrency: CONCURRENCY,
          onEvent: (e) => {
            if (e.type === "plan") emit("plan", { limit, categories: e.categories })
            else if (e.type === "generating") emit("generating", { topic: e.title })
            else if (e.result.outcome === "written") emit("generated", { title: e.result.title })
            else emit("skipped", { topicId: e.result.topicId, outcome: e.result.outcome, reason: e.result.reason })
          },
        })
        emit("complete", { ...summary, limit })
      } catch (err) {
        emit("error", { message: err instanceof Error ? err.message : String(err) })
        emit("complete", { error: true })
      } finally {
        clearTimeout(timeout)
        done()
      }
    },
  })

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  })
}
