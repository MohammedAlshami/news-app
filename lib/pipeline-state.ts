import { eq, sql } from "drizzle-orm"

import type { AppDb } from "@/db/client"
import { pipelineRuns, pipelineState } from "@/db/schema"

/** Tunables stored in `pipeline_state` (all optional; defaults below). Edit with plain SQL / an admin tool. */
export const SETTING_DEFAULTS = {
  /** Kill switch: "1" pauses scraping-independent LLM work (cluster + write). */
  paused: "0",
  /** Max LLM tokens (prompt+completion, reasoning included) per UTC day across the whole pipeline. */
  llm_daily_token_budget: "3000000",
  /** A single-outlet topic waits this long for a second outlet before it may be written. */
  single_source_wait_min: "120",
  /** Minimum time between two articles of one topic. */
  followup_cooldown_min: "240",
  /** Original + updates per topic. */
  max_articles_per_topic: "3",
} as const
export type SettingKey = keyof typeof SETTING_DEFAULTS

export type PipelineSettings = {
  paused: boolean
  llmDailyTokenBudget: number
  singleSourceWaitMs: number
  followupCooldownMs: number
  maxArticlesPerTopic: number
}

export async function getState(db: AppDb, key: string): Promise<string | null> {
  const rows = await db.select({ value: pipelineState.value }).from(pipelineState).where(eq(pipelineState.key, key)).limit(1)
  return rows[0]?.value ?? null
}

export async function setState(db: AppDb, key: string, value: string, now = Date.now()): Promise<void> {
  await db
    .insert(pipelineState)
    .values({ key, value, updatedAt: now })
    .onConflictDoUpdate({ target: pipelineState.key, set: { value, updatedAt: now } })
}

const posInt = (v: string | undefined, dflt: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : dflt
}

/** One cheap read (the table has a handful of rows). */
export async function getSettings(db: AppDb): Promise<PipelineSettings> {
  const rows = await db.select({ key: pipelineState.key, value: pipelineState.value }).from(pipelineState).where(sql`${pipelineState.key} NOT LIKE 'lease:%' AND ${pipelineState.key} NOT LIKE 'tokens:%'`)
  const m: Record<string, string> = { ...SETTING_DEFAULTS }
  for (const r of rows) m[r.key] = r.value
  const d = SETTING_DEFAULTS
  return {
    paused: m.paused === "1" || m.paused === "true",
    llmDailyTokenBudget: posInt(m.llm_daily_token_budget, Number(d.llm_daily_token_budget)),
    singleSourceWaitMs: posInt(m.single_source_wait_min, Number(d.single_source_wait_min)) * 60_000,
    followupCooldownMs: posInt(m.followup_cooldown_min, Number(d.followup_cooldown_min)) * 60_000,
    maxArticlesPerTopic: Math.max(1, posInt(m.max_articles_per_topic, Number(d.max_articles_per_topic))),
  }
}

// ---------------------------------------------------------------------------------------
// daily token counters (UTC day)

export const utcDay = (now: number) => new Date(now).toISOString().slice(0, 10)

export async function getTokensToday(db: AppDb, now: number): Promise<number> {
  return Number((await getState(db, `tokens:${utcDay(now)}`)) ?? 0) || 0
}

/** Atomic increment (single UPSERT statement). */
export async function addTokens(db: AppDb, now: number, n: number): Promise<void> {
  if (n <= 0) return
  await db.run(sql`INSERT INTO pipeline_state (key, value, updated_at) VALUES (${`tokens:${utcDay(now)}`}, ${String(n)}, ${now})
    ON CONFLICT(key) DO UPDATE SET value = CAST(CAST(value AS INTEGER) + ${n} AS TEXT), updated_at = ${now}`)
}

// ---------------------------------------------------------------------------------------
// leases: one run of a step at a time (TTL guards against a killed Worker)

/** Acquire (or renew, when `holder` already owns it) the lease. Returns false when another live holder has it. */
export async function acquireLease(db: AppDb, name: string, holder: string, ttlMs: number, now = Date.now()): Promise<boolean> {
  const rows = await db.all<unknown>(sql`INSERT INTO pipeline_state (key, value, holder, expires_at, updated_at)
    VALUES (${`lease:${name}`}, '', ${holder}, ${now + ttlMs}, ${now})
    ON CONFLICT(key) DO UPDATE SET holder = ${holder}, expires_at = ${now + ttlMs}, updated_at = ${now}
      WHERE pipeline_state.expires_at IS NULL OR pipeline_state.expires_at < ${now} OR pipeline_state.holder = ${holder}
    RETURNING key`)
  return Array.isArray(rows) && rows.length > 0
}

export async function releaseLease(db: AppDb, name: string, holder: string): Promise<void> {
  await db.run(sql`UPDATE pipeline_state SET expires_at = NULL, holder = NULL WHERE key = ${`lease:${name}`} AND holder = ${holder}`)
}

/** Runs `fn` only if the lease is free; always releases. Returns { busy: true } when another run is active. */
export async function withLease<T>(
  db: AppDb,
  name: string,
  ttlMs: number,
  fn: (renew: () => Promise<boolean>) => Promise<T>,
  now: () => number = Date.now,
): Promise<{ busy: true } | { busy: false; value: T }> {
  const holder = crypto.randomUUID()
  if (!(await acquireLease(db, name, holder, ttlMs, now()))) return { busy: true }
  try {
    return { busy: false, value: await fn(() => acquireLease(db, name, holder, ttlMs, now())) }
  } finally {
    await releaseLease(db, name, holder).catch(() => {})
  }
}

// ---------------------------------------------------------------------------------------
// run log

export async function recordRun(
  db: AppDb,
  step: string,
  startedAt: number,
  finishedAt: number,
  ok: boolean,
  summary: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(pipelineRuns).values({
      id: crypto.randomUUID(), step, startedAt, finishedAt, ok, durationMs: finishedAt - startedAt, summary: JSON.stringify(summary).slice(0, 4000),
    })
    // keep the table small: drop rows older than 14 days (range delete on the started_at index)
    if (Math.random() < 0.05) await db.run(sql`DELETE FROM pipeline_runs WHERE started_at < ${finishedAt - 14 * 86400_000}`)
  } catch {
    /* never let logging break a step */
  }
}
