import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

/**
 * App users (auth / author attribution can be added later, e.g. password hash, OAuth id).
 */
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  /** Display or full name. */
  name: text("name"),
  /**
   * Access level, e.g. `user`, `admin`. Use app constants for allowed values.
   */
  role: text("role").notNull().default("user"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
