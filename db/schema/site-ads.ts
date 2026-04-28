import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

/** Banner ads shown on the home page and/or article pages. */
export const siteAds = pgTable("site_ads", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Admin-facing label. */
  name: text("name").notNull().default(""),
  /** Full URL to image (R2 or `/uploads/...`). */
  imageUrl: text("image_url"),
  /** Click-through URL (must be http(s) or `/`). */
  href: text("href").notNull().default("#"),
  showOnHome: boolean("show_on_home").notNull().default(true),
  showOnArticle: boolean("show_on_article").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  /**
   * Display priority tier: `standard` | `gold` | `premium` | `platinum`
   * (platinum sorts above premium, etc.).
   */
  tier: text("tier").notNull().default("standard"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export type SiteAd = typeof siteAds.$inferSelect
export type NewSiteAd = typeof siteAds.$inferInsert
