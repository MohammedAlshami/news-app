import { NextResponse } from "next/server"

import { requireCronOrAdmin } from "@/lib/admin-guard.server"
import { generateAndSaveArticleForTopic } from "@/lib/db-generated-articles.server"

export const dynamic = "force-dynamic"

/**
 * GET /api/cron/generate-articles?topicId=<id>
 *
 * Admin: writes ONE unpublished draft for the given topic through the same writer, quality gates and cover
 * logic as the pipeline (lib/generation/core.ts). The old "loop over the latest topics" mode is gone: the
 * scheduler's write step is the only automatic path.
 */
export async function GET(request: Request) {
  const denied = await requireCronOrAdmin(request)
  if (denied) return denied
  const topicId = new URL(request.url).searchParams.get("topicId")
  if (!topicId) return NextResponse.json({ ok: false, error: "topicId is required" }, { status: 400 })
  try {
    const result = await generateAndSaveArticleForTopic(topicId)
    return NextResponse.json({ ok: true, generated: [result] })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
