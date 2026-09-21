import { OPENROUTER_API_KEY, OPENROUTER_MODEL, OPENROUTER_URL } from "@/lib/openrouter"

export type LlmJsonRequest = {
  system: string
  user: string
  temperature?: number
  timeoutMs?: number
}

/** Returns the parsed JSON object the model produced, or throws. Injected in tests. */
export type LlmJson = (req: LlmJsonRequest) => Promise<unknown>

/** One retry on transport/parse errors; throws after that (callers decide how to degrade). */
export const openRouterJson: LlmJson = async (req) => {
  if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not set")
  let lastErr: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: "system", content: req.system },
            { role: "user", content: req.user },
          ],
          temperature: req.temperature ?? 0.1,
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(req.timeoutMs ?? 45000),
      })
      if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 200)}`)
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
      const raw = data.choices?.[0]?.message?.content ?? ""
      // providers occasionally return an empty completion with HTTP 200 → treat as a failure and retry
      if (!raw.trim()) throw new Error("empty completion")
      return JSON.parse(raw)
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}
