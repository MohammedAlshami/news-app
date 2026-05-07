import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const priceRates = sqliteTable("price_rates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  market: text("market").notNull(),
  assetType: text("asset_type").notNull(),
  currencyCode: text("currency_code").notNull(),
  currencyName: text("currency_name").notNull(),
  sellRate: integer("sell_rate", { mode: "number" }).notNull(),
  buyRate: integer("buy_rate", { mode: "number" }).notNull(),
  scrapedAt: integer("scraped_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  sourceUrl: text("source_url").notNull(),
})

export type PriceRate = typeof priceRates.$inferSelect
export type NewPriceRate = typeof priceRates.$inferInsert
