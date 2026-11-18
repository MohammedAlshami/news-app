import { sameName } from "./blocking"
import type { Signature } from "./signature"
import { tokenize } from "./text-ar"

/**
 * Event signature of a *topic or published article*: who (actors) did what (type) when (day) where.
 * Used as the primary paraphrase de-duplication: two pieces with the same key describe the same event
 * no matter how differently they are worded.
 */
export type EventSig = {
  actors: string[][] // token lists, most frequent first (max 3)
  type: string
  stage: string
  date: string // YYYY-MM-DD
  countries: string[]
}

const DAY = 86400000

export function buildEventSig(sigs: Signature[]): EventSig | null {
  const real = sigs.filter((s) => !s.fallback)
  if (real.length === 0) return null
  const tally = <T>(items: T[], key: (t: T) => string) => {
    const m = new Map<string, { n: number; v: T }>()
    for (const it of items) {
      const k = key(it)
      if (!k) continue
      const e = m.get(k)
      if (e) e.n++
      else m.set(k, { n: 1, v: it })
    }
    return [...m.values()].sort((a, b) => b.n - a.n).map((e) => e.v)
  }
  const actors = tally(
    real.flatMap((s) => s.actors.slice(0, 3).map((a) => tokenize(a.name))).filter((t) => t.length > 0),
    (t) => t.join(" "),
  ).slice(0, 3)
  if (actors.length === 0) return null
  const top = <K extends keyof Signature>(k: K) => String(tally(real, (s) => String(s[k]))[0]?.[k] ?? "")
  const countries = [...new Set(real.flatMap((s) => s.countries))].slice(0, 6)
  return { actors, type: top("event_type"), stage: top("stage"), date: top("event_date"), countries }
}

/** Strict: same actors (≥2 when both have ≥2), same concrete event type, same stage, ±1 day, shared country. */
export function eventSigMatch(a: EventSig | null, b: EventSig | null): boolean {
  if (!a || !b) return false
  if (a.type === "other" || a.type !== b.type || a.stage !== b.stage) return false
  if (Math.abs(Date.parse(a.date) - Date.parse(b.date)) > DAY) return false
  if (a.countries.length && b.countries.length && !a.countries.some((c) => b.countries.includes(c))) return false
  let shared = 0
  for (const x of a.actors) if (b.actors.some((y) => sameName(x, y))) shared++
  return shared >= Math.min(2, a.actors.length, b.actors.length)
}

export function parseEventSig(json: string | null | undefined): EventSig | null {
  if (!json) return null
  try {
    const o = JSON.parse(json) as EventSig
    return o && Array.isArray(o.actors) && typeof o.type === "string" ? o : null
  } catch {
    return null
  }
}
