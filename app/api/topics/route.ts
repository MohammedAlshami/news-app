import { NextResponse } from "next/server"

import { getAllTopics } from "@/lib/db-topics.server"

export const dynamic = "force-dynamic"

export async function GET() {
  const topics = await getAllTopics()
  return NextResponse.json({
    count: topics.length,
    topics,
  })
}
