import { sql } from "drizzle-orm"
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const financeRevenue = sqliteTable("finance_revenue", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  date: text("date").notNull(),
  source: text("source", { enum: ["google_ads", "memberships", "paid_articles", "direct_ads"] }).notNull(),
  amount: real("amount").notNull().default(0),
  description: text("description").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

export type FinanceRevenue = typeof financeRevenue.$inferSelect
export type NewFinanceRevenue = typeof financeRevenue.$inferInsert
