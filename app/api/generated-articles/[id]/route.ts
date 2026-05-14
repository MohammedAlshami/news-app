import { NextResponse } from "next/server"

import { getGeneratedArticleWithSources } from "@/lib/db-generated-articles.server"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const article = await getGeneratedArticleWithSources(id)
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ article })
}
