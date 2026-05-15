import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const newsSources = sqliteTable("news_sources", {
  key: text("key").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  url: text("url").notNull(),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
  /** JSON blob — logoUrl, country, language, categories array */
  metadata: text("metadata").notNull().default("{}"),
})

export type NewsSource = typeof newsSources.$inferSelect
export type NewNewsSource = typeof newsSources.$inferInsert
