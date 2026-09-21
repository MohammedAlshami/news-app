import "server-only"

import type { AppDb } from "@/db/client"
import { sql } from "drizzle-orm"

export type PipelineHealth = {
  now: string
  pendingRows: number
  oldestPendingAgeMin: number | null
  lastScrapeAgeMin: number | null
  lastTopicAgeMin: number | null
  lastArticleAgeMin: number | null
  articlesLast24h: number
  stuckWriting: number
  flags: string[]
}

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v))

/** Cheap counters + alert flags. `flags` is empty when the pipeline is healthy. */
export async function getPipelineHealth(db: AppDb, nowMs = Date.now()): Promise<PipelineHealth> {
  const rows = await db.all<Record<string, unknown> | unknown[]>(sql`
    SELECT
      (SELECT count(*) FROM scraped_news WHERE status = 'pending' AND published_ts >= ${nowMs - 72 * 3600_000}) AS pending,
      (SELECT min(published_ts) FROM scraped_news WHERE status = 'pending' AND published_ts >= ${nowMs - 72 * 3600_000}) AS oldest_pending,
      (SELECT max(scraped_at) FROM scraped_news) AS last_scrape,
      (SELECT max(created_at) FROM topics) AS last_topic,
      (SELECT max(created_at) FROM generated_articles) AS last_article,
      (SELECT count(*) FROM generated_articles WHERE created_at >= ${nowMs - 24 * 3600_000}) AS articles24,
      (SELECT count(*) FROM topics WHERE status = 'writing' AND claimed_at < ${nowMs - 30 * 60_000}) AS stuck
  `)
  // D1 binding returns objects, the HTTP/proxy driver returns arrays in SELECT order — accept both.
  const COLS = ["pending", "oldest_pending", "last_scrape", "last_topic", "last_article", "articles24", "stuck"]
  const first = (Array.isArray(rows) ? rows[0] : rows) as unknown
  const r: Record<string, unknown> | undefined = Array.isArray(first)
    ? Object.fromEntries(COLS.map((c, i) => [c, (first as unknown[])[i]]))
    : (first as Record<string, unknown> | undefined)
  const age = (ts: unknown) => (num(ts) === null ? null : Math.round((nowMs - Number(ts)) / 60000))

  const h: PipelineHealth = {
    now: new Date(nowMs).toISOString(),
    pendingRows: Number(r?.pending ?? 0),
    oldestPendingAgeMin: age(r?.oldest_pending),
    lastScrapeAgeMin: age(r?.last_scrape),
    lastTopicAgeMin: age(r?.last_topic),
    lastArticleAgeMin: age(r?.last_article),
    articlesLast24h: Number(r?.articles24 ?? 0),
    stuckWriting: Number(r?.stuck ?? 0),
    flags: [],
  }
  if (h.lastScrapeAgeMin === null || h.lastScrapeAgeMin > 180) h.flags.push("scraping_stalled")
  if (h.pendingRows > 30 && (h.oldestPendingAgeMin ?? 0) > 120) h.flags.push("clustering_backlog")
  if (h.lastTopicAgeMin === null || h.lastTopicAgeMin > 240) h.flags.push("no_new_topics_4h")
  if (h.lastArticleAgeMin === null || h.lastArticleAgeMin > 240) h.flags.push("no_articles_4h")
  if (h.stuckWriting > 0) h.flags.push("stuck_writing_topics")
  return h
}
