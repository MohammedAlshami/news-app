import assert from "node:assert/strict"
import { test } from "node:test"

import { validateGroups, type BlockItem } from "@/lib/clustering/block-llm"
import { buildBlocks, sameName, type SigDoc } from "@/lib/clustering/blocking"
import { extractBatch, fallbackSignature, parseSignature, type Signature } from "@/lib/clustering/signature"
import { voteCategory } from "@/lib/clustering/run"

const PUB = Date.parse("2026-09-19T10:00:00Z")
const good = (over: Record<string, unknown> = {}) => ({
  event_domain: "diplomacy", event_type: "sanctions_imposed",
  actors: [{ name: "دونالد ترامب", kind: "person", role: "initiator" }, { name: "روسيا", kind: "country", role: "target" }],
  named_things: [{ name: "قانون العقوبات", kind: "law" }], storyline: "العقوبات الأمريكية على روسيا",
  event_places: ["واشنطن"], countries: ["us", "RU"], event_date: "2026-09-19", is_recurring: false,
  stage: "announcement", content_type: "news", keywords: ["عقوبات", "روسيا"], category: "politics", ...over,
})

test("parseSignature accepts a good signature and normalises it", () => {
  const s = parseSignature(good(), PUB)!
  assert.equal(s.event_type, "sanctions_imposed")
  assert.deepEqual(s.countries, ["US", "RU"])
  assert.equal(s.category, "politics")
  assert.equal(s.event_date, "2026-09-19")
})

test("parseSignature repairs bad enums, distrusts far-off dates and rejects empty signatures", () => {
  const s = parseSignature(good({ event_domain: "nonsense", event_type: "made_up", stage: "??", content_type: "??", category: "sports-ish", event_date: "2019-01-01" }), PUB)!
  assert.equal(s.event_domain, "other")
  assert.equal(s.event_type, "other")
  assert.equal(s.stage, "announcement")
  assert.equal(s.content_type, "news")
  assert.equal(s.category, null)
  assert.equal(s.event_date, "2026-09-19", "a date months away from the publish day is replaced by the publish day")
  assert.equal(parseSignature(good({ event_date: "2026-09-18" }), PUB)!.event_date, "2026-09-18", "a nearby date is kept")
  assert.equal(parseSignature({ actors: [], countries: [], keywords: [] }, PUB), null)
  assert.equal(parseSignature(null, PUB), null)
  assert.equal(parseSignature("text", PUB), null)
  // type must belong to its domain
  assert.equal(parseSignature(good({ event_domain: "sports", event_type: "sanctions_imposed" }), PUB)!.event_type, "other")
  // invalid country codes are dropped
  assert.deepEqual(parseSignature(good({ countries: ["USA", "x", "eg"] }), PUB)!.countries, ["EG"])
})

test("fallbackSignature is date + source category only", () => {
  const f = fallbackSignature({ title: "x", sourceCategory: "sport", publishedTs: PUB })
  assert.equal(f.fallback, true)
  assert.equal(f.category, "sports")
  assert.equal(f.event_date, "2026-09-19")
  assert.deepEqual(f.actors, [])
})

test("extractBatch maps numbered answers back to ids, drops invalid and duplicate answers", async () => {
  const rows = [1, 2, 3].map((i) => ({ id: `r${i}`, title: `عنوان ${i}`, content: null, sourceKey: "rt", sourceCategory: "world", publishedTs: PUB }))
  const llm = async () => ({ signatures: [{ n: 1, ...good() }, { n: 1, ...good({ event_type: "arrest", event_domain: "justice" }) }, { n: 2, actors: [], countries: [], keywords: [] }, { n: 9, ...good() }, { n: "x", ...good() }] })
  const got = await extractBatch(llm, rows)
  assert.deepEqual([...got.keys()], ["r1"], "only n=1 is valid; duplicates, empty and out-of-range answers are ignored")
  assert.equal(got.get("r1")!.event_type, "sanctions_imposed", "first answer wins")
})

const doc = (id: string, sig: Partial<Signature>, topicId: string | null = null): SigDoc => ({
  id, title: id, sourceKey: "rt", publishedTs: PUB, topicId,
  sig: { ...(parseSignature(good(), PUB) as Signature), ...sig },
})

test("sameName tolerates title prefixes but not different people", () => {
  assert.equal(sameName(["دونالد", "ترامب"], ["ترامب"]), true)
  assert.equal(sameName(["ترامب"], ["بايدن"]), false)
  assert.equal(sameName(["دونالد", "ترامب"], ["دونالد", "ترامب"]), true)
  assert.equal(sameName(["ال"], ["ال", "شيخ"]), false, "too short to be a name")
})

test("buildBlocks links same-event articles and applies the date / country / content-type gates", () => {
  const a = doc("a", {})
  const b = doc("b", { actors: [{ name: "الرئيس ترامب", kind: "person", role: "initiator" }] }) // same person
  const farDate = doc("c", { event_date: "2026-09-22" }) // 3 days later
  const otherCountry = doc("d", { countries: ["FR"] })
  const opinion = doc("e", { content_type: "opinion" })
  const nextDay = doc("f", { event_date: "2026-09-20" })
  const blocks = buildBlocks([a, b, farDate, otherCountry, opinion, nextDay])
  const has = (x: string, y: string) => blocks.some((bl) => bl.docs.some((d) => d.id === x) && bl.docs.some((d) => d.id === y))
  assert.ok(has("a", "b"))
  assert.ok(has("a", "f"), "±1 day is allowed")
  assert.ok(!has("a", "c"), "3 days apart is blocked")
  assert.ok(!has("a", "d"), "disjoint countries are blocked")
  assert.ok(!has("a", "e"), "opinion never blocks with news")
})

test("buildBlocks: unrelated articles stay in separate blocks; fallback signatures never link", () => {
  const x = doc("x", { actors: [{ name: "نادي الأهلي", kind: "team", role: "participant" }], keywords: ["دوري"], named_things: [], countries: ["EG"] })
  const y = doc("y", { actors: [{ name: "دونالد ترامب", kind: "person", role: "initiator" }], keywords: ["عقوبات"], named_things: [], countries: ["EG"] })
  const f1 = { ...doc("f1", {}), sig: fallbackSignature({ title: "a", sourceCategory: "world", publishedTs: PUB }) }
  const f2 = { ...doc("f2", {}), sig: fallbackSignature({ title: "b", sourceCategory: "world", publishedTs: PUB }) }
  const blocks = buildBlocks([x, y, f1, f2])
  assert.equal(blocks.length, 4)
})

test("buildBlocks splits oversized components by item count, keeping a topic's members together", () => {
  const docs: SigDoc[] = []
  for (let i = 0; i < 20; i++) docs.push(doc(`n${i}`, {}))                  // 20 new articles, all linked
  for (let t = 0; t < 30; t++) docs.push(doc(`m${t}a`, {}, `topic${t}`), doc(`m${t}b`, {}, `topic${t}`)) // 30 topics × 2 members
  const blocks = buildBlocks(docs, 35)
  assert.ok(blocks.length >= 2)
  const items = (b: (typeof blocks)[number]) => new Set(b.docs.map((d) => d.topicId ?? `new:${d.id}`)).size
  for (const b of blocks) assert.ok(items(b) <= 35)
  const seenIn = new Map<string, Set<number>>()
  blocks.forEach((b, i) => b.docs.forEach((d) => d.topicId && seenIn.set(d.topicId, (seenIn.get(d.topicId) ?? new Set()).add(i))))
  for (const s of seenIn.values()) assert.equal(s.size, 1, "a topic must not be split across blocks")
  assert.equal(blocks.reduce((n, b) => n + b.docs.length, 0), docs.length, "every doc lands in exactly one block")
})

test("validateGroups keeps only well-formed groups", () => {
  const items: BlockItem[] = [
    { label: "T1", kind: "topic", lines: ["a"] }, { label: "T2", kind: "topic", lines: ["b"] },
    { label: "N1", kind: "new", lines: ["c"] }, { label: "N2", kind: "new", lines: ["d"] }, { label: "N3", kind: "new", lines: ["e"] },
  ]
  assert.deepEqual(validateGroups({ groups: [["T1", "N1"], ["n2", "N3"]] }, items), [["T1", "N1"], ["N2", "N3"]])
  assert.deepEqual(validateGroups({ groups: [["T1", "T2"]] }, items), [], "two topics only: no new article → dropped")
  assert.deepEqual(validateGroups({ groups: [["T1", "T2", "N1"]] }, items), [["T1", "N1"]], "second topic in a group is ignored")
  assert.deepEqual(validateGroups({ groups: [["N1", "N2"], ["N2", "N3"]] }, items), [["N1", "N2"]], "a label is used once")
  assert.deepEqual(validateGroups({ groups: [["N1", "N99"], ["N1"], "junk", null] }, items), [])
  assert.deepEqual(validateGroups({}, items), [])
  assert.deepEqual(validateGroups(null, items), [])
})

test("voteCategory prefers signature categories, then direct source mapping, else null", () => {
  const ids = new Map([["sports", "c-sports"], ["politics", "c-politics"]])
  assert.equal(voteCategory([{ sig: "politics", source: "sport" }, { sig: "politics", source: "world" }, { sig: "sports", source: "sport" }], ids), "c-politics")
  assert.equal(voteCategory([{ sig: null, source: "sport" }], ids), "c-sports")
  assert.equal(voteCategory([{ sig: null, source: "world" }], ids), null)
  assert.equal(voteCategory([{ sig: "unknown-slug", source: "world" }], ids), null)
})
