import { NextResponse } from "next/server"

import { getDb } from "@/db/client"
import { requireCronOrAdmin } from "@/lib/admin-guard.server"
import { getPipelineHealth } from "@/lib/pipeline-health.server"

export const dynamic = "force-dynamic"

/**
 * 200 with flags=[] when healthy; 503 with the alert flags otherwise.
 * Guarded (not public): the payload exposes queue sizes, token usage and failure reasons.
 */
export async function GET(request: Request): Promise<Response> {
  const denied = await requireCronOrAdmin(request)
  if (denied) return denied
  const health = await getPipelineHealth(getDb())
  return NextResponse.json(health, { status: health.flags.length ? 503 : 200 })
}
