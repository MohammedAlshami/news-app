import "server-only"

import { eq, sql } from "drizzle-orm"

import { getDb, type AppDb } from "@/db/client"
import { categories, generatedArticles, topics } from "@/db/schema"

export type CategoryQuota = {
  id: string
  slug: string
  name: string
  dailyQuota: number
  generatedToday: number
  /** Topics currently claimed by a writer (their article is not counted yet). */
  inFlight: number
  remaining: number
}

/** The quota day starts at local midnight of the site's audience (Arabia, UTC+3), not at UTC midnight. */
export const QUOTA_DAY_OFFSET_MS = 3 * 3600 * 1000

/** Start (epoch ms) of the quota day containing `nowMs`. */
export function quotaDayStart(nowMs: number): number {
  return Math.floor((nowMs + QUOTA_DAY_OFFSET_MS) / 86400000) * 86400000 - QUOTA_DAY_OFFSET_MS
}

/** Per-category daily generation quota plus how many were generated today (UTC). */
export async function getCategoryQuotas(
  db: AppDb = getDb(),
  nowMs: number = Date.now(),
  opts: { staleClaimMs?: number } = {},
): Promise<CategoryQuota[]> {
  const cats = await db.select().from(categories)
  const since = new Date(quotaDayStart(nowMs))
  const staleBefore = nowMs - (opts.staleClaimMs ?? 20 * 60 * 1000)

  // claimed-but-unwritten first articles count against the quota (an update is also an article)
  const claimed = await db
    .select({ categoryId: topics.categoryId, n: sql<number>`count(*)` })
    .from(topics)
    .where(sql`${topics.status} = 'writing' AND ${topics.claimedAt} >= ${staleBefore}`)
    .groupBy(topics.categoryId)
  const inFlightBy = new Map<string, number>()
  for (const c of claimed) if (c.categoryId) inFlightBy.set(c.categoryId, Number(c.n))

  const counts = await db
    .select({
      categoryId: topics.categoryId,
      n: sql<number>`count(*)`,
    })
    .from(generatedArticles)
    .innerJoin(topics, eq(generatedArticles.topicId, topics.id))
    .where(sql`${generatedArticles.createdAt} >= ${since.getTime()} AND ${generatedArticles.isPublished} = 1`)
    .groupBy(topics.categoryId)

  const usedToday = new Map<string, number>()
  for (const c of counts) {
    if (c.categoryId) usedToday.set(c.categoryId, Number(c.n))
  }

  return cats.map((c) => {
    const generatedToday = usedToday.get(c.id) ?? 0
    const inFlight = inFlightBy.get(c.id) ?? 0
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      dailyQuota: c.dailyQuota,
      generatedToday,
      inFlight,
      remaining: Math.max(0, c.dailyQuota - generatedToday - inFlight),
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