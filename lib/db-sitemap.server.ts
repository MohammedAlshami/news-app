import "server-only"

import { desc, eq, and, gte } from "drizzle-orm"

import { getDb } from "@/db/client"
import { articles } from "@/db/schema"

/** Google caps one sitemap file at 50,000 URLs. */
export const SITEMAP_MAX_URLS = 50_000
export const RSS_MAX_ITEMS = 50
export const NEWS_SITEMAP_MAX_URLS = 1_000
const NEWS_WINDOW_MS = 48 * 60 * 60 * 1000

/** Published article ids + timestamps only (no body/excerpt) to keep D1 row-read bytes small. */
export async function getSitemapArticles(limit = SITEMAP_MAX_URLS) {
  return getDb()
    .select({
      id: articles.id,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .where(eq(articles.isPublished, true))
    .orderBy(desc(articles.updatedAt))
    .limit(Math.min(limit, SITEMAP_MAX_URLS))
}

/** Articles published in the last 48h (Google News sitemap window). */
export async function getNewsSitemapArticles(now = new Date()) {
  const since = new Date(now.getTime() - NEWS_WINDOW_MS)
  return getDb()
    .select({ id: articles.id, title: articles.title, createdAt: articles.createdAt })
    .from(articles)
    .where(and(eq(articles.isPublished, true), gte(articles.createdAt, since)))
    .orderBy(desc(articles.createdAt))
    .limit(NEWS_SITEMAP_MAX_URLS)
}

export async function getRssArticles(limit = RSS_MAX_ITEMS) {
  return getDb()
    .select({
      id: articles.id,
      title: articles.title,
      excerpt: articles.excerpt,
      coverImageUrl: articles.coverImageUrl,
      categoryId: articles.categoryId,
      createdAt: articles.createdAt,
    })
    .from(articles)
    .where(eq(articles.isPublished, true))
    .orderBy(desc(articles.createdAt))
    .limit(Math.min(limit, RSS_MAX_ITEMS))
}

const memo = new Map<string, { value: string; expiry: number }>()

/**
 * Per-isolate memo for generated feed bodies so crawler bursts do not each hit D1.
 * Best-effort only (Worker isolates are ephemeral); `Cache-Control` handles downstream caches.
 */
export async function memoFeed(key: string, ttlMs: number, build: () => Promise<string>): Promise<string> {
  const hit = memo.get(key)
  if (hit && hit.expiry > Date.now()) return hit.value
  const value = await build()
  memo.set(key, { value, expiry: Date.now() + ttlMs })
  return value
}
