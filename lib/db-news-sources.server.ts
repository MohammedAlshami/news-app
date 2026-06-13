import "server-only"

import { eq, like, or } from "drizzle-orm"

import { getDb } from "@/db/client"
import { newsSources } from "@/db/schema"
import type { ScraperSourceKey } from "@/lib/news-scraper"

export type NewsSourceRow = typeof newsSources.$inferSelect

export async function getAllNewsSources(input?: { q?: string }): Promise<NewsSourceRow[]> {
  const filter = input?.q
    ? or(like(newsSources.name, `%${input.q}%`), like(newsSources.nameAr, `%${input.q}%`))
    : undefined
  return getDb().select().from(newsSources).where(filter)
}

export async function getEnabledSourceKeys(): Promise<ScraperSourceKey[]> {
  const rows = await getDb()
    .select({ key: newsSources.key })
    .from(newsSources)
    .where(eq(newsSources.isEnabled, true))
  return rows.map((r) => r.key as ScraperSourceKey)
}

export async function setNewsSourceEnabled(key: string, enabled: boolean): Promise<void> {
  await getDb()
    .update(newsSources)
    .set({ isEnabled: enabled })
    .where(eq(newsSources.key, key))
}

export async function getNewsSourceByKey(key: string): Promise<NewsSourceRow | undefined> {
  const [row] = await getDb()
    .select()
    .from(newsSources)
    .where(eq(newsSources.key, key))
    .limit(1)
  return row
}

export function parseMetadata(metadata: string): Record<string, unknown> {
  try {
    return JSON.parse(metadata)
  } catch {
    return {}
  }
}

export function getLastScrapedAt(source: NewsSourceRow): Date | null {
  const meta = parseMetadata(source.metadata)
  const val = meta.lastScrapedAt
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val)
    if (!isNaN(d.getTime())) return d
  }
  return null
}

export async function updateLastScrapedAt(key: string, lastScrapedAt: string): Promise<void> {
  const row = await getNewsSourceByKey(key)
  if (!row) return
  const meta = parseMetadata(row.metadata)
  meta.lastScrapedAt = lastScrapedAt
  await getDb()
    .update(newsSources)
    .set({ metadata: JSON.stringify(meta) })
    .where(eq(newsSources.key, key))
}
