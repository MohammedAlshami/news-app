import "server-only"

import { desc, eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { articles } from "@/db/schema"
import type { AdminArticleListItem } from "@/lib/site-types"

export async function getAdminArticleList(): Promise<AdminArticleListItem[]> {
  const rows = await getDb()
    .select()
    .from(articles)
    .orderBy(desc(articles.updatedAt))
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    date: r.createdAt.toISOString().slice(0, 10),
    categoryIds: r.categoryId ? [r.categoryId] : [],
    isPublished: r.isPublished,
  }))
}

export async function getAdminArticleById(
  id: string,
): Promise<typeof articles.$inferSelect | undefined> {
  const [row] = await getDb()
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1)
  return row
}
