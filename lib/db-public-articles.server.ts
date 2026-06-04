import "server-only"

import { and, desc, eq, like, sql } from "drizzle-orm"

import { getDb } from "@/db/client"
import { articles } from "@/db/schema"
import { ALL_CATEGORIES_ID, parseShortId } from "@/lib/site-routes"
import type { FeedArticle } from "@/lib/site-types"

const cache = new Map<string, { data: unknown; expiry: number }>()

function cacheGet<T>(key: string): T | undefined {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiry) {
    cache.delete(key)
    return undefined
  }
  return entry.data as T
}

function cacheSet<T>(key: string, data: T, ttlMs = 60_000) {
  cache.set(key, { data, expiry: Date.now() + ttlMs })
}

export async function getPublishedArticleIdsForStaticParams(): Promise<
  { id: string }[]
> {
  const cached = cacheGet<{ id: string }[]>("static-params")
  if (cached) return cached

  const result = await getDb()
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.isPublished, true))

  cacheSet("static-params", result)
  return result
}

export async function getPublishedArticles() {
  const cached = cacheGet<ReturnType<typeof mapRow>>("published-articles")
  if (cached) return cached

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

  const result = rows.map(mapRow)
  cacheSet("published-articles", result)
  return result
}

function mapRow(r: {
  id: string
  title: string
  excerpt: string
  createdAt: Date
  categoryId: string | null
  coverImageUrl: string | null
  isMemberOnly: boolean
}) {
  return {
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    date: r.createdAt.toISOString().slice(0, 10),
    categoryIds: r.categoryId ? [r.categoryId] : [],
    coverImageUrl: r.coverImageUrl,
    isMemberOnly: r.isMemberOnly,
  }
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

export async function getRecommendedArticles(excludeId: string, limit = 8) {
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
    .where(
      and(eq(articles.isPublished, true), sql`${articles.id} != ${excludeId}`),
    )
    .orderBy(desc(articles.updatedAt))
    .limit(limit)
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
