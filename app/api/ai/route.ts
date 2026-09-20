import { NextResponse } from "next/server"
import { OPENROUTER_URL, OPENROUTER_MODEL, OPENROUTER_API_KEY, OPENROUTER_PROVIDER } from "@/lib/openrouter"

const INLINE_EDITOR_SYSTEM_PROMPT =
  "أنت مساعد تحرير أخبار عربي. اتبع تعليمات المستخدم واكتب باللغة العربية الفصحى فقط. لا تستخدم أي لغة أخرى. أعد النص المطلوب فقط بدون markdown أو عناوين أو نقاط."

export async function POST(request: Request) {
  if (!OPENROUTER_API_KEY) {
    return new NextResponse("AI is not configured.", { status: 500 })
  }

  const body = await request.json().catch(() => null)
  const prompt = body?.prompt?.toString?.() ?? ""
  const title = body?.title?.toString?.() ?? ""
  const excerpt = body?.excerpt?.toString?.() ?? ""
  const mode = body?.mode?.toString?.() ?? "write"
  const editorInline = body?.editorInline === true

  if (!prompt.trim()) {
    return new NextResponse("Prompt is required.", { status: 400 })
  }

  const messages = [
    {
      role: "system",
      content: editorInline
        ? INLINE_EDITOR_SYSTEM_PROMPT
        : "أنت محرر أخبار عربي. اكتب بالعربية الفصحى فقط. أعد النص المطلوب فقط بدون markdown أو تعليقات.",
    },
    {
      role: "user",
      content: [
        editorInline ? "Mode: inline-editor" : `Mode: ${mode}`,
        title ? `Title: ${title}` : "",
        excerpt ? `Excerpt: ${excerpt}` : "",
        `Prompt: ${prompt}`,
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ]

  const bodyJson: Record<string, unknown> = {
    model: OPENROUTER_MODEL,
    provider: OPENROUTER_PROVIDER,
    messages,
    temperature: editorInline ? 0.3 : 0.7,
  }

  bodyJson.stream = true

  const upstream = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(bodyJson),
  })

  if (!upstream.ok || !upstream.body) {
    return new NextResponse("AI generation failed.", { status: 502 })
  }

  let emitted = false

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      const pump = async (): Promise<void> => {
        const { value, done } = await reader.read()
        if (done) {
          if (!emitted) {
            controller.enqueue(new TextEncoder().encode(" "))
          }
          controller.close()
          return
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith("data:")) continue
          const payload = trimmed.slice(5).trim()
          if (!payload || payload === "[DONE]") {
            continue
          }

          try {
            const json = JSON.parse(payload)
            const token = json?.choices?.[0]?.delta?.content ?? ""
            if (token) {
              emitted = true
              controller.enqueue(new TextEncoder().encode(token))
            }
          } catch {
            // Ignore malformed chunks.
          }
        }

        await pump()
      }

      await pump()
    },
  })

  return new NextResponse(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  })
}
