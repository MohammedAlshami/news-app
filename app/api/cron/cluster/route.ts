import { NextResponse } from "next/server"

import { runClusteringNow } from "@/lib/clustering/run-now.server"

export const dynamic = "force-dynamic"

/** Clusters all pending scraped rows into topics (single entry point; idempotent). */
export async function GET(): Promise<Response> {
  try {
    const stats = await runClusteringNow()
    return NextResponse.json({ ok: true, ...stats })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`cluster failed: ${message}`)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
