import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

/**
 * Top-level site categories (e.g. "رياضات إلكترونية").
 */
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
