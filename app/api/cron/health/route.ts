import { NextResponse } from "next/server"

import { getDb } from "@/db/client"
import { getPipelineHealth } from "@/lib/pipeline-health.server"

export const dynamic = "force-dynamic"

/** 200 with flags=[] when healthy; 503 with the alert flags otherwise. */
export async function GET(): Promise<Response> {
  const health = await getPipelineHealth(getDb())
  return NextResponse.json(health, { status: health.flags.length ? 503 : 200 })
}
