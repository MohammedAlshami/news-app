import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

/** Key/value state: kill switch, settings, daily token counters and run leases (`holder`/`expires_at`). */
export const pipelineState = sqliteTable("pipeline_state", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  holder: text("holder"),
  expiresAt: integer("expires_at"),
  updatedAt: integer("updated_at").notNull().default(0),
})

/** One row per executed pipeline step (summary = JSON counters). */
export const pipelineRuns = sqliteTable("pipeline_runs", {
  id: text("id").primaryKey(),
  step: text("step").notNull(),
  startedAt: integer("started_at").notNull(),
  finishedAt: integer("finished_at"),
  ok: integer("ok", { mode: "boolean" }).notNull().default(true),
  durationMs: integer("duration_ms"),
  summary: text("summary").notNull().default("{}"),
})
