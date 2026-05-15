import "server-only"

import { eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { newsSources } from "@/db/schema"
import type { ScraperSourceKey } from "@/lib/news-scraper"

export type NewsSourceRow = typeof newsSources.$inferSelect

export async function getAllNewsSources(): Promise<NewsSourceRow[]> {
  return getDb().select().from(newsSources)
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
