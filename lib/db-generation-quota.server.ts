import "server-only"

import { eq, gte, sql } from "drizzle-orm"

import { getDb } from "@/db/client"
import { categories, generatedArticles, topics } from "@/db/schema"

export type CategoryQuota = {
  id: string
  slug: string
  name: string
  dailyQuota: number
  generatedToday: number
  remaining: number
}

function startOfUtcDay(): Date {
  const now = new Date()
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
}

/** Per-category daily generation quota plus how many were generated today (UTC). */
export async function getCategoryQuotas(): Promise<CategoryQuota[]> {
  const db = getDb()
  const cats = await db.select().from(categories)
  const since = startOfUtcDay()

  const counts = await db
    .select({
      categoryId: topics.categoryId,
      n: sql<number>`count(*)`,
    })
    .from(generatedArticles)
    .innerJoin(topics, eq(generatedArticles.topicId, topics.id))
    .where(gte(generatedArticles.createdAt, since))
    .groupBy(topics.categoryId)

  const usedToday = new Map<string, number>()
  for (const c of counts) {
    if (c.categoryId) usedToday.set(c.categoryId, Number(c.n))
  }

  return cats.map((c) => {
    const generatedToday = usedToday.get(c.id) ?? 0
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      dailyQuota: c.dailyQuota,
      generatedToday,
      remaining: Math.max(0, c.dailyQuota - generatedToday),
    }
  })
}

export async function updateCategoryQuotas(
  updates: { id: string; dailyQuota: number }[],
): Promise<void> {
  const db = getDb()
  for (const u of updates) {
    const quota = Math.max(0, Math.floor(u.dailyQuota))
    await db
      .update(categories)
      .set({ dailyQuota: quota })
      .where(eq(categories.id, u.id))
  }
}