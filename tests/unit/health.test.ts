import assert from "node:assert/strict"
import { test } from "node:test"

import { getPipelineHealth } from "@/lib/pipeline-health.server"

import { HOUR, NOW, seedRow } from "./helpers/fake-llm"
import { freshDb } from "./helpers/sqlite-db"

test("health: healthy pipeline → no flags", async () => {
  const { sqlite, db } = freshDb()
  seedRow(sqlite, { title: "x", ts: NOW - 10 * 60 * 1000, status: "clustered" })
  sqlite.prepare("INSERT INTO topics (id, title, created_at) VALUES ('t','t',?)").run(NOW - 30 * 60 * 1000)
  sqlite.prepare("INSERT INTO generated_articles (id, title, body, created_at) VALUES ('g','t','{}',?)").run(NOW - 20 * 60 * 1000)
  const h = await getPipelineHealth(db, NOW)
  assert.deepEqual(h.flags, [])
  assert.equal(h.articlesLast24h, 1)
  assert.equal(h.lastScrapeAgeMin, 10)
})

test("health: stalled scraping, backlog, no topics/articles and stuck writers are flagged", async () => {
  const { sqlite, db } = freshDb()
  for (let i = 0; i < 31; i++) seedRow(sqlite, { title: `p${i}`, ts: NOW - 5 * HOUR, status: "pending" })
  sqlite.prepare("UPDATE scraped_news SET scraped_at = ?").run(NOW - 5 * HOUR)
  sqlite.prepare("INSERT INTO topics (id, title, status, claimed_at, created_at) VALUES ('t','t','writing',?,?)").run(NOW - 2 * HOUR, NOW - 9 * HOUR)
  const h = await getPipelineHealth(db, NOW)
  assert.equal(h.pendingRows, 31)
  for (const f of ["scraping_stalled", "clustering_backlog", "no_new_topics_4h", "no_articles_4h", "stuck_writing_topics"]) assert.ok(h.flags.includes(f), f)
})

test("health: an empty database is reported as stalled, not as an error", async () => {
  const { db } = freshDb()
  const h = await getPipelineHealth(db, NOW)
  assert.ok(h.flags.includes("scraping_stalled"))
  assert.equal(h.pendingRows, 0)
})
