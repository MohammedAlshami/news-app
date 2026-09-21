import type { DatabaseSync } from "node:sqlite"

import type { LlmJson, LlmJsonRequest } from "@/lib/llm-json"

/**
 * Deterministic stand-in for the LLM. Titles carry hidden tags so tests control "truth":
 *   [E1]  event id      {US} country      <sports> category
 * Extraction gives every article of the same [E#] the same primary actor (so blocking links them),
 * and the judge merges labels that share an [E#].
 */
export type FakeLlmOptions = {
  failExtract?: boolean | number // true = always, number = first N calls
  failJudge?: boolean | number
  badJudge?: boolean // returns garbage groups
  emptyExtract?: boolean // returns no signatures at all
  skipTitle?: RegExp // extraction silently omits matching articles
}
export type FakeLlmLog = { extract: number; judge: number; classify: number; other: number; judgeInputs: string[] }

export function makeFakeLlm(opts: FakeLlmOptions = {}): { llm: LlmJson; log: FakeLlmLog } {
  const log: FakeLlmLog = { extract: 0, judge: 0, classify: 0, other: 0, judgeInputs: [] }
  const shouldFail = (flag: boolean | number | undefined, count: number) =>
    flag === true || (typeof flag === "number" && count <= flag)

  const llm: LlmJson = async (req: LlmJsonRequest) => {
    if (req.system.includes('event signature')) {
      log.extract++
      if (shouldFail(opts.failExtract, log.extract)) throw new Error("fake extract failure")
      if (opts.emptyExtract) return { signatures: [] }
      const blocks = req.user.split(/\n\n(?=### )/)
      const signatures = blocks.flatMap((b) => {
        const head = b.match(/^### (\d+) \| outlet (\S+) \| publish_date (\d{4}-\d{2}-\d{2})/)
        if (!head) return []
        const title = b.split("\n")[1] ?? ""
        if (opts.skipTitle?.test(title)) return []
        const tag = title.match(/\[(E\d+)\]/)?.[1] ?? `X${head[1]}${title.length}`
        const country = title.match(/\{([A-Z]{2})\}/)?.[1] ?? "EG"
        const category = title.match(/<(\w+)>/)?.[1] ?? "politics"
        return [{
          n: Number(head[1]),
          event_domain: "politics", event_type: "government_decision",
          actors: [{ name: `person ${tag.toLowerCase()}`, kind: "person", role: "initiator" }],
          named_things: [], storyline: null, event_places: [], countries: [country],
          event_date: head[3], is_recurring: false, stage: "announcement", content_type: title.includes("(opinion)") ? "opinion" : "news",
          category, keywords: [tag.toLowerCase()],
        }]
      })
      return { signatures }
    }
    if (req.system.includes("EXISTING topics")) {
      log.judge++
      log.judgeInputs.push(req.user)
      if (shouldFail(opts.failJudge, log.judge)) throw new Error("fake judge failure")
      if (opts.badJudge) return { groups: [["T99", "N99"], "junk", ["N1"]] }
      const byTag = new Map<string, string[]>()
      for (const line of req.user.split("\n")) {
        const label = line.match(/^(T\d+) \(existing topic\)/)?.[1]
        const nlabel = line.match(/^(N\d+):/)?.[1]
        const tag = line.match(/\[(E\d+)\]/)?.[1]
        if (nlabel && tag) byTag.set(tag, [...(byTag.get(tag) ?? []), nlabel])
        if (label) currentT = label
        if (currentT && tag && !nlabel) { byTag.set(tag, [currentT, ...(byTag.get(tag) ?? []).filter((l) => l !== currentT)]); }
      }
      const groups = [...byTag.values()].filter((g) => g.length >= 2 && g.some((l) => l.startsWith("N")))
      return { groups }
    }
    if (req.system.includes("news classifier")) {
      log.classify++
      const items = (JSON.parse(req.user) as { items: { id: string; title: string }[] }).items
      return { classifications: items.map((i) => ({ id: i.id, category: /<(\w+)>/.exec(i.title)?.[1] ?? "politics" })) }
    }
    log.other++
    throw new Error("unexpected llm call: " + req.system.slice(0, 60))
  }
  return { llm, log }
}
let currentT: string | null = null

let seq = 0
export const HOUR = 3600 * 1000
export const NOW = Date.parse("2026-09-21T12:00:00Z")

/** Insert one scraped_news row (status pending by default). Returns its id. */
export function seedRow(
  sqlite: DatabaseSync,
  r: { title: string; ts?: number; sourceKey?: string; category?: string; status?: string; attempts?: number; claimedAt?: number | null; topicId?: string | null; signature?: string | null; content?: string | null; imageUrl?: string | null; url?: string },
): string {
  const id = `row-${++seq}`
  const ts = r.ts ?? NOW - HOUR
  const content = r.content === undefined ? JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "نص المقال ".repeat(80) }] }] }) : r.content
  sqlite
    .prepare(
      `INSERT INTO scraped_news (id, source, source_key, category, title, excerpt, content, url, image_url, published_at, scraped_at, raw_json, topic_id, status, attempts, published_ts, claimed_at, signature)
       VALUES (?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?, '{}', ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id, (r.sourceKey ?? "youm7").toUpperCase(), r.sourceKey ?? "youm7", r.category ?? "world", r.title, content,
      r.url ?? `https://example.com/${id}`, r.imageUrl === undefined ? `https://img.example.com/${id}.jpg` : r.imageUrl,
      new Date(ts).toISOString(), ts, r.topicId ?? null, r.status ?? "pending", r.attempts ?? 0, ts, r.claimedAt ?? null, r.signature ?? null,
    )
  return id
}
