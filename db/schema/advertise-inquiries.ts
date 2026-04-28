import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

/**
 * Public «advertise with us» submissions (Neon).
 * `status`: `new` | `read` | `archived`
 */
export const advertiseInquiries = sqliteTable("advertise_inquiries", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  /** Internal notes (admin only). */
  adminNotes: text("admin_notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

export type AdvertiseInquiry = typeof advertiseInquiries.$inferSelect
export type NewAdvertiseInquiry = typeof advertiseInquiries.$inferInsert
