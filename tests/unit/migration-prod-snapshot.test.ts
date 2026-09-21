import assert from "node:assert/strict"
import { copyFileSync, existsSync, readdirSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { DatabaseSync } from "node:sqlite"
import { test } from "node:test"

/**
 * Runs the NEW migrations (0015+) on a copy of a real production snapshot.
 * Set PROD_SNAPSHOT_DB=/path/to/snapshot.db (schema+data dumped from D1 before 0015); skipped otherwise.
 */
const SNAP = process.env.PROD_SNAPSHOT_DB
const skip = !SNAP || !existsSync(SNAP)

test("0015-0017 migrate a real production snapshot correctly", { skip: skip ? "PROD_SNAPSHOT_DB not set" : false }, () => {
  const tmp = join(tmpdir(), `snap-${Date.now()}.db`)
  copyFileSync(SNAP!, tmp)
  const db = new DatabaseSync(tmp)
  db.exec("PRAGMA foreign_keys = ON")
  const q = (sql: string) => db.prepare(sql).all() as any[]
  const n = (sql: string) => Number((db.prepare(sql).get() as any).n)

  const before = { topics: n("SELECT count(*) n FROM topics"), scraped: n("SELECT count(*) n FROM scraped_news"), gen: n("SELECT count(*) n FROM generated_articles"), arts: n("SELECT count(*) n FROM articles") }
  const files = readdirSync(join(process.cwd(), "db/migrations")).filter((f) => /^001[5-9]_.*\.sql$/.test(f)).sort()
  assert.deepEqual(files, ["0015_pipeline_state.sql", "0016_cleanup_topics.sql", "0017_scraped_news_signature.sql"])
  for (const f of files) db.exec(readFileSync(join(process.cwd(), "db/migrations", f), "utf8"))

  // nothing valuable lost
  assert.equal(n("SELECT count(*) n FROM generated_articles"), before.gen)
  assert.equal(n("SELECT count(*) n FROM articles"), before.arts)
  assert.ok(before.scraped - n("SELECT count(*) n FROM scraped_news") <= 1, "at most the single duplicate row is removed")

  // corrupted counters are repaired
  assert.equal(n("SELECT count(*) n FROM topics t WHERE article_count <> (SELECT count(*) FROM scraped_news s WHERE s.topic_id = t.id)"), 0)
  // no empty topic remains unless it owns a generated article or is a parent
  assert.equal(n(`SELECT count(*) n FROM topics t WHERE article_count = 0
     AND t.id NOT IN (SELECT topic_id FROM generated_articles WHERE topic_id IS NOT NULL)
     AND t.id NOT IN (SELECT parent_id FROM topics WHERE parent_id IS NOT NULL)`), 0)
  assert.ok(n("SELECT count(*) n FROM topics") < before.topics, "empty topics were removed")

  // row states
  const states = q("SELECT status, count(*) c FROM scraped_news GROUP BY status").map((r) => r.status).sort()
  assert.ok(states.every((s) => ["pending", "clustered", "skipped"].includes(s)), states.join())
  assert.equal(n("SELECT count(*) n FROM scraped_news WHERE topic_id IS NOT NULL AND status <> 'clustered'"), 0)
  assert.equal(n("SELECT count(*) n FROM scraped_news WHERE topic_id IS NULL AND status = 'clustered'"), 0)
  const cutoffMs = `(CAST(strftime('%s','now') AS INTEGER) - 72*3600) * 1000`
  assert.equal(n(`SELECT count(*) n FROM scraped_news WHERE status = 'pending' AND published_ts < ${cutoffMs}`), 0, "only in-window rows may stay pending")
  assert.equal(n(`SELECT count(*) n FROM scraped_news WHERE topic_id IS NULL AND status = 'skipped' AND published_ts >= ${cutoffMs}`), 0)

  // published_ts backfilled and sane
  assert.equal(n("SELECT count(*) n FROM scraped_news WHERE published_ts IS NULL"), 0)
  assert.equal(n("SELECT count(*) n FROM scraped_news WHERE published_ts > scraped_at"), 0)

  // topics: state backfilled
  assert.equal(n("SELECT count(*) n FROM topics WHERE last_seen_at IS NULL"), 0)
  assert.equal(n("SELECT count(*) n FROM topics t WHERE EXISTS (SELECT 1 FROM generated_articles g WHERE g.topic_id = t.id) AND status <> 'written'"), 0)
  assert.equal(n("SELECT count(*) n FROM topics t WHERE status = 'written' AND written_source_count <> (SELECT count(*) FROM scraped_news s WHERE s.topic_id = t.id)"), 0)
  assert.equal(n("SELECT count(*) n FROM topics WHERE status = 'open' AND id IN (SELECT topic_id FROM generated_articles WHERE topic_id IS NOT NULL)"), 0)

  // indexes + uniqueness
  const idx = q("SELECT name FROM sqlite_master WHERE type='index'").map((r) => r.name)
  for (const need of ["scraped_news_source_url_uq", "scraped_news_topic_idx", "scraped_news_status_pub_idx", "scraped_news_published_ts_idx", "topics_status_seen_idx", "topics_category_idx", "generated_articles_topic_idx", "generated_articles_created_idx", "articles_created_idx", "articles_category_created_idx"]) {
    assert.ok(idx.includes(need), `missing index ${need}`)
  }
  assert.equal(n("SELECT count(*) n FROM (SELECT 1 FROM scraped_news GROUP BY source_key, url HAVING count(*) > 1)"), 0)
  const cols = q("PRAGMA table_info(scraped_news)").map((c) => c.name)
  for (const c of ["status", "attempts", "published_ts", "claimed_at", "signature"]) assert.ok(cols.includes(c), c)
  console.log(`      migrated snapshot: topics ${before.topics} → ${n("SELECT count(*) n FROM topics")}, scraped ${before.scraped} → ${n("SELECT count(*) n FROM scraped_news")}, pending ${n("SELECT count(*) n FROM scraped_news WHERE status='pending'")}`)
})
