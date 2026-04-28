import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

/** Banner ads shown on the home page and/or article pages. */
export const siteAds = sqliteTable("site_ads", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  /** Admin-facing label. */
  name: text("name").notNull().default(""),
  /** Full URL to image (R2 or `/uploads/...`). */
  imageUrl: text("image_url"),
  /** Click-through URL (must be http(s) or `/`). */
  href: text("href").notNull().default("#"),
  showOnHome: integer("show_on_home", { mode: "boolean" }).notNull().default(true),
  showOnArticle: integer("show_on_article", { mode: "boolean" }).notNull().default(true),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  /**
   * Display priority tier: `standard` | `gold` | `premium` | `platinum`
   * (platinum sorts above premium, etc.).
   */
  tier: text("tier").notNull().default("standard"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

export type SiteAd = typeof siteAds.$inferSelect
export type NewSiteAd = typeof siteAds.$inferInsert
