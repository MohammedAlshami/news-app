import { NextResponse } from "next/server"

import { runTopicGrouping } from "@/lib/db-topics.server"

export const dynamic = "force-dynamic"

export async function GET() {
  const result = await runTopicGrouping()
  return NextResponse.json({ ok: true, ...result })
}
