import { NextResponse } from "next/server"

import { requireCronOrAdmin } from "@/lib/admin-guard.server"
import { runGenerationNow } from "@/lib/generation/run-now.server"

export const dynamic = "force-dynamic"

const MAX_PER_RUN = 4
const CONCURRENCY = 2
/** Time budget of one step. Every LLM call is capped by what is left of it and no new topic starts in the last 45 s. */
const BUDGET_MS = 200_000

/**
 * Cron step: writes up to a few articles/updates through the shared generation loop. The work is awaited
 * (no un-awaited background continuation), one run at a time (lease), and answers with a JSON summary.
 */
export async function GET(request: Request): Promise<Response> {
  const denied = await requireCronOrAdmin(request)
  if (denied) return denied
  try {
    const r = await runGenerationNow({ max: MAX_PER_RUN, concurrency: CONCURRENCY, budgetMs: BUDGET_MS })
    if (r.busy) return NextResponse.json({ ok: true, busy: true })
    // a usage limit is an expected, reported condition (not a 5xx): the scheduler logs `stopped`
    return NextResponse.json({ ok: true, ...r.summary, tokens: r.tokens, durationMs: r.durationMs })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`write-pipeline failed: ${message}`)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
