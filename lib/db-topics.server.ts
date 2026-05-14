import "server-only"

import { desc, gte, inArray, sql } from "drizzle-orm"

import { getDb } from "@/db/client"
import { scrapedNews, topics } from "@/db/schema"
import {
  groupArticlesByTopic,
  type ArticleInput,
  type ExistingTopic,
} from "@/lib/topic-grouper"

export type TopicRow = typeof topics.$inferSelect

/** Fetch all existing topics to pass as context to the AI grouper. */
export async function getAllTopics(): Promise<ExistingTopic[]> {
  const rows = await getDb()
    .select({ id: topics.id, title: topics.title, articleCount: topics.articleCount })
    .from(topics)
    .orderBy(desc(topics.createdAt))
  return rows
}

/**
 * Run topic grouping on all scraped_news rows inserted in the last `windowMs`
 * milliseconds that don't yet have a topic_id assigned.
 *
 * Steps:
 *  1. Load ungrouped articles from the recent window
 *  2. Load all existing topics for context
 *  3. Call the AI grouper
 *  4. Upsert new topics, update scraped_news rows, and increment article_count
 *
 * Returns a summary of what was created/updated.
 */
export async function runTopicGrouping(windowMs = 24 * 60 * 60 * 1000): Promise<{
  articlesProcessed: number
  topicsCreated: number
  topicsReused: number
}> {
  const db = getDb()
  const since = new Date(Date.now() - windowMs)

  // 1. Load ungrouped articles in the window
  const ungrouped = await db
    .select({
      id: scrapedNews.id,
      title: scrapedNews.title,
      category: scrapedNews.category,
      publishedAt: scrapedNews.publishedAt,
    })
    .from(scrapedNews)
    .where(gte(scrapedNews.scrapedAt, since))

  if (ungrouped.length === 0) {
    return { articlesProcessed: 0, topicsCreated: 0, topicsReused: 0 }
  }

  // 2. Load existing topics for AI context
  const existingTopics = await getAllTopics()

  // 3. Call AI grouper
  const articles: ArticleInput[] = ungrouped.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    publishedAt: r.publishedAt,
  }))

  const { groups } = await groupArticlesByTopic(articles, existingTopics)

  let topicsCreated = 0
  let topicsReused = 0

  // 4. Process each group
  for (const group of groups) {
    if (group.articleIds.length === 0) continue

    let topicId: string

    if (group.topicId) {
      // Reuse existing topic
      topicId = group.topicId
      topicsReused++
    } else {
      // Create new topic (article_count starts at 0, incremented below)
      const newId = crypto.randomUUID()
      await db.insert(topics).values({
        id: newId,
        title: group.title,
        articleCount: 0,
      })
      topicId = newId
      topicsCreated++
    }

    const ids = group.articleIds
    const BATCH = 50

    // Assign topic_id to scraped_news rows in batches
    for (let i = 0; i < ids.length; i += BATCH) {
      const chunk = ids.slice(i, i + BATCH)
      await db
        .update(scrapedNews)
        .set({ topicId })
        .where(inArray(scrapedNews.id, chunk))
    }

    // Increment article_count by the number of articles assigned to this topic
    // and stamp updatedAt
    await db
      .update(topics)
      .set({
        articleCount: sql`${topics.articleCount} + ${ids.length}`,
        updatedAt: new Date(),
      })
      .where(inArray(topics.id, [topicId]))
  }

  return {
    articlesProcessed: ungrouped.length,
    topicsCreated,
    topicsReused,
  }
}
