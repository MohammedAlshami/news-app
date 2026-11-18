import { OPENCODE_URL, getOpenCodeApiKey, getOpenCodeModel, openCodeHeaders } from "@/lib/opencode"

export type LlmUsage = {
  promptTokens: number
  completionTokens: number
  /** Subset of completionTokens spent on hidden reasoning (billed). */
  reasoningTokens: number
  cachedTokens: number
  /** `usage.opencode.allowance` of the Go plan consumed by this call (null when absent). */
  allowance: number | null
  finishReason: string | null
}

export type LlmJsonRequest = {
  system: string
  user: string
  temperature?: number
  /** Per-attempt timeout; further capped by `deadlineAt`. */
  timeoutMs?: number
  /** Hard cap on generated tokens (reasoning included). Always sent. */
  maxTokens?: number
  /** "off" (default) disables hidden reasoning: ~3x cheaper and faster for extraction/writing. */
  reasoning?: "off" | "low" | "high"
  /** Epoch ms after which no call may start / continue (derived from the invocation's time budget). */
  deadlineAt?: number
  signal?: AbortSignal
  /** Network/5xx/empty/parse retries (never for 4xx). Default 2. */
  retries?: number
  /** Called once per HTTP response that carried usage (also for failed/truncated calls: they are billed). */
  onUsage?: (u: LlmUsage, label: string) => void
  label?: string
}

/** Returns the parsed JSON object the model produced, or throws. Injected in tests. */
export type LlmJson = (req: LlmJsonRequest) => Promise<unknown>

// ---------------------------------------------------------------------------------------
// typed errors

export class LlmError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = new.target.name
  }
}
/** Usage/balance/rate limit (HTTP 402/429 or a limit message). The whole tick must stop; nothing is retried. */
export class LlmQuotaError extends LlmError {}
/** 401/403: bad key. Stops the tick too. */
export class LlmAuthError extends LlmError {}
/** Other 4xx: our request is wrong; retrying cannot help. */
export class LlmBadRequestError extends LlmError {}
/** finish_reason "length": the cap was hit (billed). Retrying the same request is pointless. */
export class LlmTruncatedError extends LlmError {}
/** The invocation's time budget is (almost) used up. Not the topic's fault. */
export class LlmDeadlineError extends LlmError {}
/** Retries exhausted on network/5xx/empty/unparseable output. */
export class LlmTransientError extends LlmError {}

/** Errors that mean "stop spending / stop this tick", never "this topic is bad". */
export function isLlmStop(err: unknown): err is LlmQuotaError | LlmAuthError | LlmDeadlineError {
  return err instanceof LlmQuotaError || err instanceof LlmAuthError || err instanceof LlmDeadlineError
}

const QUOTA_BODY = /usage limit|FreeUsageLimit|insufficient|balance|quota|limit (?:reached|exceeded)|rate.?limit|billing|exhausted|too many requests/i

export function classifyHttpError(status: number, body: string): LlmError {
  const msg = `OpenCode ${status}: ${body.slice(0, 200)}`
  if (status === 402 || status === 429 || (status >= 400 && status < 500 && status !== 401 && status !== 403 && QUOTA_BODY.test(body))) {
    return new LlmQuotaError(msg, status)
  }
  if (status === 401 || status === 403) return new LlmAuthError(msg, status)
  if (status >= 400 && status < 500 && status !== 408) return new LlmBadRequestError(msg, status)
  return new LlmTransientError(msg, status)
}

// ---------------------------------------------------------------------------------------
// tolerant JSON

/** Strips ``` fences and surrounding prose, then parses the first balanced-looking {...}. Throws on failure. */
export function parseJsonLoose(text: string): unknown {
  const t = text.trim()
  try {
    return JSON.parse(t)
  } catch {
    /* fall through */
  }
  const fenced = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "")
  try {
    return JSON.parse(fenced)
  } catch {
    /* fall through */
  }
  const start = fenced.indexOf("{")
  const end = fenced.lastIndexOf("}")
  if (start >= 0 && end > start) return JSON.parse(fenced.slice(start, end + 1))
  throw new Error("no JSON object in completion")
}

// ---------------------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function retryDelayMs(attempt: number, retryAfter: string | null): number {
  const ra = retryAfter ? Number(retryAfter) : NaN
  if (Number.isFinite(ra) && ra > 0) return Math.min(ra * 1000, 15000)
  const base = 700 * 2 ** attempt
  return base / 2 + Math.random() * (base / 2) // jitter
}

function readUsage(data: any, finishReason: string | null): LlmUsage | null {
  const u = data?.usage
  if (!u || typeof u !== "object") return null
  const allowance = Number(u.opencode?.allowance)
  return {
    promptTokens: Number(u.prompt_tokens) || 0,
    completionTokens: Number(u.completion_tokens) || 0,
    reasoningTokens: Number(u.completion_tokens_details?.reasoning_tokens) || 0,
    cachedTokens: Number(u.prompt_tokens_details?.cached_tokens) || 0,
    allowance: Number.isFinite(allowance) ? allowance : null,
    finishReason,
  }
}

export function reasoningParams(mode: "off" | "low" | "high"): Record<string, unknown> {
  if (mode === "off") return { thinking: { type: "disabled" } } // verified: reasoning_tokens = 0
  if (mode === "low") return { reasoning_effort: "low" }
  return {}
}

/**
 * Production LLM client: JSON mode, always capped (`max_tokens`), reasoning off by default,
 * usage reported, typed errors. Retries only transport errors / timeouts / 5xx / empty or
 * unparseable completions, with jittered backoff — never on 4xx, never past the deadline.
 */
export const openCodeJson: LlmJson = async (req) => {
  if (!getOpenCodeApiKey()) throw new LlmAuthError("OPENCODE_API_KEY is not set")
  const label = req.label ?? "llm"
  const maxAttempts = 1 + (req.retries ?? 2)
  const reasoning = process.env.OPENCODE_THINKING === "on" ? "low" : (req.reasoning ?? "off")
  let lastErr: unknown

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const remaining = req.deadlineAt === undefined ? Infinity : req.deadlineAt - Date.now()
    if (remaining < 4000) throw new LlmDeadlineError(`time budget exhausted before "${label}" call`)
    const timeoutMs = Math.min(req.timeoutMs ?? 60000, remaining - 1000)
    const signal = req.signal ? AbortSignal.any([AbortSignal.timeout(timeoutMs), req.signal]) : AbortSignal.timeout(timeoutMs)

    let retryAfter: string | null = null
    try {
      const res = await fetch(OPENCODE_URL, {
        method: "POST",
        headers: openCodeHeaders(label),
        body: JSON.stringify({
          model: getOpenCodeModel(),
          messages: [
            { role: "system", content: req.system },
            { role: "user", content: req.user },
          ],
          temperature: req.temperature ?? 0.1,
          max_tokens: req.maxTokens ?? 2048,
          response_format: { type: "json_object" },
          ...reasoningParams(reasoning),
        }),
        signal,
      })
      retryAfter = res.headers.get("retry-after")
      if (!res.ok) throw classifyHttpError(res.status, await res.text().catch(() => ""))

      const data = (await res.json()) as any
      if (data?.error) throw classifyHttpError(Number(data.error.code) || 500, JSON.stringify(data.error))
      const choice = data?.choices?.[0]
      const finish: string | null = choice?.finish_reason ?? null
      const usage = readUsage(data, finish)
      if (usage) req.onUsage?.(usage, label) // billed even if we cannot use the output
      const raw: string = choice?.message?.content ?? ""
      if (finish === "length") throw new LlmTruncatedError(`"${label}" hit max_tokens (${req.maxTokens ?? 2048})`)
      // providers occasionally return an empty completion with HTTP 200 → transient
      if (!raw.trim()) throw new LlmTransientError("empty completion")
      try {
        return parseJsonLoose(raw)
      } catch (err) {
        throw new LlmTransientError(`unparseable JSON: ${err instanceof Error ? err.message : String(err)}`)
      }
    } catch (err) {
      if (err instanceof LlmQuotaError || err instanceof LlmAuthError || err instanceof LlmBadRequestError || err instanceof LlmTruncatedError || err instanceof LlmDeadlineError) throw err
      if (req.signal?.aborted) throw new LlmDeadlineError("aborted by caller")
      lastErr = err
      if (attempt < maxAttempts - 1) {
        const wait = retryDelayMs(attempt, retryAfter)
        if (req.deadlineAt !== undefined && req.deadlineAt - Date.now() < wait + 5000) break
        await sleep(wait)
      }
    }
  }
  if (lastErr instanceof LlmError) throw lastErr
  throw new LlmTransientError(lastErr instanceof Error ? lastErr.message : String(lastErr))
}
