import "server-only"

import { desc, gte } from "drizzle-orm"

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

function escapeLike(s: string): string {
  return s.replace(/'/g, "''").replace(/[%_]/g, " ").slice(0, 100)
}

async function searchTopics(query: string): Promise<{ id: string; title: string }[]> {
  const { rawD1Query } = await import("@/lib/db-raw-d1")
  try {
    const result = await rawD1Query(`SELECT id, title FROM topics WHERE title LIKE '%${escapeLike(query)}%' LIMIT 10`)
    return (result?.rows ?? []).map((r: unknown[]) => ({ id: r[0] as string, title: r[1] as string }))
  } catch {
    return []
  }
}

async function searchCategories(query: string): Promise<{ id: string; name: string; slug: string }[]> {
  const { rawD1Query } = await import("@/lib/db-raw-d1")
  try {
    const result = await rawD1Query(`SELECT id, name, slug FROM categories WHERE name LIKE '%${escapeLike(query)}%' OR slug LIKE '%${escapeLike(query)}%' LIMIT 10`)
    return (result?.rows ?? []).map((r: unknown[]) => ({ id: r[0] as string, name: r[1] as string, slug: r[2] as string }))
  } catch {
    return []
  }
}

export async function runTopicGrouping(windowMs = 24 * 60 * 60 * 1000): Promise<{
  articlesProcessed: number
  topicsCreated: number
  topicsReused: number
  articlesSkipped: number
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
    return { articlesProcessed: 0, topicsCreated: 0, topicsReused: 0, articlesSkipped: 0 }
  }

  const articles: ArticleInput[] = ungrouped.map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    content: r.content,
    category: r.category,
    publishedAt: r.publishedAt,
  }))

  const { groups, skippedArticleIds } = await groupArticlesByTopic(articles, searchTopics, searchCategories)

  const allExistingTopics = await db
    .select({ id: topics.id, title: topics.title })
    .from(topics)

  let topicsCreated = 0
  let topicsReused = 0

  for (const group of groups) {
    if (group.articleIds.length === 0) continue

    let topicId: string
    let reused = false

    if (group.topicId) {
      topicId = group.topicId
      topicsReused++
      reused = true
    } else {
      const { findMatchingTopic } = await import("@/lib/article-dedup.server")
      const match = await findMatchingTopic(group.title, allExistingTopics)
      if (match) {
        topicId = match.id
        topicsReused++
        reused = true
      } else {
        const newId = crypto.randomUUID()
        await db.insert(topics).values({
          id: newId,
          title: group.title,
          categoryId: group.categoryId,
          parentId: group.parentId ?? null,
          type: group.parentId ? "event" : "persistent",
          articleCount: 0,
        })
        topicId = newId
        topicsCreated++
      }
    }

    // Keep a reused topic's category in sync with the freshly classified group,
    // so a previously mislabeled topic gets corrected when new articles arrive.
    if (reused && group.categoryId) {
      await db
        .update(topics)
        .set({ categoryId: group.categoryId, updatedAt: new Date() })
        .where(eq(topics.id, topicId))
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
    articlesSkipped: skippedArticleIds.length,
  }
}
