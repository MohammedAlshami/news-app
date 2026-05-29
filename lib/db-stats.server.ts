import "server-only"

import { count, desc, eq, sql } from "drizzle-orm"

import { getDb } from "@/db/client"
import { articles, categories, generatedArticles } from "@/db/schema"

export type DashboardStats = {
  totalArticles: number
  totalGeneratedArticles: number
  totalViews: number
  publishedArticles: number
  draftArticles: number
  totalCategories: number
}

export type ViewsOverTime = {
  date: string
  articles: number
  generated: number
}[]

export type TopArticle = {
  id: string
  title: string
  views: number
  type: "article" | "generated"
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = getDb()

  const [{ totalArticles }] = await db
    .select({ totalArticles: count() })
    .from(articles)

  const [{ totalGeneratedArticles }] = await db
    .select({ totalGeneratedArticles: count() })
    .from(generatedArticles)

  const [{ totalArticleViews }] = await db
    .select({ totalArticleViews: sql<number>`coalesce(sum(${articles.views}), 0)` })
    .from(articles)

  const [{ totalGeneratedViews }] = await db
    .select({ totalGeneratedViews: sql<number>`coalesce(sum(${generatedArticles.views}), 0)` })
    .from(generatedArticles)

  const [{ publishedArticles }] = await db
    .select({ publishedArticles: count() })
    .from(articles)
    .where(eq(articles.isPublished, true))

  const [{ totalCategories }] = await db
    .select({ totalCategories: count() })
    .from(categories)

  return {
    totalArticles: Number(totalArticles ?? 0),
    totalGeneratedArticles: Number(totalGeneratedArticles ?? 0),
    totalViews: Number(totalArticleViews ?? 0) + Number(totalGeneratedViews ?? 0),
    publishedArticles: Number(publishedArticles ?? 0),
    draftArticles: Number(totalArticles ?? 0) - Number(publishedArticles ?? 0),
    totalCategories: Number(totalCategories ?? 0),
  }
}

export async function getArticlesCreatedOverTime(days = 30): Promise<ViewsOverTime> {
  const db = getDb()
  const now = Date.now()
  const start = now - days * 86400000

  const articleRows = await db
    .select({
      date: sql<string>`date(${articles.createdAt} / 1000, 'unixepoch')`,
      count: sql<number>`count(*)`,
    })
    .from(articles)
    .where(sql`${articles.createdAt} >= ${start}`)
    .groupBy(sql`date(${articles.createdAt} / 1000, 'unixepoch')`)
    .orderBy(sql`date(${articles.createdAt} / 1000, 'unixepoch')`)

  const generatedRows = await db
    .select({
      date: sql<string>`date(${generatedArticles.createdAt} / 1000, 'unixepoch')`,
      count: sql<number>`count(*)`,
    })
    .from(generatedArticles)
    .where(sql`${generatedArticles.createdAt} >= ${start}`)
    .groupBy(sql`date(${generatedArticles.createdAt} / 1000, 'unixepoch')`)
    .orderBy(sql`date(${generatedArticles.createdAt} / 1000, 'unixepoch')`)

  const articleMap = new Map(articleRows.map((r) => [r.date, Number(r.count)]))
  const generatedMap = new Map(generatedRows.map((r) => [r.date, Number(r.count)]))

  const result: ViewsOverTime = []
  for (let i = 0; i < days; i++) {
    const d = new Date(now - i * 86400000)
    const dateStr = d.toISOString().slice(0, 10)
    result.unshift({
      date: dateStr,
      articles: articleMap.get(dateStr) ?? 0,
      generated: generatedMap.get(dateStr) ?? 0,
    })
  }

  return result
}

export async function getTopViewedArticles(limit = 5): Promise<TopArticle[]> {
  const db = getDb()

  const topArticles = await db
    .select({ id: articles.id, title: articles.title, views: articles.views })
    .from(articles)
    .orderBy(desc(articles.views))
    .limit(limit)

  const topGenerated = await db
    .select({
      id: generatedArticles.id,
      title: generatedArticles.title,
      views: generatedArticles.views,
    })
    .from(generatedArticles)
    .orderBy(desc(generatedArticles.views))
    .limit(limit)

  const combined: TopArticle[] = [
    ...topArticles.map((a) => ({ ...a, type: "article" as const })),
    ...topGenerated.map((a) => ({ ...a, type: "generated" as const })),
  ]
    .sort((a, b) => b.views - a.views)
    .slice(0, limit)

  return combined
}
