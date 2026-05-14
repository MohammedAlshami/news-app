import { NextResponse } from "next/server"

import { getSourceArticlesForTopic } from "@/lib/db-generated-articles.server"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const sources = await getSourceArticlesForTopic(id)
  return NextResponse.json({ sources })
}
