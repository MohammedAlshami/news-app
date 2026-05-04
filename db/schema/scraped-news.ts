import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const scrapedNews = sqliteTable("scraped_news", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  source: text("source").notNull(),
  sourceKey: text("source_key").notNull(),
  category: text("category").notNull(),
  query: text("query"),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  url: text("url").notNull(),
  imageUrl: text("image_url"),
  publishedAt: text("published_at"),
  scrapedAt: integer("scraped_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  rawJson: text("raw_json").notNull(),
})

export type ScrapedNews = typeof scrapedNews.$inferSelect
export type NewScrapedNews = typeof scrapedNews.$inferInsert
