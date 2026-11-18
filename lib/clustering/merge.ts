import { sql } from "drizzle-orm"

import type { AppDb } from "@/db/client"

import { buildEventSig, eventSigMatch, type EventSig } from "./event-key"
import type { Signature } from "./signature"

const chunk = <T,>(arr: T[], n: number): T[][] => {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

const MAX_MERGES = 20

/**
 * Deterministic merge pass (no LLM): two recent topics with the same event key (actors + concrete event type +
 * stage + day + country) are one event that the block judge kept apart (e.g. it never saw them together).
 * Only a topic WITHOUT published articles is merged away; its sources move to the other topic (which then treats
 * them as new sources: update logic applies). The merged topic is marked skipped with `skip_reason = merged:<id>`.
 */
export async function mergeDuplicateTopics(db: AppDb, now: number): Promise<number> {
  const since = now - 36 * 3600_000
  const recent = await db.all<Record<string, unknown>>(sql`
    SELECT t.id, t.category_id, t.article_count, t.status,
           EXISTS (SELECT 1 FROM generated_articles g WHERE g.topic_id = t.id) AS has_article
    FROM topics t
    WHERE t.last_seen_at >= ${since} AND t.status IN ('open', 'written') AND t.category_id IS NOT NULL AND t.article_count > 0
    ORDER BY t.last_seen_at DESC LIMIT 250`)
  const topics = recent.map((r) => (Array.isArray(r) ? { id: r[0], category_id: r[1], article_count: r[2], status: r[3], has_article: r[4] } : r)) as {
    id: string; category_id: string; article_count: number; status: string; has_article: number
  }[]
  if (topics.length < 2) return 0

  const sigs = new Map<string, Signature[]>()
  for (const ids of chunk(topics.map((t) => t.id), 80)) {
    const rows = await db.all<Record<string, unknown>>(sql`SELECT topic_id, signature FROM scraped_news WHERE topic_id IN (${sql.join(ids.map((i) => sql`${i}`), sql`, `)}) AND signature IS NOT NULL`)
    for (const r of rows) {
      const [topicId, json] = (Array.isArray(r) ? r : [(r as any).topic_id, (r as any).signature]) as [string, string]
      try {
        sigs.set(topicId, [...(sigs.get(topicId) ?? []), JSON.parse(json) as Signature])
      } catch {
        /* ignore corrupt signature */
      }
    }
  }
  const key = new Map<string, EventSig | null>(topics.map((t) => [t.id, buildEventSig(sigs.get(t.id) ?? [])]))

  let merged = 0
  const gone = new Set<string>()
  for (const a of topics) {
    if (merged >= MAX_MERGES) break
    if (gone.has(a.id) || a.has_article || !key.get(a.id)) continue
    const target = topics
      .filter((b) => b.id !== a.id && !gone.has(b.id) && b.category_id === a.category_id && eventSigMatch(key.get(a.id)!, key.get(b.id) ?? null))
      // prefer a topic that already has an article, then the bigger one, then the older id (stable)
      .sort((x, y) => Number(!!y.has_article) - Number(!!x.has_article) || y.article_count - x.article_count || x.id.localeCompare(y.id))[0]
    if (!target) continue
    // two unwritten topics: merge the smaller into the larger only
    if (!target.has_article && (target.article_count < a.article_count || (target.article_count === a.article_count && target.id > a.id))) continue
    await db.run(sql`UPDATE scraped_news SET topic_id = ${target.id} WHERE topic_id = ${a.id}`)
    await db.run(sql`UPDATE topics SET status = 'skipped', skip_reason = ${`merged:${target.id}`}, article_count = 0, claimed_at = NULL, updated_at = ${now} WHERE id = ${a.id}`)
    await db.run(sql`UPDATE topics SET article_count = (SELECT count(*) FROM scraped_news s WHERE s.topic_id = topics.id),
        last_seen_at = COALESCE((SELECT max(s.published_ts) FROM scraped_news s WHERE s.topic_id = topics.id), last_seen_at), updated_at = ${now}
      WHERE id = ${target.id}`)
    target.article_count += a.article_count
    key.set(target.id, buildEventSig([...(sigs.get(target.id) ?? []), ...(sigs.get(a.id) ?? [])]))
    sigs.set(target.id, [...(sigs.get(target.id) ?? []), ...(sigs.get(a.id) ?? [])])
    gone.add(a.id)
    merged++
  }
  return merged
}
