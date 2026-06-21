import "server-only"

import { desc, eq, sql } from "drizzle-orm"

import { getDb } from "@/db/client"
import { articles, categories } from "@/db/schema"
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

async function getCategoryIdBySlug(slug: string): Promise<string | null> {
  const [row] = await getDb()
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1)
  return row?.id ?? null
}

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

export async function getArticlesByCategory(
  slug: string,
  limit: number,
): Promise<FeedArticle[]> {
  const categoryId = await getCategoryIdBySlug(slug)
  if (!categoryId) return []

  const rows = await getDb()
    .select(cols)
    .from(articles)
    .where(
      sql`${articles.isPublished} = 1 AND ${articles.categoryId} = ${categoryId} AND ${articles.coverImageUrl} IS NOT NULL AND ${articles.coverImageUrl} != ''`,
    )
    .orderBy(desc(articles.updatedAt))
    .limit(limit)
  return rows.map(toFeedArticle)
}

const cols = {
  id: articles.id,
  title: articles.title,
  excerpt: articles.excerpt,
  createdAt: articles.createdAt,
  categoryId: articles.categoryId,
  coverImageUrl: articles.coverImageUrl,
  isMemberOnly: articles.isMemberOnly,
} as const

export async function getHeroArticles(): Promise<FeedArticle[]> {
  const rows = await getDb()
    .select(cols)
    .from(articles)
    .where(sql`${articles.isPublished} = 1 AND ${articles.coverImageUrl} IS NOT NULL AND ${articles.coverImageUrl} != ''`)
    .orderBy(desc(articles.updatedAt))
    .limit(3)
  return rows.map(toFeedArticle)
}

export async function getCampusNewsArticles(): Promise<FeedArticle[]> {
  const rows = await getDb()
    .select(cols)
    .from(articles)
    .where(eq(articles.isPublished, true))
    .orderBy(desc(articles.updatedAt))
    .limit(4)
  return rows.map(toFeedArticle)
}

export async function getFinanceArticles(): Promise<FeedArticle[]> {
  return getArticlesByCategory("economy", 4)
}

export async function getSportsArticles(): Promise<FeedArticle[]> {
  return getArticlesByCategory("sports", 5)
}

export async function getTechArticles(): Promise<FeedArticle[]> {
  return getArticlesByCategory("technology", 5)
}
