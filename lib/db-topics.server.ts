import "server-only"

import { desc, gte, like } from "drizzle-orm"

import { getDb } from "@/db/client"
import { categories, scrapedNews, topics } from "@/db/schema"
import { groupArticlesByTopic, type ArticleInput } from "@/lib/topic-grouper"

export type TopicRow = typeof topics.$inferSelect

export async function getAllTopics() {
  return getDb()
    .select({ id: topics.id, title: topics.title, articleCount: topics.articleCount })
    .from(topics)
    .orderBy(desc(topics.createdAt))
}

async function searchTopics(query: string): Promise<{ id: string; title: string }[]> {
  return getDb()
    .select({ id: topics.id, title: topics.title })
    .from(topics)
    .where(like(topics.title, `%${query}%`))
    .limit(10)
}

async function searchCategories(query: string): Promise<{ id: string; name: string }[]> {
  const { rawD1Query } = await import("@/lib/db-raw-d1")
  const result = await rawD1Query(`SELECT id, name FROM categories WHERE name LIKE '%${query.replace(/'/g, "''")}%' LIMIT 5`)
  return (result?.rows ?? []).map((r: unknown[]) => ({ id: r[0] as string, name: r[1] as string }))
}

export async function runTopicGrouping(windowMs = 24 * 60 * 60 * 1000): Promise<{
  articlesProcessed: number
  topicsCreated: number
  topicsReused: number
}> {
  const db = getDb()
  const since = new Date(Date.now() - windowMs)

  const ungrouped = await db
    .select({
      id: scrapedNews.id,
      title: scrapedNews.title,
      excerpt: scrapedNews.excerpt,
      content: scrapedNews.content,
      category: scrapedNews.category,
      publishedAt: scrapedNews.publishedAt,
    })
    .from(scrapedNews)
    .where(gte(scrapedNews.scrapedAt, since))

  if (ungrouped.length === 0) {
    return { articlesProcessed: 0, topicsCreated: 0, topicsReused: 0 }
  }

  const articles: ArticleInput[] = ungrouped.map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    content: r.content,
    category: r.category,
    publishedAt: r.publishedAt,
  }))

  const { groups } = await groupArticlesByTopic(articles, searchTopics, searchCategories)

  let topicsCreated = 0
  let topicsReused = 0

  for (const group of groups) {
    if (group.articleIds.length === 0) continue

    let topicId: string

    if (group.topicId) {
      topicId = group.topicId
      topicsReused++
    } else {
      const newId = crypto.randomUUID()
      await db.insert(topics).values({
        id: newId,
        title: group.title,
        categoryId: group.categoryId,
        articleCount: 0,
      })
      topicId = newId
      topicsCreated++
    }

    const ids = [...new Set(group.articleIds)]
    const BATCH = 50

    const { rawD1Exec } = await import("@/lib/db-raw-d1")
    for (let i = 0; i < ids.length; i += BATCH) {
      const chunk = ids.slice(i, i + BATCH)
      if (chunk.length === 0) continue
      const idsList = chunk.map((id) => `'${id}'`).join(",")
      await rawD1Exec(`UPDATE scraped_news SET topic_id = '${topicId}' WHERE id IN (${idsList})`)
    }

    await rawD1Exec(
      `UPDATE topics SET article_count = article_count + ${ids.length}, updated_at = ${Date.now()} WHERE id = '${topicId}'`,
    )
  }

  return {
    articlesProcessed: ungrouped.length,
    topicsCreated,
    topicsReused,
  }
}
