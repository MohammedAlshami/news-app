import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { topics } from "./topics"

export const scrapedNews = sqliteTable("scraped_news", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  source: text("source").notNull(),
  sourceKey: text("source_key").notNull(),
  category: text("category").notNull(),
  query: text("query"),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  content: text("content"),
  url: text("url").notNull(),
  imageUrl: text("image_url"),
  publishedAt: text("published_at"),
  scrapedAt: integer("scraped_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  rawJson: text("raw_json").notNull(),
  topicId: text("topic_id").references(() => topics.id, { onDelete: "set null" }),
  /** Clustering state: pending → clustered (or skipped/failed). */
  status: text("status", { enum: ["pending", "clustering", "clustered", "skipped", "failed"] })
    .notNull()
    .default("pending"),
  /** Failed clustering attempts (row is parked as `failed` after 3). */
  attempts: integer("attempts").notNull().default(0),
  /** Parsed publication time in epoch ms (falls back to scrape time). */
  publishedTs: integer("published_ts"),
  /** Epoch ms when a clustering run claimed this row (stale claims are released). */
  claimedAt: integer("claimed_at"),
  /** JSON event signature (domain/type/actors/countries/date/...) extracted by the LLM. */
  signature: text("signature"),
  /** length(content) at insert time (cheap eligibility filter; NULL on legacy rows). */
  contentLen: integer("content_len"),
  /** 1 when the publish date could not be parsed (published_ts is NULL; kept out of generation). */
  dateUnknown: integer("date_unknown").notNull().default(0),
})

export type ScrapedNews = typeof scrapedNews.$inferSelect
export type NewScrapedNews = typeof scrapedNews.$inferInsert
