import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

/**
 * News articles (Neon). `body` is stored as Tiptap JSON (stringified).
 */
export const articles = sqliteTable("articles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  body: text("body").notNull(),
  /** Page view count (increment when an article is shown). */
  views: integer("views").notNull().default(0),
  /** Optional category; references `categories.id` logically (no FK for flexibility). */
  categoryId: text("category_id"),
  /** Shown on the public site only when true. */
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
  /** Visible only to logged-in members when true. */
  isMemberOnly: integer("is_member_only", { mode: "boolean" }).notNull().default(false),
  /**
   * Hero/banner image (URL path e.g. `/uploads/articles/{id}/cover.jpg`).
   */
  coverImageUrl: text("cover_image_url"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

export type Article = typeof articles.$inferSelect
export type NewArticle = typeof articles.$inferInsert
