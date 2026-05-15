"use server"

import { eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { articles, generatedArticles } from "@/db/schema"

export type PublishGeneratedArticleResult =
  | { ok: true; articleId: string }
  | { ok: false; error: string }

/**
 * Copies a generated article into the `articles` table.
 * @param generatedId  - ID of the generated_articles row
 * @param publishNow   - true → isPublished=true, false → draft
 */
export async function publishGeneratedArticleAction(
  generatedId: string,
  publishNow: boolean,
): Promise<PublishGeneratedArticleResult> {
  try {
    const db = getDb()

    const [gen] = await db
      .select()
      .from(generatedArticles)
      .where(eq(generatedArticles.id, generatedId))
      .limit(1)

    if (!gen) return { ok: false, error: "المقال المولّد غير موجود." }

    const newId = crypto.randomUUID()
    const now = new Date()

    await db.insert(articles).values({
      id: newId,
      title: gen.title,
      excerpt: gen.excerpt,
      body: gen.body,
      coverImageUrl: gen.coverImageUrl,
      categoryId: null,
      isPublished: publishNow,
      views: 0,
      createdAt: now,
      updatedAt: now,
    })

    return { ok: true, articleId: newId }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "حدث خطأ غير متوقع." }
  }
}
