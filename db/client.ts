import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

import * as schema from "./schema"

type Db = ReturnType<typeof drizzle<typeof schema>>

let _db: Db | undefined

/**
 * Use from Server Actions, route handlers, and RSCs (not in client components).
 * @example
 *   const [row] = await getDb().select().from(articles).where(...);
 */
export function getDb() {
  if (_db) return _db
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("Missing DATABASE_URL. Set it in .env.local (see .env.example).")
  }
  _db = drizzle(neon(url), { schema })
  return _db
}
