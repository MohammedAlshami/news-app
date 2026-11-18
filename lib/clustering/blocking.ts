import { tokenize } from "./text-ar"
import type { Signature } from "./signature"

export type SigDoc = {
  id: string
  title: string
  sourceKey: string
  publishedTs: number
  sig: Signature
  /** topic the row already belongs to (existing member) or null (new article) */
  topicId: string | null
}

const DAY = 86400000

type Prepared = {
  doc: SigDoc
  day: number
  actors: string[][]
  things: Set<string>
  kw: Set<string>
  countries: Set<string>
}

const nameTokens = (n: string) => tokenize(n)
const prep = (doc: SigDoc): Prepared => ({
  doc,
  day: Date.parse(doc.sig.event_date),
  actors: doc.sig.actors.map((a) => nameTokens(a.name)).filter((t) => t.length > 0),
  things: new Set(doc.sig.named_things.map((t) => nameTokens(t.name).join(" ")).filter(Boolean)),
  kw: new Set(doc.sig.keywords.flatMap((k) => tokenize(k))),
  countries: new Set(doc.sig.countries),
})

/** Same person/org allowing "الرئيس ترامب" ⊂ "دونالد ترامب": one token set contained in the other. */
export function sameName(x: string[], y: string[]): boolean {
  const [s, l] = x.length <= y.length ? [x, y] : [y, x]
  if (s.length >= 1 && s.every((t) => l.includes(t)) && s.join("").length >= 4) return true
  // spelling variants of the same name (نتنياهو / نتانياهو / نتينياهو): compare consonant skeletons
  const sk = (ts: string[]) => ts.map(nameSkeleton)
  const ls = sk(l)
  return s.length >= 1 && sk(s).every((t) => t.length >= 3 && ls.includes(t))
}

/** Consonant skeleton of a normalized token: drops interior long vowels / hamza (ا و ي ء). */
export function nameSkeleton(token: string): string {
  if (!token || /^[a-z0-9]+$/.test(token)) return token
  return token[0] + token.slice(1).replace(/[اويءى]/g, "")
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0
  let i = 0
  for (const x of a) if (b.has(x)) i++
  return i / (a.size + b.size - i)
}

/** Hard gates: different day (>1), different content type, or disjoint countries can never be the same event. */
function gatesFail(a: Prepared, b: Prepared): boolean {
  if (Math.abs(a.day - b.day) > DAY) return true
  if (a.doc.sig.content_type !== b.doc.sig.content_type) return true
  if (a.countries.size && b.countries.size) {
    let shared = false
    for (const c of a.countries) if (b.countries.has(c)) { shared = true; break }
    if (!shared) return true
  }
  return false
}

/** Candidate link: passes the gates and shares an actor, a named thing, or enough keywords. */
function linked(a: Prepared, b: Prepared): boolean {
  if (gatesFail(a, b)) return false
  for (const x of a.actors) for (const y of b.actors) if (sameName(x, y)) return true
  for (const t of a.things) if (b.things.has(t)) return true
  return jaccard(a.kw, b.kw) >= 0.25
}

export type Block = { docs: SigDoc[] }

/**
 * Connected components of the "possibly related" graph. A component that would need more than
 * `maxItems` LLM items (topics count once, new articles once each) is split by event domain and chunked.
 */
export function buildBlocks(docs: SigDoc[], maxItems = 35): Block[] {
  const P = docs.map(prep)
  const parent = P.map((_, i) => i)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))

  // only compare docs whose event days are within one day of each other
  const order = P.map((_, i) => i).sort((a, b) => P[a].day - P[b].day)
  for (let oi = 0; oi < order.length; oi++) {
    const i = order[oi]
    for (let oj = oi + 1; oj < order.length; oj++) {
      const j = order[oj]
      if (P[j].day - P[i].day > DAY) break
      if (find(i) === find(j)) continue
      if (linked(P[i], P[j])) parent[find(i)] = find(j)
    }
  }

  const comps = new Map<number, SigDoc[]>()
  P.forEach((p, i) => {
    const r = find(i)
    comps.set(r, [...(comps.get(r) ?? []), p.doc])
  })

  const itemsOf = (ds: SigDoc[]) => {
    const items = new Map<string, SigDoc[]>() // topic id or doc id → docs
    for (const d of ds) {
      const k = d.topicId ?? `new:${d.id}`
      items.set(k, [...(items.get(k) ?? []), d])
    }
    return [...items.values()]
  }

  const blocks: Block[] = []
  for (const ds of comps.values()) {
    const items = itemsOf(ds)
    if (items.length <= maxItems) { blocks.push({ docs: ds }); continue }
    const byDomain = new Map<string, SigDoc[][]>()
    for (const it of items) byDomain.set(it[0].sig.event_domain, [...(byDomain.get(it[0].sig.event_domain) ?? []), it])
    for (const group of byDomain.values()) {
      for (let i = 0; i < group.length; i += maxItems) blocks.push({ docs: group.slice(i, i + maxItems).flat() })
    }
  }
  return blocks
}
