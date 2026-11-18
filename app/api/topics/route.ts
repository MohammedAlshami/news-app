import { NextResponse } from "next/server"

import { requireAdminApi } from "@/lib/admin-guard.server"

import { getAllTopics } from "@/lib/db-topics.server"

export const dynamic = "force-dynamic"

export async function GET() {
  const denied = await requireAdminApi()
  if (denied) return denied
  const topics = await getAllTopics()
  return NextResponse.json({
    count: topics.length,
    topics,
  })
}
