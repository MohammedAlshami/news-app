import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

/**
 * App users (auth / author attribution can be added later, e.g. password hash, OAuth id).
 */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  /** Display or full name. */
  name: text("name"),
  /**
   * Access level, e.g. `user`, `admin`. Use app constants for allowed values.
   */
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
