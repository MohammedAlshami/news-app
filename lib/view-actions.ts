"use server"

import { and, eq, sql } from "drizzle-orm"

import { getDb } from "@/db/client"
import { articles } from "@/db/schema"

const ARTICLE_ID = /^[0-9a-fA-F-]{36}$/

/**
 * PUBLIC on purpose (anonymous readers count views). It can only bump the view counter of an already
 * published article; ids are validated so junk input never reaches the database.
 */
export async function incrementArticleViewAction(id: string): Promise<void> {
  if (typeof id !== "string" || !ARTICLE_ID.test(id)) return
  await getDb()
    .update(articles)
    .set({ views: sql`${articles.views} + 1` })
    .where(and(eq(articles.id, id), eq(articles.isPublished, true)))
}
