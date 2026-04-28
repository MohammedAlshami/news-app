import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

/**
 * Public «advertise with us» submissions (Neon).
 * `status`: `new` | `read` | `archived`
 */
export const advertiseInquiries = pgTable("advertise_inquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  /** Internal notes (admin only). */
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export type AdvertiseInquiry = typeof advertiseInquiries.$inferSelect
export type NewAdvertiseInquiry = typeof advertiseInquiries.$inferInsert
