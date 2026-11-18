import "server-only"

import { and, desc, eq, inArray } from "drizzle-orm"
import { cache } from "react"

import { getDb } from "@/db/client"
import { priceRates } from "@/db/schema"

export type PriceRateRow = typeof priceRates.$inferSelect

export async function getLatestPriceRateByCurrency(
  market: string,
  currencyCode: string,
): Promise<PriceRateRow | undefined> {
  const rows = await getDb()
    .select()
    .from(priceRates)
    .where(eq(priceRates.market, market))
    .orderBy(desc(priceRates.scrapedAt))
  return rows.find((row) => row.currencyCode.toUpperCase() === currencyCode.toUpperCase())
}

export type RateLine = { code: string; name: string; buy: number; sell: number }
export type HomeRates = { sanaa: RateLine[]; aden: RateLine[]; updatedAt: number | null }

const HOME_RATE_CODES = ["USD", "SAR", "EUR", "AED", "GBP"]

/** Latest Sana'a / Aden rates of the main currencies (one query; newest row per market+currency wins). */
export const getHomeRates = cache(async (): Promise<HomeRates> => {
  const rows = await getDb()
    .select()
    .from(priceRates)
    .where(
      and(
        eq(priceRates.assetType, "currency"),
        inArray(priceRates.market, ["sanaa", "aden"]),
        inArray(priceRates.currencyCode, HOME_RATE_CODES),
      ),
    )
    .orderBy(desc(priceRates.scrapedAt))
    .limit(80)
  const pick = (market: string): RateLine[] => {
    const seen = new Map<string, RateLine>()
    for (const r of rows) {
      if (r.market !== market || seen.has(r.currencyCode)) continue
      seen.set(r.currencyCode, { code: r.currencyCode, name: r.currencyName, buy: r.buyRate, sell: r.sellRate })
    }
    return HOME_RATE_CODES.flatMap((c) => (seen.has(c) ? [seen.get(c)!] : []))
  }
  const newest = rows.reduce((m, r) => Math.max(m, r.scrapedAt.getTime()), 0)
  return { sanaa: pick("sanaa"), aden: pick("aden"), updatedAt: newest || null }
})

/** Latest gold quotes (for the converter page sidebar). */
export const getGoldRates = cache(async (): Promise<RateLine[]> => {
  const rows = await getDb().select().from(priceRates).where(eq(priceRates.assetType, "gold")).orderBy(desc(priceRates.scrapedAt)).limit(40)
  const seen = new Map<string, RateLine>()
  for (const r of rows) if (!seen.has(r.currencyCode)) seen.set(r.currencyCode, { code: r.currencyCode, name: r.currencyName, buy: r.buyRate, sell: r.sellRate })
  return [...seen.values()].slice(0, 5)
})

/** Full latest table for one market (converter page sidebar). */
export const getMarketRates = cache(async (market: string): Promise<RateLine[]> => {
  const rows = await getDb().select().from(priceRates).where(and(eq(priceRates.assetType, "currency"), eq(priceRates.market, market))).orderBy(desc(priceRates.scrapedAt)).limit(120)
  const seen = new Map<string, RateLine>()
  for (const r of rows) if (!seen.has(r.currencyCode)) seen.set(r.currencyCode, { code: r.currencyCode, name: r.currencyName, buy: r.buyRate, sell: r.sellRate })
  return [...seen.values()]
})
