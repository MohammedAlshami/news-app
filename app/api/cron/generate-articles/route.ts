import { NextResponse } from "next/server"

import { generateAndSaveArticleForTopic, getAdminTopicsPage } from "@/lib/db-generated-articles.server"

export const dynamic = "force-dynamic"

/**
 * GET /api/cron/generate-articles
 *
 * For testing: generates one article from the most recently updated topic.
 * Pass ?topicId=<uuid> to target a specific topic.
 * Pass ?limit=N to generate for the top N topics (default 1).
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const specificTopicId = url.searchParams.get("topicId")
  const limit = Math.min(10, Math.max(1, Number(url.searchParams.get("limit") ?? "1") || 1))

  try {
    if (specificTopicId) {
      const result = await generateAndSaveArticleForTopic(specificTopicId)
      return NextResponse.json({ ok: true, generated: [result] })
    }

    // Pick the top N most recently updated topics
    const { rows: topicRows } = await getAdminTopicsPage({ page: 1, pageSize: limit })

    if (topicRows.length === 0) {
      return NextResponse.json({ ok: true, generated: [], message: "No topics found." })
    }

    const generated = []
    for (const topic of topicRows) {
      const result = await generateAndSaveArticleForTopic(topic.id)
      generated.push(result)
    }

    return NextResponse.json({ ok: true, generated })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
