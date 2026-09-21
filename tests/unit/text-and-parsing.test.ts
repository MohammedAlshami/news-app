import assert from "node:assert/strict"
import { test } from "node:test"

import { dateConflict, extractDateSignature, normalizeArabic, tokenize } from "@/lib/clustering/text-ar"
import { parsePublishedTs } from "@/lib/published-ts"
import { tiptapToText } from "@/lib/tiptap-text"
import { canonicalizeUrl } from "@/lib/url-canonical"

test("normalizeArabic unifies letter variants, digits and strips diacritics", () => {
  assert.equal(normalizeArabic("إسرائيل"), normalizeArabic("اسرائيل"))
  assert.equal(normalizeArabic("مُحَمَّد"), "محمد")
  assert.equal(normalizeArabic("٢٠٢٦"), "2026")
  assert.equal(normalizeArabic("مدرسة"), normalizeArabic("مدرسه"))
  assert.equal(normalizeArabic("أسعار الذهب!! في، مصر"), "اسعار الذهب في مصر")
})

test("tokenize removes stopwords/dates and light-stems", () => {
  const t = tokenize("ارتفاع أسعار الذهب في مصر اليوم الجمعة 24 يوليو")
  assert.ok(t.includes("ذهب") || t.includes("الذهب"))
  assert.ok(!t.includes("في"))
  assert.ok(!t.includes("الجمعه"))
  assert.ok(!t.includes("يوليو"))
  // same word with/without the definite article and with hamza variants
  assert.equal(tokenize("والولايات")[0], tokenize("الولايات")[0])
  assert.equal(tokenize("الاقتصاد")[0], tokenize("اقتصاد")[0])
})

test("date signature: explicit dates and 'today <weekday>' conflicts", () => {
  const a = extractDateSignature("سعر الذهب اليوم الجمعة 24 يوليو 2026")
  const b = extractDateSignature("سعر الذهب اليوم السبت 25 يوليو 2026")
  const c = extractDateSignature("سعر الذهب اليوم الجمعة 24 يوليو")
  const none = extractDateSignature("ارتفاع سعر الذهب")
  assert.equal(dateConflict(a, b), true)
  assert.equal(dateConflict(a, c), false)
  assert.equal(dateConflict(a, none), false, "no date on one side is not a conflict")
  // "yesterday Friday" is not a today-marker
  assert.equal(dateConflict(extractDateSignature("أمس الجمعة قال الوزير"), extractDateSignature("اليوم السبت قال الوزير")), false)
})

test("parsePublishedTs handles every scraper format seen in production", () => {
  const now = Date.parse("2026-09-21T12:00:00Z")
  assert.equal(parsePublishedTs("2026-08-14T01:00:55.624Z", now), Date.parse("2026-08-14T01:00:55.624Z"))
  assert.equal(parsePublishedTs("2026-08-21T16:08:30+03:00", now), Date.parse("2026-08-21T13:08:30Z"))
  assert.equal(parsePublishedTs("2026-09-12T05:00:03+0300", now), Date.parse("2026-09-12T02:00:03Z"))
  assert.equal(parsePublishedTs("٢٠٢٦-٠٧-١٧T١٤:٢٤:٤٩+0400", now), Date.parse("2026-07-17T10:24:49Z"))
  assert.equal(parsePublishedTs("سبت, 08/01/2026 - 07:30", now), Date.parse("2026-08-01T04:30:00Z"))
  assert.equal(parsePublishedTs("9/8/2026 9:30:50 AM", now), Date.parse("2026-09-08T06:30:50Z"))
  assert.equal(parsePublishedTs("9/8/2026 9:30:50 PM", now), Date.parse("2026-09-08T18:30:50Z"))
  assert.equal(parsePublishedTs("", now), null)
  assert.equal(parsePublishedTs(null, now), null)
  assert.equal(parsePublishedTs("garbage", now), null)
  // future timestamps are clamped to now
  assert.equal(parsePublishedTs("2030-01-01T00:00:00Z", now), now)
})

test("canonicalizeUrl strips tracking, fragments, trailing slash", () => {
  assert.equal(canonicalizeUrl("https://Example.com/a/b/?utm_source=x&id=3#top"), "https://example.com/a/b/?id=3")
  assert.equal(canonicalizeUrl("https://example.com/"), "https://example.com/")
  assert.equal(canonicalizeUrl("not a url"), "not a url")
  // must not re-encode or strip slashes: stored URLs must map to themselves
  for (const stored of [
    "https://arabic.rt.com/news/1234-some-title/",
    "https://aawsat.com/%D8%A7%D9%84%D8%B9/5297266-%D9%87",
    "https://www.independentarabia.com/node/123/متحدة",
    "https://www.youm7.com/story/2026/7/20/x/123",
  ]) assert.equal(canonicalizeUrl(stored), stored)
  // idempotent
  const u = canonicalizeUrl("https://a.com/x/?fbclid=1")
  assert.equal(canonicalizeUrl(u), u)
})

test("tiptapToText flattens docs and tolerates junk", () => {
  const doc = JSON.stringify({ type: "doc", content: [
    { type: "paragraph", content: [{ type: "text", text: "الفقرة الأولى" }] },
    { type: "paragraph", content: [{ type: "text", text: "" }] },
    { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "بند" }] }] }] },
  ] })
  assert.equal(tiptapToText(doc), "الفقرة الأولى\n\nبند")
  assert.equal(tiptapToText(null), "")
  assert.equal(tiptapToText("plain text"), "plain text")
  assert.equal(tiptapToText(JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }] })), "")
})
