import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { topics } from "./topics"

/**
 * AI-generated articles. Same shape as `articles` but kept separate
 * so they don't pollute the editorial content table.
 */
export const generatedArticles = sqliteTable("generated_articles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  body: text("body").notNull(),
  coverImageUrl: text("cover_image_url"),
  /** Original source URL before R2 upload — for dedup detection. */
  originalCoverImageUrl: text("original_cover_image_url"),
  /** Additional image URLs collected from source articles (JSON array string) */
  imageUrls: text("image_urls").notNull().default("[]"),
  /** JSON array of 3-5 bullet-point highlights for this article. */
  highlights: text("highlights").notNull().default("[]"),
  /** FK → topics.id — the topic this article was generated from */
  topicId: text("topic_id").references(() => topics.id, { onDelete: "set null" }),
  /** IDs of the scraped_news rows used as sources (JSON array string) */
  sourceArticleIds: text("source_article_ids").notNull().default("[]"),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
  views: integer("views").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

export type GeneratedArticle = typeof generatedArticles.$inferSelect
export type NewGeneratedArticle = typeof generatedArticles.$inferInsert
