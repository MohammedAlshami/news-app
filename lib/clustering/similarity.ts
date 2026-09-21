import { tokenize } from "./text-ar"

/** Sparse term-weight vector. Computed in memory per run; never persisted. */
export type TermVec = Map<string, number>

export function termCounts(title: string, excerpt: string): TermVec {
  const v: TermVec = new Map()
  // Title carries the event identity → weight 2. Excerpt adds context → weight 1.
  for (const t of tokenize(title)) v.set(t, (v.get(t) ?? 0) + 2)
  for (const t of tokenize((excerpt ?? "").slice(0, 240))) v.set(t, (v.get(t) ?? 0) + 1)
  return v
}

export class IdfIndex {
  private df = new Map<string, number>()
  private n = 0

  add(v: TermVec) {
    this.n++
    for (const t of v.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1)
  }

  idf(t: string): number {
    const df = this.df.get(t) ?? 0
    return Math.log(1 + (this.n + 1) / (1 + df))
  }

  docFreq(t: string): number {
    return this.df.get(t) ?? 0
  }

  size(): number {
    return this.n
  }

  /** tf(sublinear) × idf, L2-normalised. */
  weigh(v: TermVec): TermVec {
    const w: TermVec = new Map()
    let norm = 0
    for (const [t, tf] of v) {
      const x = (1 + Math.log(tf)) * this.idf(t)
      w.set(t, x)
      norm += x * x
    }
    norm = Math.sqrt(norm) || 1
    for (const [t, x] of w) w.set(t, x / norm)
    return w
  }
}

export function cosine(a: TermVec, b: TermVec): number {
  const [small, big] = a.size <= b.size ? [a, b] : [b, a]
  let dot = 0
  for (const [t, x] of small) {
    const y = big.get(t)
    if (y) dot += x * y
  }
  return dot
}

export function sharedTerms(a: TermVec, b: TermVec): string[] {
  const out: string[] = []
  for (const t of a.keys()) if (b.has(t)) out.push(t)
  return out
}
