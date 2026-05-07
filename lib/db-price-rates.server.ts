import "server-only"

import { desc, eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { priceRates } from "@/db/schema"

export type PriceRateRow = typeof priceRates.$inferSelect

export async function getLatestPriceRates(market = "sanaa"): Promise<PriceRateRow[]> {
  return getDb()
    .select()
    .from(priceRates)
    .where(eq(priceRates.market, market))
    .orderBy(desc(priceRates.scrapedAt))
}

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
