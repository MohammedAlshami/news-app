import { runWriter } from "@/lib/writer"

export const dynamic = "force-dynamic"

function event(name: string, data: Record<string, unknown>) {
  return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function GET(): Promise<Response> {
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
        emit("error", { message: "Write pipeline timed out after 120s" })
        emit("complete", { timedOut: true })
        done()
      }, 120000)

      try {
        emit("start", {})
        const result = await runWriter()

        if (result.action === "write" && result.article) {
          emit("written", { genId: result.article.id, articleId: result.article.articleId, title: result.article.title })
        } else {
          emit("skipped", { reason: result.reason ?? "No topic worth writing about" })
        }

        emit("complete", { result })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        emit("error", { message: msg })
        emit("complete", { error: msg })
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
