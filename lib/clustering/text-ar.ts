/** Pure Arabic text helpers for lexical matching (no DB, no network, no embeddings). */

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩"
const EXT_ARABIC_INDIC = "۰۱۲۳۴۵۶۷۸۹"

function normalizeDigitsOnly(input: string): string {
  return (input ?? "")
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(EXT_ARABIC_INDIC.indexOf(d)))
}

export function normalizeArabic(input: string): string {
  let s = (input ?? "").normalize("NFKC")
  s = s.replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
  s = s.replace(/[۰-۹]/g, (d) => String(EXT_ARABIC_INDIC.indexOf(d)))
  s = s
    .replace(/[ً-ٰٟـ]/g, "") // diacritics + tatweel
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .toLowerCase()
  // keep letters/digits of any script, turn everything else into spaces
  return s.replace(/[^\p{L}\p{N}]+/gu, " ").trim()
}

const STOPWORD_SOURCE =
  (
    "في من على الى عن مع هذا هذه ذلك تلك التي الذي الذين اللذين بعد قبل بين خلال حول ان انه انها كان كانت يكون تكون " +
    "قال قالت وقال وقالت لكن لكنه او ثم كما كل بعض غير اي هو هي هم هن نحن انا انت ما لا لم لن قد سوف حتي حيث اذا اذ عند " +
    "فيه فيها منه منها عليه عليها به بها له لها الي عنه عنها هناك هنا ايضا اكثر اقل بشكل نحو ضمن دون وفق وفقا امام " +
    "يوم اليوم امس غدا الان عاجل بالفيديو فيديو صور بالصور شاهد بالتفاصيل تفاصيل تقرير خبر اخبار مصدر " +
    "جديد جديده اخر اخري بعد ايام عام العام اول ثاني ثالث " +
    "الاحد الاثنين الثلاثاء الاربعاء الخميس الجمعه السبت احد اثنين ثلاثاء اربعاء خميس جمعه سبت " +
    "يناير فبراير مارس ابريل مايو يونيو يوليو اغسطس سبتمبر اكتوبر نوفمبر ديسمبر"
  )

// Entries are run through the same normalization as tokens (على → علي, إلى → الي, ة → ه …)
// so the list matches what the tokenizer actually sees.
const STOPWORDS = new Set(STOPWORD_SOURCE.split(/\s+/).map((w) => normalizeArabic(w)).filter(Boolean))

const PREFIX_RE = /^(وال|بال|كال|فال|لل)/
const SUFFIXES = ["ات", "ون", "ين", "ان", "ها", "هم", "ه"]

function stem(token: string): string {
  let t = token
  if (/^[a-z0-9]+$/.test(t)) return t // latin/digits untouched
  if (t.length > 4 && PREFIX_RE.test(t)) t = t.replace(PREFIX_RE, "")
  else if (t.length > 4 && t.startsWith("ال")) t = t.slice(2)
  if (t.length >= 6 && t.startsWith("و")) t = t.slice(1)
  for (const suf of SUFFIXES) {
    if (t.length >= 6 && t.endsWith(suf)) {
      t = t.slice(0, -suf.length)
      break
    }
  }
  return t
}

/** Content-bearing tokens: normalized, stopwords removed, lightly stemmed. */
export function tokenize(input: string): string[] {
  const out: string[] = []
  for (const raw of normalizeArabic(input).split(" ")) {
    if (!raw) continue
    if (STOPWORDS.has(raw)) continue
    const t = stem(raw)
    if (t.length < 2) continue
    if (STOPWORDS.has(t)) continue
    out.push(t)
  }
  return out
}

const MONTHS: Record<string, number> = {
  يناير: 1, فبراير: 2, مارس: 3, ابريل: 4, مايو: 5, يونيو: 6, يوليو: 7, اغسطس: 8, سبتمبر: 9, اكتوبر: 10, نوفمبر: 11, ديسمبر: 12,
  كانون: 0, // Levantine names are ambiguous; ignored by the date guard
}
const WEEKDAYS = ["الاحد", "الاثنين", "الثلاثاء", "الاربعاء", "الخميس", "الجمعه", "السبت"]

export type DateSignature = {
  /** e.g. "7-18" for "18 يوليو" */
  dates: Set<string>
  /** weekday names that directly follow "اليوم" ("today Friday") */
  todayWeekdays: Set<string>
}

/**
 * Explicit dates ("18 يوليو") and "اليوم الجمعة" markers. Two texts that carry
 * *different* explicit dates describe different daily events (prices, results, etc.)
 * even when their wording is nearly identical.
 */
export function extractDateSignature(input: string): DateSignature {
  const n = normalizeArabic(input)
  const words = n.split(" ")
  const dates = new Set<string>()
  const todayWeekdays = new Set<string>()

  // numeric dates like 19-9-2026 / 19/9/2026 (day first, as Arabic outlets write them);
  // must run on the raw text because normalization strips the separators.
  const ascii = normalizeDigitsOnly(input)
  for (const m of ascii.matchAll(/(?<!\d)(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(20\d{2})(?!\d)/g)) {
    const day = +m[1]
    const month = +m[2]
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) dates.add(`${month}-${day}`)
  }
  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    const month = MONTHS[w]
    if (month) {
      const prev = words[i - 1]
      const next = words[i + 1]
      const dayCandidate = [prev, next].find((x) => x && /^\d{1,2}$/.test(x) && +x >= 1 && +x <= 31)
      if (dayCandidate) dates.add(`${month}-${+dayCandidate}`)
    }
    if ((w === "اليوم" || w === "اليوم،") && WEEKDAYS.includes(words[i + 1])) {
      todayWeekdays.add(words[i + 1])
    }
  }
  return { dates, todayWeekdays }
}

function disjoint(a: Set<string>, b: Set<string>): boolean {
  if (a.size === 0 || b.size === 0) return false
  for (const x of a) if (b.has(x)) return false
  return true
}

/** True when the two signatures prove the texts are about different days. */
export function dateConflict(a: DateSignature, b: DateSignature): boolean {
  return disjoint(a.dates, b.dates) || disjoint(a.todayWeekdays, b.todayWeekdays)
}
