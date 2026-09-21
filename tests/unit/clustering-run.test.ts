import assert from "node:assert/strict"
import { test } from "node:test"

import { runClustering } from "@/lib/clustering/run"
import { insertScrapedNewsRows, findKnownUrls } from "@/lib/db-scraped-news.server"

import { makeFakeLlm, seedRow, HOUR, NOW } from "./helpers/fake-llm"
import { freshDb } from "./helpers/sqlite-db"

const q = (sqlite: ReturnType<typeof freshDb>["sqlite"], sql: string, ...p: (string | number)[]) => sqlite.prepare(sql).all(...p) as any[]
const one = (sqlite: ReturnType<typeof freshDb>["sqlite"], sql: string, ...p: (string | number)[]) => ({ ...(sqlite.prepare(sql).get(...p) as object) }) as any

test("clusters same-event articles into one topic, sets exact counts, categories and states", async () => {
  const { sqlite, db, catId } = freshDb()
  const { llm, log } = makeFakeLlm()
  const a1 = seedRow(sqlite, { title: "خبر [E1] <sports>", sourceKey: "youm7", ts: NOW - 5 * HOUR })
  const a2 = seedRow(sqlite, { title: "خبر آخر [E1] <sports>", sourceKey: "rt", ts: NOW - 4 * HOUR })
  const a3 = seedRow(sqlite, { title: "خبر ثالث [E1] <sports>", sourceKey: "bbc", ts: NOW - 3 * HOUR })
  const b1 = seedRow(sqlite, { title: "حدث مختلف [E2] <economy>", ts: NOW - 2 * HOUR })
  const b2 = seedRow(sqlite, { title: "حدث مختلف ثان [E2] <economy>", ts: NOW - 2 * HOUR })
  const c1 = seedRow(sqlite, { title: "حدث وحيد [E3] <health>", ts: NOW - HOUR })

  const stats = await runClustering({ db, llm, now: NOW })
  assert.equal(stats.claimed, 6)
  assert.equal(stats.extracted, 6)
  assert.equal(stats.newTopics, 3)
  assert.equal(log.other, 0)

  const topics = q(sqlite, "SELECT id, title, article_count, category_id, status, last_seen_at FROM topics ORDER BY article_count DESC")
  assert.deepEqual(topics.map((t) => t.article_count), [3, 2, 1], "article_count equals the real number of linked rows")
  assert.deepEqual(topics.map((t) => t.category_id), [catId.sports, catId.economy, catId.health], "category comes from the signature")
  assert.ok(topics.every((t) => t.status === "open"))
  const of = (id: string) => one(sqlite, "SELECT topic_id, status, signature FROM scraped_news WHERE id = ?", id)
  assert.equal(of(a1).topic_id, of(a2).topic_id)
  assert.equal(of(a1).topic_id, of(a3).topic_id)
  assert.equal(of(b1).topic_id, of(b2).topic_id)
  assert.notEqual(of(a1).topic_id, of(b1).topic_id)
  assert.notEqual(of(b1).topic_id, of(c1).topic_id)
  for (const id of [a1, a2, a3, b1, b2, c1]) {
    assert.equal(of(id).status, "clustered")
    assert.ok(JSON.parse(of(id).signature).event_type, "signature persisted")
  }
  assert.equal(topics[0].last_seen_at, NOW - 3 * HOUR, "last_seen_at = newest member's publish time")
})

test("is idempotent: a second run does nothing and counts stay exact", async () => {
  const { sqlite, db } = freshDb()
  const { llm, log } = makeFakeLlm()
  seedRow(sqlite, { title: "أ [E1]" }); seedRow(sqlite, { title: "ب [E1]" })
  await runClustering({ db, llm, now: NOW })
  const before = q(sqlite, "SELECT id, article_count FROM topics")
  const calls = { ...log }
  const again = await runClustering({ db, llm, now: NOW })
  assert.equal(again.claimed, 0)
  assert.equal(again.newTopics, 0)
  assert.deepEqual(q(sqlite, "SELECT id, article_count FROM topics"), before)
  assert.equal(log.extract, calls.extract, "no LLM calls when nothing is pending")
  assert.equal(log.judge, calls.judge)
})

test("a later article joins the EXISTING topic (no duplicate topic) and the count is recomputed, not incremented", async () => {
  const { sqlite, db } = freshDb()
  const { llm, log } = makeFakeLlm()
  seedRow(sqlite, { title: "أول [E1]", ts: NOW - 6 * HOUR })
  seedRow(sqlite, { title: "ثان [E1]", ts: NOW - 5 * HOUR })
  await runClustering({ db, llm, now: NOW })
  const topic = one(sqlite, "SELECT id FROM topics")
  const late = seedRow(sqlite, { title: "ثالث متأخر [E1]", ts: NOW - HOUR, sourceKey: "bbc" })
  const stats = await runClustering({ db, llm, now: NOW })
  assert.equal(stats.attachedToExisting, 1)
  assert.equal(stats.newTopics, 0)
  assert.equal(one(sqlite, "SELECT count(*) n FROM topics").n, 1)
  assert.equal(one(sqlite, "SELECT topic_id FROM scraped_news WHERE id = ?", late).topic_id, topic.id)
  assert.equal(one(sqlite, "SELECT article_count FROM topics WHERE id = ?", topic.id).article_count, 3)
  assert.match(log.judgeInputs.at(-1)!, /T1 \(existing topic\)/, "the judge saw the existing topic")
  // and running again keeps it at exactly 3
  await runClustering({ db, llm, now: NOW })
  assert.equal(one(sqlite, "SELECT article_count FROM topics WHERE id = ?", topic.id).article_count, 3)
})

test("the gates keep look-alikes apart: two days apart, other country, opinion vs news", async () => {
  const { sqlite, db } = freshDb()
  const { llm } = makeFakeLlm()
  seedRow(sqlite, { title: "سعر [E1] {EG}", ts: NOW - 2 * HOUR })
  seedRow(sqlite, { title: "سعر [E1] {EG} قبل يومين", ts: NOW - 2 * HOUR - 2 * 24 * HOUR })
  seedRow(sqlite, { title: "سعر [E1] {SA}", ts: NOW - 2 * HOUR })
  seedRow(sqlite, { title: "سعر [E1] {EG} (opinion)", ts: NOW - 2 * HOUR })
  await runClustering({ db, llm, now: NOW })
  assert.equal(one(sqlite, "SELECT count(*) n FROM topics").n, 4, "none of the four may be merged")
})

test("newest rows are processed first and maxPerRun bounds one run; the rest follows next run", async () => {
  const { sqlite, db } = freshDb()
  const { llm } = makeFakeLlm()
  const ids = Array.from({ length: 10 }, (_, i) => seedRow(sqlite, { title: `مقال منفصل ${i} [E${i + 10}]`, ts: NOW - (10 - i) * HOUR }))
  const s1 = await runClustering({ db, llm, now: NOW, maxPerRun: 4 })
  assert.equal(s1.claimed, 4)
  const done = q(sqlite, "SELECT id FROM scraped_news WHERE status = 'clustered'").map((r) => r.id).sort()
  assert.deepEqual(done, ids.slice(-4).sort(), "the 4 newest were clustered first")
  assert.equal(one(sqlite, "SELECT count(*) n FROM scraped_news WHERE status = 'pending'").n, 6)
  await runClustering({ db, llm, now: NOW, maxPerRun: 4 })
  await runClustering({ db, llm, now: NOW, maxPerRun: 4 })
  assert.equal(one(sqlite, "SELECT count(*) n FROM scraped_news WHERE status = 'pending'").n, 0)
  assert.equal(one(sqlite, "SELECT count(*) n FROM topics").n, 10)
})

test("rows older than the 72h window are skipped, not clustered", async () => {
  const { sqlite, db } = freshDb()
  const { llm } = makeFakeLlm()
  const old = seedRow(sqlite, { title: "قديم [E1]", ts: NOW - 100 * HOUR })
  const fresh = seedRow(sqlite, { title: "جديد [E2]", ts: NOW - HOUR })
  const stats = await runClustering({ db, llm, now: NOW })
  assert.equal(stats.expired, 1)
  assert.equal(one(sqlite, "SELECT status FROM scraped_news WHERE id = ?", old).status, "skipped")
  assert.equal(one(sqlite, "SELECT status FROM scraped_news WHERE id = ?", fresh).status, "clustered")
})

test("two concurrent runs never process the same row twice (atomic claim)", async () => {
  const { sqlite, db } = freshDb()
  const { llm } = makeFakeLlm()
  for (let i = 0; i < 6; i++) seedRow(sqlite, { title: `حدث ${i % 3} [E${i % 3}]`, ts: NOW - (i + 1) * HOUR })
  const [a, b] = await Promise.all([runClustering({ db, llm, now: NOW }), runClustering({ db, llm, now: NOW + 1 })])
  assert.equal(a.claimed + b.claimed, 6, "each row claimed exactly once")
  assert.equal(one(sqlite, "SELECT count(*) n FROM scraped_news WHERE status = 'clustered'").n, 6)
  assert.equal(one(sqlite, "SELECT count(*) n FROM scraped_news WHERE topic_id IS NULL").n, 0)
  const total = one(sqlite, "SELECT sum(article_count) s FROM topics").s
  assert.equal(total, 6, "counts add up to the real number of rows")
})

test("stale 'clustering' claims from a crashed run are released and processed", async () => {
  const { sqlite, db } = freshDb()
  const { llm } = makeFakeLlm()
  const id = seedRow(sqlite, { title: "عالق [E1]", status: "clustering", claimedAt: NOW - 30 * 60 * 1000 })
  const fresh = seedRow(sqlite, { title: "قيد المعالجة [E2]", status: "clustering", claimedAt: NOW - 60 * 1000 })
  await runClustering({ db, llm, now: NOW })
  assert.equal(one(sqlite, "SELECT status FROM scraped_news WHERE id = ?", id).status, "clustered")
  assert.equal(one(sqlite, "SELECT status FROM scraped_news WHERE id = ?", fresh).status, "clustering", "a recent claim belongs to another run and is left alone")
})

test("signature extraction failure: rows retry, then fall back after 3 attempts (never lost, never stuck)", async () => {
  const { sqlite, db } = freshDb()
  const { llm, log } = makeFakeLlm({ failExtract: true })
  const id = seedRow(sqlite, { title: "لا توقيع [E1] <sports>", category: "sport" })
  const r1 = await runClustering({ db, llm, now: NOW })
  assert.equal(r1.extractionFailed, 1)
  assert.deepEqual(one(sqlite, "SELECT status, attempts, topic_id FROM scraped_news WHERE id = ?", id), { status: "pending", attempts: 1, topic_id: null })
  assert.equal(one(sqlite, "SELECT count(*) n FROM topics").n, 0)
  await runClustering({ db, llm, now: NOW })
  assert.equal(one(sqlite, "SELECT attempts FROM scraped_news WHERE id = ?", id).attempts, 2)
  const r3 = await runClustering({ db, llm, now: NOW })
  assert.equal(r3.fallbackSignatures, 1, "third strike: fallback signature")
  const row = one(sqlite, "SELECT status, topic_id, signature FROM scraped_news WHERE id = ?", id)
  assert.equal(row.status, "clustered")
  assert.ok(row.topic_id)
  assert.equal(JSON.parse(row.signature).fallback, true)
  assert.equal(one(sqlite, "SELECT category_id FROM topics").category_id, "cat-sports", "category from the source mapping (sport → sports)")
  assert.equal(log.extract, 3)
})

test("articles the model silently skips during extraction are retried and eventually clustered", async () => {
  const { sqlite, db } = freshDb()
  const { llm } = makeFakeLlm({ skipTitle: /مُتخطى/ })
  seedRow(sqlite, { title: "عادي [E1]" })
  const skipped = seedRow(sqlite, { title: "مُتخطى [E2]" })
  const r1 = await runClustering({ db, llm, now: NOW })
  assert.equal(r1.extracted, 1)
  assert.equal(r1.extractionFailed, 1)
  assert.equal(one(sqlite, "SELECT status FROM scraped_news WHERE id = ?", skipped).status, "pending")
  await runClustering({ db, llm, now: NOW })
  await runClustering({ db, llm, now: NOW })
  assert.equal(one(sqlite, "SELECT status FROM scraped_news WHERE id = ?", skipped).status, "clustered")
})

test("judge failure: rows stay pending with reused signatures; third strike keeps them as separate topics", async () => {
  const { sqlite, db } = freshDb()
  const { llm, log } = makeFakeLlm({ failJudge: true })
  const a = seedRow(sqlite, { title: "أ [E1]" }); const b = seedRow(sqlite, { title: "ب [E1]" })
  const r1 = await runClustering({ db, llm, now: NOW })
  assert.equal(r1.blockJudgeFailed, 1)
  assert.equal(one(sqlite, "SELECT count(*) n FROM topics").n, 0)
  assert.equal(one(sqlite, "SELECT status FROM scraped_news WHERE id = ?", a).status, "pending")
  assert.equal(log.extract, 1)
  await runClustering({ db, llm, now: NOW })
  assert.equal(log.extract, 1, "signatures were stored, so extraction is not paid for again")
  await runClustering({ db, llm, now: NOW })
  assert.equal(one(sqlite, "SELECT count(*) n FROM scraped_news WHERE status = 'clustered'").n, 2)
  assert.equal(one(sqlite, "SELECT count(*) n FROM topics").n, 2, "no merge could be verified → separate topics, nothing lost")
  assert.ok(one(sqlite, "SELECT topic_id FROM scraped_news WHERE id = ?", b).topic_id)
})

test("garbage judge output is ignored safely (articles stay separate)", async () => {
  const { sqlite, db } = freshDb()
  const { llm } = makeFakeLlm({ badJudge: true })
  seedRow(sqlite, { title: "أ [E1]" }); seedRow(sqlite, { title: "ب [E1]" })
  const stats = await runClustering({ db, llm, now: NOW })
  assert.equal(stats.newTopics, 2)
  assert.equal(one(sqlite, "SELECT count(*) n FROM scraped_news WHERE status = 'clustered'").n, 2)
})

test("without an LLM every article becomes its own topic (no crash, no guessing)", async () => {
  const { sqlite, db } = freshDb()
  seedRow(sqlite, { title: "أ [E1]", category: "sport" }); seedRow(sqlite, { title: "ب [E1]" })
  const stats = await runClustering({ db, now: NOW })
  assert.equal(stats.newTopics, 2)
  assert.equal(stats.fallbackSignatures, 2)
})

test("a persistence failure rolls back cleanly: no orphan topics, rows retried, then recovers", async () => {
  const { sqlite, db } = freshDb()
  const { llm } = makeFakeLlm()
  const id = seedRow(sqlite, { title: "ينهار [E1]" })
  sqlite.exec("CREATE TRIGGER boom BEFORE INSERT ON topics BEGIN SELECT RAISE(ABORT, 'boom'); END")
  const r1 = await runClustering({ db, llm, now: NOW })
  assert.equal(r1.newTopics, 0)
  assert.equal(one(sqlite, "SELECT count(*) n FROM topics").n, 0)
  assert.deepEqual(one(sqlite, "SELECT status, attempts FROM scraped_news WHERE id = ?", id), { status: "pending", attempts: 1 })
  sqlite.exec("DROP TRIGGER boom")
  const r2 = await runClustering({ db, llm, now: NOW })
  assert.equal(r2.newTopics, 1)
  assert.equal(one(sqlite, "SELECT status FROM scraped_news WHERE id = ?", id).status, "clustered")
})

test("topics without a category are classified by title afterwards; empty stale topics are pruned; written ones kept", async () => {
  const { sqlite, db } = freshDb()
  const { llm, log } = makeFakeLlm({ failExtract: true })
  seedRow(sqlite, { title: "بلا فئة [E1] <health>", category: "world", attempts: 2 }) // third strike → fallback (world → no direct category)
  await runClustering({ db, llm, now: NOW })
  assert.equal(log.classify, 1)
  assert.equal(one(sqlite, "SELECT category_id FROM topics").category_id, "cat-health")

  sqlite.prepare("INSERT INTO topics (id, title, status, article_count, created_at, updated_at) VALUES ('empty', 'x', 'open', 0, ?, ?)").run(NOW - 3 * HOUR, NOW - 3 * HOUR)
  sqlite.prepare("INSERT INTO topics (id, title, status, article_count, created_at, updated_at) VALUES ('young', 'x', 'open', 0, ?, ?)").run(NOW - 60 * 1000, NOW)
  sqlite.prepare("INSERT INTO topics (id, title, status, article_count, created_at, updated_at) VALUES ('written', 'x', 'open', 0, ?, ?)").run(NOW - 3 * HOUR, NOW - 3 * HOUR)
  sqlite.prepare("INSERT INTO generated_articles (id, title, body, topic_id) VALUES ('g1', 't', '{}', 'written')").run()
  const stats = await runClustering({ db, llm, now: NOW })
  assert.equal(stats.prunedEmptyTopics, 1)
  const left = q(sqlite, "SELECT id FROM topics").map((t) => t.id)
  assert.ok(!left.includes("empty"))
  assert.ok(left.includes("young") && left.includes("written"))
})

test("insertScrapedNewsRows: canonical URLs, image required, duplicate-safe, real publish time, pending state", async () => {
  const { sqlite, db } = freshDb()
  const item = (over: Record<string, unknown> = {}) => ({ title: "t", excerpt: "e", url: "https://Example.com/a/1/?utm_source=x#top", imageUrl: "https://img/x.jpg", publishedAt: "سبت, 09/19/2026 - 10:00", rawJson: {}, ...over }) as any
  const input = { sourceKey: "youm7" as const, source: "YOUM7", category: "world", items: [item(), item({ url: "https://example.com/a/1/" }), item({ url: "https://example.com/noimg", imageUrl: "" }), item({ url: "https://example.com/b", imageUrl: undefined })] }
  assert.equal(await insertScrapedNewsRows(input, db, NOW), 1, "1 inserted: dup canonical url, empty image and missing image dropped")
  const row = one(sqlite, "SELECT url, status, published_ts FROM scraped_news")
  assert.equal(row.url, "https://example.com/a/1/")
  assert.equal(row.status, "pending")
  assert.equal(row.published_ts, Date.parse("2026-09-19T07:00:00Z"), "parsed from the Arabic-format date (UTC+3)")
  assert.equal(await insertScrapedNewsRows(input, db, NOW), 0, "re-inserting the same items adds nothing")
  assert.deepEqual([...(await findKnownUrls("youm7", ["https://example.com/a/1/", "https://example.com/zzz"], db))], ["https://example.com/a/1/"])
  assert.equal((await findKnownUrls("rt", ["https://example.com/a/1/"], db)).size, 0, "known-ness is per source")
  assert.throws(() => sqlite.prepare("INSERT INTO scraped_news (id, source, source_key, category, title, url, raw_json) VALUES ('x','S','youm7','c','t','https://example.com/a/1/','{}')").run(), /UNIQUE/)
})
