import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { DatabaseSync } from "node:sqlite"

import { drizzle } from "drizzle-orm/sqlite-proxy"

import type { AppDb } from "@/db/client"
import * as schema from "@/db/schema"

/** drizzle sqlite-proxy over node:sqlite — same driver family the app uses, no network. */
export function dbFromSqlite(sqlite: DatabaseSync): AppDb {
  return drizzle(
    async (sql, params, method) => {
      const stmt = sqlite.prepare(sql)
      stmt.setReturnArrays(true)
      const p = params as (string | number | null)[]
      if (method === "run") {
        stmt.setReturnArrays(false)
        stmt.run(...p)
        return { rows: [] }
      }
      if (method === "get") {
        const row = stmt.get(...p) as unknown[] | undefined
        return { rows: row as never }
      }
      return { rows: stmt.all(...p) as unknown as unknown[][] }
    },
    { schema },
  ) as AppDb
}

const MIGRATIONS_DIR = join(process.cwd(), "db/migrations")
const BASELINE = join(process.cwd(), "tests/unit/helpers/baseline-schema.sql")

/**
 * Historical migrations 0001-0014 do not create every base table (categories/articles were
 * created out-of-band), so tests start from a dump of the real production schema taken before
 * 0015, then apply the NEW migrations (0015+) exactly as they will run on D1.
 */
export function applyMigrations(sqlite: DatabaseSync, from = "0015") {
  sqlite.exec(readFileSync(BASELINE, "utf8"))
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{4}_.*\.sql$/.test(f) && f.slice(0, 4) >= from)
    .sort()
  for (const f of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, f), "utf8")
    try {
      sqlite.exec(sql)
    } catch (err) {
      throw new Error(`migration ${f} failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  return files
}

export const CATEGORY_SLUGS = ["economy", "politics", "culture", "sports", "health", "technology", "science", "environment"]

export function freshDb(opts: { dailyQuota?: number } = {}): { sqlite: DatabaseSync; db: AppDb; catId: Record<string, string> } {
  const sqlite = new DatabaseSync(":memory:")
  sqlite.exec("PRAGMA foreign_keys = ON")
  applyMigrations(sqlite)
  const catId: Record<string, string> = {}
  const ins = sqlite.prepare("INSERT INTO categories (id, name, slug, daily_quota) VALUES (?, ?, ?, ?)")
  for (const slug of CATEGORY_SLUGS) {
    catId[slug] = `cat-${slug}`
    ins.run(`cat-${slug}`, slug, slug, opts.dailyQuota ?? 32)
  }
  return { sqlite, db: dbFromSqlite(sqlite), catId }
}
