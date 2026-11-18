import { requireCronOrAdmin } from "@/lib/admin-guard.server"
import { runGenerationNow } from "@/lib/generation/run-now.server"

export const dynamic = "force-dynamic"

const CONCURRENCY = 3
const DEFAULT_LIMIT = 30
const MAX_LIMIT = 100
/** Bulk runs get a bigger budget than the 10-minute step; still enforced on every LLM call. */
const BUDGET_MS = 600_000

function event(name: string, data: Record<string, unknown>) {
  return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`
}

/**
 * Manual bulk generation (`?limit=N`). Same loop, lease, token budget and gates as the 10-minute write step
 * (claiming, freshness, quota, duplicates, updates) — only with a bigger budget. The work is awaited inside the
 * stream, so it ends exactly when the stream closes.
 */
export async function GET(request: Request): Promise<Response> {
  const denied = await requireCronOrAdmin(request)
  if (denied) return denied
  const url = new URL(request.url)
  const parsedLimit = Number.parseInt(url.searchParams.get("limit") ?? "", 10)
  const limit = Math.min(MAX_LIMIT, Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : DEFAULT_LIMIT)

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const emit = (n: string, d: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(event(n, d)))
        } catch {
          /* client went away; the run continues to completion and releases its claims */
        }
      }
      try {
        const r = await runGenerationNow({
          step: "batch-generate",
          max: limit,
          concurrency: CONCURRENCY,
          budgetMs: BUDGET_MS,
          onEvent: (e) => {
            if (e.type === "plan") emit("plan", { limit, categories: e.categories })
            else if (e.type === "generating") emit("generating", { topic: e.title })
            else if (e.result.outcome === "written") emit("generated", { title: e.result.title, kind: e.result.kind })
            else emit("skipped", { topicId: e.result.topicId, outcome: e.result.outcome, reason: e.result.reason })
          },
        })
        if (r.busy) emit("complete", { busy: true, limit })
        else emit("complete", { ...r.summary, limit })
      } catch (err) {
        emit("error", { message: err instanceof Error ? err.message : String(err) })
        emit("complete", { error: true })
      } finally {
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      }
    },
  })

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  })
}
