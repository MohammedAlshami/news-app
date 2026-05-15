import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { scrapedNews } from "@/db/schema"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const db = getDb()
  const [article] = await db
    .select()
    .from(scrapedNews)
    .where(eq(scrapedNews.id, id))
    .limit(1)

  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 })
  }

  return NextResponse.json({ article })
}
