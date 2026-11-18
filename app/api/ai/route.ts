import { NextResponse } from "next/server"

import { requireAdminApi } from "@/lib/admin-guard.server"
import {
  AI_LIMITS,
  AI_THINKING_MARK,
  AI_TRUNCATED_MARK,
  createRateLimiter,
  mapUpstreamStatus,
  parseSseChunk,
  parseSseDelta,
  type AiErrorInfo,
} from "@/lib/ai-stream"
import { getAuthSessionUserId } from "@/lib/auth-session.server"
import { OPENCODE_URL, getOpenCodeModel, hasOpenCodeKey, openCodeHeaders } from "@/lib/opencode"

export const dynamic = "force-dynamic"

const INLINE_EDITOR_SYSTEM_PROMPT =
  "أنت مساعد تحرير أخبار عربي. اتبع تعليمات المستخدم واكتب باللغة العربية الفصحى فقط. لا تستخدم أي لغة أخرى. أعد النص المطلوب فقط بدون markdown أو عناوين أو نقاط."

const limiter = createRateLimiter(AI_LIMITS.rateLimitMax, AI_LIMITS.rateLimitWindowMs)

function fail(info: Pick<AiErrorInfo, "status" | "code" | "message"> & { retryAfter?: number }) {
  return NextResponse.json(
    { error: info.code, message: info.message },
    {
      status: info.status,
      headers: {
        "cache-control": "no-store",
        ...(info.retryAfter ? { "retry-after": String(info.retryAfter) } : {}),
      },
    },
  )
}

function str(value: unknown, max: number): string | null {
  if (value === undefined || value === null) return ""
  if (typeof value !== "string") return null
  return value.length > max ? null : value
}

export async function POST(request: Request) {
  const denied = await requireAdminApi()
  if (denied) return denied

  if (!hasOpenCodeKey()) {
    return fail({ status: 503, code: "ai_not_configured", message: "الذكاء الاصطناعي غير مُهيأ." })
  }

  const userId = (await getAuthSessionUserId()) ?? "admin"
  const wait = limiter.check(userId)
  if (wait > 0) {
    return fail({
      status: 429,
      code: "rate_limited",
      message: "طلبات كثيرة. انتظر قليلاً ثم حاول مجدداً.",
      retryAfter: wait,
    })
  }

  const declared = Number(request.headers.get("content-length") ?? 0)
  if (declared > AI_LIMITS.maxBodyBytes) {
    return fail({ status: 413, code: "too_large", message: "النص المرسل أطول من المسموح." })
  }
  const raw = await request.text().catch(() => "")
  if (raw.length > AI_LIMITS.maxBodyBytes) {
    return fail({ status: 413, code: "too_large", message: "النص المرسل أطول من المسموح." })
  }
  let body: Record<string, unknown> | null = null
  try {
    const parsed = JSON.parse(raw)
    body = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null
  } catch {
    body = null
  }
  if (!body) return fail({ status: 400, code: "bad_request", message: "الطلب غير صالح." })

  const prompt = str(body.prompt, AI_LIMITS.maxPromptChars)
  const title = str(body.title, AI_LIMITS.maxTitleChars)
  const excerpt = str(body.excerpt, AI_LIMITS.maxExcerptChars)
  const mode = str(body.mode ?? "write", AI_LIMITS.maxModeChars)
  if (prompt === null || title === null || excerpt === null || mode === null) {
    return fail({ status: 413, code: "too_large", message: "النص المرسل أطول من المسموح." })
  }
  if (!prompt.trim()) {
    return fail({ status: 400, code: "bad_request", message: "الطلب فارغ." })
  }
  const editorInline = body.editorInline === true

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

  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(AI_LIMITS.upstreamTimeoutMs)])

  let upstream: Response
  try {
    upstream = await fetch(OPENCODE_URL, {
      method: "POST",
      headers: openCodeHeaders("editor-inline"),
      body: JSON.stringify({
        model: getOpenCodeModel(),
        messages,
        temperature: editorInline ? 0.3 : 0.7,
        max_tokens: AI_LIMITS.maxTokens,
        // Reasoning model: keep thinking short so the first visible token arrives sooner.
        reasoning_effort: "low",
        stream: true,
      }),
      signal,
    })
  } catch (error) {
    if (request.signal.aborted) return new NextResponse(null, { status: 499 })
    const timedOut = (error as { name?: string })?.name === "TimeoutError"
    console.error("[api/ai] upstream fetch failed:", timedOut ? "timeout" : (error as Error)?.name)
    return fail(mapUpstreamStatus(timedOut ? 504 : 503))
  }

  if (!upstream.ok || !upstream.body) {
    console.error("[api/ai] upstream status", upstream.status)
    await upstream.body?.cancel().catch(() => {})
    return fail(mapUpstreamStatus(upstream.status))
  }

  const reader = upstream.body.getReader()
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let cancelled = false

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = ""
      let emitted = false
      let lastThinkingAt = 0
      try {
        while (!cancelled) {
          const { value, done } = await reader.read()
          if (done) break
          const parsed = parseSseChunk(buffer, decoder.decode(value, { stream: true }))
          buffer = parsed.rest
          for (const payload of parsed.payloads) {
            const delta = parseSseDelta(payload)
            if (!delta) continue
            if (delta.content) {
              emitted = true
              controller.enqueue(encoder.encode(delta.content))
            } else if (delta.reasoning) {
              const now = Date.now()
              if (now - lastThinkingAt > 2000) {
                lastThinkingAt = now
                controller.enqueue(encoder.encode(AI_THINKING_MARK))
              }
            }
            if (delta.finishReason === "length") {
              console.warn("[api/ai] finish_reason=length emitted=", emitted)
              controller.enqueue(encoder.encode(AI_TRUNCATED_MARK))
            }
          }
        }
        if (!cancelled) controller.close()
      } catch (error) {
        if (!cancelled) {
          console.error("[api/ai] stream failed:", (error as Error)?.name)
          controller.error(new Error("ai_stream_failed"))
        }
      } finally {
        await reader.cancel().catch(() => {})
      }
    },
    cancel() {
      cancelled = true
      return reader.cancel().catch(() => {})
    },
  })

  return new NextResponse(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  })
}
