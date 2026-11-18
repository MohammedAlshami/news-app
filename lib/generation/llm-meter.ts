import type { AppDb } from "@/db/client"
import { LlmQuotaError, type LlmJson, type LlmUsage } from "@/lib/llm-json"
import { addTokens, getTokensToday } from "@/lib/pipeline-state"

export type Meter = {
  llm: LlmJson
  /** Usage since the meter was created (this step). */
  totals: () => { calls: number; promptTokens: number; completionTokens: number; reasoningTokens: number; allowance: number }
  /** Usage of the most recent calls tagged with `tag` (per-article accounting). */
  scope: (tag: string) => { promptTokens: number; completionTokens: number; reasoningTokens: number }
}

/**
 * Wraps an LlmJson with (1) a daily token budget guard (throws LlmQuotaError before the call is made),
 * (2) usage accounting (per step, per scope) and (3) a persisted daily counter in pipeline_state.
 */
export function meterLlm(base: LlmJson, opts: { db: AppDb; budget: number; usedBefore: number; now?: () => number }): Meter {
  const t = { calls: 0, promptTokens: 0, completionTokens: 0, reasoningTokens: 0, allowance: 0 }
  const scopes = new Map<string, { promptTokens: number; completionTokens: number; reasoningTokens: number }>()
  const now = opts.now ?? Date.now

  const llm: LlmJson = async (req) => {
    if (opts.budget > 0 && opts.usedBefore + t.promptTokens + t.completionTokens >= opts.budget) {
      throw new LlmQuotaError(`daily token budget reached (${opts.budget})`)
    }
    let billed = 0
    const tag = req.label ?? "llm"
    try {
      return await base({
        ...req,
        onUsage: (u: LlmUsage, label: string) => {
          t.calls++
          t.promptTokens += u.promptTokens
          t.completionTokens += u.completionTokens
          t.reasoningTokens += u.reasoningTokens
          t.allowance += u.allowance ?? 0
          billed += u.promptTokens + u.completionTokens
          const s = scopes.get(tag) ?? { promptTokens: 0, completionTokens: 0, reasoningTokens: 0 }
          s.promptTokens += u.promptTokens
          s.completionTokens += u.completionTokens
          s.reasoningTokens += u.reasoningTokens
          scopes.set(tag, s)
          req.onUsage?.(u, label)
        },
      })
    } finally {
      if (billed > 0) await addTokens(opts.db, now(), billed).catch(() => {})
    }
  }
  return {
    llm,
    totals: () => ({ ...t }),
    scope: (tag) => scopes.get(tag) ?? { promptTokens: 0, completionTokens: 0, reasoningTokens: 0 },
  }
}

export async function meterFromDb(base: LlmJson, db: AppDb, budget: number, now: () => number = Date.now): Promise<Meter> {
  return meterLlm(base, { db, budget, usedBefore: await getTokensToday(db, now()), now })
}
