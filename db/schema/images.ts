import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const images = sqliteTable("images", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sourceUrl: text("source_url").notNull(),
  r2Url: text("r2_url").notNull(),
  hash: text("hash").notNull().unique(),
  firstUsedAt: integer("first_used_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  usageCount: integer("usage_count").notNull().default(1),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

export type Image = typeof images.$inferSelect
export type NewImage = typeof images.$inferInsert
