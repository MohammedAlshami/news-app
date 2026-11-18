import { and, desc, eq, gte, inArray, isNotNull, lt, sql } from "drizzle-orm"

import type { AppDb } from "@/db/client"
import { categories, scrapedNews, topics } from "@/db/schema"
import { directSiteCategory } from "@/lib/category-map"
import { isLlmStop, type LlmJson } from "@/lib/llm-json"

import { buildBlocks, type SigDoc } from "./blocking"
import { judgeBlock, type BlockItem } from "./block-llm"
import { classifyTitles } from "./llm-steps"
import { mergeDuplicateTopics } from "./merge"
import { EXTRACT_BATCH, extractBatch, fallbackSignature, type Signature, type SignatureInput } from "./signature"

export type ClusterRunDeps = {
  db: AppDb
  /** Without an LLM nothing can be merged: every article becomes its own topic (safe, never wrong). */
  llm?: LlmJson
  now?: number
  log?: (msg: string) => void
  /** Rows claimed per run (newest first). Bounds one run's LLM time; the rest is picked up next tick. */
  maxPerRun?: number
  concurrency?: number
  /** Epoch ms: no LLM call starts or runs past this (derived from the invocation's time budget). */
  deadlineAt?: number
}

export type ClusterRunStats = {
  claimed: number
  expired: number
  extracted: number
  extractionFailed: number
  fallbackSignatures: number
  blocks: number
  blocksJudged: number
  blockJudgeFailed: number
  newTopics: number
  attachedToExisting: number
  classified: number
  unclassified: number
  prunedEmptyTopics: number
  failedRows: number
  merged: number
  /** set when the LLM reported a usage limit / budget / deadline: the run stopped and counted no attempts */
  llmStopped: string | null
}

export const WINDOW_MS = 72 * 3600 * 1000
// well above the worst-case duration of one run (budget ≈ 2.5 min) so two runs never share rows
const STALE_CLAIM_MS = 20 * 60 * 1000
const DEFAULT_MAX_PER_RUN = 40
const MAX_ATTEMPTS = 3

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (next < items.length) {
        const i = next++
        results[i] = await fn(items[i])
      }
    }),
  )
  return results
}

/**
 * The single clustering entry point. Idempotent: it only touches rows in state `pending`,
 * claims them first (so overlapping runs never share rows), and every counter it writes is
 * recomputed from real rows rather than incremented.
 *
 * Per run: extract an LLM "event signature" for each claimed article → block candidates by
 * date/country/content type/shared actors → let the LLM decide inside each small block
 * (seeing the existing topics of that block) → persist.
 */
export async function runClustering(deps: ClusterRunDeps): Promise<ClusterRunStats> {
  const { db, llm } = deps
  const now = deps.now ?? Date.now()
  const log = deps.log ?? (() => {})
  const windowStart = now - WINDOW_MS

  const stats: ClusterRunStats = {
    claimed: 0, expired: 0, extracted: 0, extractionFailed: 0, fallbackSignatures: 0, blocks: 0,
    blocksJudged: 0, blockJudgeFailed: 0, newTopics: 0, attachedToExisting: 0, classified: 0,
    unclassified: 0, prunedEmptyTopics: 0, failedRows: 0, merged: 0, llmStopped: null,
  }

  // 0. housekeeping: release stale claims, expire rows that fell out of the window
  await db
    .update(scrapedNews)
    .set({ status: "pending", claimedAt: null })
    .where(and(eq(scrapedNews.status, "clustering"), lt(scrapedNews.claimedAt, now - STALE_CLAIM_MS)))
  const expired = await db
    .update(scrapedNews)
    .set({ status: "skipped" })
    .where(and(eq(scrapedNews.status, "pending"), sql`(${scrapedNews.publishedTs} IS NULL OR ${scrapedNews.publishedTs} < ${windowStart})`))
    .returning({ id: scrapedNews.id })
  stats.expired = expired.length

  // 1. claim pending rows (atomic: the UPDATE decides who owns them)
  const claimedIds = await claimPending(db, now, windowStart, deps.maxPerRun ?? DEFAULT_MAX_PER_RUN)
  stats.claimed = claimedIds.length

  if (claimedIds.length > 0) {
    try {
      await clusterClaimed({ ...deps, llm: deadlined(deps) }, now, windowStart, claimedIds, stats)
    } finally {
      // anything still claimed by this run (crash / partial failure) goes back to pending
      await db
        .update(scrapedNews)
        .set({ status: "pending", claimedAt: null })
        .where(and(eq(scrapedNews.status, "clustering"), eq(scrapedNews.claimedAt, now)))
    }
  }

  // 2. topics that still have no category (fallback signatures, LLM outage): classify by title
  if (llm && !stats.llmStopped) {
    try {
      const r = await classifyOpenTopics(db, deadlined(deps)!, log)
      stats.classified = r.classified
      stats.unclassified = r.remaining
    } catch (err) {
      if (!isLlmStop(err)) throw err
      stats.llmStopped = err.message
    }
  }

  // 3. merge topics that describe the same event (deterministic), then prune empty leftovers
  try {
    stats.merged = await mergeDuplicateTopics(db, now)
  } catch (err) {
    log(`merge pass failed: ${err instanceof Error ? err.message : String(err)}`)
  }
  stats.prunedEmptyTopics = await pruneEmptyTopics(db, now)
  return stats
}

/** The LLM with the step's deadline applied to every call. */
function deadlined(deps: ClusterRunDeps): LlmJson | undefined {
  const { llm, deadlineAt } = deps
  if (!llm || deadlineAt === undefined) return llm
  return (req) => llm({ deadlineAt, ...req })
}

async function claimPending(db: AppDb, now: number, windowStart: number, limit: number): Promise<string[]> {
  const rows = await db
    .update(scrapedNews)
    .set({ status: "clustering", claimedAt: now })
    .where(
      and(
        eq(scrapedNews.status, "pending"),
        gte(scrapedNews.publishedTs, windowStart),
        // newest first: fresh news is clustered (and published) before the backlog
        sql`${scrapedNews.id} IN (SELECT id FROM scraped_news WHERE status = 'pending' AND published_ts >= ${windowStart} ORDER BY published_ts DESC LIMIT ${limit})`,
      ),
    )
    .returning({ id: scrapedNews.id })
  return rows.map((r) => r.id)
}

type NewRow = {
  id: string
  title: string
  content: string | null
  sourceKey: string
  sourceCategory: string
  publishedTs: number
  attempts: number
  signature: string | null
}

function parseStoredSignature(json: string | null): Signature | null {
  if (!json) return null
  try {
    const s = JSON.parse(json) as Signature
    return s && typeof s === "object" && Array.isArray(s.actors) && typeof s.event_date === "string" ? s : null
  } catch {
    return null
  }
}

type Plan = {
  newTopics: { title: string; rows: NewRow[] }[]
  assignments: { row: NewRow; topicId: string }[]
}

async function clusterClaimed(
  deps: ClusterRunDeps,
  now: number,
  windowStart: number,
  claimedIds: string[],
  stats: ClusterRunStats,
) {
  const { db, llm } = deps
  const log = deps.log ?? (() => {})
  const conc = deps.concurrency ?? 4

  // ---- load claimed rows
  const rows: NewRow[] = []
  for (const ids of chunk(claimedIds, 90)) {
    const part = await db
      .select({
        id: scrapedNews.id, title: scrapedNews.title, content: scrapedNews.content, sourceKey: scrapedNews.sourceKey,
        sourceCategory: scrapedNews.category, publishedTs: scrapedNews.publishedTs, attempts: scrapedNews.attempts,
        signature: scrapedNews.signature,
      })
      .from(scrapedNews)
      .where(inArray(scrapedNews.id, ids))
    for (const r of part) rows.push({ ...r, publishedTs: r.publishedTs ?? now })
  }

  // ---- 1. signatures (reuse stored ones, e.g. after an earlier LLM failure in this pipeline)
  const sigOf = new Map<string, Signature>()
  const need: NewRow[] = []
  for (const r of rows) {
    const s = parseStoredSignature(r.signature)
    if (s) sigOf.set(r.id, s)
    else need.push(r)
  }
  const dropped = new Set<string>() // rows postponed to a later run
  const useFallback = async (r: NewRow) => {
    const sig = fallbackSignature({ title: r.title, sourceCategory: r.sourceCategory, publishedTs: r.publishedTs })
    sigOf.set(r.id, sig)
    stats.fallbackSignatures++
    await db.update(scrapedNews).set({ signature: JSON.stringify(sig) }).where(eq(scrapedNews.id, r.id))
  }

  if (need.length > 0) {
    if (!llm) {
      for (const r of need) await useFallback(r)
    } else {
      const inputs: SignatureInput[] = need.map((r) => ({
        id: r.id, title: r.title, content: r.content, sourceKey: r.sourceKey, sourceCategory: r.sourceCategory, publishedTs: r.publishedTs,
      }))
      const got = new Map<string, Signature>()
      await mapPool(chunk(inputs, EXTRACT_BATCH), conc, async (batch) => {
        if (stats.llmStopped) return
        try {
          for (const [id, sig] of await extractBatch(llm, batch)) got.set(id, sig)
        } catch (err) {
          if (isLlmStop(err)) stats.llmStopped = err.message
          log(`signature batch failed: ${err instanceof Error ? err.message : String(err)}`)
        }
      })
      const failedIds: string[] = []
      for (const r of need) {
        const sig = got.get(r.id)
        if (!sig && stats.llmStopped) {
          dropped.add(r.id) // quota / deadline: back to pending below, NO attempt counted, no fallback signature
        } else if (sig) {
          sigOf.set(r.id, sig)
          stats.extracted++
          await db.update(scrapedNews).set({ signature: JSON.stringify(sig) }).where(eq(scrapedNews.id, r.id))
        } else if (r.attempts + 1 >= MAX_ATTEMPTS) {
          await useFallback(r) // third strike: cluster with what we know instead of parking the row
        } else {
          failedIds.push(r.id)
          dropped.add(r.id)
        }
      }
      stats.extractionFailed = failedIds.length
      if (failedIds.length) await bumpAttempts(db, failedIds, stats)
    }
  }

  const live = rows.filter((r) => !dropped.has(r.id))
  if (live.length === 0) return

  // ---- 2. existing topics with signed members inside the window
  const memberRows = await db
    .select({
      id: scrapedNews.id, title: scrapedNews.title, sourceKey: scrapedNews.sourceKey,
      publishedTs: scrapedNews.publishedTs, topicId: scrapedNews.topicId, signature: scrapedNews.signature,
    })
    .from(scrapedNews)
    .where(and(isNotNull(scrapedNews.topicId), isNotNull(scrapedNews.signature), gte(scrapedNews.publishedTs, windowStart)))
    .orderBy(desc(scrapedNews.publishedTs))
    .limit(2500)
  const topicIds = [...new Set(memberRows.map((m) => m.topicId!).filter(Boolean))]
  const topicMeta = new Map<string, { title: string; status: string }>()
  for (const ids of chunk(topicIds, 90)) {
    const part = await db
      .select({ id: topics.id, title: topics.title, status: topics.status })
      .from(topics)
      .where(inArray(topics.id, ids))
    for (const t of part) topicMeta.set(t.id, t)
  }
  const docs: SigDoc[] = []
  for (const m of memberRows) {
    const meta = topicMeta.get(m.topicId!)
    const sig = parseStoredSignature(m.signature)
    if (!meta || meta.status === "skipped" || !sig) continue
    docs.push({ id: m.id, title: m.title, sourceKey: m.sourceKey, publishedTs: m.publishedTs ?? now, sig, topicId: m.topicId })
  }
  for (const r of live) {
    docs.push({ id: r.id, title: r.title, sourceKey: r.sourceKey, publishedTs: r.publishedTs, sig: sigOf.get(r.id)!, topicId: null })
  }

  // ---- 3. blocks that contain at least one new article
  const rowById = new Map(live.map((r) => [r.id, r]))
  const blocks = buildBlocks(docs).filter((b) => b.docs.some((d) => d.topicId === null))
  stats.blocks = blocks.length

  const plan: Plan = { newTopics: [], assignments: [] }
  const singleton = (r: NewRow) => plan.newTopics.push({ title: r.title.trim().slice(0, 140), rows: [r] })

  await mapPool(blocks, conc, async (block) => {
    if (stats.llmStopped) {
      for (const d of block.docs) if (d.topicId === null) dropped.add(d.id)
      return
    }
    const newDocs = block.docs.filter((d) => d.topicId === null).sort((a, b) => a.publishedTs - b.publishedTs)
    const byTopic = new Map<string, SigDoc[]>()
    for (const d of block.docs) if (d.topicId) byTopic.set(d.topicId, [...(byTopic.get(d.topicId) ?? []), d])

    if (byTopic.size === 0 && newDocs.length === 1) return singleton(rowById.get(newDocs[0].id)!)
    if (!llm) return newDocs.forEach((d) => singleton(rowById.get(d.id)!))

    const items: BlockItem[] = []
    const topicOfLabel = new Map<string, string>()
    const docOfLabel = new Map<string, SigDoc>()
    let ti = 0
    for (const [topicId, members] of byTopic) {
      const label = `T${++ti}`
      topicOfLabel.set(label, topicId)
      const sample = [...members].sort((a, b) => b.publishedTs - a.publishedTs).slice(0, 3)
      items.push({ label, kind: "topic", lines: sample.map((m) => `${m.sourceKey} | ${m.sig.event_date} | ${m.title}`) })
    }
    newDocs.forEach((d, i) => {
      const label = `N${i + 1}`
      docOfLabel.set(label, d)
      items.push({ label, kind: "new", lines: [`${d.sourceKey} | ${d.sig.event_date} | ${d.title}`] })
    })

    let groups: string[][]
    try {
      stats.blocksJudged++
      groups = await judgeBlock(llm, items)
    } catch (err) {
      if (isLlmStop(err)) {
        // usage limit / budget / deadline: not the articles' fault. No attempt counted, no singleton fallback.
        stats.llmStopped = err.message
        for (const d of newDocs) dropped.add(d.id)
        return
      }
      stats.blockJudgeFailed++
      log(`block judge failed: ${err instanceof Error ? err.message : String(err)}`)
      // retry later; on the third strike keep the articles separate rather than lose them
      const retry: string[] = []
      for (const d of newDocs) {
        const r = rowById.get(d.id)!
        if (r.attempts + 1 >= MAX_ATTEMPTS) singleton(r)
        else { retry.push(r.id); dropped.add(r.id) }
      }
      if (retry.length) await bumpAttempts(db, retry, stats)
      return
    }

    const placed = new Set<string>()
    for (const g of groups) {
      const topicLabel = g.find((l) => l.startsWith("T"))
      const newLabels = g.filter((l) => l.startsWith("N"))
      const memberRows = newLabels.map((l) => rowById.get(docOfLabel.get(l)!.id)!)
      newLabels.forEach((l) => placed.add(l))
      if (topicLabel) memberRows.forEach((r) => plan.assignments.push({ row: r, topicId: topicOfLabel.get(topicLabel)! }))
      else plan.newTopics.push({ title: memberRows[0].title.trim().slice(0, 140), rows: memberRows })
    }
    for (const [label, d] of docOfLabel) if (!placed.has(label)) singleton(rowById.get(d.id)!)
  })
  log(`plan: ${plan.newTopics.length} new topics, ${plan.assignments.length} attached to existing (${blocks.length} blocks)`)

  // ---- 4. persist
  const cats = await db.select({ id: categories.id, slug: categories.slug }).from(categories)
  const idBySlug = new Map(cats.map((c) => [c.slug, c.id]))
  const touched = new Set<string>()

  for (const batch of chunk(plan.newTopics, 10)) {
    const topicRowsPlan = batch.map((t) => ({
      id: crypto.randomUUID(),
      title: t.title,
      categoryId: voteCategory(t.rows.map((r) => ({ sig: sigOf.get(r.id)?.category ?? null, source: r.sourceCategory })), idBySlug),
      rows: t.rows,
      lastSeen: Math.max(...t.rows.map((r) => r.publishedTs)),
    }))
    const allIds = topicRowsPlan.flatMap((t) => t.rows.map((r) => r.id))
    try {
      await db.run(
        sql`INSERT INTO topics (id, title, category_id, status, last_seen_at, article_count, type) VALUES ${sql.join(
          topicRowsPlan.map((t) => sql`(${t.id}, ${t.title}, ${t.categoryId}, 'open', ${t.lastSeen}, 0, 'event')`),
          sql`, `,
        )}`,
      )
      for (const t of topicRowsPlan) touched.add(t.id)
      await linkRows(db, topicRowsPlan.flatMap((t) => t.rows.map((r) => ({ articleId: r.id, topicId: t.id }))))
      stats.newTopics += topicRowsPlan.length
    } catch (err) {
      log(`persist failed for ${topicRowsPlan.length} topics: ${err instanceof Error ? err.message : String(err)}`)
      await bumpAttempts(db, allIds, stats)
      await db.run(
        sql`DELETE FROM topics WHERE id IN (${sql.join(topicRowsPlan.map((t) => sql`${t.id}`), sql`, `)}) AND NOT EXISTS (SELECT 1 FROM scraped_news s WHERE s.topic_id = topics.id)`,
      )
    }
  }

  for (const batch of chunk(plan.assignments, 30)) {
    try {
      await linkRows(db, batch.map((a) => ({ articleId: a.row.id, topicId: a.topicId })))
      for (const a of batch) touched.add(a.topicId)
      stats.attachedToExisting += batch.length
    } catch (err) {
      log(`attach failed: ${err instanceof Error ? err.message : String(err)}`)
      await bumpAttempts(db, batch.map((b) => b.row.id), stats)
    }
  }

  // recompute aggregates from real rows (never increment)
  for (const ids of chunk([...touched], 40)) {
    await db.run(
      sql`UPDATE topics SET
            article_count = (SELECT count(*) FROM scraped_news s WHERE s.topic_id = topics.id),
            last_seen_at = COALESCE((SELECT max(s.published_ts) FROM scraped_news s WHERE s.topic_id = topics.id), last_seen_at),
            updated_at = ${now}
          WHERE id IN (${sql.join(ids.map((i) => sql`${i}`), sql`, `)})`,
    )
  }
}

async function linkRows(db: AppDb, rows: { articleId: string; topicId: string }[]) {
  for (const part of chunk(rows, 30)) {
    const whens = part.map((r) => sql`WHEN ${r.articleId} THEN ${r.topicId}`)
    await db.run(
      sql`UPDATE scraped_news SET topic_id = CASE id ${sql.join(whens, sql` `)} END, status = 'clustered', claimed_at = NULL
          WHERE id IN (${sql.join(part.map((r) => sql`${r.articleId}`), sql`, `)})`,
    )
  }
}

async function bumpAttempts(db: AppDb, ids: string[], stats: ClusterRunStats) {
  for (const part of chunk(ids, 90)) {
    await db.run(
      sql`UPDATE scraped_news
          SET attempts = attempts + 1,
              status = CASE WHEN attempts + 1 >= ${MAX_ATTEMPTS} THEN 'failed' ELSE 'pending' END,
              claimed_at = NULL
          WHERE id IN (${sql.join(part.map((i) => sql`${i}`), sql`, `)}) AND status = 'clustering'`,
    )
  }
  stats.failedRows += ids.length
}

/**
 * Topic category = majority of the LLM signature categories of its articles;
 * falls back to the direct source-category mapping (sport → sports …); null → classified later by title.
 */
export function voteCategory(
  members: { sig: string | null; source: string }[],
  idBySlug: Map<string, string>,
): string | null {
  const tally = (slugs: (string | null)[]) => {
    const votes = new Map<string, number>()
    for (const s of slugs) if (s && idBySlug.has(s)) votes.set(s, (votes.get(s) ?? 0) + 1)
    let best: string | null = null
    let n = 0
    for (const [slug, c] of votes) if (c > n) { best = slug; n = c }
    return best
  }
  const slug = tally(members.map((m) => m.sig)) ?? tally(members.map((m) => directSiteCategory(m.source)))
  return slug ? idBySlug.get(slug)! : null
}

async function classifyOpenTopics(db: AppDb, llm: LlmJson, log: (m: string) => void) {
  const todo = await db
    .select({ id: topics.id, title: topics.title })
    .from(topics)
    .where(and(sql`${topics.categoryId} IS NULL`, sql`${topics.status} IN ('open','written')`))
    .limit(150)
  if (todo.length === 0) return { classified: 0, remaining: 0 }
  const cats = await db.select({ id: categories.id, slug: categories.slug }).from(categories)
  const result = await classifyTitles(llm, todo, cats, (e) =>
    log(`classify chunk failed: ${e instanceof Error ? e.message : String(e)}`),
  )
  const byCat = new Map<string, string[]>()
  for (const [topicId, catId] of Object.entries(result)) {
    const arr = byCat.get(catId) ?? []
    arr.push(topicId)
    byCat.set(catId, arr)
  }
  for (const [catId, ids] of byCat) {
    for (const part of chunk(ids, 90)) {
      await db.update(topics).set({ categoryId: catId }).where(inArray(topics.id, part))
    }
  }
  const classified = Object.keys(result).length
  return { classified, remaining: todo.length - classified }
}

async function pruneEmptyTopics(db: AppDb, now: number): Promise<number> {
  const cutoff = now - 60 * 60 * 1000
  const rows = await db
    .delete(topics)
    .where(
      sql`${topics.status} = 'open' AND ${topics.articleCount} = 0 AND ${topics.createdAt} < ${cutoff}
          AND NOT EXISTS (SELECT 1 FROM scraped_news s WHERE s.topic_id = topics.id)
          AND NOT EXISTS (SELECT 1 FROM generated_articles g WHERE g.topic_id = topics.id)
          AND NOT EXISTS (SELECT 1 FROM topics c WHERE c.parent_id = topics.id)`,
    )
    .returning({ id: topics.id })
  return rows.length
}
