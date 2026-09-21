import "server-only"

import { desc } from "drizzle-orm"

import { getDb } from "@/db/client"
import { topics } from "@/db/schema"

export type TopicRow = typeof topics.$inferSelect

export async function getAllTopics() {
  return getDb()
    .select({ id: topics.id, title: topics.title, articleCount: topics.articleCount })
    .from(topics)
    .orderBy(desc(topics.createdAt))
}
