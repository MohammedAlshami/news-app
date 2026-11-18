import { NextResponse } from "next/server"

import { runClusteringNow } from "@/lib/clustering/run-now.server"
import { requireCronOrAdmin } from "@/lib/admin-guard.server"

export const dynamic = "force-dynamic"

/** Clusters pending scraped rows into topics (one run at a time, ~150 s budget; idempotent). */
export async function GET(request: Request): Promise<Response> {
  const denied = await requireCronOrAdmin(request)
  if (denied) return denied
  try {
    const r = await runClusteringNow({ budgetMs: 150_000 })
    if (r.busy) return NextResponse.json({ ok: true, busy: true })
    return NextResponse.json({ ok: !r.stats.llmStopped, ...r.stats, tokens: r.tokens, durationMs: r.durationMs })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`cluster failed: ${message}`)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
