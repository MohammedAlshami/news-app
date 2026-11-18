import "server-only"

import { getDb } from "@/db/client"
import { openCodeJson } from "@/lib/llm-json"
import { hasOpenCodeKey } from "@/lib/opencode"
import { getSettings, recordRun, withLease } from "@/lib/pipeline-state"
import { uploadCoverWithDedup } from "@/lib/upload-image-dedup.server"

import { runGeneration, type GenEvent, type GenSummary } from "./core"
import { meterFromDb } from "./llm-meter"

export type WriteStepResult =
  | { busy: true }
  | { busy: false; summary: GenSummary; tokens: { calls: number; promptTokens: number; completionTokens: number; reasoningTokens: number; allowance: number }; durationMs: number }

/**
 * Production wiring: real DB, OpenCode, R2 cover upload. One run at a time (lease in pipeline_state),
 * bounded by `budgetMs` (every LLM call is capped by the remaining budget), token-budgeted, logged as one JSON line
 * and recorded in `pipeline_runs`.
 */
export async function runGenerationNow(opts: {
  max: number
  concurrency: number
  budgetMs?: number
  onEvent?: (e: GenEvent) => void
  step?: string
}): Promise<WriteStepResult> {
  const db = getDb()
  const started = Date.now()
  const budgetMs = opts.budgetMs ?? 200_000
  const step = opts.step ?? "write"
  if (!hasOpenCodeKey()) throw new Error("OPENCODE_API_KEY is not set")

  const leased = await withLease(db, "write", budgetMs + 60_000, async () => {
    const settings = await getSettings(db)
    const meter = await meterFromDb(openCodeJson, db, settings.llmDailyTokenBudget)
    const summary = await runGeneration(
      { db, llm: meter.llm, meter, settings, uploadCover: uploadCoverWithDedup, deadlineAt: started + budgetMs, log: (m) => console.log(`[write] ${m}`) },
      opts,
    )
    return { summary, tokens: meter.totals() }
  })
  if (leased.busy) {
    console.log(JSON.stringify({ step, busy: true }))
    return { busy: true }
  }
  const durationMs = Date.now() - started
  const { summary, tokens } = leased.value
  console.log(JSON.stringify({ step, ...summary, tokens, durationMs }))
  await recordRun(db, step, started, started + durationMs, !summary.stopped || summary.stopped === "paused", { ...summary, tokens })
  return { busy: false, summary, tokens, durationMs }
}
