import "server-only"

import { desc, eq, sql } from "drizzle-orm"

import { getDb } from "@/db/client"
import { articles } from "@/db/schema"
import type { AdminArticleListItem } from "@/lib/site-types"

export const ADMIN_PAGE_SIZE = 10

export async function getAdminArticleListPage(input: {
  page: number
  pageSize?: number
}): Promise<{ rows: AdminArticleListItem[]; total: number }> {
  const pageSize = input.pageSize ?? ADMIN_PAGE_SIZE
  const page = Math.max(1, input.page)
  const offset = (page - 1) * pageSize
  const [{ total }] = await getDb()
    .select({ total: sql<number>`count(*)` })
    .from(articles)
  const rows = await getDb()
    .select()
    .from(articles)
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
    })),
  }
}

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
