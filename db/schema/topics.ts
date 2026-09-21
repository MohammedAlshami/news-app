import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { categories } from "./categories"

export const topics = sqliteTable("topics", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  articleCount: integer("article_count").notNull().default(0),
  categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
  parentId: text("parent_id"),
  type: text("type", { enum: ["persistent", "event"] }).notNull().default("event"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  /** Writing lifecycle: open → writing → written (or skipped). */
  status: text("status", { enum: ["open", "writing", "written", "skipped"] })
    .notNull()
    .default("open"),
  /** Epoch ms of the newest article attached (freshness / clustering window). */
  lastSeenAt: integer("last_seen_at"),
  genAttempts: integer("gen_attempts").notNull().default(0),
  /** Epoch ms when a writer claimed this topic (stale claims are re-claimable). */
  claimedAt: integer("claimed_at"),
  /** Number of sources at the time the article was written (for follow-ups). */
  writtenSourceCount: integer("written_source_count").notNull().default(0),
  startDate: text("start_date"),
  endDate: text("end_date"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

export type Topic = typeof topics.$inferSelect
export type NewTopic = typeof topics.$inferInsert
