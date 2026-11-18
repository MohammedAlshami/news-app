import "server-only"
import { cleanImageUrl } from "@/lib/image-url"

import { cache } from "react"
import { and, asc, desc, eq, sql } from "drizzle-orm"

import { getDb } from "@/db/client"
import { articles, categories } from "@/db/schema"
import { getPublishedArticleRowById, getPublishedArticleRowBySlugId } from "@/lib/db-public-articles.server"
import { ALL_CATEGORIES_ID } from "@/lib/site-routes"
import type { FeedArticle, SiteCategory } from "@/lib/site-types"
import { isSubscribed } from "@/lib/subscription"

/**
 * Request-scoped (React `cache`) wrappers so layout, `generateMetadata` and the page share a single
 * D1 query / cookie read per render instead of repeating them.
 */

export const isSubscribedCached = cache(isSubscribed)

export const getCategoriesCached = cache(async (): Promise<SiteCategory[]> => {
  const rows = await getDb().select().from(categories).orderBy(asc(categories.name))
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? "",
    slug: r.slug,
  }))
})

export function findCategory(list: SiteCategory[], pageId: string): SiteCategory | undefined {
  if (pageId === ALL_CATEGORIES_ID) return undefined
  return list.find((c) => c.slug === pageId) ?? list.find((c) => c.id === pageId)
}

const isFullUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

export const getArticleForPage = cache(async (idOrSlug: string) =>
  isFullUuid(idOrSlug)
    ? getPublishedArticleRowById(idOrSlug)
    : getPublishedArticleRowBySlugId(idOrSlug),
)

const feedCols = {
  id: articles.id,
  title: articles.title,
  excerpt: articles.excerpt,
  createdAt: articles.createdAt,
  categoryId: articles.categoryId,
  coverImageUrl: articles.coverImageUrl,
  isMemberOnly: articles.isMemberOnly,
} as const

function toFeed(r: {
  id: string
  title: string
  excerpt: string
  createdAt: Date
  categoryId: string | null
  coverImageUrl: string | null
  isMemberOnly: boolean
}): FeedArticle {
  return {
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    date: r.createdAt.toISOString().slice(0, 10),
    categoryIds: r.categoryId ? [r.categoryId] : [],
    coverImageUrl: cleanImageUrl(r.coverImageUrl),
    isMemberOnly: r.isMemberOnly,
  }
}

export const CATEGORY_PAGE_SIZE = 20

/** One page of a category feed (`categoryId` undefined = all). Fetches pageSize+1 to detect a next page. */
export const getCategoryFeedPage = cache(
  async (categoryId: string | undefined, page: number) => {
    const rows = await getDb()
      .select(feedCols)
      .from(articles)
      .where(
        categoryId
          ? and(eq(articles.isPublished, true), eq(articles.categoryId, categoryId))
          : eq(articles.isPublished, true),
      )
      .orderBy(desc(articles.updatedAt), desc(articles.id))
      .limit(CATEGORY_PAGE_SIZE + 1)
      .offset((page - 1) * CATEGORY_PAGE_SIZE)
    return {
      articles: rows.slice(0, CATEGORY_PAGE_SIZE).map(toFeed),
      hasNext: rows.length > CATEGORY_PAGE_SIZE,
    }
  },
)

export const HOME_SECTION_SIZE = 8
export const HOME_MAX_SECTIONS = 6

/** Home hero (3 newest with cover) in one query. */
export const getHomeHero = cache(async (): Promise<FeedArticle[]> => {
  const rows = await getDb()
    .select(feedCols)
    .from(articles)
    .where(
      sql`${articles.isPublished} = 1 AND ${articles.coverImageUrl} IS NOT NULL AND ${articles.coverImageUrl} != ''`,
    )
    .orderBy(desc(articles.updatedAt))
    .limit(3)
  return rows.map(toFeed)
})

/** Newest articles with a cover for a category id (single query; no slug->id lookup). */
export const getHomeSection = cache(async (categoryId: string): Promise<FeedArticle[]> => {
  const rows = await getDb()
    .select(feedCols)
    .from(articles)
    .where(
      sql`${articles.isPublished} = 1 AND ${articles.categoryId} = ${categoryId} AND ${articles.coverImageUrl} IS NOT NULL AND ${articles.coverImageUrl} != ''`,
    )
    .orderBy(desc(articles.updatedAt))
    .limit(HOME_SECTION_SIZE)
  return rows.map(toFeed)
})
