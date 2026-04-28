import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

/**
 * News articles (Neon). `body` is stored as Tiptap JSON (stringified).
 */
export const articles = pgTable("articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  body: text("body").notNull(),
  /** Page view count (increment when an article is shown). */
  views: integer("views").notNull().default(0),
  /** Optional category; references `categories.id` logically (no FK for flexibility). */
  categoryId: uuid("category_id"),
  /** Shown on the public site only when true. */
  isPublished: boolean("is_published").notNull().default(false),
  /**
   * Hero/banner image (URL path e.g. `/uploads/articles/{id}/cover.jpg`).
   */
  coverImageUrl: text("cover_image_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export type Article = typeof articles.$inferSelect
export type NewArticle = typeof articles.$inferInsert
