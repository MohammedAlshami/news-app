import { desc, gte } from "drizzle-orm"

import type { AppDb } from "@/db/client"
import { articles } from "@/db/schema"
import { IdfIndex, cosine, termCounts } from "@/lib/clustering/similarity"

const WINDOW_MS = 72 * 3600 * 1000
const MAX_RECENT = 400

export type RecentArticle = { id: string; title: string; excerpt: string }

export async function loadRecentArticles(db: AppDb, now: number): Promise<RecentArticle[]> {
  return db
    .select({ id: articles.id, title: articles.title, excerpt: articles.excerpt })
    .from(articles)
    .where(gte(articles.createdAt, new Date(now - WINDOW_MS)))
    .orderBy(desc(articles.createdAt))
    .limit(MAX_RECENT)
}

/**
 * Lexical near-duplicate check against recently published articles.
 * `candidates` are texts describing the new piece (e.g. its title+excerpt, or the titles of
 * its source articles). Returns the closest existing article if the cosine reaches `threshold`.
 */
export function findNearDuplicate(
  candidates: { title: string; excerpt?: string }[],
  recent: RecentArticle[],
  threshold: number,
): { article: RecentArticle; score: number } | null {
  if (candidates.length === 0 || recent.length === 0) return null
  const idf = new IdfIndex()
  const rc = recent.map((r) => termCounts(r.title, r.excerpt))
  for (const c of rc) idf.add(c)
  const cc = candidates.map((c) => termCounts(c.title, c.excerpt ?? ""))
  for (const c of cc) idf.add(c)

  let best: { article: RecentArticle; score: number } | null = null
  const rw = rc.map((c) => idf.weigh(c))
  for (const c of cc) {
    const w = idf.weigh(c)
    rw.forEach((r, i) => {
      const score = cosine(w, r)
      if (!best || score > best.score) best = { article: recent[i], score }
    })
  }
  const found = best as { article: RecentArticle; score: number } | null
  return found && found.score >= threshold ? found : null
}
