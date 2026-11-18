import type { DatabaseSync } from "node:sqlite"

import type { LlmJson } from "@/lib/llm-json"

import { HOUR, NOW, seedRow } from "./fake-llm"

let tseq = 1000
export function seedTopic(
  sqlite: DatabaseSync,
  o: { category?: string; status?: string; sources?: string[]; written?: number; title?: string; ts?: number } = {},
): string {
  const id = `ptopic-${++tseq}`
  const keys = o.sources ?? ["youm7", "rt"]
  const ts = o.ts ?? NOW - HOUR
  sqlite
    .prepare("INSERT INTO topics (id, title, category_id, status, last_seen_at, written_source_count, article_count) VALUES (?,?,?,?,?,?,?)")
    .run(id, o.title ?? `موضوع ${tseq}`, o.category ?? "cat-politics", o.status ?? "open", ts, o.written ?? 0, keys.length)
  for (const k of keys) seedRow(sqlite, { title: `مصدر ${k} عن ${id} ${Math.random()}`, sourceKey: k, ts, topicId: id, status: "clustered" })
  return id
}

/** Attach `n` NEW sources (later scraped_at) from the given outlets. */
export function addSources(sqlite: DatabaseSync, topicId: string, keys: string[], ts: number) {
  for (const k of keys) seedRow(sqlite, { title: `جديد ${k} ${Math.random()}`, sourceKey: k, ts, topicId, status: "clustered" })
  sqlite.prepare("UPDATE topics SET article_count = article_count + ?, last_seen_at = ? WHERE id = ?").run(keys.length, ts, topicId)
}

/** A topic that already has a published article (public + generated rows) and has seen all its sources. */
export function seedPublishedTopic(sqlite: DatabaseSync, o: { sources?: string[]; hoursAgo?: number; category?: string } = {}) {
  const id = seedTopic(sqlite, { status: "written", category: o.category, sources: o.sources })
  const n = (o.sources ?? ["youm7", "rt"]).length
  const at = NOW - (o.hoursAgo ?? 8) * HOUR
  const aid = `art-${id}-0000`
  const title = `المقال الأول عن ${id} وتفاصيله الكاملة`
  sqlite.prepare("INSERT INTO articles (id, title, excerpt, body, created_at, category_id, is_published) VALUES (?,?,?,?,?,?,1)").run(aid, title, "ملخص المقال الأول عن الحدث", "{}", at, o.category ?? "cat-politics")
  sqlite.prepare("INSERT INTO generated_articles (id, title, excerpt, body, topic_id, created_at, article_id, is_published) VALUES (?,?,?,?,?,?,?,1)").run(`g-${id}-0`, title, "ملخص المقال الأول عن الحدث", '{"type":"doc","content":[]}', id, at, aid)
  sqlite.prepare("UPDATE topics SET written_source_count = ? WHERE id = ?").run(n, id)
  return { id, title, articleId: aid }
}

const WORDS = ["زلزال", "فيضان", "انتخابات", "مؤتمر", "اتفاقية", "بطولة", "حريق", "مهرجان", "قمة", "احتجاجات", "ميزانية", "كسوف", "مناظرة", "معرض", "سباق", "إضراب", "استفتاء", "عاصفة", "مزاد", "تحقيق", "هجوم", "مفاوضات", "تصريحات", "جائزة", "انهيار", "اكتشاف", "قرار", "إطلاق", "افتتاح", "وفاة", "زيارة", "صفقة", "أزمة", "مبادرة", "اختراق", "تحذير", "قافلة", "مناورات", "استقالة", "تعيين"]

export type FakeOpts = {
  material?: boolean
  throwWith?: Error
  delayMs?: number
  /** override the paragraphs the writer returns */
  paragraphs?: string[]
  title?: (n: number) => string
}

/** Writer + update judge, counted separately. */
export function makeLlm(o: FakeOpts = {}) {
  const writes: any[] = []
  const judges: any[] = []
  let n = 0
  const llm: LlmJson = async (req) => {
    if (o.delayMs) await new Promise((r) => setTimeout(r, o.delayMs))
    if (o.throwWith) throw o.throwWith
    if (req.system.includes("MATERIAL new information")) {
      judges.push(JSON.parse(req.user))
      return o.material === false
        ? { material: false, new_facts: [], reason: "same facts re-worded" }
        : { material: true, new_facts: ["ارتفاع حصيلة الضحايا إلى عدد جديد حسب المصادر"], reason: "new development" }
    }
    const user = JSON.parse(req.user)
    writes.push(user)
    n++
    const w = (i: number) => WORDS[(n * 3 + i * 7) % WORDS.length]
    return {
      action: "write",
      title: o.title ? o.title(n) : `${w(0)} ${w(1)} ${w(2)} ${w(3)} ${user.topic}`,
      excerpt: `${w(4)} ${w(5)} ${w(6)} ${w(8)} ${w(9)} ${w(10)} ${w(11)} ${w(12)} ${w(13)}`,
      paragraphs: o.paragraphs ?? [1, 2, 3, 4].map((i) => Array.from({ length: 14 }, (_, j) => WORDS[((n * 2654435761 + i * 40503 + j * j * 7919 + j * 31) >>> 0) % WORDS.length]).join(" ") + " في سياق الحدث"),
      highlights: ["نقطة أولى مهمة", "نقطة ثانية مهمة", "نقطة ثالثة مهمة"],
      sourceIds: user.sources.map((s: any) => s.id).slice(0, 2),
    }
  }
  return { llm, writes, judges, total: () => writes.length + judges.length }
}
