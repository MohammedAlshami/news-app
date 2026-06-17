import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { categories } from "./categories"

export const topics = sqliteTable("topics", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  articleCount: integer("article_count").notNull().default(0),
  categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

export type Topic = typeof topics.$inferSelect
export type NewTopic = typeof topics.$inferInsert
