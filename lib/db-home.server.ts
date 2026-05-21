import "server-only"

import { desc, eq, sql } from "drizzle-orm"

import { getDb } from "@/db/client"
import { articles } from "@/db/schema"
import type { FeedArticle } from "@/lib/site-types"

export async function getMarqueeArticles(limit = 10) {
  const rows = await getDb()
    .select({
      id: articles.id,
      title: articles.title,
    })
    .from(articles)
    .where(eq(articles.isPublished, true))
    .orderBy(desc(articles.updatedAt))
    .limit(limit)
  return rows
}

const financeCategoryId = "44444444-4444-4444-4444-444444444444"
const sportsCategoryId = "33333333-3333-3333-3333-333333333333"
const techCategoryId = "11111111-1111-1111-1111-111111111111"

function toFeedArticle(r: {
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
    coverImageUrl: r.coverImageUrl,
    isMemberOnly: r.isMemberOnly,
  }
}

export async function getHeroArticles(): Promise<FeedArticle[]> {
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
    .limit(3)
  return rows.map(toFeedArticle)
}

export async function getCampusNewsArticles(): Promise<FeedArticle[]> {
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
    .limit(4)
  return rows.map(toFeedArticle)
}

export async function getFinanceArticles(): Promise<FeedArticle[]> {
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
      sql`${articles.isPublished} = 1 AND ${articles.categoryId} = ${financeCategoryId}`,
    )
    .orderBy(desc(articles.updatedAt))
    .limit(4)
  return rows.map(toFeedArticle)
}

export async function getSportsArticles(): Promise<FeedArticle[]> {
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
      sql`${articles.isPublished} = 1 AND ${articles.categoryId} = ${sportsCategoryId}`,
    )
    .orderBy(desc(articles.updatedAt))
    .limit(5)
  return rows.map(toFeedArticle)
}

export async function getTechArticles(): Promise<FeedArticle[]> {
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
      sql`${articles.isPublished} = 1 AND ${articles.categoryId} = ${techCategoryId}`,
    )
    .orderBy(desc(articles.updatedAt))
    .limit(5)
  return rows.map(toFeedArticle)
}
