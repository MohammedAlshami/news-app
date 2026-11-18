import "server-only"

import { getDb } from "@/db/client"
import { meterFromDb } from "@/lib/generation/llm-meter"
import { openCodeJson } from "@/lib/llm-json"
import { hasOpenCodeKey } from "@/lib/opencode"
import { getSettings, recordRun, withLease } from "@/lib/pipeline-state"

import { runClustering, type ClusterRunStats } from "./run"

export type ClusterStepResult = { busy: true } | { busy: false; stats: ClusterRunStats; tokens: ReturnType<Awaited<ReturnType<typeof meterFromDb>>["totals"]>; durationMs: number }

/**
 * Production wiring: real DB + OpenCode (LLM steps are skipped when no key is configured or the kill switch is on).
 * One run at a time (lease), time-boxed, token-budgeted, one JSON log line, one `pipeline_runs` row.
 */
export async function runClusteringNow(opts: { budgetMs?: number } = {}): Promise<ClusterStepResult> {
  const db = getDb()
  const started = Date.now()
  const budgetMs = opts.budgetMs ?? 150_000
  const leased = await withLease(db, "cluster", budgetMs + 60_000, async () => {
    const settings = await getSettings(db)
    const meter = await meterFromDb(openCodeJson, db, settings.llmDailyTokenBudget)
    const useLlm = hasOpenCodeKey() && !settings.paused
    const stats = await runClustering({ db, llm: useLlm ? meter.llm : undefined, deadlineAt: started + budgetMs, log: (m) => console.log(`[cluster] ${m}`) })
    return { stats, tokens: meter.totals() }
  })
  if (leased.busy) {
    console.log(JSON.stringify({ step: "cluster", busy: true }))
    return { busy: true }
  }
  const durationMs = Date.now() - started
  const { stats, tokens } = leased.value
  console.log(JSON.stringify({ step: "cluster", ...stats, tokens, durationMs }))
  await recordRun(db, "cluster", started, started + durationMs, !stats.llmStopped, { ...stats, tokens })
  return { busy: false, stats, tokens, durationMs }
}
