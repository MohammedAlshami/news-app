/** OpenCode Go inference API (OpenAI-compatible chat completions). */
export const OPENCODE_URL = "https://opencode.ai/inference/go/v1/chat/completions"

/**
 * Everything env-dependent is a function: on Cloudflare Workers (OpenNext) `process.env` is only
 * populated per request, so reading it at import time would freeze an empty value into the bundle.
 */
export function getOpenCodeModel(): string {
  return process.env.OPENCODE_MODEL || "deepseek-v4.1-flash"
}

export function getOpenCodeApiKey(): string {
  return process.env.OPENCODE_API_KEY ?? ""
}

export function hasOpenCodeKey(): boolean {
  return getOpenCodeApiKey().length > 0
}

/**
 * Headers required by the Go API: bearer key, a stable `x-opencode-session` id
 * (routing + prompt caching) and an identifying user agent.
 */
export function openCodeHeaders(sessionId: string): Record<string, string> {
  return {
    Authorization: `Bearer ${getOpenCodeApiKey()}`,
    "Content-Type": "application/json",
    "x-opencode-session": sessionId,
    "User-Agent": "news-app/1.0",
  }
}
