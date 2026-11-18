/**
 * Pure helpers shared by `/api/ai` (server) and the editor AI resolvers (client).
 *
 * Wire format of `/api/ai` success responses: a `text/plain` byte stream of the model's visible
 * answer, with two in-band single-character control marks that clients MUST strip:
 *   - AI_THINKING_MARK  (U+0000): keep-alive while the reasoning model is still "thinking".
 *   - AI_TRUNCATED_MARK (U+0001): the model hit max_tokens (`finish_reason: "length"`).
 * Failures before the stream starts are JSON `{ error, message }` with a non-2xx status; failures
 * after it starts error the stream (the reader rejects).
 */

export const AI_THINKING_MARK = "\u0000"
export const AI_TRUNCATED_MARK = "\u0001"

export const AI_LIMITS = {
  maxBodyBytes: 200_000,
  maxPromptChars: 60_000,
  maxTitleChars: 300,
  maxExcerptChars: 2_000,
  maxModeChars: 32,
  maxTokens: 4_096,
  upstreamTimeoutMs: 120_000,
  rateLimitMax: 20,
  rateLimitWindowMs: 60_000,
} as const

// ---------------------------------------------------------------------------------------------
// Upstream SSE parsing
// ---------------------------------------------------------------------------------------------

/** Splits an SSE text buffer into complete `data:` payloads; returns the incomplete remainder. */
export function parseSseChunk(
  buffer: string,
  chunk: string,
): { payloads: string[]; rest: string } {
  const lines = (buffer + chunk).split("\n")
  const rest = lines.pop() ?? ""
  const payloads: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith("data:")) continue
    const payload = trimmed.slice(5).trim()
    if (!payload || payload === "[DONE]") continue
    payloads.push(payload)
  }
  return { payloads, rest }
}

export type SseDelta = {
  content: string
  reasoning: string
  finishReason: string | null
}

/** Extracts the visible/reasoning delta from one OpenAI-style streaming payload (null if malformed). */
export function parseSseDelta(payload: string): SseDelta | null {
  try {
    const json = JSON.parse(payload)
    const choice = json?.choices?.[0]
    if (!choice) return { content: "", reasoning: "", finishReason: null }
    const delta = choice.delta ?? {}
    return {
      content: typeof delta.content === "string" ? delta.content : "",
      reasoning:
        typeof delta.reasoning_content === "string"
          ? delta.reasoning_content
          : typeof delta.reasoning === "string"
            ? delta.reasoning
            : "",
      finishReason: typeof choice.finish_reason === "string" ? choice.finish_reason : null,
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------------------------
// Error mapping
// ---------------------------------------------------------------------------------------------

export type AiErrorInfo = { status: number; code: string; message: string; retryAfter?: number }

/** Maps an upstream provider status to what OUR client should see (no upstream body is leaked). */
export function mapUpstreamStatus(status: number): AiErrorInfo {
  if (status === 401 || status === 403) {
    return { status: 502, code: "ai_auth", message: "مفتاح خدمة الذكاء الاصطناعي غير صالح. تواصل مع المسؤول." }
  }
  if (status === 402) {
    return { status: 402, code: "ai_quota", message: "نفد رصيد خدمة الذكاء الاصطناعي." }
  }
  if (status === 429) {
    return { status: 429, code: "ai_rate_limited", message: "الخدمة مشغولة حالياً. حاول بعد قليل.", retryAfter: 20 }
  }
  if (status === 408 || status === 504) {
    return { status: 504, code: "ai_timeout", message: "انتهت مهلة الاستجابة من الذكاء الاصطناعي." }
  }
  if (status >= 500) {
    return { status: 502, code: "ai_unavailable", message: "خدمة الذكاء الاصطناعي غير متاحة مؤقتاً." }
  }
  return { status: 502, code: "ai_failed", message: "تعذر إتمام طلب الذكاء الاصطناعي." }
}

const GENERIC_HTTP_MESSAGES: Record<number, string> = {
  400: "الطلب غير صالح.",
  401: "انتهت الجلسة. أعد تسجيل الدخول.",
  403: "لا تملك صلاحية استخدام الذكاء الاصطناعي.",
  413: "النص المرسل أطول من المسموح.",
  429: "طلبات كثيرة. انتظر قليلاً ثم حاول مجدداً.",
}

/** Client side: turn a failed `/api/ai` HTTP response into a short, user-showable Arabic message. */
export function describeAiHttpError(status: number, bodyText: string): string {
  try {
    const parsed = JSON.parse(bodyText)
    if (parsed && typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message.trim().slice(0, 300)
    }
  } catch {
    // not JSON
  }
  return GENERIC_HTTP_MESSAGES[status] ?? "تعذر الاتصال بالذكاء الاصطناعي."
}

export class AiRequestError extends Error {
  readonly userMessage: string
  constructor(userMessage: string) {
    super(userMessage)
    this.name = "AiRequestError"
    this.userMessage = userMessage
  }
}

export const AI_EMPTY_MESSAGE = "لم يتم الحصول على رد من الذكاء الاصطناعي."
export const AI_TRUNCATED_MESSAGE = "تم اقتطاع الرد لأنه طويل جداً."
export const AI_TRUNCATED_EMPTY_MESSAGE = "استغرق الذكاء الاصطناعي وقتاً طويلاً في التفكير دون رد. جرّب نصاً أقصر."

export function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: string }).name === "AbortError"
  )
}

/** Message to show for any error thrown while talking to the AI endpoint. */
export function aiErrorMessage(error: unknown): string {
  if (error instanceof AiRequestError) return error.userMessage
  if (error instanceof TypeError) return "تعذر الاتصال بالخادم. تحقق من الإنترنت."
  return "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي."
}

// ---------------------------------------------------------------------------------------------
// Client-side stream filtering
// ---------------------------------------------------------------------------------------------

export type AiFilterResult = { text: string; thinking: boolean; truncated: boolean }

/** Strips the in-band control marks from a decoded chunk. Single-char marks => no boundary issues. */
export function stripAiControlMarks(chunk: string): AiFilterResult {
  let thinking = false
  let truncated = false
  let text = ""
  for (const ch of chunk) {
    if (ch === AI_THINKING_MARK) thinking = true
    else if (ch === AI_TRUNCATED_MARK) truncated = true
    else text += ch
  }
  return { text, thinking, truncated }
}

export type AiStreamCallbacks = {
  onThinking?: () => void
  onTruncated?: () => void
}

/**
 * Wraps the `/api/ai` response body into a clean UTF-8 byte stream (control marks removed).
 * Errors the stream with AiRequestError when the model produced no visible text.
 */
export function createCleanAiStream(
  body: ReadableStream<Uint8Array>,
  callbacks: AiStreamCallbacks = {},
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  const reader = body.getReader()
  let emitted = false
  let truncated = false
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      // Loop until something is enqueued or the stream ends: a pull that enqueues nothing (e.g. a
      // chunk holding only control marks) is never retried by the stream machinery and would hang.
      try {
        for (;;) {
          const { value, done } = await reader.read()
          if (done) {
            const tail = decoder.decode()
            if (tail) {
              emitted = true
              controller.enqueue(encoder.encode(tail))
            }
            if (!emitted) {
              controller.error(
                new AiRequestError(truncated ? AI_TRUNCATED_EMPTY_MESSAGE : AI_EMPTY_MESSAGE),
              )
            } else {
              controller.close()
            }
            return
          }
          const r = stripAiControlMarks(decoder.decode(value, { stream: true }))
          if (r.thinking) callbacks.onThinking?.()
          if (r.truncated) {
            truncated = true
            callbacks.onTruncated?.()
          }
          if (r.text) {
            emitted = true
            controller.enqueue(encoder.encode(r.text))
            return
          }
        }
      } catch (error) {
        controller.error(error)
      }
    },
    cancel(reason) {
      return reader.cancel(reason)
    },
  })
}

// ---------------------------------------------------------------------------------------------
// Best-effort in-isolate rate limiter (fixed window)
// ---------------------------------------------------------------------------------------------

export function createRateLimiter(max: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, { count: number; resetAt: number }>()
  return {
    /** Returns 0 when allowed, otherwise seconds to wait. */
    check(key: string): number {
      const t = now()
      if (hits.size > 500) {
        for (const [k, v] of hits) if (v.resetAt <= t) hits.delete(k)
      }
      const entry = hits.get(key)
      if (!entry || entry.resetAt <= t) {
        hits.set(key, { count: 1, resetAt: t + windowMs })
        return 0
      }
      if (entry.count >= max) return Math.max(1, Math.ceil((entry.resetAt - t) / 1000))
      entry.count += 1
      return 0
    },
  }
}
