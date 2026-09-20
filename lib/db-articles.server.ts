import "server-only"

import { desc, eq, like, or, sql } from "drizzle-orm"

import { getDb } from "@/db/client"
import { articles } from "@/db/schema"
import type { AdminArticleListItem } from "@/lib/site-types"

export const ADMIN_PAGE_SIZE = 10

export async function getAdminArticleListPage(input: {
  page: number
  pageSize?: number
  q?: string
}): Promise<{ rows: AdminArticleListItem[]; total: number }> {
  const pageSize = input.pageSize ?? ADMIN_PAGE_SIZE
  const page = Math.max(1, input.page)
  const offset = (page - 1) * pageSize
  const db = getDb()

  const filter = input.q
    ? or(like(articles.title, `%${input.q}%`), like(articles.excerpt, `%${input.q}%`))
    : undefined

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(articles)
    .where(filter)

  const rows = await db
    .select()
    .from(articles)
    .where(filter)
    .orderBy(desc(articles.updatedAt))
    .limit(pageSize)
    .offset(offset)
  return {
    total: Number(total ?? 0),
    rows: rows.map((r) => ({
      id: r.id,
      title: r.title,
      excerpt: r.excerpt,
      date: r.createdAt.toISOString().slice(0, 10),
      categoryIds: r.categoryId ? [r.categoryId] : [],
      isPublished: r.isPublished,
      isMemberOnly: r.isMemberOnly,
      views: r.views,
      coverImageUrl: r.coverImageUrl,
    })),
  }
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
