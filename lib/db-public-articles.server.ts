import "server-only"

import { and, desc, eq, like } from "drizzle-orm"

import { getDb } from "@/db/client"
import { articles } from "@/db/schema"
import { ALL_CATEGORIES_ID, parseShortId } from "@/lib/site-routes"
import type { FeedArticle } from "@/lib/site-types"

export async function getPublishedArticleIdsForStaticParams(): Promise<
  { id: string }[]
> {
  return (await getDb())
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.isPublished, true))
}

export async function getPublishedArticles() {
  const rows = await getDb()
    .select({
      id: articles.id,
      title: articles.title,
      excerpt: articles.excerpt,
      createdAt: articles.createdAt,
      categoryId: articles.categoryId,
      coverImageUrl: articles.coverImageUrl,
      isMemberOnly: articles.isMemberOnly,
    })
    .from(articles)
    .where(eq(articles.isPublished, true))
    .orderBy(desc(articles.updatedAt))

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    date: r.createdAt.toISOString().slice(0, 10),
    categoryIds: r.categoryId ? [r.categoryId] : [],
    coverImageUrl: r.coverImageUrl,
    isMemberOnly: r.isMemberOnly,
  }))
}

export async function getPublishedArticleRowById(id: string) {
  const [row] = await getDb()
    .select()
    .from(articles)
    .where(and(eq(articles.id, id), eq(articles.isPublished, true)))
    .limit(1)
  return row
}

export async function getPublishedArticleRowBySlugId(slugId: string) {
  const shortId = parseShortId(slugId)
  if (!shortId) return null
  const [row] = await getDb()
    .select()
    .from(articles)
    .where(
      and(
        like(articles.id, `${shortId}%`),
        eq(articles.isPublished, true),
      ),
    )
    .limit(1)
  return row
}

export async function getFeedArticlesByPageId(
  pageId: string,
  options?: { limit?: number },
): Promise<FeedArticle[]> {
  const db = await getDb()
  const cols = {
    id: articles.id,
    title: articles.title,
    excerpt: articles.excerpt,
    createdAt: articles.createdAt,
    categoryId: articles.categoryId,
    coverImageUrl: articles.coverImageUrl,
    isMemberOnly: articles.isMemberOnly,
  }

  /** `/category/all`: every published article, any category (or uncategorized). */
  const base =
    pageId === ALL_CATEGORIES_ID
      ? db
          .select(cols)
          .from(articles)
          .where(eq(articles.isPublished, true))
          .orderBy(desc(articles.updatedAt))
      : db
          .select(cols)
          .from(articles)
          .where(
            and(eq(articles.isPublished, true), eq(articles.categoryId, pageId)),
          )
          .orderBy(desc(articles.updatedAt))

  const rows =
    options?.limit !== undefined
      ? await base.limit(options.limit)
      : await base

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    date: r.createdAt.toISOString().slice(0, 10),
    categoryIds: r.categoryId ? [r.categoryId] : [],
    coverImageUrl: r.coverImageUrl,
    isMemberOnly: r.isMemberOnly,
  }))
}
