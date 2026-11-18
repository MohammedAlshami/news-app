import assert from "node:assert/strict"
import type { DatabaseSync } from "node:sqlite"
import { test } from "node:test"

import type { LlmJson } from "@/lib/llm-json"
import { findNearDuplicate } from "@/lib/generation/dedupe"
import {
  buildBody, buildQueues, generateForCandidate, GEN, isWritable, listCandidates, parseWriterOutput, runGeneration,
  type Candidate, type GenDeps,
} from "@/lib/generation/core"

import { HOUR, NOW, seedRow } from "./helpers/fake-llm"
import { freshDb } from "./helpers/sqlite-db"

const all = (s: DatabaseSync, sql: string, ...p: (string | number)[]) => (s.prepare(sql).all(...p) as object[]).map((r) => ({ ...r })) as any[]
const one = (s: DatabaseSync, sql: string, ...p: (string | number)[]) => ({ ...(s.prepare(sql).get(...p) as object) }) as any

let tseq = 0
type Src = { sourceKey?: string; ts?: number; content?: string | null; imageUrl?: string | null }
function seedTopic(
  sqlite: DatabaseSync,
  o: { category?: string | null; status?: string; lastSeenAt?: number; sources?: Src[]; genAttempts?: number; claimedAt?: number | null; writtenSourceCount?: number; title?: string },
): string {
  const id = `topic-${++tseq}`
  const sources = o.sources ?? [{ sourceKey: "youm7" }, { sourceKey: "rt" }]
  const lastSeen = o.lastSeenAt ?? Math.max(...sources.map((s) => s.ts ?? NOW - HOUR))
  sqlite
    .prepare("INSERT INTO topics (id, title, category_id, status, last_seen_at, gen_attempts, claimed_at, written_source_count, article_count) VALUES (?,?,?,?,?,?,?,?,?)")
    .run(id, o.title ?? `موضوع ${tseq}`, o.category === undefined ? "cat-politics" : o.category, o.status ?? "open", lastSeen, o.genAttempts ?? 0, o.claimedAt ?? null, o.writtenSourceCount ?? 0, sources.length)
  for (const s of sources) seedRow(sqlite, { title: `مصدر عن ${o.title ?? tseq} ${Math.random()}`, sourceKey: s.sourceKey, ts: s.ts ?? NOW - HOUR, topicId: id, status: "clustered", content: s.content, imageUrl: s.imageUrl })
  return id
}

type WriterOpts = { skip?: boolean; invalid?: boolean; throws?: boolean; title?: (n: number) => string; delayMs?: number }
function makeWriter(o: WriterOpts = {}) {
  const calls: { user: any }[] = []
  const llm: LlmJson = async (req) => {
    if (req.system.includes("MATERIAL new information")) return { material: true, new_facts: ["رقم جديد ومعلومة جديدة في القضية"], reason: "new" }
    const user = JSON.parse(req.user)
    calls.push({ user })
    if (o.delayMs) await new Promise((r) => setTimeout(r, o.delayMs))
    if (o.throws) throw new Error("llm down")
    if (o.skip) return { action: "skip", reason: "same story already covered" }
    if (o.invalid) return { action: "write", title: "قصير", paragraphs: ["x"] }
    const n = calls.length
    const w = (i: number) => WORDS[(n * 3 + i * 7) % WORDS.length] // distinct vocabulary per call, like real articles
    const title = o.title ? o.title(n) : `${w(0)} ${w(1)} ${w(2)} ${w(3)} ${user.topic}`
    return {
      action: "write", title, excerpt: `${w(4)} ${w(5)} ${w(6)} ${w(8)} ${w(9)} ${w(10)} ${w(11)} ${w(12)} ${w(13)}`,
      paragraphs: [1, 2, 3, 4].map((i) => `الفقرة رقم ${i} من المقال ${n} تتناول تفاصيل الحدث وخلفياته وتأثيراته على المنطقة بشكل مفصل ومتماسك.`),
      highlights: ["نقطة أولى مهمة", "نقطة ثانية مهمة", "نقطة ثالثة مهمة"], sourceIds: user.sources.map((s: any) => s.id).slice(0, 2),
    }
  }
  return { llm, calls }
}
const WORDS = ["زلزال", "فيضان", "انتخابات", "مؤتمر", "اتفاقية", "بطولة", "حريق", "مهرجان", "قمة", "احتجاجات", "ميزانية", "كسوف", "مناظرة", "معرض", "سباق", "إضراب", "استفتاء", "عاصفة", "مزاد", "تحقيق", "هجوم", "مفاوضات", "تصريحات", "جائزة", "انهيار", "اكتشاف", "قرار", "إطلاق", "افتتاح", "وفاة", "زيارة", "صفقة", "أزمة", "مبادرة", "اختراق", "تحذير", "قافلة", "مناورات", "استقالة", "تعيين"]
const upload = async (_url: string, owner: string) => `https://r2.test/${owner}.jpg`
const mkDeps = (db: any, llm: LlmJson, extra: Partial<GenDeps> = {}): GenDeps => ({ db, llm, uploadCover: upload, now: NOW, ...extra })
const cand = async (db: any, id: string) => (await listCandidates(db, NOW)).find((c) => c.id === id)!

test("isWritable: content + image + freshness; 2 outlets now, single outlet only after waiting", () => {
  const base: Candidate = { id: "t", title: "t", categoryId: "c", status: "open", claimedAt: null, writtenSourceCount: 0, sourceCount: 2, distinctSources: 2, withContent: 2, withImage: 2, newestTs: NOW - HOUR, firstScrapedAt: NOW - HOUR }
  assert.equal(isWritable(base, NOW), true)
  assert.equal(isWritable({ ...base, withContent: 0 }, NOW), false)
  assert.equal(isWritable({ ...base, withImage: 0 }, NOW), false)
  assert.equal(isWritable({ ...base, newestTs: NOW - 49 * HOUR }, NOW), false, "stale news is never written")
  assert.equal(isWritable({ ...base, distinctSources: 1, firstScrapedAt: NOW - HOUR }, NOW), false, "single outlet waits for a second one")
  assert.equal(isWritable({ ...base, distinctSources: 1, firstScrapedAt: NOW - 3 * HOUR }, NOW), true)
})

test("listCandidates applies status, freshness, category, attempts and claim rules", async () => {
  const { sqlite, db } = freshDb()
  const ok = seedTopic(sqlite, {})
  const noCat = seedTopic(sqlite, { category: null })
  const stale = seedTopic(sqlite, { sources: [{ ts: NOW - 60 * HOUR }, { ts: NOW - 60 * HOUR, sourceKey: "rt" }] })
  const tooManyTries = seedTopic(sqlite, { genAttempts: 3 })
  const skipped = seedTopic(sqlite, { status: "skipped" })
  const writingFresh = seedTopic(sqlite, { status: "writing", claimedAt: NOW - 60 * 1000 })
  // stale-claim threshold is now 20 min (was 15): it must stay well above the worst-case duration of one step
  const writingStale = seedTopic(sqlite, { status: "writing", claimedAt: NOW - 30 * 60 * 1000 })
  const hasArticle = seedTopic(sqlite, {})
  sqlite.prepare("INSERT INTO generated_articles (id, title, body, topic_id) VALUES ('g-manual', 't', '{}', ?)").run(hasArticle)
  const ids = (await listCandidates(db, NOW)).map((c) => c.id)
  assert.ok(ids.includes(ok))
  assert.ok(ids.includes(writingStale), "a stale claim is re-claimable")
  for (const bad of [noCat, stale, tooManyTries, skipped, writingFresh, hasArticle]) assert.ok(!ids.includes(bad), `${bad} must not be a candidate`)
})

test("follow-ups: written topics need unseen sources, a 4h cooldown and fewer than 3 articles", async () => {
  const { sqlite, db } = freshDb()
  const mk = (over: { count: number; written: number; lastGenHoursAgo: number; nArticles?: number }) => {
    const id = seedTopic(sqlite, { status: "written", writtenSourceCount: over.written, sources: Array.from({ length: over.count }, (_, i) => ({ sourceKey: `s${i}` })) })
    for (let i = 0; i < (over.nArticles ?? 1); i++) sqlite.prepare("INSERT INTO generated_articles (id, title, body, topic_id, created_at) VALUES (?, 't', '{}', ?, ?)").run(`g-${id}-${i}`, id, NOW - over.lastGenHoursAgo * HOUR)
    return id
  }
  const eligible = mk({ count: 5, written: 2, lastGenHoursAgo: 7 })
  const oneNew = mk({ count: 3, written: 2, lastGenHoursAgo: 7 }) // still a candidate: the update judge decides, not a counter
  const nothingNew = mk({ count: 4, written: 4, lastGenHoursAgo: 7 })
  const tooSoon = mk({ count: 5, written: 2, lastGenHoursAgo: 2 })
  const atMax = mk({ count: 8, written: 2, lastGenHoursAgo: 12, nArticles: 3 })
  const ids = (await listCandidates(db, NOW)).map((c) => c.id)
  assert.ok(ids.includes(eligible) && ids.includes(oneNew))
  for (const bad of [nothingNew, tooSoon, atMax]) assert.ok(!ids.includes(bad))
})

test("generateForCandidate: publishes article + generated row, marks topic written, attributes sources with links", async () => {
  const { sqlite, db } = freshDb()
  sqlite.prepare("INSERT INTO news_sources (key, name, name_ar, url, is_enabled) VALUES ('youm7','Youm7','اليوم السابع','https://youm7.com',1), ('rt','RT','RT عربي','https://rt.com',1)").run()
  const id = seedTopic(sqlite, { category: "cat-sports", title: "حدث رياضي مهم" })
  const { llm, calls } = makeWriter()
  const r = await generateForCandidate(mkDeps(db, llm), await cand(db, id))
  assert.equal(r.outcome, "written")

  const art = one(sqlite, "SELECT * FROM articles")
  assert.equal(art.is_published, 1)
  assert.equal(art.category_id, "cat-sports")
  assert.equal(art.cover_image_url, `https://r2.test/${id}.jpg`)
  assert.equal(JSON.parse(art.highlights).length, 3)
  assert.equal(one(sqlite, "SELECT count(*) n FROM generated_articles WHERE topic_id = ?", id).n, 1)
  const topic = one(sqlite, "SELECT status, claimed_at, gen_attempts, written_source_count FROM topics WHERE id = ?", id)
  assert.deepEqual(topic, { status: "written", claimed_at: null, gen_attempts: 0, written_source_count: 2 })

  const body = JSON.parse(art.body)
  assert.ok(!JSON.stringify(body).includes("المصادر"))

  // the LLM saw plain text (not Tiptap JSON) and never the image url / secrets
  const sent = calls[0].user
  assert.ok(sent.sources[0].text.startsWith("نص المقال"))
  assert.ok(!sent.sources[0].text.includes('"type"'))
})

test("gallery: every source's image is mirrored (cover first), stored on the public article, no sources line", async () => {
  const { sqlite, db } = freshDb()
  const id = seedTopic(sqlite, { sources: [{ sourceKey: "rt" }, { sourceKey: "bbc" }, { sourceKey: "youm7" }, { imageUrl: null, sourceKey: "rt" }] })
  const { llm } = makeWriter()
  await generateForCandidate(mkDeps(db, llm, { uploadCover: async (u: string) => `https://r2.test/${encodeURIComponent(u)}` }), await cand(db, id))
  const art = one(sqlite, "SELECT cover_image_url, image_urls, body FROM articles")
  const imgs = JSON.parse(art.image_urls)
  assert.equal(imgs.length, 3, "one mirrored image per source that had one")
  assert.equal(imgs[0], art.cover_image_url)
  assert.equal(new Set(imgs).size, 3)
  assert.ok(!art.body.includes("المصادر"))
})

test("two writers racing for the same topic: exactly one wins, one article, no stuck state", async () => {
  const { sqlite, db } = freshDb()
  const id = seedTopic(sqlite, {})
  const { llm } = makeWriter({ delayMs: 30 })
  const c = await cand(db, id)
  const [a, b] = await Promise.all([generateForCandidate(mkDeps(db, llm), c), generateForCandidate(mkDeps(db, llm), c)])
  assert.deepEqual([a.outcome, b.outcome].sort(), ["lost", "written"])
  assert.equal(one(sqlite, "SELECT count(*) n FROM articles").n, 1)
  assert.equal(one(sqlite, "SELECT status FROM topics WHERE id = ?", id).status, "written")
})

test("daily quota: never exceeds the category quota; the over-quota topic returns to open", async () => {
  const { sqlite, db } = freshDb({ dailyQuota: 1 })
  const t1 = seedTopic(sqlite, { title: "أول" }), t2 = seedTopic(sqlite, { title: "ثان" })
  const { llm } = makeWriter()
  const first = await generateForCandidate(mkDeps(db, llm), await cand(db, t1))
  const second = await generateForCandidate(mkDeps(db, llm), await cand(db, t2))
  assert.equal(first.outcome, "written")
  assert.equal(second.outcome, "quota")
  assert.equal(one(sqlite, "SELECT status FROM topics WHERE id = ?", t2).status, "open")
  assert.equal(one(sqlite, "SELECT count(*) n FROM articles").n, 1)
  const s = await runGeneration(mkDeps(db, llm), { max: 5, concurrency: 2 })
  assert.equal(s.written, 0, "a full category is not attempted again")
})

test("runGeneration: respects max, spreads across categories, prefers more outlets then newer", async () => {
  const { sqlite, db } = freshDb()
  const cats = ["cat-sports", "cat-economy", "cat-health"]
  for (const c of cats) for (let i = 0; i < 3; i++) seedTopic(sqlite, { category: c, title: `${c}-${i}` })
  const big = seedTopic(sqlite, { category: "cat-sports", title: "كبير", sources: [{ sourceKey: "a" }, { sourceKey: "b" }, { sourceKey: "c" }] })
  const queues = buildQueues(await listCandidates(db, NOW), NOW)
  assert.equal(queues.get("cat-sports")![0].id, big, "topic with the most outlets is first in its category")

  const { llm } = makeWriter()
  const summary = await runGeneration(mkDeps(db, llm), { max: 4, concurrency: 2 })
  assert.equal(summary.written, 4)
  const perCat = all(sqlite, "SELECT category_id c, count(*) n FROM articles GROUP BY category_id").map((r) => r.c).sort()
  assert.deepEqual(perCat, [...cats].sort(), "round-robin: each category got an article before any got two")
  assert.equal(one(sqlite, "SELECT count(*) n FROM topics WHERE status = 'writing'").n, 0)
})

test("skips a topic already covered by a published article (before spending an LLM call)", async () => {
  const { sqlite, db } = freshDb()
  const id = seedTopic(sqlite, { sources: [{ sourceKey: "youm7" }, { sourceKey: "rt" }], title: "x" })
  const srcTitles = all(sqlite, "SELECT title FROM scraped_news WHERE topic_id = ?", id).map((r) => r.title)
  sqlite.prepare("INSERT INTO articles (id, title, excerpt, body, created_at) VALUES ('a1', ?, 'e', '{}', ?)").run(srcTitles[0], NOW - 2 * HOUR)
  const { llm, calls } = makeWriter()
  const r = await generateForCandidate(mkDeps(db, llm), await cand(db, id))
  assert.equal(r.outcome, "skipped")
  assert.equal(calls.length, 0, "no LLM call spent")
  assert.equal(one(sqlite, "SELECT status FROM topics WHERE id = ?", id).status, "skipped")
})

test("skips when the generated article is a near-duplicate of one published moments ago", async () => {
  const { sqlite, db } = freshDb()
  const id = seedTopic(sqlite, {})
  const dupTitle = "ترامب يوقع قانون العقوبات الجديد ضد روسيا ويهدد بالمزيد"
  sqlite.prepare("INSERT INTO articles (id, title, excerpt, body, created_at) VALUES ('a1', ?, ?, '{}', ?)").run(dupTitle, "الرئيس الأمريكي يوقع قانون العقوبات الجديد ضد روسيا", NOW - HOUR)
  const { llm } = makeWriter({ title: () => dupTitle })
  const r = await generateForCandidate(mkDeps(db, llm), await cand(db, id))
  assert.equal(r.outcome, "skipped")
  assert.equal(one(sqlite, "SELECT count(*) n FROM articles").n, 1, "nothing new published")
})

test("failures never leave a topic stuck: invalid output / LLM error / upload error retry, then give up after 3", async () => {
  for (const mode of ["invalid", "throws", "upload"] as const) {
    const { sqlite, db } = freshDb()
    const id = seedTopic(sqlite, {})
    const { llm } = makeWriter({ invalid: mode === "invalid", throws: mode === "throws" })
    const deps = mkDeps(db, llm, mode === "upload" ? { uploadCover: async () => { throw new Error("r2 down") } } : {})
    for (let i = 1; i <= 3; i++) {
      const r = await generateForCandidate(deps, await cand(db, id).catch(() => undefined as any) ?? ({ id } as any))
      assert.equal(r.outcome, "failed", mode)
      const t = one(sqlite, "SELECT status, gen_attempts, claimed_at FROM topics WHERE id = ?", id)
      assert.equal(t.gen_attempts, i)
      assert.equal(t.claimed_at, null)
      assert.equal(t.status, i < 3 ? "open" : "skipped", `${mode}: attempt ${i}`)
    }
    assert.equal(one(sqlite, "SELECT count(*) n FROM articles").n, 0)
    assert.equal(one(sqlite, "SELECT count(*) n FROM generated_articles").n, 0)
  }
})

test("AI 'skip' answer marks the topic skipped without publishing", async () => {
  const { sqlite, db } = freshDb()
  const id = seedTopic(sqlite, {})
  const { llm } = makeWriter({ skip: true })
  const r = await generateForCandidate(mkDeps(db, llm), await cand(db, id))
  assert.equal(r.outcome, "skipped")
  assert.equal(one(sqlite, "SELECT status FROM topics WHERE id = ?", id).status, "skipped")
  assert.equal(one(sqlite, "SELECT count(*) n FROM articles").n, 0)
})

test("if the public article insert fails, the generated row is rolled back and the topic is released", async () => {
  const { sqlite, db } = freshDb()
  const id = seedTopic(sqlite, {})
  sqlite.exec("CREATE TRIGGER boom BEFORE INSERT ON articles BEGIN SELECT RAISE(ABORT, 'boom'); END")
  const { llm } = makeWriter()
  const r = await generateForCandidate(mkDeps(db, llm), await cand(db, id))
  assert.equal(r.outcome, "failed")
  assert.equal(one(sqlite, "SELECT count(*) n FROM generated_articles").n, 0)
  assert.equal(one(sqlite, "SELECT status FROM topics WHERE id = ?", id).status, "open")
})

test("sources whose 'content' is an empty Tiptap doc are not usable text", async () => {
  const { sqlite, db } = freshDb()
  const emptyDoc = JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }] })
  const padded = JSON.stringify({ type: "doc", content: Array.from({ length: 12 }, () => ({ type: "paragraph", content: [{ type: "text", text: "" }] })) })
  const id = seedTopic(sqlite, { sources: [{ content: padded }, { sourceKey: "rt", content: emptyDoc }] })
  const { llm, calls } = makeWriter()
  const c = (await listCandidates(db, NOW)).find((x) => x.id === id)
  if (c && isWritable(c, NOW)) {
    const r = await generateForCandidate(mkDeps(db, llm), c)
    assert.equal(r.outcome, "failed")
    assert.equal(calls.length, 0)
  }
})

test("stale 'writing' claim from a crashed writer is taken over and finished", async () => {
  const { sqlite, db } = freshDb()
  const id = seedTopic(sqlite, { status: "writing", claimedAt: NOW - 30 * 60 * 1000 })
  const { llm } = makeWriter()
  const r = await generateForCandidate(mkDeps(db, llm), await cand(db, id))
  assert.equal(r.outcome, "written")
  assert.equal(one(sqlite, "SELECT status FROM topics WHERE id = ?", id).status, "written")
})

test("follow-up article: the writer is told what was already published; a second article is created once", async () => {
  const { sqlite, db } = freshDb()
  const id = seedTopic(sqlite, { status: "written", writtenSourceCount: 2, sources: Array.from({ length: 5 }, (_, i) => ({ sourceKey: `s${i}` })) })
  sqlite.prepare("INSERT INTO generated_articles (id, title, excerpt, body, topic_id, created_at) VALUES ('g0', 'المقال الأول عن الحدث', 'ملخص أول', '{}', ?, ?)").run(id, NOW - 8 * HOUR)
  const { llm, calls } = makeWriter({ title: () => "تطور جديد مختلف تماما في القضية بعد ساعات من الإعلان الأول" })
  const r = await generateForCandidate(mkDeps(db, llm), await cand(db, id))
  assert.equal(r.outcome, "written")
  assert.equal(calls[0].user.previousArticles[0].title, "المقال الأول عن الحدث")
  assert.equal(one(sqlite, "SELECT count(*) n FROM generated_articles WHERE topic_id = ?", id).n, 2)
  assert.equal(one(sqlite, "SELECT written_source_count n FROM topics WHERE id = ?", id).n, 5)
  assert.ok(!(await listCandidates(db, NOW + 24 * HOUR)).some((c) => c.id === id), "never a third article")
})

test("a failed follow-up leaves the topic 'written' (it is not demoted to open)", async () => {
  const { sqlite, db } = freshDb()
  const id = seedTopic(sqlite, { status: "written", writtenSourceCount: 2, sources: Array.from({ length: 5 }, (_, i) => ({ sourceKey: `s${i}` })) })
  sqlite.prepare("INSERT INTO generated_articles (id, title, body, topic_id, created_at) VALUES ('g0', 't', '{}', ?, ?)").run(id, NOW - 8 * HOUR)
  const { llm } = makeWriter({ throws: true })
  const r = await generateForCandidate(mkDeps(db, llm), await cand(db, id))
  assert.equal(r.outcome, "failed")
  assert.equal(one(sqlite, "SELECT status FROM topics WHERE id = ?", id).status, "written")
})

test("parseWriterOutput validates model output", () => {
  const good = { action: "write", title: "عنوان صحيح وطويل بما فيه الكفاية", excerpt: "ملخص طويل بما يكفي لتجاوز الحد الأدنى للطول المطلوب", paragraphs: ["فقرة أولى طويلة بما يكفي لتجاوز الحد الأدنى للطول", "فقرة ثانية طويلة بما يكفي لتجاوز الحد الأدنى للطول", "فقرة ثالثة طويلة بما يكفي لتجاوز الحد الأدنى للطول", "ملخص: هذه فقرة ملخص يجب حذفها لأنها تبدأ بكلمة ملخص"], highlights: ["أ", "ب", "ج", "د", "هـ", "و"], sourceIds: ["s1", "zzz"] }
  const ok = parseWriterOutput(good, ["s1", "s2"]) as any
  assert.equal(ok.paragraphs.length, 3, "summary-style paragraph removed")
  assert.equal(ok.highlights.length, 5)
  assert.deepEqual(ok.sourceIds, ["s1"], "unknown source ids dropped")
  assert.deepEqual((parseWriterOutput({ ...good, sourceIds: [] }, ["s1", "s2"]) as any).sourceIds, ["s1", "s2"], "fallback: all provided")
  assert.ok("skip" in (parseWriterOutput({ action: "skip", reason: "r" }, []) as object))
  for (const bad of [null, "x", {}, { ...good, title: "قصير" }, { ...good, excerpt: "x" }, { ...good, paragraphs: "no" }, { ...good, paragraphs: [good.paragraphs[0]] }]) {
    assert.ok("invalid" in (parseWriterOutput(bad, ["s1"]) as object), JSON.stringify(bad).slice(0, 40))
  }
})

test("buildBody: paragraphs only (no sources line); optional internal 'read also' link", () => {
  const body = JSON.parse(buildBody(["ف1", "ف2"]))
  assert.equal(body.content.length, 2)
  assert.ok(!JSON.stringify(body).includes("المصادر"))
  const withRel = JSON.parse(buildBody(["ف"], { title: "عنوان سابق", articleId: "abcdefgh-1234" }))
  assert.equal(withRel.content.length, 2)
  assert.equal(withRel.content[1].content[1].marks[0].attrs.href, "/news/abcdefgh-1234")
})

test("findNearDuplicate: same story reworded is caught; a different story with shared words is not", () => {
  const recent = [
    { id: "1", title: "ترامب يوقع قانون العقوبات الجديد ضد روسيا", excerpt: "" },
    { id: "2", title: "سعر الدولار اليوم السبت أمام الجنيه في البنوك", excerpt: "" },
    { id: "3", title: "الأهلي يفوز على الزمالك في قمة الدوري", excerpt: "" },
  ]
  assert.equal(findNearDuplicate([{ title: "ترامب يوقع قانون عقوبات جديدا ضد روسيا" }], recent, 0.5)?.article.id, "1")
  assert.equal(findNearDuplicate([{ title: "عقوبات الدوري المصري: إيقاف لاعب الأهلي وتغريم الزمالك" }], recent, 0.5), null)
  assert.equal(findNearDuplicate([], recent, 0.5), null)
  assert.equal(findNearDuplicate([{ title: "x" }], [], 0.5), null)
  assert.ok(GEN.PRE_DUP >= GEN.POST_DUP)
})
