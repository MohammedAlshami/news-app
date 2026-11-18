import { normalizeArabic } from "@/lib/clustering/text-ar"

/** Pure output gates. Everything here runs after the (paid) LLM call and decides publish / reject. */

const ASCII_DIGITS = (s: string) =>
  s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))

/** Numbers (as ascii digit strings, thousands separators removed) that carry information: ≥3 digits, decimals, percentages. */
export function significantNumbers(text: string): Set<string> {
  const out = new Set<string>()
  const t = ASCII_DIGITS(text).replace(/(\d)[,٬،](?=\d{3}\b)/g, "$1")
  for (const m of t.matchAll(/\d+(?:[.,٫]\d+)?/g)) {
    const raw = m[0].replace(/[,٫]/g, ".")
    const digits = raw.replace(/\D/g, "")
    if (digits.length >= 3 || raw.includes(".") || t.slice(m.index! + m[0].length, m.index! + m[0].length + 2).trim().startsWith("%")) out.add(raw)
  }
  return out
}

const URL_RE = /\bhttps?:\/\/[^\s)»"']+|\bwww\.[^\s)»"']+/gi
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g
const PHONE_RE = /(?<![\d.])\+?\d[\d\s-]{8,}\d(?![\d.])/g
const INJECTION_RE = /ignore (?:all |the )?(?:previous|above)|system prompt|as an ai|تجاهل (?:كل |جميع )?(?:التعليمات|ما سبق)|<\/?(?:script|iframe|style|img)\b|\bjavascript:/i

export type GateResult = { ok: true; flags: string[] } | { ok: false; reason: string; flags: string[] }

export type GateInput = {
  title: string
  excerpt: string
  paragraphs: string[]
  highlights: string[]
  /** Plain texts of the sources (and previous article for updates) the model was shown. */
  sourceTexts: string[]
  sourceTitles: string[]
  previousTexts?: string[]
}

export const GATES = {
  MIN_PARAGRAPHS: 3,
  MAX_PARAGRAPHS: 8,
  MAX_PARAGRAPH_CHARS: 1500,
  MIN_ARABIC_RATIO: 0.7,
  NGRAM: 6,
  MAX_COPY_RATIO: 0.25,
  MAX_COPY_RUN_WORDS: 25,
  MAX_UNGROUNDED_NUMBERS: 1,
} as const

function words(s: string): string[] {
  return normalizeArabic(s).split(" ").filter(Boolean)
}

/** Fraction of the output's word n-grams present in any source + the longest verbatim run (words). */
export function copyStats(output: string, sources: string[], n: number = GATES.NGRAM): { ratio: number; longestRun: number } {
  const ow = words(output)
  if (ow.length < n) return { ratio: 0, longestRun: 0 }
  const grams = new Set<string>()
  for (const src of sources) {
    const sw = words(src)
    for (let i = 0; i + n <= sw.length; i++) grams.add(sw.slice(i, i + n).join(" "))
  }
  let hit = 0
  let total = 0
  let run = 0
  let longest = 0
  for (let i = 0; i + n <= ow.length; i++) {
    total++
    if (grams.has(ow.slice(i, i + n).join(" "))) {
      hit++
      run = run === 0 ? n : run + 1
      longest = Math.max(longest, run)
    } else run = 0
  }
  return { ratio: total ? hit / total : 0, longestRun: longest }
}

function arabicRatio(s: string): number {
  const letters = s.match(/\p{L}/gu) ?? []
  if (letters.length === 0) return 0
  const ar = s.match(/[؀-ۿݐ-ݿࢠ-ࣿ]/g)?.length ?? 0
  return ar / letters.length
}

/** Quoted strings («…» / "…") the article attributes to someone must exist verbatim in a source. */
function quotes(s: string): string[] {
  return [...s.matchAll(/«([^»]{12,})»|"([^"]{12,})"/g)].map((m) => (m[1] ?? m[2]).trim())
}

/** Decide whether the model output may be published. */
export function checkArticle(a: GateInput): GateResult {
  const flags: string[] = []
  const fail = (reason: string): GateResult => ({ ok: false, reason, flags })
  const body = a.paragraphs.join("\n")
  const all = `${a.title}\n${a.excerpt}\n${body}\n${a.highlights.join("\n")}`
  const srcAll = [...a.sourceTexts, ...(a.previousTexts ?? [])]
  const srcJoined = ASCII_DIGITS(srcAll.join("\n"))
  const srcNorm = normalizeArabic(srcAll.join("\n"))

  if (a.paragraphs.length < GATES.MIN_PARAGRAPHS || a.paragraphs.length > GATES.MAX_PARAGRAPHS) return fail(`paragraph count ${a.paragraphs.length}`)
  if (a.paragraphs.some((p) => p.length > GATES.MAX_PARAGRAPH_CHARS)) return fail("paragraph too long")
  if (INJECTION_RE.test(all)) return fail("instruction-like or markup content in output")
  if (arabicRatio(all) < GATES.MIN_ARABIC_RATIO) return fail("not Arabic enough")

  // title must not be a source headline
  const tn = normalizeArabic(a.title)
  if (a.sourceTitles.some((t) => normalizeArabic(t) === tn)) return fail("title identical to a source headline")

  // URLs / emails / phones that no source contains
  const ungroundedContact = [...(all.match(URL_RE) ?? []), ...(all.match(EMAIL_RE) ?? [])].filter((u) => !srcJoined.includes(u))
  if (ungroundedContact.length) return fail("url/email not present in sources")
  const phones = (ASCII_DIGITS(all).match(PHONE_RE) ?? []).map((p) => p.replace(/\D/g, ""))
  if (phones.some((p) => !srcJoined.replace(/\D/g, "").includes(p))) return fail("phone number not present in sources")

  // numbers must come from the sources
  const srcNums = significantNumbers(srcAll.join("\n"))
  const outNums = [...significantNumbers(all)]
  const ungrounded = outNums.filter((n) => !srcNums.has(n) && !srcJoined.includes(n))
  if (ungrounded.length > GATES.MAX_UNGROUNDED_NUMBERS) return fail(`numbers not in sources: ${ungrounded.slice(0, 4).join(", ")}`)
  if (ungrounded.length) flags.push(`ungrounded_number:${ungrounded[0]}`)

  // Latin proper nouns (names of people/orgs written in Latin script) must appear in the sources
  const latin = new Set((all.match(/\b[A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,})*/g) ?? []).map((w) => w.toLowerCase()))
  const missing = [...latin].filter((w) => !srcJoined.toLowerCase().includes(w))
  if (missing.length > 1) return fail(`latin names not in sources: ${missing.slice(0, 3).join(", ")}`)

  // direct quotes must be verbatim
  for (const q of quotes(all)) if (!srcNorm.includes(normalizeArabic(q))) return fail("quotation not present in sources")

  // near-copy of the sources
  const copy = copyStats(`${a.excerpt}\n${body}`, srcAll)
  if (copy.ratio >= GATES.MAX_COPY_RATIO || copy.longestRun >= GATES.MAX_COPY_RUN_WORDS) {
    return fail(`near-copy of sources (${copy.ratio.toFixed(2)}, run ${copy.longestRun})`)
  }
  if (copy.ratio > 0.12) flags.push(`copy_ratio:${copy.ratio.toFixed(2)}`)
  return { ok: true, flags }
}

/** Only http(s) links may be written into a body. Returns null for anything else. */
export function safeHref(url: string): string | null {
  try {
    const u = new URL(url)
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null
  } catch {
    return null
  }
}
